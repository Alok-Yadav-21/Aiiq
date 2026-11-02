import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: {
    default: 'AIIQ — Learn It. Quiz It. Win It.',
    template: '%s | AIIQ',
  },
  description:
    'AIIQ turns your study material into intelligent quizzes, flashcards and notes — grounded strictly in what you upload. Learn it, quiz it, win it.',
  keywords: ['AIIQ', 'AI quiz', 'study', 'flashcards', 'learning platform', 'revision', 'education'],
  authors: [{ name: 'AIIQ' }],
  icons: {
    icon: '/favicon.ico',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'AIIQ — Learn It. Quiz It. Win It.',
    description:
      'Turn your documents into AI-generated quizzes, flashcards and study notes. Track mastery as you go.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#e4e3e0',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
