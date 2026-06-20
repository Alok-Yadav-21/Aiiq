'use client'

import { Suspense, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import {
  BookOpen, Swords, Trophy, TrendingUp, Plus,
  Zap, Target, Flame, Star, ArrowRight, Crown, FileText, HelpCircle, User as UserIcon
} from 'lucide-react'
import { formatCurrency, getRankBadge } from '@/lib/utils'
import type { Subject } from '@/types'

function UpgradeEffect() {
  const { toast } = useToast()
  const { refreshUser } = useAuth()
  const searchParams = useSearchParams()
  useEffect(() => {
    if (searchParams?.get('upgraded') === 'true') {
      toast.success('Welcome to Pro! 🎉', 'All features are now unlocked.')
      refreshUser()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

// ── Light-theme subject-card accent palette (cycled for visual variety) ──
const ACCENTS = [
  'from-allq-purple to-indigo-400',
  'from-allq-cyan to-sky-400',
  'from-rose-400 to-orange-300',
  'from-emerald-400 to-teal-300',
]

export default function DashboardPage() {
  const { user } = useAuth()

  const { data: subjectsData, isLoading: subjectsLoading } = useQuery({
    queryKey: ['subjects', 'mine'],
    queryFn: async () => {
      const res = await fetch('/api/subjects?mine=true&perPage=6')
      if (!res.ok) throw new Error('Failed to fetch subjects')
      const json = await res.json()
      return json.data
    },
  })

  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const res = await fetch('/api/leaderboard')
      const json = await res.json()
      return json.data?.slice(0, 5) || []
    },
  })

  const plan = user?.subscription?.plan || 'FREE'
  const rank = getRankBadge(user?.profile?.eloRating || 1200)
  const firstName = user?.name?.split(' ')[0] || 'there'
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })

  const stats = [
    { label: 'Total Wins', value: user?.profile?.totalWins ?? 0, icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'ELO Rating', value: user?.profile?.eloRating ?? 1200, icon: TrendingUp, color: 'text-allq-purple', bg: 'bg-purple-50' },
    { label: 'Weekly Streak', value: `${user?.profile?.weeklyStreak ?? 0} days`, icon: Flame, color: 'text-rose-500', bg: 'bg-rose-50' },
    { label: 'Total Earnings', value: formatCurrency(Number(user?.profile?.totalEarnings ?? 0)), icon: Star, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  ]

  const planBadge =
    plan === 'PRO' ? 'bg-amber-50 text-amber-600 border-amber-200'
    : plan === 'STARTER' ? 'bg-purple-50 text-allq-purple border-purple-200'
    : 'bg-slate-100 text-slate-600 border-slate-200'

  const cardShadow = 'shadow-[0_2px_16px_rgba(15,23,42,0.06)]'

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#eef1f6] px-5 py-7 lg:px-9 lg:py-9">
      <Suspense fallback={null}>
        <UpgradeEffect />
      </Suspense>

      <div className="max-w-[1400px] mx-auto grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        {/* ─── Centre column ─────────────────────────────────────────── */}
        <div className="min-w-0">
          {/* Top bar */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-medium text-slate-400">{today}</p>
            </div>
          </div>

          {/* Welcome banner */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative overflow-hidden rounded-3xl bg-white ${cardShadow} border border-slate-100 p-6 sm:p-8 mb-6`}
          >
            <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-gradient-to-br from-allq-purple/10 to-allq-cyan/10 blur-2xl" aria-hidden />
            <div className="relative flex items-center justify-between flex-wrap gap-5">
              <div className="max-w-lg">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Welcome back, {firstName} 👋
                </h1>
                <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                  Turn your lecture notes into summaries, quizzes, flashcards and Q&amp;A — and track your progress.
                </p>
                <div className="mt-4 flex items-center gap-2.5 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${planBadge}`}>
                    {plan === 'PRO' && <Crown className="h-3.5 w-3.5" />}{plan} Plan
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border"
                    style={{ borderColor: rank.color + '40', color: rank.color, background: rank.color + '12' }}
                  >
                    <Target className="h-3.5 w-3.5" />{rank.label}
                  </span>
                  <Link
                    href="/subjects/new"
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-allq-purple to-indigo-500 hover:opacity-90 transition-opacity shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5" /> New Subject
                  </Link>
                </div>
              </div>
              {/* Decorative stack (purely visual) */}
              <div className="hidden sm:flex relative h-28 w-40 items-center justify-center" aria-hidden>
                <div className="absolute h-20 w-28 rounded-2xl bg-gradient-to-br from-allq-cyan/80 to-sky-300 rotate-[-8deg] translate-x-3 translate-y-2 shadow-md" />
                <div className="absolute h-20 w-28 rounded-2xl bg-gradient-to-br from-allq-purple to-indigo-400 rotate-[6deg] shadow-lg flex items-center justify-center">
                  <BookOpen className="h-7 w-7 text-white/90" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`rounded-2xl bg-white ${cardShadow} border border-slate-100 p-4`}
              >
                <div className={`h-9 w-9 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                  <stat.icon className={`h-4.5 w-4.5 ${stat.color}`} />
                </div>
                <div className="text-xl font-black text-slate-900">{stat.value}</div>
                <div className="text-xs text-slate-400 mt-0.5">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* My Subjects */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="h-7 w-7 rounded-lg bg-purple-50 flex items-center justify-center"><BookOpen className="h-4 w-4 text-allq-purple" /></span>
              My Subjects
            </h2>
            <Link href="/subjects" className="inline-flex items-center gap-1 text-xs font-semibold text-allq-purple hover:underline">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {subjectsLoading ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`rounded-2xl bg-white ${cardShadow} border border-slate-100 p-5 animate-pulse`}>
                  <div className="flex gap-2 mb-3"><div className="h-4 w-16 rounded-full bg-slate-100" /><div className="h-4 w-20 rounded-full bg-slate-100" /></div>
                  <div className="h-4 w-3/4 rounded bg-slate-100 mb-2" />
                  <div className="h-3 w-full rounded bg-slate-100 mb-1" />
                  <div className="h-3 w-2/3 rounded bg-slate-100 mb-4" />
                  <div className="h-3 w-1/2 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : subjectsData?.items?.length === 0 ? (
            <div className={`rounded-2xl bg-white ${cardShadow} border border-slate-100 p-10 text-center`}>
              <div className="h-12 w-12 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-3">
                <BookOpen className="h-6 w-6 text-allq-purple" />
              </div>
              <h3 className="text-slate-900 font-bold mb-1">No subjects yet</h3>
              <p className="text-slate-500 text-sm mb-4">Create your first subject and upload materials to get started.</p>
              <Link href="/subjects/new" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-allq-purple to-indigo-500 hover:opacity-90 transition">
                <Plus className="h-4 w-4" /> Create Subject
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {subjectsData?.items?.map((subject: Subject, i: number) => (
                <Link key={subject.id} href={`/subjects/${subject.id}`} className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-allq-purple/50 rounded-2xl">
                  <div className={`rounded-2xl bg-white ${cardShadow} border border-slate-100 overflow-hidden h-full transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_8px_28px_rgba(15,23,42,0.10)]`}>
                    <div className={`h-1.5 bg-gradient-to-r ${ACCENTS[i % ACCENTS.length]}`} />
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-allq-purple">{subject.difficulty}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">{subject.category}</span>
                      </div>
                      <h3 className="font-bold text-slate-900 mb-1 group-hover:text-allq-purple transition-colors line-clamp-1">{subject.title}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-4 min-h-[2rem]">{subject.description || 'No description yet.'}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-400 border-t border-slate-100 pt-3">
                        <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> {subject._count?.materials || 0} materials</span>
                        <span className="flex items-center gap-1"><HelpCircle className="h-3.5 w-3.5" /> {subject._count?.questionBank || 0} questions</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ─── Right rail ────────────────────────────────────────────── */}
        <aside className="space-y-5">
          {/* Profile card */}
          <div className={`rounded-2xl bg-white ${cardShadow} border border-slate-100 p-6 text-center`}>
            <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-allq-purple to-allq-cyan flex items-center justify-center text-white text-2xl font-black ring-4 ring-purple-50 overflow-hidden">
              {user?.image ? <img src={user.image} alt={user?.name || 'Profile'} className="h-full w-full object-cover" /> : (user?.name?.[0] || 'A').toUpperCase()}
            </div>
            <h3 className="mt-3 font-bold text-slate-900">{user?.name || 'Student'}</h3>
            <p className="text-xs text-slate-400">Student · {plan} plan</p>
            <Link href="/settings" className="mt-4 inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-bold text-allq-purple bg-purple-50 hover:bg-purple-100 transition">
              <UserIcon className="h-3.5 w-3.5" /> View profile
            </Link>
          </div>

          {/* Quick actions */}
          <div className={`rounded-2xl bg-white ${cardShadow} border border-slate-100 p-5`}>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-allq-purple" /> Quick Actions
            </h3>
            <div className="space-y-2">
              <Link href="/compete" className="flex items-center gap-3 p-2.5 rounded-xl bg-gradient-to-r from-purple-50 to-sky-50 hover:from-purple-100 transition group">
                <span className="h-9 w-9 rounded-lg bg-white shadow-sm flex items-center justify-center"><Swords className="h-4.5 w-4.5 text-allq-purple" /></span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-slate-900">Join Battle</span>
                  <span className="block text-xs text-slate-400">Compete now</span>
                </span>
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-allq-purple transition-colors" />
              </Link>
              <Link href="/subjects/new" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition group">
                <span className="h-9 w-9 rounded-lg bg-cyan-50 flex items-center justify-center"><Plus className="h-4.5 w-4.5 text-allq-cyan" /></span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-slate-900">New Subject</span>
                  <span className="block text-xs text-slate-400">Upload &amp; generate</span>
                </span>
              </Link>
            </div>
          </div>

          {/* Global Top 5 */}
          <div className={`rounded-2xl bg-white ${cardShadow} border border-slate-100 p-5`}>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
              <Trophy className="h-4 w-4 text-amber-500" /> Global Top 5
            </h3>
            <div className="space-y-2.5">
              {(leaderboard || []).map((entry: { userId: string; name?: string; totalWins?: number; eloRating?: number }, i: number) => (
                <div key={entry.userId} className="flex items-center gap-3">
                  <span className={`text-sm font-bold w-4 text-center ${i < 3 ? 'text-amber-500' : 'text-slate-300'}`}>{i + 1}</span>
                  <span className="h-7 w-7 rounded-full bg-gradient-to-br from-allq-purple to-allq-cyan flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
                    {(entry.name || 'U')[0].toUpperCase()}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-xs font-semibold text-slate-800 truncate">{entry.name || 'Anonymous'}</span>
                    <span className="block text-[10px] text-slate-400">{entry.totalWins ?? 0} wins</span>
                  </span>
                  <span className="text-xs font-bold text-allq-purple">{entry.eloRating}</span>
                </div>
              ))}
              {(!leaderboard || leaderboard.length === 0) && (
                <p className="text-xs text-slate-400 text-center py-2">No rankings yet.</p>
              )}
              <Link href="/leaderboard" className="flex items-center justify-center gap-1 w-full text-xs font-semibold text-allq-purple hover:underline pt-1">
                View full leaderboard <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
