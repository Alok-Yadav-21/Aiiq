'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import {
  LayoutDashboard, BookOpen, Swords, Settings, Trophy,
  TrendingUp, Plus, Target, Bell, Lock, Flame,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/subjects', icon: BookOpen, label: 'My subjects' },
  { href: '/compete', icon: Swords, label: 'Compete' },
  { href: '/challenges', icon: Target, label: 'Challenges', starterOnly: true },
  { href: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { href: '/analytics', icon: TrendingUp, label: 'Analytics', proOnly: true },
]

const bottomItems = [
  { href: '/notifications', icon: Bell, label: 'Notifications' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isStarter, isPro } = useAuth()

  // Real study stats — the sidebar used to show a frozen ELO bar.
  const { data } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const res = await fetch('/api/stats')
      if (!res.ok) return null
      return res.json().then((j) => j.data)
    },
    staleTime: 60_000,
  })
  const stats = data?.stats

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen border-r border-line-warm bg-white pt-16">
      <div className="flex flex-col h-full p-4">
        <Link
          href="/subjects/new"
          className="flex items-center gap-2 btn-grad rounded-xl px-3 py-2.5 text-sm font-semibold mb-5 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          New subject
        </Link>

        <nav className="flex-1 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname?.startsWith(item.href)
            const isLocked = (item.proOnly && !isPro) || (item.starterOnly && !isStarter && !isPro)

            return (
              <Link
                key={item.href}
                href={isLocked ? '/pricing' : item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors',
                  isActive
                    ? 'bg-gold-50 text-gold-700 border border-gold-200'
                    : 'text-ink-muted hover:text-ink hover:bg-black/[0.035] border border-transparent'
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {isLocked && <Lock className="h-3.5 w-3.5 text-ink-faint" />}
              </Link>
            )
          })}
        </nav>

        {/* Study streak — derived from real quiz activity */}
        {stats && (
          <div className="mt-4 surface-sunken p-3.5">
            <div className="flex items-center justify-between mb-2.5">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.12em] uppercase text-ink-muted">
                <Flame className="h-3.5 w-3.5 text-gold-deep" /> Streak
              </span>
              <span className="text-sm font-bold text-ink">
                {stats.currentStreak} {stats.currentStreak === 1 ? 'day' : 'days'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-ink-muted">
              <span>{stats.questionsAnswered} answered</span>
              <span className="font-semibold text-ink-secondary">{stats.accuracy}% correct</span>
            </div>
          </div>
        )}

        {!isPro && (
          <Link href="/pricing" className="block mt-3">
            <div className="rounded-xl p-3.5 border border-gold-200 bg-gold-50 hover:border-gold-300 transition-colors">
              <p className="text-xs font-bold text-ink mb-1.5">Upgrade to Pro</p>
              <p className="text-[11px] text-ink-muted leading-relaxed mb-2">
                Unlimited subjects, longer quizzes and full analytics.
              </p>
              <span className="text-xs font-bold gradient-text">See plans →</span>
            </div>
          </Link>
        )}

        <div className="space-y-0.5 mt-3 pt-3 border-t border-line-soft">
          {bottomItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors',
                pathname?.startsWith(item.href)
                  ? 'text-gold-700 bg-gold-50'
                  : 'text-ink-muted hover:text-ink hover:bg-black/[0.035]'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  )
}
