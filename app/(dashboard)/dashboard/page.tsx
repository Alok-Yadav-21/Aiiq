'use client'

import { Suspense, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import {
  BookOpen, Plus, ArrowRight, FileText, HelpCircle,
  Flame, Target, CheckCircle2, ListChecks, Trophy, Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Subject } from '@/types'

function UpgradeEffect() {
  const { toast } = useToast()
  const { refreshUser } = useAuth()
  const searchParams = useSearchParams()
  useEffect(() => {
    if (searchParams?.get('upgraded') === 'true') {
      toast.success('Welcome to Pro', 'All features are now unlocked.')
      refreshUser()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

function StatTile({
  label, value, sub, icon: Icon,
}: {
  label: string; value: string | number; sub?: string; icon: React.ElementType
}) {
  return (
    <div className="surface-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="h-8 w-8 rounded-lg bg-gold-50 border border-gold-200 flex items-center justify-center">
          <Icon className="h-4 w-4 text-gold-700" />
        </span>
      </div>
      <div className="text-2xl font-black text-ink tracking-tight">{value}</div>
      <div className="text-[11px] font-semibold tracking-[0.12em] uppercase text-ink-muted mt-1">{label}</div>
      {sub && <div className="text-[11px] text-ink-faint mt-0.5">{sub}</div>}
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()

  const { data: subjectsData, isLoading: subjectsLoading } = useQuery({
    queryKey: ['subjects', 'mine'],
    queryFn: async () => {
      const res = await fetch('/api/subjects?mine=true&perPage=6')
      if (!res.ok) throw new Error('Failed to fetch subjects')
      return res.json().then((j) => j.data)
    },
  })

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const res = await fetch('/api/stats')
      if (!res.ok) throw new Error('Failed to fetch stats')
      return res.json().then((j) => j.data)
    },
  })

  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard', 'top'],
    queryFn: async () => {
      const res = await fetch('/api/leaderboard')
      const json = await res.json()
      return (json.data || []).slice(0, 5)
    },
  })

  const stats = statsData?.stats
  const weakest = statsData?.weakestTopics ?? []
  const recent = statsData?.recentAttempts ?? []
  const subjects: Subject[] = subjectsData?.items ?? []

  const plan = user?.subscription?.plan || 'FREE'
  const firstName = user?.name?.split(' ')[0] || 'there'
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  const hasStudied = (stats?.questionsAnswered ?? 0) > 0

  return (
    <div className="app-canvas px-5 py-7 lg:px-9 lg:py-9">
      <Suspense fallback={null}>
        <UpgradeEffect />
      </Suspense>

      <div className="max-w-[1400px] mx-auto grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        {/* ─── Main column ─────────────────────────────────────────── */}
        <div className="min-w-0">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mb-7">
            <p className="label-eyebrow mb-2">{today}</p>
            <h1 className="display text-3xl sm:text-4xl mb-2">Welcome back, {firstName}.</h1>
            <p className="text-sm text-ink-secondary max-w-lg leading-relaxed">
              {hasStudied
                ? 'Pick up a subject, or close a weak spot from the list on the right.'
                : 'Create a subject, upload your material, and AIIQ will turn it into questions.'}
            </p>
          </motion.div>

          {/* Stats — all derived from real quiz history */}
          {statsLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-[132px] rounded-[1.25rem]" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatTile
                label="Questions" icon={ListChecks}
                value={stats?.questionsAnswered ?? 0}
                sub={`${stats?.correctAnswers ?? 0} correct`}
              />
              <StatTile
                label="Accuracy" icon={Target}
                value={`${stats?.accuracy ?? 0}%`}
                sub={hasStudied ? 'across all quizzes' : 'no quizzes yet'}
              />
              <StatTile
                label="Streak" icon={Flame}
                value={stats?.currentStreak ?? 0}
                sub={`${stats?.studyDays ?? 0} study days total`}
              />
              <StatTile
                label="Quizzes" icon={CheckCircle2}
                value={stats?.quizzesCompleted ?? 0}
                sub={`${stats?.totalPoints ?? 0} points earned`}
              />
            </div>
          )}

          {/* Subjects */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-ink">Your subjects</h2>
            {subjects.length > 0 && (
              <Link href="/subjects" className="inline-flex items-center gap-1 text-xs font-semibold text-gold-700 hover:underline">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          {subjectsLoading ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-44 rounded-[1.25rem]" />)}
            </div>
          ) : subjects.length === 0 ? (
            <div className="surface-card p-10 text-center">
              <span className="h-12 w-12 rounded-2xl bg-gold-50 border border-gold-200 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-5 w-5 text-gold-700" />
              </span>
              <h3 className="text-ink font-bold mb-1.5">No subjects yet</h3>
              <p className="text-ink-muted text-sm mb-5 max-w-sm mx-auto leading-relaxed">
                A subject holds your material. Upload notes or a PDF, and AIIQ generates
                questions strictly from it.
              </p>
              <Link href="/subjects/new" className="btn-grad inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold">
                <Plus className="h-4 w-4" /> Create your first subject
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {subjects.map((subject) => (
                <Link key={subject.id} href={`/subjects/${subject.id}`} className="group rounded-[1.25rem]">
                  <div className="surface-card-hover h-full p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gold-50 text-gold-700 border border-gold-200">
                        {subject.difficulty}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/[0.04] text-ink-muted">
                        {subject.category}
                      </span>
                    </div>
                    <h3 className="font-bold text-ink mb-1 group-hover:text-gold-700 transition-colors line-clamp-1">
                      {subject.title}
                    </h3>
                    <p className="text-xs text-ink-muted line-clamp-2 mb-4 min-h-[2rem] leading-relaxed">
                      {subject.description || 'No description yet.'}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-ink-faint border-t border-line-soft pt-3">
                      <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> {subject._count?.materials || 0} materials</span>
                      <span className="flex items-center gap-1"><HelpCircle className="h-3.5 w-3.5" /> {subject._count?.questionBank || 0} questions</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Recent results */}
          {recent.length > 0 && (
            <>
              <h2 className="text-base font-bold text-ink mt-9 mb-4">Recent results</h2>
              <div className="surface-card divide-y divide-line-soft overflow-hidden">
                {recent.map((a: {
                  id: string; subjectId: string; subjectTitle: string
                  accuracy: number; correctAnswers: number; totalQuestions: number
                  score: number; completedAt: string | null
                }) => (
                  <Link
                    key={a.id}
                    href={`/subjects/${a.subjectId}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-black/[0.02] transition-colors"
                  >
                    <span
                      className={cn(
                        'h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0',
                        a.accuracy >= 80 ? 'bg-success-tint text-success'
                          : a.accuracy >= 50 ? 'bg-warning-tint text-warning'
                          : 'bg-danger-tint text-danger'
                      )}
                    >
                      {a.accuracy}%
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-ink truncate">{a.subjectTitle}</span>
                      <span className="block text-xs text-ink-faint">
                        {a.correctAnswers}/{a.totalQuestions} correct
                        {a.completedAt && ` · ${new Date(a.completedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                      </span>
                    </span>
                    <span className="text-sm font-bold text-ink-secondary flex-shrink-0">{a.score}</span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ─── Right rail ──────────────────────────────────────────── */}
        <aside className="space-y-5">
          {/* Profile */}
          <div className="surface-card p-6 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-gold-light to-gold-deep flex items-center justify-center text-white text-xl font-black overflow-hidden">
              {user?.image
                ? <img src={user.image} alt="" className="h-full w-full object-cover" />
                : (user?.name?.[0] || 'A').toUpperCase()}
            </div>
            <h3 className="mt-3 font-bold text-ink">{user?.name || 'Student'}</h3>
            <p className="text-[11px] uppercase tracking-[0.12em] text-ink-faint mt-0.5">{plan} plan</p>
            <Link
              href="/settings"
              className="mt-4 inline-flex items-center justify-center w-full py-2 rounded-xl text-xs font-semibold text-ink-secondary border border-line-warm hover:border-gold-300 hover:text-ink transition-colors"
            >
              Account settings
            </Link>
          </div>

          {/* Revise next — the weak-spot list, from real topic accuracy */}
          <div className="surface-card p-5">
            <h3 className="text-sm font-bold text-ink flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-gold-deep" /> Revise next
            </h3>
            <p className="text-[11px] text-ink-faint mb-4">Your weakest topics so far.</p>
            {weakest.length === 0 ? (
              <p className="text-xs text-ink-faint leading-relaxed">
                Complete a quiz and your weakest topics will appear here.
              </p>
            ) : (
              <div className="space-y-3">
                {weakest.map((t: TopicRow) => (
                  <div key={t.topic}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-ink-secondary truncate pr-2">{t.topic}</span>
                      <span className="font-bold text-ink flex-shrink-0">{t.accuracy}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-black/[0.06] overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          t.accuracy >= 80 ? 'bg-success' : t.accuracy >= 50 ? 'bg-warning' : 'bg-danger'
                        )}
                        style={{ width: `${t.accuracy}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leaderboard */}
          <div className="surface-card p-5">
            <h3 className="text-sm font-bold text-ink flex items-center gap-2 mb-4">
              <Trophy className="h-4 w-4 text-gold-deep" /> Top learners
            </h3>
            <div className="space-y-2.5">
              {(leaderboard ?? []).map((e: LeaderRow, i: number) => (
                <div key={e.userId} className="flex items-center gap-3">
                  <span className={cn('text-xs font-bold w-4 text-center', i < 3 ? 'text-gold-deep' : 'text-ink-faint')}>
                    {i + 1}
                  </span>
                  <span className="h-7 w-7 rounded-full bg-gradient-to-br from-gold-light to-gold-deep flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
                    {(e.name || 'U')[0].toUpperCase()}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-xs font-semibold text-ink truncate">{e.name}</span>
                    <span className="block text-[10px] text-ink-faint">{e.accuracy}% accuracy</span>
                  </span>
                  <span className="text-xs font-bold text-ink-secondary">{e.points}</span>
                </div>
              ))}
              {(!leaderboard || leaderboard.length === 0) && (
                <p className="text-xs text-ink-faint text-center py-2">
                  No completed quizzes yet. Be the first.
                </p>
              )}
              <Link href="/leaderboard" className="flex items-center justify-center gap-1 w-full text-xs font-semibold text-gold-700 hover:underline pt-2">
                Full leaderboard <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

type TopicRow = { topic: string; accuracy: number; answered: number; correct: number }
type LeaderRow = { userId: string; name: string; points: number; accuracy: number }
