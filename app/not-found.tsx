'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Zap, Home, Search, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-6">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-allq-purple/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-allq-cyan/8 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative text-center max-w-lg"
      >
        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-2 mb-10 group">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-allq-purple to-allq-cyan flex items-center justify-center shadow-neon-purple">
            <Zap className="h-5 w-5 text-white fill-white" />
          </div>
          <span className="text-2xl font-black gradient-text">AllQ</span>
        </Link>

        {/* 404 */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', damping: 14 }}
          className="mb-6"
        >
          <div className="text-[120px] font-black leading-none gradient-text">404</div>
          <div className="text-2xl font-black text-white -mt-4">Page Not Found</div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-slate-400 text-base leading-relaxed mb-10"
        >
          Looks like this quiz question doesn't exist — or the page has been moved.
          Let's get you back on track.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link href="/">
            <Button size="lg" className="gap-2">
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </Link>
          <Link href="/subjects">
            <Button size="lg" variant="outline" className="gap-2">
              <Search className="h-4 w-4" />
              Browse Subjects
            </Button>
          </Link>
        </motion.div>

        {/* Quick links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm"
        >
          {[
            { href: '/dashboard', label: 'Dashboard' },
            { href: '/compete', label: 'Compete' },
            { href: '/leaderboard', label: 'Leaderboard' },
            { href: '/pricing', label: 'Pricing' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-slate-500 hover:text-allq-purple transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}
