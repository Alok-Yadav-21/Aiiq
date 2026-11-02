'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Zap, RefreshCw, Home, AlertTriangle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <html lang="en">
      <body className="antialiased bg-[#e4e3e0] min-h-screen flex items-center justify-center p-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-allq-red/6 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-allq-purple/8 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative text-center max-w-lg"
        >
          <Link href="/" className="inline-flex items-center gap-2 mb-10">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-allq-purple to-allq-cyan flex items-center justify-center">
              <Zap className="h-5 w-5 text-white fill-white" />
            </div>
            <span className="text-2xl font-black gradient-text">AIIQ</span>
          </Link>

          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring' }}
            className="h-20 w-20 rounded-3xl bg-allq-red/10 border border-allq-red/20 flex items-center justify-center mx-auto mb-6"
          >
            <AlertTriangle className="h-10 w-10 text-allq-red" />
          </motion.div>

          <h1 className="text-3xl font-black text-slate-900 mb-3">Something went wrong</h1>
          <p className="text-slate-500 leading-relaxed mb-2">
            An unexpected error occurred. We've been notified and are working on a fix.
          </p>
          {error.digest && (
            <p className="text-xs text-slate-400 font-mono mb-8">Error ID: {error.digest}</p>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Button size="lg" onClick={reset} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Link href="/">
              <Button size="lg" variant="outline" className="gap-2">
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            </Link>
          </div>
        </motion.div>
      </body>
    </html>
  )
}
