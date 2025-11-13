import type { Metadata } from 'next'
import Providers from './providers'

export const metadata: Metadata = {
  title: 'Seery - A crypto forecast',
  description: 'AI-powered prediction market platform on BNB Chain',
  icons: {
    icon: '/seeryicon.ico',
    shortcut: '/seeryicon.ico',
    apple: '/seeryicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

