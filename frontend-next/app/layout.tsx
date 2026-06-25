import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'IT Helpdesk Agent',
  description: 'AI-powered IT support dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}