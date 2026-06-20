import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: {
    default: 'AllQ — Learn It. Quiz It. Win It.',
    template: '%s | AllQ',
  },
  description:
    'The AI-powered global learning and competitive quiz platform. Upload your notes, generate intelligent quizzes, and compete in real-time for real prizes.',
  keywords: ['quiz', 'AI', 'learning', 'competitive', 'education', 'study'],
  authors: [{ name: 'AllQ Team' }],
  icons: {
    icon: '/favicon.ico',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'AllQ — Learn It. Quiz It. Win It.',
    description: 'AI-powered competitive quiz platform',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#8b5cf6',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
