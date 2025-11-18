# Diário de Obra

Sistema web desenvolvido em Next.js para criação de diários de obra. Permite que engenheiros preencham informações sobre a obra e gerem um PDF formatado profissionalmente.

## Funcionalidades

- Formulário completo com todos os campos necessários para um diário de obra
- Geração de PDF profissional com tabelas e formatação adequada
- Interface moderna e intuitiva com navegação lateral e seções colapsáveis
- Importação automática de dados de arquivos Word usando IA (Google Gemini)
- Auto-save de rascunhos no navegador
- Barra de progresso do formulário
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

2. Configure a API Key do Google Gemini:
   - Crie um arquivo `.env` na raiz do projeto
   - Adicione a seguinte linha:
   ```
   GOOGLE_API_KEY=sua_chave_api_aqui
   ```
   - Obtenha sua chave em: https://makersuite.google.com/app/apikey

3. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

4. Acesse [http://localhost:3000](http://localhost:3000) no seu navegador

## Uso

1. **Importar Dados (Opcional)**: Clique no botão "Importar Dados" e selecione um arquivo Word (.docx). A IA irá extrair automaticamente as informações e preencher o formulário.

2. Preencha todos os campos obrigatórios do formulário
3. Adicione quantos itens forem necessários nas listas (equipamentos, funcionários, atividades, serviços)
4. Use a navegação lateral para navegar entre as seções
5. Clique em "Visualizar Prévia do PDF" para ver como ficará o PDF
6. Clique em "Gerar e Baixar PDF" para gerar e baixar o PDF final

## Tecnologias Utilizadas

- **Next.js 14**: Framework React com App Router
- **TypeScript**: Tipagem estática
- **Tailwind CSS**: Estilização
- **jsPDF**: Geração de PDFs
- **jspdf-autotable**: Criação de tabelas no PDF
- **Google Gemini AI**: Processamento de arquivos Word e extração de dados
- **Mammoth**: Extração de texto de arquivos Word (.docx)

## Estrutura do Projeto

```
.
├── app/
│   ├── api/
│   │   └── parse-word/
│   │       └── route.ts  # API route para processar Word com Gemini
│   ├── globals.css      # Estilos globais
│   ├── layout.tsx       # Layout principal
│   └── page.tsx         # Página principal
├── components/
│   └── DiarioObraForm.tsx  # Componente principal do formulário
├── utils/
│   ├── pdfGenerator.ts  # Geração de PDFs
│   └── wordParser.ts    # Parser de Word (legado, não usado mais)
├── .env                 # Variáveis de ambiente (não versionado)
└── package.json
```

## Build para Produção

```bash
npm run build
npm start
```

