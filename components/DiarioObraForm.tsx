'use client'

import { useState } from 'react'
import { generatePDF } from '@/utils/pdfGenerator'

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
  }

  const handleSubmit = (e: React.FormEvent) => {
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

    generatePDF(dados)
    
    // Mostrar modal e limpar formulário após um pequeno delay para garantir que o PDF foi gerado
    setTimeout(() => {
      setShowModal(true)
      limparFormulario()
    }, 500)
  }

  const fecharModal = () => {
    setShowModal(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informações Básicas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Condições do Tempo */}
      <div>
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
      </div>

      {condicaoTempo === 'chuvoso' && (
        <div>
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

      {/* Equipamentos */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Equipamentos Utilizados
          </label>
          <button
            type="button"
            onClick={addEquipamento}
            className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
          >
            + Adicionar
          </button>
        </div>
        <div className="space-y-3">
          {equipamentos.map((equipamento, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <div className="flex gap-2 items-center mb-2">
                <input
                  type="text"
                  value={equipamento.nome}
                  onChange={(e) => updateEquipamento(index, 'nome', e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nome do equipamento"
                />
                <input
                  type="number"
                  min="0"
                  value={equipamento.quantidade || ''}
                  onChange={(e) => updateEquipamento(index, 'quantidade', parseInt(e.target.value) || 0)}
                  className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Qtd"
                />
                {equipamentos.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEquipamento(index)}
                    className="text-red-500 hover:text-red-700 px-2"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Observação (opcional)
                </label>
                <input
                  type="text"
                  value={equipamento.observacao || ''}
                  onChange={(e) => updateEquipamento(index, 'observacao', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Ex: Perda, quebra, falta..."
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Corpo Efetivo */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Corpo Efetivo da Empresa Contratada
          </label>
          <button
            type="button"
            onClick={addFuncionario}
            className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
          >
            + Adicionar
          </button>
        </div>
        <div className="space-y-2">
          {funcionarios.map((funcionario, index) => (
            <div key={index} className="flex gap-2 items-center">
              <input
                type="text"
                value={funcionario.cargo}
                onChange={(e) => updateFuncionario(index, 'cargo', e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Engenheiro, Pintor, Eletricista..."
              />
              <input
                type="number"
                min="0"
                value={funcionario.quantidade || ''}
                onChange={(e) => updateFuncionario(index, 'quantidade', parseInt(e.target.value) || 0)}
                className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Qtd"
              />
              {funcionarios.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeFuncionario(index)}
                  className="text-red-500 hover:text-red-700 px-2"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Atividades */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Atividades Exercidas da Empresa Contratada
          </label>
          <button
            type="button"
            onClick={addAtividade}
            className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
          >
            + Adicionar
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
                placeholder="Descreva a atividade"
              />
              {atividades.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeAtividade(index)}
                  className="text-red-500 hover:text-red-700 px-2"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Serviços Executados */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Serviços Executados
          </label>
          <button
            type="button"
            onClick={addServico}
            className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
          >
            + Adicionar
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
                placeholder="Ex: Banheiros, Área Externa..."
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

      {/* Upload de Imagens */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Imagens do Diário de Obra
          </label>
          <span className="text-xs text-gray-500">
            {imagens.length} imagem{imagens.length !== 1 ? 'ns' : ''} adicionada{imagens.length !== 1 ? 's' : ''}
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

      {/* Descrição Livre */}
      <div>
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

      {/* Botão de Gerar PDF */}
      <div className="pt-4">
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
        >
          Gerar PDF do Diário de Obra
        </button>
      </div>

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
    </form>
  )
}

