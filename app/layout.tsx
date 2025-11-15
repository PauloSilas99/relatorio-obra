import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Diário de Obra',
  description: 'Sistema para criação de diários de obra',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}

