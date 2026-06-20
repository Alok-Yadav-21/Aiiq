'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn, getInitials, generateAvatarUrl } from '@/lib/utils'
import { ChevronDown, LogOut, Settings, User, Zap } from 'lucide-react'
import { NotificationsDropdown } from '@/components/notifications-dropdown'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import Image from 'next/image'
import { useState } from 'react'

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/subjects', label: 'Subjects' },
  { href: '/compete', label: 'Compete', badge: 'LIVE' },
  { href: '/pricing', label: 'Pricing' },
]

export function Navbar() {
  const pathname = usePathname()
  const { user, isAuthenticated, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5">
      <div
        className="backdrop-blur-xl bg-bg-base/80"
        style={{ boxShadow: '0 1px 0 rgba(255,255,255,0.05)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-allq-purple to-allq-cyan flex items-center justify-center shadow-neon-purple group-hover:shadow-neon-purple transition-shadow">
                  <Zap className="h-5 w-5 text-white fill-white" />
                </div>
              </div>
              <span className="text-xl font-black tracking-tight gradient-text">AllQ</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'relative px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 flex items-center gap-2',
                    pathname?.startsWith(link.href)
                      ? 'text-white bg-white/5'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  {link.label}
                  {link.badge && (
                    <span className="text-[10px] font-bold bg-allq-red/20 text-allq-red border border-allq-red/30 px-1.5 py-0.5 rounded-full animate-pulse-slow">
                      {link.badge}
                    </span>
                  )}
                  {pathname?.startsWith(link.href) && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-8 bg-allq-purple rounded-full"
                    />
                  )}
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {isAuthenticated && user ? (
                <>
                  {user.subscription?.plan === 'FREE' && (
                    <Link href="/pricing">
                      <Button variant="outline" size="sm" className="hidden sm:flex gap-1.5">
                        <Zap className="h-3.5 w-3.5" />
                        Upgrade
                      </Button>
                    </Link>
                  )}

                  <NotificationsDropdown />

                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button className="flex items-center gap-2 glass rounded-xl px-3 py-2 hover:border-allq-purple/30 transition-all">
                        <div className="h-7 w-7 rounded-lg overflow-hidden">
                          {user.image ? (
                            <Image src={user.image} alt="" width={28} height={28} className="object-cover" />
                          ) : (
                            <div className="h-full w-full bg-gradient-to-br from-allq-purple to-allq-cyan flex items-center justify-center text-white text-xs font-bold">
                              {getInitials(user.name || user.email)}
                            </div>
                          )}
                        </div>
                        <div className="hidden sm:block text-left">
                          <p className="text-xs font-semibold text-white leading-none">
                            {user.name?.split(' ')[0] || 'User'}
                          </p>
                          <p className="text-[10px] text-slate-500 leading-none mt-0.5">
                            {user.subscription?.plan || 'FREE'}
                          </p>
                        </div>
                        <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
                      </button>
                    </DropdownMenu.Trigger>

                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        className="z-50 glass rounded-xl p-1.5 min-w-[200px] shadow-card animate-slide-down border border-white/10 mt-2"
                        align="end"
                        sideOffset={8}
                      >
                        <div className="px-3 py-2 mb-1">
                          <p className="text-sm font-semibold text-white">{user.name}</p>
                          <p className="text-xs text-slate-400">{user.email}</p>
                        </div>
                        <DropdownMenu.Separator className="my-1 border-t border-white/5" />
                        <DropdownMenu.Item asChild>
                          <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                            <User className="h-4 w-4" /> Dashboard
                          </Link>
                        </DropdownMenu.Item>
                        <DropdownMenu.Item asChild>
                          <Link href="/settings" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                            <Settings className="h-4 w-4" /> Settings
                          </Link>
                        </DropdownMenu.Item>
                        <DropdownMenu.Separator className="my-1 border-t border-white/5" />
                        <DropdownMenu.Item
                          className="flex items-center gap-2 px-3 py-2 text-sm text-allq-red hover:bg-allq-red/10 rounded-lg cursor-pointer transition-colors"
                          onSelect={logout}
                        >
                          <LogOut className="h-4 w-4" /> Sign Out
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login">
                    <Button variant="ghost" size="sm">Sign In</Button>
                  </Link>
                  <Link href="/signup">
                    <Button size="sm">Get Started</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
