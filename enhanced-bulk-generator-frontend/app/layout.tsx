import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PL Capital Content Engine',
  description: 'AI-powered content workflow automation',
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
