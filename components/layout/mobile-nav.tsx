'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, BookOpen, Swords, Trophy, TrendingUp } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const mobileNav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/subjects', icon: BookOpen, label: 'Subjects' },
  { href: '/compete', icon: Swords, label: 'Compete' },
  { href: '/leaderboard', icon: Trophy, label: 'Ranks' },
  { href: '/analytics', icon: TrendingUp, label: 'Stats' },
]

export function MobileNav() {
  const pathname = usePathname()
  const { isPro } = useAuth()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-line-warm bg-white/95 backdrop-blur-xl">
      <div className="flex items-center justify-around h-16 px-2">
        {mobileNav.map((item) => {
          const isActive = pathname?.startsWith(item.href)
          const isLocked = item.href === '/analytics' && !isPro

          return (
            <Link
              key={item.href}
              href={isLocked ? '/pricing' : item.href}
              className={cn(
                'relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors min-w-0',
                isActive ? 'text-gold-700' : 'text-ink-faint hover:text-ink'
              )}
            >
              {isActive && (
                <span className="absolute top-0 h-0.5 w-6 rounded-full bg-gold-deep" />
              )}
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-[10px] font-medium truncate">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
