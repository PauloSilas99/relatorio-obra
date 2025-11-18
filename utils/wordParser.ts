import mammoth from 'mammoth'

interface Equipamento {
  nome: string
  quantidade: number
  observacao?: string
}

interface Funcionario {
  cargo: string
  quantidade: number
}

interface Atividade {
  descricao: string
}

interface Servico {
  descricao: string
}

export interface DadosImportados {
  nomeObra?: string
  empresaContratada?: string
  localizacaoObra?: string
  data?: string
  numeroFolha?: string
  condicaoTempo?: string
  periodoChuva?: string
  equipamentos?: Equipamento[]
  funcionarios?: Funcionario[]
  atividades?: Atividade[]
  servicos?: Servico[]
  descricao?: string
}

/**
 * Extrai dados de um arquivo Word (.docx)
 * Espera um formato estruturado com labels específicos
 */
export async function parseWordFile(file: File): Promise<DadosImportados> {
  try {
    console.log('Iniciando processamento do arquivo Word:', file.name)
    
    // Validar se o arquivo pode ser processado
    if (file.size === 0) {
      throw new Error('O arquivo está vazio ou corrompido.')
    }

    console.log('Lendo arrayBuffer do arquivo...')
    const arrayBuffer = await file.arrayBuffer()
    
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error('Não foi possível ler o conteúdo do arquivo. Verifique se o arquivo não está corrompido.')
    }

    console.log('ArrayBuffer lido com sucesso. Tamanho:', arrayBuffer.byteLength, 'bytes')
    console.log('Tentando extrair texto com mammoth...')

    let result
    try {
      result = await mammoth.extractRawText({ arrayBuffer })
      console.log('Texto extraído com sucesso. Tamanho do texto:', result.value?.length || 0, 'caracteres')
    } catch (mammothError: any) {
      console.error('Erro do mammoth:', mammothError)
      const errorDetails = mammothError?.message || 'Erro desconhecido'
      throw new Error(`Erro ao processar o arquivo Word: ${errorDetails}\n\nVerifique se o arquivo está no formato .docx válido. Arquivos .doc antigos podem não ser suportados.`)
    }

    if (!result || !result.value) {
      throw new Error('O arquivo Word está vazio ou não contém texto legível.')
    }

    const text = result.value

    if (!text || text.trim().length === 0) {
      throw new Error('O arquivo Word não contém texto. Verifique se o documento possui conteúdo.')
    }

    const dados: DadosImportados = {}

    // Função auxiliar para extrair valor após um label
    const extrairValor = (label: string, texto: string): string | undefined => {
      const labels = label.split('|')
      for (const lbl of labels) {
        const regex = new RegExp(`${lbl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s:]*([^\\n]+)`, 'i')
        const match = texto.match(regex)
        if (match && match[1].trim()) {
          return match[1].trim()
        }
      }
      return undefined
    }

    // Extrair informações básicas
    dados.nomeObra = extrairValor('Nome da Obra|Nome da obra|NOME DA OBRA', text)
    dados.empresaContratada = extrairValor('Empresa Contratada|Empresa contratada|EMPRESA CONTRATADA', text)
    dados.localizacaoObra = extrairValor('Localização|Localização da Obra|LOCALIZAÇÃO', text)
    dados.numeroFolha = extrairValor('Número da Folha|Número da folha|Número|RDO|Folha', text)
    
    // Extrair data (formato flexível: DD/MM/YYYY, DD-MM-YYYY, etc)
    const dataPatterns = [
      /(?:Data|DATA)[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
    ]
    
    for (const pattern of dataPatterns) {
      const dataMatch = text.match(pattern)
      if (dataMatch) {
        const dataStr = dataMatch[1]
        // Converter para formato YYYY-MM-DD
        const partes = dataStr.split(/[\/\-]/)
        if (partes.length === 3) {
          const dia = partes[0].padStart(2, '0')
          const mes = partes[1].padStart(2, '0')
          const ano = partes[2].length === 2 ? `20${partes[2]}` : partes[2]
          // Validar se é uma data válida (dia <= 31, mês <= 12)
          if (parseInt(dia) <= 31 && parseInt(mes) <= 12) {
            dados.data = `${ano}-${mes}-${dia}`
            break
          }
        }
      }
    }

    // Extrair condições do tempo
    const tempoMatch = text.match(/(?:Condições do Tempo|Condição|Tempo)[\s:]*([^\n]+)/i)
    if (tempoMatch) {
      const tempo = tempoMatch[1].trim().toLowerCase()
      if (tempo.includes('bom')) dados.condicaoTempo = 'bom'
      else if (tempo.includes('nublado')) dados.condicaoTempo = 'nublado'
      else if (tempo.includes('chuvoso') || tempo.includes('chuva')) dados.condicaoTempo = 'chuvoso'
    }

    // Extrair período da chuva
    dados.periodoChuva = extrairValor('Período da Chuva|Período|Chuva', text)

    // Extrair equipamentos (formato: Nome - Quantidade ou Nome: Quantidade)
    const equipamentosSection = extrairSecao('Equipamentos|EQUIPAMENTOS', text)
    if (equipamentosSection) {
      dados.equipamentos = parsearEquipamentos(equipamentosSection)
    }

    // Extrair funcionários (formato: Cargo - Quantidade ou Cargo: Quantidade)
    const funcionariosSection = extrairSecao('Corpo Efetivo|Funcionários|FUNCIONÁRIOS|Colaboradores', text)
    if (funcionariosSection) {
      dados.funcionarios = parsearFuncionarios(funcionariosSection)
    }

    // Extrair atividades (lista simples)
    const atividadesSection = extrairSecao('Atividades|ATIVIDADES|Atividades Exercidas', text)
    if (atividadesSection) {
      dados.atividades = parsearListaSimples(atividadesSection)
    }

    // Extrair serviços (lista simples)
    const servicosSection = extrairSecao('Serviços|SERVIÇOS|Serviços Executados', text)
    if (servicosSection) {
      dados.servicos = parsearListaSimples(servicosSection)
    }

    // Extrair descrição (tudo que sobrar ou seção específica)
    const descricaoSection = extrairSecao('Descrição|DESCRIÇÃO|Observações|OBSERVAÇÕES', text)
    dados.descricao = descricaoSection || text.split('\n').slice(-5).join('\n').trim()

    return dados
  } catch (error) {
    console.error('Erro ao processar arquivo Word:', error)
    throw new Error('Erro ao processar o arquivo Word. Verifique se o arquivo está no formato correto.')
  }
}

/**
 * Extrai uma seção específica do texto
 */
function extrairSecao(titulo: string, texto: string): string | undefined {
  const regex = new RegExp(`${titulo}[\\s:]*\\n([\\s\\S]*?)(?=\\n\\n[A-Z]|$)`, 'i')
  const match = texto.match(regex)
  return match ? match[1].trim() : undefined
}

/**
 * Parseia uma lista de equipamentos com quantidade
 */
function parsearEquipamentos(texto: string): Equipamento[] {
  const itens: Equipamento[] = []
  const linhas = texto.split('\n').filter(linha => linha.trim())

  linhas.forEach(linha => {
    linha = linha.trim()
    if (!linha) return

    // Padrões: "Item - 5" ou "Item: 5" ou "Item 5" ou "Item (5)"
    const patterns = [
      /^(.+?)\s*[-:]\s*(\d+)(?:\s*[-:]\s*(.+))?$/,  // "Item - 5" ou "Item: 5 - Observação"
      /^(.+?)\s+(\d+)$/,                              // "Item 5"
      /^(.+?)\s*\((\d+)\)(?:\s*[-:]\s*(.+))?$/,      // "Item (5)" ou "Item (5) - Observação"
    ]

    for (const pattern of patterns) {
      const match = linha.match(pattern)
      if (match) {
        const nome = match[1].trim()
        const quantidade = parseInt(match[2], 10)
        const observacao = match[3]?.trim()

        if (nome && !isNaN(quantidade)) {
          itens.push({ nome, quantidade, observacao })
          return
        }
      }
    }

    // Se não encontrou padrão, tenta extrair número no final
    const numeroMatch = linha.match(/(\d+)/)
    if (numeroMatch) {
      const quantidade = parseInt(numeroMatch[1], 10)
      const nome = linha.replace(/\d+/g, '').trim().replace(/[-:()]/g, '').trim()
      if (nome) {
        itens.push({ nome, quantidade })
      }
    }
  })

  return itens
}

/**
 * Parseia uma lista de funcionários com quantidade
 */
function parsearFuncionarios(texto: string): Funcionario[] {
  const itens: Funcionario[] = []
  const linhas = texto.split('\n').filter(linha => linha.trim())

  linhas.forEach(linha => {
    linha = linha.trim()
    if (!linha) return

    // Padrões: "Cargo - 5" ou "Cargo: 5" ou "Cargo 5" ou "Cargo (5)"
    const patterns = [
      /^(.+?)\s*[-:]\s*(\d+)$/,                       // "Cargo - 5" ou "Cargo: 5"
      /^(.+?)\s+(\d+)$/,                              // "Cargo 5"
      /^(.+?)\s*\((\d+)\)$/,                          // "Cargo (5)"
    ]

    for (const pattern of patterns) {
      const match = linha.match(pattern)
      if (match) {
        const cargo = match[1].trim()
        const quantidade = parseInt(match[2], 10)

        if (cargo && !isNaN(quantidade)) {
          itens.push({ cargo, quantidade })
          return
        }
      }
    }

    // Se não encontrou padrão, tenta extrair número no final
    const numeroMatch = linha.match(/(\d+)/)
    if (numeroMatch) {
      const quantidade = parseInt(numeroMatch[1], 10)
      const cargo = linha.replace(/\d+/g, '').trim().replace(/[-:()]/g, '').trim()
      if (cargo) {
        itens.push({ cargo, quantidade })
      }
    }
  })

  return itens
}

/**
 * Parseia uma lista simples (sem quantidade)
 */
function parsearListaSimples(texto: string): Array<{ descricao: string }> {
  const itens: Array<{ descricao: string }> = []
  const linhas = texto.split('\n').filter(linha => linha.trim())

  linhas.forEach(linha => {
    linha = linha.trim()
    // Remove bullets, números e outros marcadores
    linha = linha.replace(/^[•\-\*\d\.\)]\s*/, '')
    if (linha) {
      itens.push({ descricao: linha })
    }
  })

  return itens
}

