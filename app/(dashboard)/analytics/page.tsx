'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  TrendingUp, Target, Flame, ListChecks, Lock,
  BarChart2, ArrowRight, Sparkles,
} from 'lucide-react'

type Topic = { topic: string; answered: number; correct: number; accuracy: number }
type Day = { date: string; count: number }

function ActivityChart({ data }: { data: Day[] }) {
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <div>
      <div className="flex items-end gap-1.5 h-28">
        {data.map((d) => (
          <div key={d.date} className="flex-1 flex flex-col justify-end group relative">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${Math.max((d.count / max) * 100, d.count > 0 ? 6 : 2)}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className={cn(
                'rounded-sm w-full',
                d.count > 0 ? 'bg-gold-deep' : 'bg-black/[0.07]',
              )}
            />
            {/* Tooltip */}
            <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity z-10">
              {d.count} on {new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2.5 text-[10px] text-ink-faint">
        <span>{new Date(data[0]?.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
        <span>Today</span>
      </div>
    </div>
  )
}

function TopicBar({ t }: { t: Topic }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-ink-secondary truncate pr-3">{t.topic}</span>
        <span className="text-ink-faint flex-shrink-0">
          <span className="font-bold text-ink">{t.accuracy}%</span> · {t.correct}/{t.answered}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-black/[0.06] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${t.accuracy}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={cn(
            'h-full rounded-full',
            t.accuracy >= 80 ? 'bg-success' : t.accuracy >= 50 ? 'bg-warning' : 'bg-danger',
          )}
        />
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const { isPro, isStarter } = useAuth()
  const unlocked = isPro || isStarter

  const { data, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const res = await fetch('/api/stats')
      if (!res.ok) throw new Error('Failed to load statistics')
      return res.json().then((j) => j.data)
    },
    enabled: unlocked,
  })

  /* ─── Plan gate ────────────────────────────────────────────────────────── */
  if (!unlocked) {
    return (
      <div className="app-canvas px-5 py-7 lg:px-9 lg:py-9">
        <div className="max-w-3xl mx-auto">
          <p className="label-eyebrow mb-2">Analytics</p>
          <h1 className="display text-3xl sm:text-4xl mb-2">Know where you stand.</h1>
          <p className="text-sm text-ink-secondary mb-8 max-w-lg leading-relaxed">
            Accuracy per topic, activity over time, and the weak spots worth revising next.
          </p>

          <div className="surface-card p-10 text-center">
            <span className="h-12 w-12 rounded-2xl bg-gold-50 border border-gold-200 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-5 w-5 text-gold-700" />
            </span>
            <h2 className="font-bold text-ink mb-1.5">Starter plan required</h2>
            <p className="text-sm text-ink-muted mb-6 max-w-sm mx-auto leading-relaxed">
              Detailed analytics are part of Starter and Pro. Your quiz history is still being
              recorded — upgrade any time and it will all be here.
            </p>
            <Link href="/pricing">
              <Button><Sparkles className="h-4 w-4" /> See plans</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const stats = data?.stats
  const topics: Topic[] = data?.topics ?? []
  const activity: Day[] = data?.activity ?? []
  const weakest: Topic[] = data?.weakestTopics ?? []
  const strongest: Topic[] = data?.strongestTopics ?? []
  const hasData = (stats?.questionsAnswered ?? 0) > 0
  // Weakest/strongest each take 5; below 10 topics the two lists overlap.
  const splitWorthwhile = topics.length >= 10

  return (
    <div className="app-canvas px-5 py-7 lg:px-9 lg:py-9">
      <div className="max-w-5xl mx-auto">
        <div className="mb-7">
          <p className="label-eyebrow mb-2">Analytics</p>
          <h1 className="display text-3xl sm:text-4xl mb-2">Your performance</h1>
          <p className="text-sm text-ink-secondary">
            Everything here is calculated from quizzes you have actually completed.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-[120px] rounded-[1.25rem]" />)}
            </div>
            <div className="skeleton h-56 rounded-[1.25rem]" />
          </div>
        ) : !hasData ? (
          <div className="surface-card p-12 text-center">
            <span className="h-12 w-12 rounded-2xl bg-gold-50 border border-gold-200 flex items-center justify-center mx-auto mb-4">
              <BarChart2 className="h-5 w-5 text-gold-700" />
            </span>
            <h2 className="font-bold text-ink mb-1.5">Nothing to analyse yet</h2>
            <p className="text-sm text-ink-muted mb-6 max-w-sm mx-auto leading-relaxed">
              Complete your first quiz and this page will fill with your accuracy per topic,
              activity over time, and what to revise next.
            </p>
            <Link href="/subjects">
              <Button>Go to subjects <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Headline stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Questions', value: stats.questionsAnswered, sub: `${stats.correctAnswers} correct`, icon: ListChecks },
                { label: 'Accuracy', value: `${stats.accuracy}%`, sub: 'all time', icon: Target },
                { label: 'Streak', value: stats.currentStreak, sub: `${stats.studyDays} study ${stats.studyDays === 1 ? 'day' : 'days'}`, icon: Flame },
                { label: 'Points', value: stats.totalPoints, sub: `${stats.quizzesCompleted} quizzes`, icon: TrendingUp },
              ].map((s) => (
                <div key={s.label} className="surface-card p-5">
                  <span className="h-8 w-8 rounded-lg bg-gold-50 border border-gold-200 flex items-center justify-center mb-3">
                    <s.icon className="h-4 w-4 text-gold-700" />
                  </span>
                  <div className="text-2xl font-black text-ink tracking-tight">{s.value}</div>
                  <div className="label-eyebrow mt-1">{s.label}</div>
                  <div className="text-[11px] text-ink-faint mt-0.5">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Activity */}
            {activity.length > 0 && (
              <div className="surface-card p-7">
                <div className="flex items-baseline justify-between mb-5">
                  <div>
                    <h2 className="text-sm font-bold text-ink">Activity</h2>
                    <p className="text-xs text-ink-faint mt-0.5">Questions answered, last 14 days</p>
                  </div>
                </div>
                <ActivityChart data={activity} />
              </div>
            )}

            {/* Topic mastery.
                Splitting into weakest/strongest only says something once there
                are enough topics for the two lists to differ — below that it is
                the same list printed twice, so show a single ranking instead. */}
            {topics.length > 0 && (
              splitWorthwhile ? (
                <div className="grid lg:grid-cols-2 gap-5">
                  <div className="surface-card p-7">
                    <h2 className="text-sm font-bold text-ink mb-1">Needs work</h2>
                    <p className="text-xs text-ink-faint mb-5">Lowest accuracy first.</p>
                    <div className="space-y-3.5">
                      {weakest.map((t) => <TopicBar key={t.topic} t={t} />)}
                    </div>
                  </div>

                  <div className="surface-card p-7">
                    <h2 className="text-sm font-bold text-ink mb-1">Strongest</h2>
                    <p className="text-xs text-ink-faint mb-5">Topics you have mastered.</p>
                    <div className="space-y-3.5">
                      {strongest.map((t) => <TopicBar key={t.topic} t={t} />)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="surface-card p-7">
                  <h2 className="text-sm font-bold text-ink mb-1">Topic mastery</h2>
                  <p className="text-xs text-ink-faint mb-5">
                    {topics.length} {topics.length === 1 ? 'topic' : 'topics'} with enough answers to score — weakest first.
                  </p>
                  <div className="space-y-3.5">
                    {topics.map((t) => <TopicBar key={t.topic} t={t} />)}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  )
}
