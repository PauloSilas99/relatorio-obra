# Diário de Obra

Sistema web desenvolvido em Next.js para criação de diários de obra. Permite que engenheiros preencham informações sobre a obra e gerem um PDF formatado profissionalmente.

## Funcionalidades

- Formulário completo com todos os campos necessários para um diário de obra
- Geração de PDF profissional com tabelas e formatação adequada
- Interface moderna e intuitiva
- Não requer armazenamento de dados (tudo é processado no cliente)

## Campos do Formulário

- **Nome da Obra**: Nome da obra em execução
- **Empresa Contratada**: Nome da empresa responsável
- **Data**: Data do diário
- **Número da Folha (RDO)**: Número de identificação do diário
- **Condições do Tempo**: Bom, Nublado ou Chuvoso
- **Período da Chuva**: (aparece apenas se "Chuvoso" for selecionado)
- **Equipamentos Utilizados**: Lista de equipamentos com quantidades
- **Corpo Efetivo**: Lista de funcionários por cargo com quantidades
- **Atividades Exercidas**: Lista de atividades realizadas (por tópicos)
- **Serviços Executados**: Lista de serviços realizados (por tópicos)
- **Descrição**: Campo de texto livre para observações detalhadas

## Instalação

1. Instale as dependências:
```bash
npm install
```

2. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

3. Acesse [http://localhost:3000](http://localhost:3000) no seu navegador

## Uso

1. Preencha todos os campos obrigatórios do formulário
2. Adicione quantos itens forem necessários nas listas (equipamentos, funcionários, atividades, serviços)
3. Clique em "Gerar PDF do Diário de Obra"
4. O PDF será gerado e baixado automaticamente

## Tecnologias Utilizadas

- **Next.js 14**: Framework React
- **TypeScript**: Tipagem estática
- **Tailwind CSS**: Estilização
- **jsPDF**: Geração de PDFs
- **jspdf-autotable**: Criação de tabelas no PDF

## Estrutura do Projeto

```
.
├── app/
│   ├── globals.css      # Estilos globais
│   ├── layout.tsx       # Layout principal
│   └── page.tsx         # Página inicial
├── components/
│   └── DiarioObraForm.tsx  # Componente do formulário
├── utils/
│   └── pdfGenerator.ts     # Lógica de geração de PDF
└── package.json
```

## Build para Produção

```bash
npm run build
npm start
```

