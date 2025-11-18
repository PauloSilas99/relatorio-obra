import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import mammoth from 'mammoth'

// Configuração para permitir upload de arquivos
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Interface para os dados retornados
interface DadosDiario {
  nomeObra?: string
  empresaContratada?: string
  localizacaoObra?: string
  data?: string
  numeroFolha?: string
  condicaoTempo?: string
  periodoChuva?: string
  equipamentos?: Array<{ nome: string; quantidade: number; observacao?: string }>
  funcionarios?: Array<{ cargo: string; quantidade: number }>
  atividades?: Array<{ descricao: string }>
  servicos?: Array<{ descricao: string }>
  descricao?: string
}

export async function POST(request: NextRequest) {
  try {
    // Verificar se a API key está configurada
    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key do Google Gemini não configurada. Verifique a variável GOOGLE_API_KEY no arquivo .env' },
        { status: 500 }
      )
    }

    // Obter o arquivo do FormData
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo foi enviado' },
        { status: 400 }
      )
    }

    // Validar tipo de arquivo
    const extensaoValida = file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc')
    if (!extensaoValida) {
      return NextResponse.json(
        { error: 'Arquivo inválido. Por favor, envie um arquivo Word (.docx ou .doc)' },
        { status: 400 }
      )
    }

    // Validar tamanho (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Tamanho máximo permitido: 10MB' },
        { status: 400 }
      )
    }

    console.log('Processando arquivo Word:', file.name, 'Tamanho:', file.size, 'bytes')

    // Extrair texto do arquivo Word usando mammoth
    // Converter File para ArrayBuffer primeiro
    const arrayBuffer = await file.arrayBuffer()
    
    // Converter ArrayBuffer para Buffer do Node.js
    // O mammoth no Node.js funciona melhor com Buffer
    const buffer = Buffer.from(arrayBuffer)
    
    let text: string
    try {
      // Passar o buffer para mammoth
      // O mammoth aceita 'buffer' como opção no Node.js
      const result = await mammoth.extractRawText({ 
        buffer: buffer
      })
      text = result.value
      
      if (!text || text.trim().length === 0) {
        return NextResponse.json(
          { error: 'O arquivo Word está vazio ou não contém texto legível' },
          { status: 400 }
        )
      }
    } catch (mammothError: any) {
      console.error('Erro ao extrair texto do Word:', mammothError)
      console.error('Detalhes do erro:', {
        message: mammothError.message,
        stack: mammothError.stack,
        fileName: file.name,
        fileSize: file.size
      })
      
      // Tentar uma abordagem alternativa se o erro persistir
      if (mammothError.message?.includes('Could not find file')) {
        return NextResponse.json(
          { error: 'Erro ao processar o arquivo Word. O arquivo pode estar corrompido ou em formato não suportado. Por favor, tente salvar o arquivo novamente no Word como .docx.' },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: `Erro ao processar o arquivo Word: ${mammothError.message || 'Erro desconhecido'}. Verifique se o arquivo é um .docx válido.` },
        { status: 500 }
      )
    }

    console.log('Texto extraído com sucesso. Tamanho:', text.length, 'caracteres')

    // Inicializar Gemini
    const genAI = new GoogleGenerativeAI(apiKey)
    
    // Listar modelos disponíveis primeiro
    let model
    let modeloUsado = ''
    
    try {
      // Tentar listar modelos disponíveis
      const client = genAI as any
      // Tentar diferentes nomes de modelos que podem estar disponíveis
      const modelosParaTentar = [
        'gemini-1.5-pro-latest',
        'gemini-1.5-flash-latest',
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'gemini-pro-latest',
        'gemini-pro',
        'models/gemini-1.5-pro-latest',
        'models/gemini-1.5-flash-latest'
      ]
      
      // Tentar cada modelo
      for (const nomeModelo of modelosParaTentar) {
        try {
          console.log(`Tentando inicializar modelo: ${nomeModelo}`)
          const testModel = genAI.getGenerativeModel({ model: nomeModelo })
          // Se chegou aqui, o modelo foi criado (mas ainda não testado)
          model = testModel
          modeloUsado = nomeModelo
          console.log(`Modelo ${nomeModelo} inicializado com sucesso`)
          break
        } catch (initError: any) {
          console.warn(`Não foi possível inicializar modelo ${nomeModelo}:`, initError.message)
          continue
        }
      }
      
      // Se nenhum modelo foi inicializado, usar o padrão
      if (!model) {
        console.log('Usando modelo padrão: gemini-pro')
        model = genAI.getGenerativeModel({ model: 'gemini-pro' })
        modeloUsado = 'gemini-pro'
      }
    } catch (error: any) {
      console.error('Erro ao inicializar modelos:', error)
      // Último recurso: tentar gemini-pro
      model = genAI.getGenerativeModel({ model: 'gemini-pro' })
      modeloUsado = 'gemini-pro (fallback)'
    }
    
    console.log(`Usando modelo: ${modeloUsado}`)

    // Prompt para o Gemini interpretar os dados
    const prompt = `Você é um assistente especializado em extrair dados de relatórios de diário de obra.

Analise o texto extraído de um documento Word e extraia APENAS as informações estruturadas em formato JSON válido.

TEXTO DO DOCUMENTO:
${text.substring(0, 30000)}${text.length > 30000 ? '\n\n[... texto truncado ...]' : ''}

INSTRUÇÕES IMPORTANTES:
1. Identifique e extraia as seguintes informações (quando disponíveis):
   - nomeObra: Nome da obra/projeto
   - empresaContratada: Nome da empresa contratada/responsável
   - localizacaoObra: Localização/endereço completo da obra
   - data: Data do diário no formato YYYY-MM-DD (ex: 2024-12-15)
   - numeroFolha: Número da folha/RDO/registro
   - condicaoTempo: Apenas "bom", "nublado" ou "chuvoso" (em minúsculas)
   - periodoChuva: Período da chuva (ex: "08:00 às 12:00") - apenas se condicaoTempo for "chuvoso"
   - equipamentos: Array de objetos {nome: string, quantidade: number, observacao?: string}
   - funcionarios: Array de objetos {cargo: string, quantidade: number}
   - atividades: Array de objetos {descricao: string} - cada atividade em um objeto separado
   - servicos: Array de objetos {descricao: string} - cada serviço em um objeto separado
   - descricao: Texto livre com descrição geral/observações

2. Para equipamentos e funcionários, identifique quantidades mencionadas (números).
3. Para atividades e serviços, extraia cada item da lista como um objeto separado no array.
4. Se uma informação não estiver presente, NÃO inclua o campo no JSON (não use null ou undefined).
5. Retorne APENAS um JSON válido, sem markdown, sem explicações, sem texto adicional antes ou depois.

IMPORTANTE: Retorne somente o JSON, sem markdown code blocks, sem explicações.

EXEMPLO DE RESPOSTA:
{"nomeObra":"Edifício Residencial XYZ","empresaContratada":"Construtora ABC","equipamentos":[{"nome":"Betoneira","quantidade":2}]}`

    console.log('Enviando texto para Gemini...')

    // Chamar Gemini com tratamento de erro específico para modelo não encontrado
    let geminiText: string = ''
    
    try {
      const result = await model.generateContent(prompt)
      const response = await result.response
      geminiText = response.text()
    } catch (modelError: any) {
      console.error('Erro ao chamar Gemini:', modelError)
      
      // Se o erro for de modelo não encontrado, tentar outros modelos
      if (modelError.message?.includes('not found') || modelError.message?.includes('404')) {
        console.log('Modelo não encontrado, tentando alternativas...')
        
        // Tentar modelos alternativos
        const modelosAlternativos = [
          'gemini-1.5-pro-latest',
          'gemini-1.5-flash-latest',
          'gemini-1.5-pro',
          'gemini-1.5-flash'
        ]
        
        let sucesso = false
        for (const nomeModelo of modelosAlternativos) {
          if (nomeModelo === modeloUsado) continue // Pular o que já tentamos
          
          try {
            console.log(`Tentando modelo alternativo: ${nomeModelo}`)
            const altModel = genAI.getGenerativeModel({ model: nomeModelo })
            const altResult = await altModel.generateContent(prompt)
            const altResponse = await altResult.response
            geminiText = altResponse.text()
            sucesso = true
            console.log(`Modelo ${nomeModelo} funcionou!`)
            break
          } catch (altError: any) {
            console.warn(`Modelo ${nomeModelo} também falhou:`, altError.message)
            continue
          }
        }
        
        if (!sucesso) {
          throw new Error(`Nenhum modelo do Gemini está disponível. Verifique sua API key e os modelos disponíveis em sua conta. Erro original: ${modelError.message}`)
        }
      } else {
        throw modelError
      }
    }
    
    // Verificar se obtivemos uma resposta
    if (!geminiText || geminiText.trim().length === 0) {
      throw new Error('A resposta do Gemini está vazia. Tente novamente.')
    }

    console.log('Resposta do Gemini recebida:', geminiText.substring(0, 200) + '...')

    // Extrair JSON da resposta (pode vir com markdown code blocks)
    let jsonText = geminiText.trim()
    
    // Remover markdown code blocks se presentes
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    // Tentar encontrar JSON no texto
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonText = jsonMatch[0]
    }

    // Parsear JSON
    let dados: DadosDiario
    try {
      dados = JSON.parse(jsonText)
    } catch (parseError) {
      console.error('Erro ao parsear JSON do Gemini:', parseError)
      console.error('Texto recebido:', jsonText)
      return NextResponse.json(
        { error: 'Erro ao processar resposta da IA. Tente novamente.' },
        { status: 500 }
      )
    }

    // Validar e limpar dados
    const dadosLimpos: DadosDiario = {}

    if (dados.nomeObra) dadosLimpos.nomeObra = String(dados.nomeObra).trim()
    if (dados.empresaContratada) dadosLimpos.empresaContratada = String(dados.empresaContratada).trim()
    if (dados.localizacaoObra) dadosLimpos.localizacaoObra = String(dados.localizacaoObra).trim()
    if (dados.data) dadosLimpos.data = String(dados.data).trim()
    if (dados.numeroFolha) dadosLimpos.numeroFolha = String(dados.numeroFolha).trim()
    if (dados.condicaoTempo) {
      const tempo = String(dados.condicaoTempo).toLowerCase()
      if (['bom', 'nublado', 'chuvoso'].includes(tempo)) {
        dadosLimpos.condicaoTempo = tempo
      }
    }
    if (dados.periodoChuva) dadosLimpos.periodoChuva = String(dados.periodoChuva).trim()
    if (dados.descricao) dadosLimpos.descricao = String(dados.descricao).trim()

    // Processar arrays
    if (Array.isArray(dados.equipamentos)) {
      dadosLimpos.equipamentos = dados.equipamentos
        .filter((eq: any) => eq.nome && eq.quantidade !== undefined)
        .map((eq: any) => ({
          nome: String(eq.nome).trim(),
          quantidade: Number(eq.quantidade) || 0,
          observacao: eq.observacao ? String(eq.observacao).trim() : undefined
        }))
    }

    if (Array.isArray(dados.funcionarios)) {
      dadosLimpos.funcionarios = dados.funcionarios
        .filter((func: any) => func.cargo && func.quantidade !== undefined)
        .map((func: any) => ({
          cargo: String(func.cargo).trim(),
          quantidade: Number(func.quantidade) || 0
        }))
    }

    if (Array.isArray(dados.atividades)) {
      dadosLimpos.atividades = dados.atividades
        .filter((atv: any) => atv.descricao)
        .map((atv: any) => ({
          descricao: String(atv.descricao).trim()
        }))
    }

    if (Array.isArray(dados.servicos)) {
      dadosLimpos.servicos = dados.servicos
        .filter((serv: any) => serv.descricao)
        .map((serv: any) => ({
          descricao: String(serv.descricao).trim()
        }))
    }

    console.log('Dados processados com sucesso:', Object.keys(dadosLimpos))

    return NextResponse.json({ dados: dadosLimpos }, { status: 200 })

  } catch (error: any) {
    console.error('Erro ao processar arquivo Word:', error)
    return NextResponse.json(
      { error: `Erro interno do servidor: ${error.message || 'Erro desconhecido'}` },
      { status: 500 }
    )
  }
}

