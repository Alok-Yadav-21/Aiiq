'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/pricing', label: 'Pricing' },
]

export function SiteNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <nav className="relative px-7 sm:px-12 pt-8">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="text-lg font-black tracking-[0.18em] hover:opacity-60 transition-opacity"
        >
          AIIQ
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-10">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'label-eyebrow transition-opacity',
                pathname === link.href
                  ? 'text-ink opacity-40'
                  : 'text-ink hover:opacity-50'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4 sm:gap-5">
          <Link
            href="/login"
            className="hidden sm:inline label-eyebrow text-ink hover:opacity-50 transition-opacity"
          >
            Log in
          </Link>
          <Link href="/signup" className="btn-pill px-6 py-2.5">
            Get started
          </Link>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="md:hidden h-9 w-9 -mr-1 flex items-center justify-center rounded-full hover:bg-black/[0.04] transition-colors"
          >
            {open ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden mt-5 pb-1 flex flex-col gap-1 border-t border-line-soft pt-4 animate-slide-down">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                'label-eyebrow py-2.5 transition-opacity',
                pathname === link.href ? 'text-ink opacity-40' : 'text-ink hover:opacity-50'
              )}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="label-eyebrow py-2.5 text-ink hover:opacity-50 transition-opacity sm:hidden"
          >
            Log in
          </Link>
        </div>
      )}
    </nav>
  )
}
