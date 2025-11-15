'use client'

import DiarioObraForm from '@/components/DiarioObraForm'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
            Diário de Obra
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Preencha os dados abaixo para gerar o diário de obra em PDF
          </p>
          <DiarioObraForm />
        </div>
      </div>
    </main>
  )
}

