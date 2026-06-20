'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import {
  LayoutDashboard, BookOpen, Swords, Settings, Trophy,
  TrendingUp, Plus, ChevronRight, Zap, Crown, Target,
  GraduationCap, ShieldCheck, MessageSquare, MessageSquarePlus, BookOpenCheck,
  LayoutGrid, Building2, Bell
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/subjects', icon: BookOpen, label: 'My Subjects' },
  { href: '/compete', icon: Swords, label: 'Compete', badge: 'LIVE' },
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
  const { user, isStarter, isPro, isTeacher, isUniversityAdmin } = useAuth()

  // Role-based navigation (teacher-support system).
  const isStudent = !isTeacher && !isUniversityAdmin
  const roleItems = [
    isStudent && { href: '/support/new', icon: MessageSquarePlus, label: 'Ask a Teacher' },
    isStudent && { href: '/support', icon: MessageSquare, label: 'My Questions' },
    isStudent && { href: '/learning', icon: BookOpenCheck, label: 'Teacher Content' },
    isTeacher && { href: '/teacher', icon: GraduationCap, label: 'Teacher Dashboard' },
    isTeacher && { href: '/support', icon: MessageSquare, label: 'Student Questions' },
    isTeacher && { href: '/teacher/content', icon: BookOpenCheck, label: 'Create Content' },
    isStudent && { href: '/teacher/apply', icon: GraduationCap, label: 'Become a Teacher' },
    isUniversityAdmin && { href: '/admin', icon: LayoutGrid, label: 'Admin Dashboard' },
    isUniversityAdmin && { href: '/admin/academic', icon: Building2, label: 'Departments' },
    isUniversityAdmin && { href: '/admin/teachers', icon: ShieldCheck, label: 'Teacher Approvals' },
    isUniversityAdmin && { href: '/support', icon: MessageSquare, label: 'Support Requests' },
  ].filter(Boolean) as { href: string; icon: typeof GraduationCap; label: string }[]

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen border-r border-white/5 bg-bg-surface pt-16">
      <div className="flex flex-col h-full p-4">
        {/* Quick Actions */}
        <div className="mb-4">
          <Link
            href="/subjects/new"
            className="flex items-center gap-2 glass-hover rounded-xl px-3 py-2.5 text-sm font-medium text-allq-purple border border-allq-purple/20 hover:border-allq-purple/40 transition-all group"
          >
            <Plus className="h-4 w-4" />
            New Subject
            <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname?.startsWith(item.href)
            const isLocked = (item.proOnly && !isPro) || (item.starterOnly && !isStarter && !isPro)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative',
                  isActive
                    ? 'bg-allq-purple/10 text-allq-purple border border-allq-purple/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5',
                  isLocked && 'opacity-60'
                )}
              >
                <item.icon className="h-4.5 w-4.5 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="text-[9px] font-bold bg-allq-red/20 text-allq-red border border-allq-red/30 px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
                {isLocked && (
                  <Crown className="h-3.5 w-3.5 text-allq-amber opacity-70" />
                )}
              </Link>
            )
          })}

          {roleItems.length > 0 && (
            <div className="pt-2 mt-2 border-t border-white/5 space-y-0.5">
              {roleItems.map((item) => {
                const isActive = pathname?.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                      isActive ? 'bg-allq-cyan/10 text-allq-cyan border border-allq-cyan/20' : 'text-slate-400 hover:text-white hover:bg-white/5',
                    )}
                  >
                    <item.icon className="h-4.5 w-4.5 flex-shrink-0" />
                    <span className="flex-1">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </nav>

        {/* Upgrade Banner */}
        {!isPro && (
          <Link href="/pricing" className="block mb-3">
            <div className="glass rounded-xl p-3 border border-allq-purple/20 bg-gradient-to-br from-allq-purple/10 to-allq-cyan/5 hover:border-allq-purple/40 transition-all group">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-allq-purple" />
                <span className="text-xs font-bold text-white">Upgrade to Pro</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
                Unlock real money competitions, unlimited subjects, and advanced AI.
              </p>
              <div className="text-xs font-bold gradient-text">£14.99/month →</div>
            </div>
          </Link>
        )}

        {/* Bottom Nav */}
        <div className="space-y-0.5">
          {bottomItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                pathname?.startsWith(item.href)
                  ? 'text-allq-purple'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </Link>
          ))}
        </div>

        {/* User ELO */}
        {user?.profile && (
          <div className="mt-3 glass rounded-xl p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">ELO Rating</span>
              <span className="text-sm font-bold text-white">{user.profile.eloRating}</span>
            </div>
            <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-allq-purple to-allq-cyan rounded-full transition-all"
                style={{ width: `${Math.min(100, (user.profile.eloRating / 2200) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
