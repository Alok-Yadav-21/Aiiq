'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { cn, getInitials } from '@/lib/utils'
import { ChevronDown, LogOut, Settings, LayoutDashboard, Sparkles } from 'lucide-react'
import { NotificationsDropdown } from '@/components/notifications-dropdown'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import Image from 'next/image'

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/subjects', label: 'Subjects' },
  { href: '/compete', label: 'Compete' },
  { href: '/leaderboard', label: 'Leaderboard' },
]

export function Navbar() {
  const pathname = usePathname()
  const { user, isAuthenticated, logout } = useAuth()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-line-warm bg-white/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Wordmark — same treatment as the public site */}
          <Link
            href={isAuthenticated ? '/dashboard' : '/'}
            className="text-lg font-black tracking-[0.18em] text-ink hover:opacity-60 transition-opacity"
          >
            AIIQ
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = pathname?.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'relative px-4 py-2 text-[13px] font-medium rounded-xl transition-colors',
                    active ? 'text-ink' : 'text-ink-muted hover:text-ink hover:bg-black/[0.03]'
                  )}
                >
                  {link.label}
                  {active && (
                    <motion.span
                      layoutId="nav-indicator"
                      className="absolute -bottom-px left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-gold-deep"
                    />
                  )}
                </Link>
              )
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                {user.subscription?.plan === 'FREE' && (
                  <Link
                    href="/pricing"
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-[0.12em] uppercase text-gold-700 bg-gold-50 border border-gold-200 hover:bg-gold-100 transition-colors"
                  >
                    <Sparkles className="h-3 w-3" /> Upgrade
                  </Link>
                )}

                <NotificationsDropdown />

                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 border border-line-warm bg-white hover:border-gold-300 transition-colors">
                      <span className="h-7 w-7 rounded-lg overflow-hidden flex-shrink-0">
                        {user.image ? (
                          <Image src={user.image} alt="" width={28} height={28} className="object-cover" />
                        ) : (
                          <span className="h-full w-full bg-gradient-to-br from-gold-light to-gold-deep flex items-center justify-center text-white text-[11px] font-bold">
                            {getInitials(user.name || user.email)}
                          </span>
                        )}
                      </span>
                      <span className="hidden sm:block text-left">
                        <span className="block text-xs font-semibold text-ink leading-none">
                          {user.name?.split(' ')[0] || 'User'}
                        </span>
                        <span className="block text-[10px] text-ink-faint leading-none mt-0.5 uppercase tracking-wider">
                          {user.subscription?.plan || 'FREE'}
                        </span>
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 text-ink-faint hidden sm:block" />
                    </button>
                  </DropdownMenu.Trigger>

                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      className="z-50 bg-white rounded-xl p-1.5 min-w-[210px] shadow-pop animate-slide-down border border-line-card mt-2"
                      align="end"
                      sideOffset={8}
                    >
                      <div className="px-3 py-2 mb-1">
                        <p className="text-sm font-semibold text-ink truncate">{user.name}</p>
                        <p className="text-xs text-ink-faint truncate">{user.email}</p>
                      </div>
                      <DropdownMenu.Separator className="my-1 border-t border-line-soft" />
                      <DropdownMenu.Item asChild>
                        <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm text-ink-secondary hover:text-ink hover:bg-black/[0.04] rounded-lg cursor-pointer transition-colors">
                          <LayoutDashboard className="h-4 w-4" /> Dashboard
                        </Link>
                      </DropdownMenu.Item>
                      <DropdownMenu.Item asChild>
                        <Link href="/settings" className="flex items-center gap-2 px-3 py-2 text-sm text-ink-secondary hover:text-ink hover:bg-black/[0.04] rounded-lg cursor-pointer transition-colors">
                          <Settings className="h-4 w-4" /> Settings
                        </Link>
                      </DropdownMenu.Item>
                      <DropdownMenu.Separator className="my-1 border-t border-line-soft" />
                      <DropdownMenu.Item
                        className="flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger-tint rounded-lg cursor-pointer transition-colors"
                        onSelect={logout}
                      >
                        <LogOut className="h-4 w-4" /> Sign out
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="label-eyebrow text-ink hover:opacity-50 transition-opacity">
                  Log in
                </Link>
                <Link href="/signup">
                  <Button size="sm">Get started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
