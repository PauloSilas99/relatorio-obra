import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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

interface ImagemDiario {
  data: string
  nome: string
  dimensoes: { width: number; height: number }
}

interface DadosDiario {
  nomeObra: string
  empresaContratada: string
  localizacaoObra: string
  data: string
  numeroFolha: string
  condicaoTempo: string
  periodoChuva: string
  equipamentos: Equipamento[]
  funcionarios: Funcionario[]
  atividades: Atividade[]
  servicos: Servico[]
  descricao: string
  imagens?: ImagemDiario[]
}

export function generatePDFPreview(dados: DadosDiario): string {
  const doc = new jsPDF()
  const url = generatePDFContent(doc, dados, false)
  return url || ''
}

export function generatePDF(dados: DadosDiario) {
  const doc = new jsPDF()
  generatePDFContent(doc, dados, true)
}

function generatePDFContent(doc: jsPDF, dados: DadosDiario, shouldSave: boolean): string | void {
  
  // Configurações
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const contentWidth = pageWidth - (margin * 2)
  let yPosition = margin

  // Título
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('RELATÓRIO DE DIÁRIO DE OBRA', pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 15

  // Funções auxiliares
  const formatarData = (dataStr: string) => {
    if (!dataStr) return ''
    
    // Parsear a data manualmente para evitar problemas de fuso horário
    // Formato esperado: YYYY-MM-DD
    const partes = dataStr.split('-')
    if (partes.length === 3) {
      const ano = partes[0]
      const mes = partes[1]
      const dia = partes[2]
      // Formatar como DD/MM/YYYY (formato brasileiro)
      return `${dia}/${mes}/${ano}`
    }
    
    // Fallback: tentar usar Date se o formato não for YYYY-MM-DD
    try {
      const data = new Date(dataStr + 'T12:00:00') // Adicionar meio-dia para evitar problemas de timezone
      return data.toLocaleDateString('pt-BR')
    } catch {
      return dataStr
    }
  }

  const condicaoTempoTexto: { [key: string]: string } = {
    'bom': 'Bom',
    'nublado': 'Nublado',
    'chuvoso': 'Chuvoso'
  }

  // Preparar body das informações gerais
  const infoBody = [
    ['Nome da Obra:', dados.nomeObra || ''],
    ['Empresa Contratada:', dados.empresaContratada || ''],
    ['Localização da Obra:', dados.localizacaoObra || ''],
    ['Data:', formatarData(dados.data)],
    ['Número da Folha (RDO):', dados.numeroFolha || ''],
    ['Condições do Tempo:', condicaoTempoTexto[dados.condicaoTempo] || dados.condicaoTempo || ''],
  ]
  
  if (dados.condicaoTempo === 'chuvoso' && dados.periodoChuva) {
    infoBody.push(['Período da Chuva:', dados.periodoChuva])
  }

  // Tabela de Informações Básicas - usando head com 2 colunas e título mesclado
  autoTable(doc, {
    startY: yPosition,
    head: [['INFORMAÇÕES GERAIS', '']],
    headStyles: { 
      fillColor: [41, 128, 185], 
      textColor: 255, 
      fontStyle: 'bold',
      fontSize: 11,
      halign: 'center'
    },
    body: infoBody,
    theme: 'grid',
    styles: { 
      fontSize: 10,
      cellPadding: 4
    },
    columnStyles: {
      0: { 
        cellWidth: 70, 
        fontStyle: 'bold',
        fillColor: [245, 245, 245]
      },
      1: { 
        cellWidth: 100
      }
    },
    margin: { left: margin, right: margin },
    didParseCell: function(data: any) {
      // Mesclar células do cabeçalho
      if (data.section === 'head' && data.row.index === 0) {
        if (data.column.index === 0) {
          data.cell.colSpan = 2
        } else {
          data.cell = null
        }
      }
    }
  })

  yPosition = (doc as any).lastAutoTable?.finalY || yPosition + 50
  yPosition += 12 // Espaçamento adicional após a tabela

  // Equipamentos Utilizados
  if (dados.equipamentos.length > 0) {
    // Verificar se há observações para determinar o número de colunas
    const temObservacoes = dados.equipamentos.some(eq => eq.observacao && eq.observacao.trim() !== '')
    
    if (temObservacoes) {
      // Tabela com observações
      autoTable(doc, {
        startY: yPosition,
        head: [['Equipamento Utilizado', 'Quantidade', 'Observação']],
        body: dados.equipamentos.map(eq => [
          eq.nome || '', 
          eq.quantidade.toString(),
          eq.observacao || ''
        ]),
        theme: 'grid',
        headStyles: { 
          fillColor: [52, 152, 219], 
          textColor: 255, 
          fontStyle: 'bold',
          fontSize: 11
        },
        styles: { 
          fontSize: 9,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 30, halign: 'center' },
          2: { cellWidth: 70 }
        },
        margin: { left: margin, right: margin }
      })
    } else {
      // Tabela sem observações
      autoTable(doc, {
        startY: yPosition,
        head: [['Equipamento Utilizado', 'Quantidade']],
        body: dados.equipamentos.map(eq => [eq.nome || '', eq.quantidade.toString()]),
        theme: 'grid',
        headStyles: { 
          fillColor: [52, 152, 219], 
          textColor: 255, 
          fontStyle: 'bold',
          fontSize: 11
        },
        styles: { 
          fontSize: 10,
          cellPadding: 3
        },
        margin: { left: margin, right: margin }
      })
    }
    yPosition = (doc as any).lastAutoTable?.finalY || yPosition + 30
    yPosition += 12 // Espaçamento adicional
  }

  // Corpo Efetivo
  if (dados.funcionarios.length > 0) {
    autoTable(doc, {
      startY: yPosition,
      head: [['Colaboradores', 'Quantidade']],
      body: dados.funcionarios.map(func => [func.cargo || '', func.quantidade.toString()]),
      theme: 'grid',
      headStyles: { 
        fillColor: [46, 125, 50], 
        textColor: 255, 
        fontStyle: 'bold',
        fontSize: 11
      },
      styles: { 
        fontSize: 10,
        cellPadding: 3
      },
      margin: { left: margin, right: margin }
    })
    yPosition = (doc as any).lastAutoTable?.finalY || yPosition + 30
    yPosition += 12 // Espaçamento adicional
  }

  // Atividades Exercidas
  if (dados.atividades.length > 0) {
    if (yPosition > 250) {
      doc.addPage()
      yPosition = margin
    }
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('ATIVIDADES EXERCIDAS DA EMPRESA CONTRATADA', margin, yPosition)
    yPosition += 10 // Espaçamento após título
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const bulletWidth = contentWidth - 5 // Largura disponível para o texto (descontando o bullet e margem)
    
    dados.atividades.forEach((atividade) => {
      if (atividade.descricao.trim()) {
        // Quebrar texto em múltiplas linhas se necessário
        const textLines = doc.splitTextToSize(atividade.descricao, bulletWidth)
        
        textLines.forEach((line: string, lineIndex: number) => {
          if (yPosition > 270) {
            doc.addPage()
            yPosition = margin
          }
          
          // Adicionar bullet apenas na primeira linha
          const textToShow = lineIndex === 0 ? `• ${line}` : `  ${line}`
          doc.text(textToShow, margin + 5, yPosition)
          yPosition += 7 // Espaçamento entre linhas do mesmo item
        })
        
        yPosition += 3 // Espaçamento adicional entre itens diferentes
      }
    })
    yPosition += 8 // Espaçamento adicional após a lista
  }

  // Serviços Executados
  if (dados.servicos.length > 0) {
    if (yPosition > 250) {
      doc.addPage()
      yPosition = margin
    }
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('SERVIÇOS EXECUTADOS', margin, yPosition)
    yPosition += 10 // Espaçamento após título
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const bulletWidth = contentWidth - 5 // Largura disponível para o texto (descontando o bullet e margem)
    
    dados.servicos.forEach((servico) => {
      if (servico.descricao.trim()) {
        // Quebrar texto em múltiplas linhas se necessário
        const textLines = doc.splitTextToSize(servico.descricao, bulletWidth)
        
        textLines.forEach((line: string, lineIndex: number) => {
          if (yPosition > 270) {
            doc.addPage()
            yPosition = margin
          }
          
          // Adicionar bullet apenas na primeira linha
          const textToShow = lineIndex === 0 ? `• ${line}` : `  ${line}`
          doc.text(textToShow, margin + 5, yPosition)
          yPosition += 7 // Espaçamento entre linhas do mesmo item
        })
        
        yPosition += 3 // Espaçamento adicional entre itens diferentes
      }
    })
    yPosition += 8 // Espaçamento adicional após a lista
  }

  // Descrição Livre
  if (dados.descricao.trim()) {
    if (yPosition > 240) {
      doc.addPage()
      yPosition = margin
    }
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('DESCRIÇÃO', margin, yPosition)
    yPosition += 10 // Espaçamento após título
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    
    const lines = doc.splitTextToSize(dados.descricao, contentWidth)
    lines.forEach((line: string) => {
      if (yPosition > 270) {
        doc.addPage()
        yPosition = margin
      }
      doc.text(line, margin, yPosition)
      yPosition += 7
    })
    yPosition += 5
  }

  // Imagens em grade de 2 colunas
  if (dados.imagens && dados.imagens.length > 0) {
    if (yPosition > 200) {
      doc.addPage()
      yPosition = margin
    }
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(
      dados.imagens.length === 1 
        ? 'IMAGEM DO DIÁRIO DE OBRA' 
        : `IMAGENS DO DIÁRIO DE OBRA (${dados.imagens.length})`,
      margin,
      yPosition
    )
    yPosition += 10 // Espaçamento após título
    
    const pageHeight = doc.internal.pageSize.getHeight()
    const spacingBetweenImages = 8 // Espaçamento horizontal e vertical entre imagens
    const imageColumnWidth = (contentWidth - spacingBetweenImages) / 2 // Largura de cada coluna
    const maxImageHeight = 80 // Altura máxima por imagem
    
    // Processar imagens em pares (2 colunas)
    for (let i = 0; i < dados.imagens.length; i += 2) {
      const imagem1 = dados.imagens[i]
      const imagem2 = dados.imagens[i + 1]
      let startY = yPosition
      let maxHeightInRow = 0
      
      // Verificar se precisa de nova página antes de começar a linha
      if (yPosition > pageHeight - 100) {
        doc.addPage()
        yPosition = margin
        startY = yPosition
      }
      
      // Processar primeira imagem (coluna esquerda)
      if (imagem1) {
        try {
          
          // Detectar formato da imagem
          let imageFormat: 'JPEG' | 'PNG' = 'JPEG'
          if (imagem1.data.startsWith('data:image/png')) {
            imageFormat = 'PNG'
          } else if (imagem1.data.startsWith('data:image/jpeg') || imagem1.data.startsWith('data:image/jpg')) {
            imageFormat = 'JPEG'
          }
          
          // Calcular dimensões da imagem mantendo proporção
          let imgWidth = imagem1.dimensoes.width
          let imgHeight = imagem1.dimensoes.height
          
          // Calcular proporção para redimensionar
          const widthRatio = imageColumnWidth / imgWidth
          const heightRatio = maxImageHeight / imgHeight
          const ratio = Math.min(widthRatio, heightRatio, 1) // Não aumentar a imagem
          
          imgWidth = imgWidth * ratio
          imgHeight = imgHeight * ratio
          
          // Adicionar a imagem na coluna esquerda
          doc.addImage(
            imagem1.data,
            imageFormat,
            margin,
            yPosition,
            imgWidth,
            imgHeight
          )
          
          maxHeightInRow = Math.max(maxHeightInRow, imgHeight)
        } catch (error) {
          doc.setFontSize(10)
          doc.setFont('helvetica', 'normal')
          doc.text(`Erro ao processar imagem ${i + 1}`, margin, yPosition)
          maxHeightInRow = Math.max(maxHeightInRow, 20)
        }
      }
      
      // Processar segunda imagem (coluna direita), se existir
      if (imagem2) {
        try {
          
          // Detectar formato da imagem
          let imageFormat: 'JPEG' | 'PNG' = 'JPEG'
          if (imagem2.data.startsWith('data:image/png')) {
            imageFormat = 'PNG'
          } else if (imagem2.data.startsWith('data:image/jpeg') || imagem2.data.startsWith('data:image/jpg')) {
            imageFormat = 'JPEG'
          }
          
          // Calcular dimensões da imagem mantendo proporção
          let imgWidth = imagem2.dimensoes.width
          let imgHeight = imagem2.dimensoes.height
          
          // Calcular proporção para redimensionar
          const widthRatio = imageColumnWidth / imgWidth
          const heightRatio = maxImageHeight / imgHeight
          const ratio = Math.min(widthRatio, heightRatio, 1) // Não aumentar a imagem
          
          imgWidth = imgWidth * ratio
          imgHeight = imgHeight * ratio
          
          // Posição X da segunda coluna
          const rightColumnX = margin + imageColumnWidth + spacingBetweenImages
          
          // Adicionar a imagem na coluna direita
          doc.addImage(
            imagem2.data,
            imageFormat,
            rightColumnX,
            yPosition,
            imgWidth,
            imgHeight
          )
          
          maxHeightInRow = Math.max(maxHeightInRow, imgHeight)
        } catch (error) {
          doc.setFontSize(10)
          doc.setFont('helvetica', 'normal')
          doc.text(`Erro ao processar imagem ${i + 2}`, margin + imageColumnWidth + spacingBetweenImages, yPosition)
          maxHeightInRow = Math.max(maxHeightInRow, 20)
        }
      }
      
      // Atualizar posição Y para a próxima linha
      yPosition = startY + maxHeightInRow + spacingBetweenImages
      
      // Verificar se precisa de nova página após a linha
      if (yPosition > pageHeight - 50) {
        doc.addPage()
        yPosition = margin
      }
    }
    
    // Espaçamento final após todas as imagens
    yPosition += 5
  }

  // Carimbo do Engenheiro ao final do PDF (compacto, estilo contrato)
  // Deve aparecer na última página que tem imagens, ou na última página do conteúdo
  const pageHeight = doc.internal.pageSize.getHeight()
  const carimboWidth = 110 // Largura maior para texto mais largo
  const carimboHeight = 50 // Altura menor (menos espaço interno)
  const carimboX = pageWidth - carimboWidth - margin - 5 // Canto inferior direito, mais próximo da margem
  const carimboY = pageHeight - carimboHeight - 15 // 15px de margem inferior
  
  // Ir para a última página (onde as imagens terminaram ou última página do conteúdo)
  const finalPage = doc.getNumberOfPages()
  doc.setPage(finalPage)
  
  // Desenhar cantos do carimbo (bordas em L)
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.8)
  const cornerLength = 5
  
  // Canto superior esquerdo
  doc.line(carimboX, carimboY, carimboX + cornerLength, carimboY)
  doc.line(carimboX, carimboY, carimboX, carimboY + cornerLength)
  
  // Canto superior direito
  doc.line(carimboX + carimboWidth - cornerLength, carimboY, carimboX + carimboWidth, carimboY)
  doc.line(carimboX + carimboWidth, carimboY, carimboX + carimboWidth, carimboY + cornerLength)
  
  // Canto inferior esquerdo
  doc.line(carimboX, carimboY + carimboHeight - cornerLength, carimboX, carimboY + carimboHeight)
  doc.line(carimboX, carimboY + carimboHeight, carimboX + cornerLength, carimboY + carimboHeight)
  
  // Canto inferior direito
  doc.line(carimboX + carimboWidth - cornerLength, carimboY + carimboHeight, carimboX + carimboWidth, carimboY + carimboHeight)
  doc.line(carimboX + carimboWidth, carimboY + carimboHeight - cornerLength, carimboX + carimboWidth, carimboY + carimboHeight)
  
  // Texto do carimbo (mais largo e com fontes maiores)
  doc.setTextColor(0, 0, 0)
  const carimboCenterX = carimboX + carimboWidth / 2
  let textY = carimboY + 4 // Menos espaço no topo
  
  // CREA - ENGENHEIRO (topo)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.text('CREA - ENGENHEIRO', carimboCenterX, textY, { align: 'center' })
  textY += 6.5
  
  // Número do CREA
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('110134303-6', carimboCenterX, textY, { align: 'center' })
  textY += 7.5
  
  // Nome do Engenheiro
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('Paulo Sérgio A. Fonseca', carimboCenterX, textY, { align: 'center' })
  textY += 6
  
  // Títulos profissionais (em uma linha)
  doc.setFontSize(6)
  doc.setFont('helvetica', 'normal')
  doc.text('Eng. Civil / Eng. Seg. do Trabalho', carimboCenterX, textY, { align: 'center' })
  textY += 5.5
  
  // Registros nos Estados
  doc.setFontSize(5.5)
  doc.text('Registro: MA/PA/TO', carimboCenterX, textY, { align: 'center' })
  textY += 5
  
  // Contato
  doc.setFontSize(5.5)
  doc.text('(99) 98111 1920 - TIM', carimboCenterX, textY, { align: 'center' })
  textY += 5
  
  // BRASIL
  doc.setFontSize(5)
  doc.text('BRASIL', carimboCenterX, textY, { align: 'center' })

  // Rodapé (numeração de páginas)
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }

  // Salvar PDF ou retornar URL para pré-visualização
  if (shouldSave) {
    const fileName = `Diario_Obra_${dados.numeroFolha}_${dados.data.replace(/-/g, '')}.pdf`
    doc.save(fileName)
    return
  } else {
    // Retornar blob URL para pré-visualização
    const pdfBlob = doc.output('blob')
    return URL.createObjectURL(pdfBlob)
  }
}

