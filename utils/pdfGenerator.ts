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

export function generatePDF(dados: DadosDiario) {
  const doc = new jsPDF()
  
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
    const data = new Date(dataStr)
    return data.toLocaleDateString('pt-BR')
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
    dados.atividades.forEach((atividade) => {
      if (yPosition > 270) {
        doc.addPage()
        yPosition = margin
      }
      if (atividade.descricao.trim()) {
        doc.text(`• ${atividade.descricao}`, margin + 5, yPosition)
        yPosition += 8 // Espaçamento maior entre itens
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
    dados.servicos.forEach((servico) => {
      if (yPosition > 270) {
        doc.addPage()
        yPosition = margin
      }
      if (servico.descricao.trim()) {
        doc.text(`• ${servico.descricao}`, margin + 5, yPosition)
        yPosition += 8 // Espaçamento maior entre itens
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
          
          // Adicionar legenda
          const legendY = yPosition + imgHeight + 3
          let legendHeight = 0
          if (legendY < pageHeight - 15) {
            doc.setFontSize(7)
            doc.setFont('helvetica', 'italic')
            doc.text(
              `Img ${i + 1}: ${imagem1.nome}`,
              margin,
              legendY,
              { maxWidth: imageColumnWidth }
            )
            legendHeight = 5
          }
          
          maxHeightInRow = Math.max(maxHeightInRow, imgHeight + legendHeight + 3)
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
          
          // Adicionar legenda
          const legendY = yPosition + imgHeight + 3
          let legendHeight = 0
          if (legendY < pageHeight - 15) {
            doc.setFontSize(7)
            doc.setFont('helvetica', 'italic')
            doc.text(
              `Img ${i + 2}: ${imagem2.nome}`,
              rightColumnX,
              legendY,
              { maxWidth: imageColumnWidth }
            )
            legendHeight = 5
          }
          
          maxHeightInRow = Math.max(maxHeightInRow, imgHeight + legendHeight + 3)
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

  // Carimbo Profissional como Marca D'água (adicionar em todas as páginas)
  const pageHeight = doc.internal.pageSize.getHeight()
  const carimboHeight = 65
  const carimboWidth = 140
  const carimboX = pageWidth - carimboWidth - margin - 10 // Canto inferior direito
  const carimboY = pageHeight - carimboHeight - 15 // 15px de margem inferior
  
  // Adicionar carimbo em todas as páginas como marca d'água
  const totalPagesForCarimbo = doc.getNumberOfPages()
  for (let pageNum = 1; pageNum <= totalPagesForCarimbo; pageNum++) {
    doc.setPage(pageNum)
    
    // Borda externa do carimbo (mais espessa para simular carimbo real)
    doc.setDrawColor(120, 120, 120) // Cinza médio para efeito de marca d'água
    doc.setLineWidth(1.2)
    doc.rect(carimboX, carimboY, carimboWidth, carimboHeight)
    
    // Borda interna (dupla borda para simular carimbo real)
    doc.setDrawColor(140, 140, 140) // Cinza mais claro
    doc.setLineWidth(0.4)
    doc.rect(carimboX + 2, carimboY + 2, carimboWidth - 4, carimboHeight - 4)
    
    // Linha divisória superior
    doc.setDrawColor(150, 150, 150)
    doc.setLineWidth(0.3)
    doc.line(carimboX + 4, carimboY + 18, carimboX + carimboWidth - 4, carimboY + 18)
    
    // Linha divisória inferior
    doc.line(carimboX + 4, carimboY + carimboHeight - 18, carimboX + carimboWidth - 4, carimboY + carimboHeight - 18)
    
    // Texto do carimbo com cor cinza para efeito de marca d'água
    doc.setTextColor(100, 100, 100) // Cinza para marca d'água
    const carimboCenterX = carimboX + carimboWidth / 2
    const carimboTextY = carimboY + 10
    
    // Nome (maior destaque)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Paulo Sérgio A. Fonseca', carimboCenterX, carimboTextY, { align: 'center' })
    
    // Títulos profissionais
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.text('Eng: Civil / Eng: Segurança', carimboCenterX, carimboTextY + 8, { align: 'center' })
    doc.text('do Trabalho', carimboCenterX, carimboTextY + 12, { align: 'center' })
    
    // CREA
    doc.setFontSize(7.5)
    doc.text('CREA NACIONAL', carimboCenterX, carimboTextY + 20, { align: 'center' })
    doc.text('110134303 - 6', carimboCenterX, carimboTextY + 24, { align: 'center' })
    
    // Registros nos Estados
    doc.setFontSize(6.5)
    doc.text('Registro: MA / PA / TO', carimboCenterX, carimboTextY + 32, { align: 'center' })
    
    // Contatos
    doc.setFontSize(6.5)
    doc.text('(99) 98111 1920 - TIM', carimboCenterX, carimboTextY + 38, { align: 'center' })
    
    // Restaurar cor do texto e borda para o restante do documento
    doc.setTextColor(0, 0, 0)
    doc.setDrawColor(0, 0, 0)
  }

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

  // Salvar PDF
  const fileName = `Diario_Obra_${dados.numeroFolha}_${dados.data.replace(/-/g, '')}.pdf`
  doc.save(fileName)
}

