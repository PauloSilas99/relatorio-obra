'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { generatePDF, generatePDFPreview } from '@/utils/pdfGenerator'

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

export default function DiarioObraForm() {
  const [nomeObra, setNomeObra] = useState('')
  const [empresaContratada, setEmpresaContratada] = useState('')
  const [localizacaoObra, setLocalizacaoObra] = useState('')
  const [data, setData] = useState('')
  const [numeroFolha, setNumeroFolha] = useState('')
  const [condicaoTempo, setCondicaoTempo] = useState('bom')
  const [periodoChuva, setPeriodoChuva] = useState('')
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([{ nome: '', quantidade: 0, observacao: '' }])
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([{ cargo: '', quantidade: 0 }])
  const [atividades, setAtividades] = useState<Atividade[]>([{ descricao: '' }])
  const [servicos, setServicos] = useState<Servico[]>([{ descricao: '' }])
  const [descricao, setDescricao] = useState('')
  const [imagens, setImagens] = useState<Array<{
    data: string
    nome: string
    dimensoes: { width: number; height: number }
  }>>([])
  const [showModal, setShowModal] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Estados para seções colapsáveis e navegação
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basicas', 'tempo', 'equipamentos', 'funcionarios', 'atividades', 'servicos', 'imagens', 'descricao']))
  const [activeSection, setActiveSection] = useState<string>('basicas')
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  
  // Função para alternar seção
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }
  
  // Função para scroll suave até uma seção
  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId)
    const element = sectionRefs.current[sectionId]
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      // Expandir seção se estiver colapsada
      if (!expandedSections.has(sectionId)) {
        setExpandedSections(prev => new Set(prev).add(sectionId))
      }
    }
  }
  
  // Calcular progresso do formulário
  const progresso = useMemo(() => {
    const camposObrigatorios = [
      nomeObra,
      empresaContratada,
      localizacaoObra,
      data,
      numeroFolha,
      condicaoTempo,
      condicaoTempo === 'chuvoso' ? periodoChuva : 'ok'
    ]
    const camposPreenchidos = camposObrigatorios.filter(campo => campo && campo.trim() !== '').length
    const totalCampos = camposObrigatorios.length
    return Math.round((camposPreenchidos / totalCampos) * 100)
  }, [nomeObra, empresaContratada, localizacaoObra, data, numeroFolha, condicaoTempo, periodoChuva])
  
  // Verificar se uma seção está completa
  const isSectionComplete = useCallback((sectionId: string): boolean => {
    switch (sectionId) {
      case 'basicas':
        return !!(nomeObra && empresaContratada && localizacaoObra && data && numeroFolha)
      case 'tempo':
        return !!(condicaoTempo && (condicaoTempo !== 'chuvoso' || periodoChuva))
      case 'equipamentos':
        return equipamentos.some(eq => eq.nome.trim() !== '')
      case 'funcionarios':
        return funcionarios.some(func => func.cargo.trim() !== '')
      case 'atividades':
        return atividades.some(atv => atv.descricao.trim() !== '')
      case 'servicos':
        return servicos.some(serv => serv.descricao.trim() !== '')
      case 'imagens':
        return imagens.length > 0
      case 'descricao':
        return descricao.trim() !== ''
      default:
        return false
    }
  }, [nomeObra, empresaContratada, localizacaoObra, data, numeroFolha, condicaoTempo, periodoChuva, equipamentos, funcionarios, atividades, servicos, imagens, descricao])
  
  // Auto-save no localStorage
  useEffect(() => {
    const dados = {
      nomeObra,
      empresaContratada,
      localizacaoObra,
      data,
      numeroFolha,
      condicaoTempo,
      periodoChuva,
      equipamentos,
      funcionarios,
      atividades,
      servicos,
      descricao,
      // Não salvar imagens no localStorage (muito grande)
    }
    try {
      localStorage.setItem('diarioObra_draft', JSON.stringify(dados))
    } catch (error) {
      console.warn('Erro ao salvar rascunho:', error)
    }
  }, [nomeObra, empresaContratada, localizacaoObra, data, numeroFolha, condicaoTempo, periodoChuva, equipamentos, funcionarios, atividades, servicos, descricao])
  
  // Carregar rascunho ao montar componente
  useEffect(() => {
    try {
      const draft = localStorage.getItem('diarioObra_draft')
      if (draft) {
        const dados = JSON.parse(draft)
        if (dados.nomeObra) setNomeObra(dados.nomeObra)
        if (dados.empresaContratada) setEmpresaContratada(dados.empresaContratada)
        if (dados.localizacaoObra) setLocalizacaoObra(dados.localizacaoObra)
        if (dados.data) setData(dados.data)
        if (dados.numeroFolha) setNumeroFolha(dados.numeroFolha)
        if (dados.condicaoTempo) setCondicaoTempo(dados.condicaoTempo)
        if (dados.periodoChuva) setPeriodoChuva(dados.periodoChuva)
        if (dados.equipamentos) setEquipamentos(dados.equipamentos)
        if (dados.funcionarios) setFuncionarios(dados.funcionarios)
        if (dados.atividades) setAtividades(dados.atividades)
        if (dados.servicos) setServicos(dados.servicos)
        if (dados.descricao) setDescricao(dados.descricao)
      }
    } catch (error) {
      console.warn('Erro ao carregar rascunho:', error)
    }
  }, [])
  
  // Debounce para inputs de texto
  const debounce = useCallback((func: Function, wait: number) => {
    let timeout: NodeJS.Timeout
    return (...args: any[]) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  }, [])

  const addEquipamento = () => {
    setEquipamentos([...equipamentos, { nome: '', quantidade: 0, observacao: '' }])
  }

  const removeEquipamento = (index: number) => {
    setEquipamentos(equipamentos.filter((_, i) => i !== index))
  }

  const updateEquipamento = (index: number, field: 'nome' | 'quantidade' | 'observacao', value: string | number) => {
    const updated = [...equipamentos]
    updated[index] = { ...updated[index], [field]: value }
    setEquipamentos(updated)
  }

  const addFuncionario = () => {
    setFuncionarios([...funcionarios, { cargo: '', quantidade: 0 }])
  }

  const removeFuncionario = (index: number) => {
    setFuncionarios(funcionarios.filter((_, i) => i !== index))
  }

  const updateFuncionario = (index: number, field: 'cargo' | 'quantidade', value: string | number) => {
    const updated = [...funcionarios]
    updated[index] = { ...updated[index], [field]: value }
    setFuncionarios(updated)
  }

  const addAtividade = () => {
    setAtividades([...atividades, { descricao: '' }])
  }

  const removeAtividade = (index: number) => {
    setAtividades(atividades.filter((_, i) => i !== index))
  }

  const updateAtividade = (index: number, value: string) => {
    const updated = [...atividades]
    updated[index] = { descricao: value }
    setAtividades(updated)
  }

  const addServico = () => {
    setServicos([...servicos, { descricao: '' }])
  }

  const removeServico = (index: number) => {
    setServicos(servicos.filter((_, i) => i !== index))
  }

  const updateServico = (index: number, value: string) => {
    const updated = [...servicos]
    updated[index] = { descricao: value }
    setServicos(updated)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    Array.from(files).forEach((file) => {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        alert(`O arquivo ${file.name} não é uma imagem válida.`)
        return
      }
      
      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(`A imagem ${file.name} excede o tamanho máximo de 5MB.`)
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        const imageDataUrl = reader.result as string
        
        // Obter dimensões da imagem
        const img = new Image()
        img.onload = () => {
          setImagens(prev => [...prev, {
            data: imageDataUrl,
            nome: file.name,
            dimensoes: { width: img.width, height: img.height }
          }])
        }
        img.src = imageDataUrl
      }
      reader.readAsDataURL(file)
    })

    // Limpar o input para permitir selecionar o mesmo arquivo novamente
    e.target.value = ''
  }

  const removeImagem = (index: number) => {
    setImagens(prev => prev.filter((_, i) => i !== index))
  }

  const limparFormulario = () => {
    setNomeObra('')
    setEmpresaContratada('')
    setLocalizacaoObra('')
    setData('')
    setNumeroFolha('')
    setCondicaoTempo('bom')
    setPeriodoChuva('')
    setEquipamentos([{ nome: '', quantidade: 0, observacao: '' }])
    setFuncionarios([{ cargo: '', quantidade: 0 }])
    setAtividades([{ descricao: '' }])
    setServicos([{ descricao: '' }])
    setDescricao('')
    setImagens([])
    // Limpar localStorage
    try {
      localStorage.removeItem('diarioObra_draft')
    } catch (error) {
      console.warn('Erro ao limpar rascunho:', error)
    }
  }

  const handlePreview = (e: React.FormEvent) => {
    e.preventDefault()
    
    const dados = {
      nomeObra,
      empresaContratada,
      localizacaoObra,
      data,
      numeroFolha,
      condicaoTempo,
      periodoChuva: condicaoTempo === 'chuvoso' ? periodoChuva : '',
      equipamentos: equipamentos.filter(eq => eq.nome.trim() !== ''),
      funcionarios: funcionarios.filter(func => func.cargo.trim() !== ''),
      atividades: atividades.filter(atv => atv.descricao.trim() !== ''),
      servicos: servicos.filter(serv => serv.descricao.trim() !== ''),
      descricao,
      imagens
    }

    // Gerar pré-visualização
    const url = generatePDFPreview(dados)
    setPreviewUrl(url)
    setShowPreview(true)
  }

  const handleGeneratePDF = () => {
    const dados = {
      nomeObra,
      empresaContratada,
      localizacaoObra,
      data,
      numeroFolha,
      condicaoTempo,
      periodoChuva: condicaoTempo === 'chuvoso' ? periodoChuva : '',
      equipamentos: equipamentos.filter(eq => eq.nome.trim() !== ''),
      funcionarios: funcionarios.filter(func => func.cargo.trim() !== ''),
      atividades: atividades.filter(atv => atv.descricao.trim() !== ''),
      servicos: servicos.filter(serv => serv.descricao.trim() !== ''),
      descricao,
      imagens
    }

    generatePDF(dados)
    
    // Fechar pré-visualização, mostrar modal e limpar formulário
    setShowPreview(false)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl('')
    }
    
    setTimeout(() => {
      setShowModal(true)
      limparFormulario()
    }, 500)
  }

  const fecharPreview = () => {
    setShowPreview(false)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl('')
    }
  }

  const fecharModal = () => {
    setShowModal(false)
  }

  const handleImportarDados = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Log para debug
    console.log('Arquivo selecionado:', {
      nome: file.name,
      tamanho: file.size,
      tipo: file.type,
      ultimaModificacao: file.lastModified
    })

    // Validar tipo de arquivo - verificar extensão (MIME type pode não estar disponível em todos os navegadores)
    const extensaoValida = file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc')
    
    // MIME type é opcional, mas se estiver presente, deve ser válido
    const mimeTypeValido = !file.type || 
                          file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                          file.type === 'application/msword' ||
                          file.type.includes('wordprocessingml') ||
                          file.type.includes('msword')

    if (!extensaoValida) {
      const mensagem = `Por favor, selecione um arquivo Word válido (.docx ou .doc).\n\nArquivo selecionado: ${file.name}\nTipo detectado: ${file.type || 'desconhecido'}\nTamanho: ${(file.size / 1024).toFixed(2)} KB\n\nNota: O arquivo deve ter extensão .docx ou .doc`
      console.error('Arquivo rejeitado - extensão inválida:', mensagem)
      alert(mensagem)
      e.target.value = ''
      return
    }

    // Se MIME type estiver presente e for inválido, avisar mas permitir tentar processar
    if (file.type && !mimeTypeValido) {
      console.warn(`Aviso: MIME type não reconhecido (${file.type}), mas extensão é válida. Tentando processar...`)
    }

    // Validar tamanho do arquivo (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('O arquivo é muito grande. Tamanho máximo permitido: 10MB')
      e.target.value = ''
      return
    }

    setIsImporting(true)
    try {
      // Criar FormData para enviar o arquivo
      const formData = new FormData()
      formData.append('file', file)

      console.log('Enviando arquivo para API...')

      // Chamar API do backend
      const response = await fetch('/api/parse-word', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao processar arquivo')
      }

      const dadosImportados = result.dados

      if (!dadosImportados) {
        throw new Error('Nenhum dado foi retornado pela API')
      }

      console.log('Dados recebidos da API:', dadosImportados)
      
      // Preencher campos básicos
      if (dadosImportados.nomeObra) setNomeObra(dadosImportados.nomeObra)
      if (dadosImportados.empresaContratada) setEmpresaContratada(dadosImportados.empresaContratada)
      if (dadosImportados.localizacaoObra) setLocalizacaoObra(dadosImportados.localizacaoObra)
      if (dadosImportados.data) setData(dadosImportados.data)
      if (dadosImportados.numeroFolha) setNumeroFolha(dadosImportados.numeroFolha)
      if (dadosImportados.condicaoTempo) setCondicaoTempo(dadosImportados.condicaoTempo)
      if (dadosImportados.periodoChuva) setPeriodoChuva(dadosImportados.periodoChuva)
      if (dadosImportados.descricao) setDescricao(dadosImportados.descricao)

      // Preencher equipamentos
      if (dadosImportados.equipamentos && dadosImportados.equipamentos.length > 0) {
        setEquipamentos(dadosImportados.equipamentos)
      }

      // Preencher funcionários
      if (dadosImportados.funcionarios && dadosImportados.funcionarios.length > 0) {
        setFuncionarios(dadosImportados.funcionarios)
      }

      // Preencher atividades
      if (dadosImportados.atividades && dadosImportados.atividades.length > 0) {
        setAtividades(dadosImportados.atividades)
      }

      // Preencher serviços
      if (dadosImportados.servicos && dadosImportados.servicos.length > 0) {
        setServicos(dadosImportados.servicos)
      }

      // Verificar se pelo menos algum dado foi importado
      const dadosImportadosCount = Object.values(dadosImportados).filter(v => 
        v !== undefined && v !== null && 
        (Array.isArray(v) ? v.length > 0 : v !== '')
      ).length

      if (dadosImportadosCount === 0) {
        alert('Atenção: Nenhum dado foi encontrado no arquivo Word.\n\nA IA não conseguiu identificar informações estruturadas no documento.\n\nVerifique se o arquivo contém informações sobre:\n- Nome da Obra\n- Empresa Contratada\n- Localização\n- Data\n- Equipamentos\n- Funcionários\n- Atividades\n- Serviços\n- Descrição')
      } else {
        alert(`✅ Dados importados com sucesso!\n\n${dadosImportadosCount} campo(s) preenchido(s) pela IA.\n\nRevise os campos e ajuste se necessário.`)
      }
    } catch (error) {
      console.error('Erro ao importar dados:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao processar o arquivo.'
      
      // Mensagem mais detalhada para o usuário
      alert(`❌ Erro ao importar dados do arquivo Word:\n\n${errorMessage}\n\nVerifique:\n- Se o arquivo está no formato .docx válido\n- Se o arquivo não está corrompido\n- Se o arquivo contém texto legível\n- Se a API do Gemini está configurada corretamente\n- Tente salvar o arquivo novamente no Word como .docx`)
    } finally {
      setIsImporting(false)
      e.target.value = ''
    }
  }

  // Lista de seções para navegação
  const secoes = [
    { id: 'basicas', titulo: 'Informações Básicas', icon: '📋' },
    { id: 'tempo', titulo: 'Condições do Tempo', icon: '🌤️' },
    { id: 'equipamentos', titulo: 'Equipamentos', icon: '🔧' },
    { id: 'funcionarios', titulo: 'Corpo Efetivo', icon: '👷' },
    { id: 'atividades', titulo: 'Atividades', icon: '📝' },
    { id: 'servicos', titulo: 'Serviços', icon: '🏗️' },
    { id: 'imagens', titulo: 'Imagens', icon: '📷' },
    { id: 'descricao', titulo: 'Descrição', icon: '📄' },
  ]

  // Limpar URL quando componente desmontar
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])
  
  // Detectar seção ativa durante o scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200 // Offset para considerar header
      
      for (const secao of secoes) {
        const element = sectionRefs.current[secao.id]
        if (element) {
          const { offsetTop, offsetHeight } = element
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(secao.id)
            break
          }
        }
      }
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [secoes])

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Navegação Lateral */}
      <div className="lg:w-64 flex-shrink-0">
        <div className="sticky top-4 bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-3 text-sm">Navegação</h3>
          <div className="space-y-1">
            {secoes.map((secao) => {
              const isComplete = isSectionComplete(secao.id)
              const isActive = activeSection === secao.id
              return (
                <button
                  key={secao.id}
                  type="button"
                  onClick={() => scrollToSection(secao.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>{secao.icon}</span>
                  <span className="flex-1">{secao.titulo}</span>
                  {isComplete && (
                    <span className="text-green-500 text-xs">✓</span>
                  )}
                </button>
              )
            })}
          </div>
          
          {/* Barra de Progresso */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-gray-700">Progresso</span>
              <span className="text-xs font-bold text-blue-600">{progresso}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progresso}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Formulário Principal */}
      <div className="flex-1">
    <form onSubmit={handlePreview} className="space-y-6">
          {/* Botão de Importar Dados */}
          <div className="mb-4">
        {/* <button
          type="button"
          onClick={handleImportarDados}
          disabled={isImporting}
          className="w-full md:w-auto bg-purple-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isImporting ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Importando...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Importar Dados
            </>
          )}
        </button> */}
        {/* <input
          ref={fileInputRef}
          type="file"
          accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
          onChange={handleFileChange}
          className="hidden"
        />
        <p className="text-xs text-gray-500 mt-2">
          Selecione um arquivo Word (.docx recomendado) com os dados do diário de obra para preencher automaticamente o formulário.
          <br />
          <span className="text-orange-600">Nota: Arquivos .doc antigos podem não funcionar corretamente. Use .docx quando possível.</span>
        </p> */}
      </div>

      {/* Informações Básicas */}
      <div
        ref={(el) => { sectionRefs.current['basicas'] = el }}
        className="border border-gray-200 rounded-lg bg-white shadow-sm"
      >
        <button
          type="button"
          onClick={() => toggleSection('basicas')}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">📋</span>
            <h2 className="text-lg font-semibold text-gray-800">Informações Básicas</h2>
            {isSectionComplete('basicas') && (
              <span className="text-green-500 text-sm">✓ Completo</span>
            )}
          </div>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${
              expandedSections.has('basicas') ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expandedSections.has('basicas') && (
          <div className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome da Obra *
          </label>
          <input
            type="text"
            required
            value={nomeObra}
            onChange={(e) => setNomeObra(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ex: Edifício Residencial XYZ"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Empresa Contratada *
          </label>
          <input
            type="text"
            required
            value={empresaContratada}
            onChange={(e) => setEmpresaContratada(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ex: Construtora ABC Ltda"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Localização da Obra *
          </label>
          <input
            type="text"
            required
            value={localizacaoObra}
            onChange={(e) => setLocalizacaoObra(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ex: Rua das Flores, 123 - Centro"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data *
          </label>
          <input
            type="date"
            required
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Número da Folha (RDO) *
          </label>
          <input
            type="text"
            required
            value={numeroFolha}
            onChange={(e) => setNumeroFolha(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ex: 001"
          />
        </div>
            </div>
          </div>
        )}
      </div>

      {/* Condições do Tempo */}
      <div
        ref={(el) => { sectionRefs.current['tempo'] = el }}
        className="border border-gray-200 rounded-lg bg-white shadow-sm"
      >
        <button
          type="button"
          onClick={() => toggleSection('tempo')}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🌤️</span>
            <h2 className="text-lg font-semibold text-gray-800">Condições do Tempo</h2>
            {isSectionComplete('tempo') && (
              <span className="text-green-500 text-sm">✓ Completo</span>
            )}
          </div>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${
              expandedSections.has('tempo') ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expandedSections.has('tempo') && (
          <div className="px-4 pb-4">
            <div className="pt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Condições do Tempo *
        </label>
        <select
          required
          value={condicaoTempo}
          onChange={(e) => setCondicaoTempo(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="bom">Bom</option>
          <option value="nublado">Nublado</option>
          <option value="chuvoso">Chuvoso</option>
        </select>

      {condicaoTempo === 'chuvoso' && (
                <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Período da Chuva *
          </label>
          <input
            type="text"
            required
            value={periodoChuva}
            onChange={(e) => setPeriodoChuva(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ex: 08:00 às 12:00"
          />
        </div>
      )}
            </div>
          </div>
        )}
      </div>

      {/* Equipamentos */}
      <div
        ref={(el) => { sectionRefs.current['equipamentos'] = el }}
        className="border border-gray-200 rounded-lg bg-white shadow-sm"
      >
        <button
          type="button"
          onClick={() => toggleSection('equipamentos')}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🔧</span>
            <h2 className="text-lg font-semibold text-gray-800">Equipamentos Utilizados</h2>
            {isSectionComplete('equipamentos') && (
              <span className="text-green-500 text-sm">✓ Completo</span>
            )}
          </div>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${
              expandedSections.has('equipamentos') ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expandedSections.has('equipamentos') && (
          <div className="px-4 pb-4">
            <div className="pt-4">
        <div className="flex flex-col sm:flex-row sm:justify-end gap-2 mb-3">
          <button
            type="button"
            onClick={addEquipamento}
            className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 w-full sm:w-auto"
          >
            + Adicionar Equipamento
          </button>
        </div>
        <div className="space-y-3">
          {equipamentos.map((equipamento, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center mb-2">
                <input
                  type="text"
                  value={equipamento.nome}
                  onChange={(e) => updateEquipamento(index, 'nome', e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nome"
                />
                <div className="flex gap-2 items-center">
                <input
                  type="number"
                  min="0"
                  value={equipamento.quantidade || ''}
                  onChange={(e) => updateEquipamento(index, 'quantidade', parseInt(e.target.value) || 0)}
                    className="w-20 sm:w-24 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Qtd"
                />
                {equipamentos.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEquipamento(index)}
                      className="text-red-500 hover:text-red-700 px-2 flex-shrink-0"
                      title="Remover"
                  >
                    ✕
                  </button>
                )}
                </div>
              </div>
              <div>
                <input
                  type="text"
                  value={equipamento.observacao || ''}
                  onChange={(e) => updateEquipamento(index, 'observacao', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Observação (opcional)"
                />
              </div>
            </div>
          ))}
        </div>
            </div>
          </div>
        )}
      </div>

      {/* Corpo Efetivo */}
      <div
        ref={(el) => { sectionRefs.current['funcionarios'] = el }}
        className="border border-gray-200 rounded-lg bg-white shadow-sm"
      >
        <button
          type="button"
          onClick={() => toggleSection('funcionarios')}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">👷</span>
            <h2 className="text-lg font-semibold text-gray-800">Corpo Efetivo da Empresa Contratada</h2>
            {isSectionComplete('funcionarios') && (
              <span className="text-green-500 text-sm">✓ Completo</span>
            )}
          </div>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${
              expandedSections.has('funcionarios') ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expandedSections.has('funcionarios') && (
          <div className="px-4 pb-4">
            <div className="pt-4">
        <div className="flex flex-col sm:flex-row sm:justify-end gap-2 mb-3">
          <button
            type="button"
            onClick={addFuncionario}
            className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 w-full sm:w-auto"
          >
            + Adicionar Cargo
          </button>
        </div>
        <div className="space-y-2">
          {funcionarios.map((funcionario, index) => (
            <div key={index} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              <input
                type="text"
                value={funcionario.cargo}
                onChange={(e) => updateFuncionario(index, 'cargo', e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Cargo"
              />
              <div className="flex gap-2 items-center">
              <input
                type="number"
                min="0"
                value={funcionario.quantidade || ''}
                onChange={(e) => updateFuncionario(index, 'quantidade', parseInt(e.target.value) || 0)}
                  className="w-20 sm:w-24 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Qtd"
              />
              {funcionarios.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeFuncionario(index)}
                    className="text-red-500 hover:text-red-700 px-2 flex-shrink-0"
                    title="Remover"
                >
                  ✕
                </button>
              )}
              </div>
            </div>
          ))}
        </div>
            </div>
          </div>
        )}
      </div>

      {/* Atividades */}
      <div
        ref={(el) => { sectionRefs.current['atividades'] = el }}
        className="border border-gray-200 rounded-lg bg-white shadow-sm"
      >
        <button
          type="button"
          onClick={() => toggleSection('atividades')}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">📝</span>
            <h2 className="text-lg font-semibold text-gray-800">Atividades Exercidas da Empresa Contratada</h2>
            {isSectionComplete('atividades') && (
              <span className="text-green-500 text-sm">✓ Completo</span>
            )}
          </div>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${
              expandedSections.has('atividades') ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expandedSections.has('atividades') && (
          <div className="px-4 pb-4">
            <div className="pt-4">
        <div className="flex flex-col sm:flex-row sm:justify-end gap-2 mb-3">
          <button
            type="button"
            onClick={addAtividade}
            className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 w-full sm:w-auto"
          >
            + Adicionar Atividade
          </button>
        </div>
        <div className="space-y-2">
          {atividades.map((atividade, index) => (
            <div key={index} className="flex gap-2 items-center">
              <input
                type="text"
                value={atividade.descricao}
                onChange={(e) => updateAtividade(index, e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descrição da atividade"
              />
              {atividades.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeAtividade(index)}
                  className="text-red-500 hover:text-red-700 px-2 flex-shrink-0"
                  title="Remover"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
            </div>
          </div>
        )}
      </div>

      {/* Serviços Executados */}
      <div
        ref={(el) => { sectionRefs.current['servicos'] = el }}
        className="border border-gray-200 rounded-lg bg-white shadow-sm"
      >
        <button
          type="button"
          onClick={() => toggleSection('servicos')}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🏗️</span>
            <h2 className="text-lg font-semibold text-gray-800">Serviços Executados</h2>
            {isSectionComplete('servicos') && (
              <span className="text-green-500 text-sm">✓ Completo</span>
            )}
          </div>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${
              expandedSections.has('servicos') ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expandedSections.has('servicos') && (
          <div className="px-4 pb-4">
            <div className="pt-4">
        <div className="flex flex-col sm:flex-row sm:justify-end gap-2 mb-3">
          <button
            type="button"
            onClick={addServico}
            className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 w-full sm:w-auto"
          >
            + Adicionar Serviço
          </button>
        </div>
        <div className="space-y-2">
          {servicos.map((servico, index) => (
            <div key={index} className="flex gap-2 items-center">
              <input
                type="text"
                value={servico.descricao}
                onChange={(e) => updateServico(index, e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descrição do serviço"
              />
              {servicos.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeServico(index)}
                  className="text-red-500 hover:text-red-700 px-2"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload de Imagens */}
      <div
        ref={(el) => { sectionRefs.current['imagens'] = el }}
        className="border border-gray-200 rounded-lg bg-white shadow-sm"
      >
        <button
          type="button"
          onClick={() => toggleSection('imagens')}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">📷</span>
            <h2 className="text-lg font-semibold text-gray-800">Imagens do Diário de Obra</h2>
            {isSectionComplete('imagens') && (
              <span className="text-green-500 text-sm">✓ Completo</span>
            )}
          </div>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${
              expandedSections.has('imagens') ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expandedSections.has('imagens') && (
          <div className="px-4 pb-4">
            <div className="pt-4">
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Imagens do Diário de Obra
          </label>
          <span className="text-xs text-gray-500">
            {imagens.length} {imagens.length === 1 ? 'imagem adicionada' : 'imagens adicionadas'}
          </span>
        </div>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors mb-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
            id="image-upload"
            multiple
          />
          <label
            htmlFor="image-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <svg
              className="w-12 h-12 text-gray-400 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm text-gray-600">
              Clique para adicionar imagens
            </span>
            <span className="text-xs text-gray-400 mt-1">
              PNG, JPG, GIF até 5MB cada (múltiplas imagens permitidas)
            </span>
          </label>
        </div>

        {imagens.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {imagens.map((imagem, index) => (
              <div key={index} className="relative border border-gray-300 rounded-lg p-3 bg-gray-50">
                <div className="relative">
                  <img
                    src={imagem.data}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-auto max-h-48 object-contain rounded"
                    loading="lazy"
                  />
                  <button
                    type="button"
                    onClick={() => removeImagem(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors text-xs"
                    title="Remover imagem"
                  >
                    ✕
                  </button>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-gray-600 truncate" title={imagem.nome}>
                    {imagem.nome}
                  </p>
                  <p className="text-xs text-gray-400">
                    {imagem.dimensoes.width} × {imagem.dimensoes.height}px
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
            </div>
          </div>
        )}
      </div>

      {/* Descrição Livre */}
      <div
        ref={(el) => { sectionRefs.current['descricao'] = el }}
        className="border border-gray-200 rounded-lg bg-white shadow-sm"
      >
        <button
          type="button"
          onClick={() => toggleSection('descricao')}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">📄</span>
            <h2 className="text-lg font-semibold text-gray-800">Descrição (Texto Livre)</h2>
            {isSectionComplete('descricao') && (
              <span className="text-green-500 text-sm">✓ Completo</span>
            )}
          </div>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${
              expandedSections.has('descricao') ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expandedSections.has('descricao') && (
          <div className="px-4 pb-4">
            <div className="pt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descrição (Texto Livre)
        </label>
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Descreva detalhadamente as atividades do dia..."
        />
            </div>
          </div>
        )}
      </div>

      {/* Botão de Pré-visualização */}
      <div className="pt-4">
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
        >
          Visualizar Prévia do PDF
        </button>
      </div>
        </form>
      </div>

      {/* Modal de Pré-visualização */}
      {showPreview && previewUrl && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={fecharPreview}
        >
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-xl font-bold text-gray-800">
                Pré-visualização do PDF
              </h3>
              <button
                type="button"
                onClick={fecharPreview}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={previewUrl}
                className="w-full h-full border-0"
                title="Pré-visualização do PDF"
              />
            </div>
            <div className="p-4 border-t flex gap-3">
              <button
                type="button"
                onClick={fecharPreview}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGeneratePDF}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Gerar e Baixar PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={fecharModal}
        >
          <div 
            className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-center mb-4">
              <div className="bg-green-100 rounded-full p-3">
                <svg
                  className="w-12 h-12 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-800 text-center mb-2">
              PDF Gerado com Sucesso!
            </h3>
            <p className="text-gray-600 text-center mb-6">
              O diário de obra foi gerado e baixado com sucesso. O formulário foi limpo e está pronto para um novo registro.
            </p>
            <button
              type="button"
              onClick={fecharModal}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

