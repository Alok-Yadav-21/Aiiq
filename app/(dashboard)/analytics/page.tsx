'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import {
  TrendingUp, Target, Flame, Trophy, Brain,
  Crown, Lock, BookOpen, BarChart2, Zap
} from 'lucide-react'
import { cn, formatCurrency, getRankBadge } from '@/lib/utils'

function MiniBarChart({ data, color = '#8b5cf6' }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((v, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${(v / max) * 100}%` }}
          transition={{ delay: i * 0.04, type: 'spring', damping: 12 }}
          className="flex-1 rounded-sm min-h-[2px]"
          style={{ background: color, opacity: v === 0 ? 0.15 : 0.85 }}
        />
      ))}
    </div>
  )
}

function RadarCell({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="font-bold" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const { user, isPro, isStarter } = useAuth()

  const { data: meData } = useQuery({
    queryKey: ['me-analytics'],
    queryFn: async () => {
      const res = await fetch('/api/auth/me')
      const json = await res.json()
      return json.data
    },
    enabled: isPro || isStarter,
  })

  const profile = meData?.profile || user?.profile
  const rank = getRankBadge(profile?.eloRating || 1200)

  const weeklyActivity = [3, 7, 2, 9, 5, 11, 8]
  const monthlyScores = [420, 390, 580, 510, 640, 720, 680, 750, 690, 810, 870, 920]

  const topicStrengths = [
    { label: 'JavaScript', pct: 84, color: '#f59e0b' },
    { label: 'React', pct: 71, color: '#06b6d4' },
    { label: 'CSS / HTML', pct: 92, color: '#8b5cf6' },
    { label: 'Node.js', pct: 63, color: '#10b981' },
    { label: 'Databases', pct: 55, color: '#ec4899' },
    { label: 'Algorithms', pct: 48, color: '#ef4444' },
  ]

  if (!isPro && !isStarter) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl">
        <h1 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
          <BarChart2 className="h-7 w-7 text-allq-purple" /> Analytics
        </h1>
        <p className="text-slate-400 mb-8">Deep insights into your learning performance</p>

        <div className="glass rounded-2xl p-10 text-center border border-allq-amber/20">
          <div className="h-16 w-16 rounded-2xl bg-allq-amber/10 flex items-center justify-center mx-auto mb-4">
            <Crown className="h-8 w-8 text-allq-amber" />
          </div>
          <h2 className="text-xl font-black text-white mb-2">Starter+ Required</h2>
          <p className="text-slate-400 mb-6 max-w-sm mx-auto">
            Unlock detailed analytics — topic heatmaps, performance trends, accuracy breakdowns, and weak spot detection.
          </p>
          <Link href="/pricing">
            <Button><Zap className="h-4 w-4" /> Upgrade to Starter</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <BarChart2 className="h-7 w-7 text-allq-purple" /> Analytics
          </h1>
          <p className="text-slate-400 mt-0.5">Your learning performance at a glance</p>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold border"
          style={{ borderColor: rank.color + '40', color: rank.color, background: rank.color + '10' }}
        >
          <Target className="h-4 w-4" /> {rank.label} · {profile?.eloRating || 1200} ELO
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Quiz Accuracy', value: '74%', delta: '+6%', icon: Target, color: 'text-allq-purple', bg: 'bg-allq-purple/10' },
          { label: 'Avg Score', value: '680', delta: '+45', icon: TrendingUp, color: 'text-allq-cyan', bg: 'bg-allq-cyan/10' },
          { label: 'Day Streak', value: `${profile?.weeklyStreak || 3}d`, delta: '+1', icon: Flame, color: 'text-allq-red', bg: 'bg-allq-red/10' },
          { label: 'Total Earned', value: formatCurrency(Number(profile?.totalEarnings || 0)), delta: '', icon: Trophy, color: 'text-allq-amber', bg: 'bg-allq-amber/10' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <Card className="glass-hover">
              <CardContent className="pt-5">
                <div className={`inline-flex p-2 rounded-xl ${s.bg} mb-3`}>
                  <s.icon className={`h-4.5 w-4.5 ${s.color}`} />
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-black text-white">{s.value}</span>
                  {s.delta && (
                    <span className="text-xs font-semibold text-allq-green mb-0.5">{s.delta}</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Weekly Activity */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-4.5 w-4.5 text-allq-red" /> Weekly Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2">
                <MiniBarChart data={weeklyActivity} color="#8b5cf6" />
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4.5 w-4.5 text-allq-cyan" /> Score Trend (12 weeks)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MiniBarChart data={monthlyScores} color="#06b6d4" />
              <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                <span>12 weeks ago</span>
                <span className="text-allq-green font-semibold">↑ +119% improvement</span>
                <span>Now</span>
              </div>
            </CardContent>
          </Card>

          {/* Win/Loss record */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-4.5 w-4.5 text-allq-amber" /> Battle Record
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="text-center flex-1">
                  <div className="text-3xl font-black text-allq-green">{profile?.totalWins || 0}</div>
                  <div className="text-xs text-slate-400">Wins</div>
                </div>
                <div className="text-center flex-1">
                  <div className="text-3xl font-black text-allq-red">{profile?.totalLosses || 0}</div>
                  <div className="text-xs text-slate-400">Losses</div>
                </div>
                <div className="text-center flex-1">
                  <div className="text-3xl font-black text-allq-purple">
                    {(profile?.totalWins || 0) + (profile?.totalLosses || 0) > 0
                      ? Math.round(((profile?.totalWins || 0) / ((profile?.totalWins || 0) + (profile?.totalLosses || 0))) * 100)
                      : 0}%
                  </div>
                  <div className="text-xs text-slate-400">Win Rate</div>
                </div>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden flex">
                <motion.div
                  className="bg-allq-green rounded-l-full"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(profile?.totalWins || 0) + (profile?.totalLosses || 0) > 0
                      ? ((profile?.totalWins || 0) / ((profile?.totalWins || 0) + (profile?.totalLosses || 0))) * 100
                      : 50}%`
                  }}
                  transition={{ duration: 1 }}
                />
                <div className="flex-1 bg-allq-red/60 rounded-r-full" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Topic Radar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-4.5 w-4.5 text-allq-purple" /> Topic Mastery
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topicStrengths.map((topic) => (
                <RadarCell key={topic.label} {...topic} />
              ))}
            </CardContent>
          </Card>

          {/* Suggestions */}
          <Card className="border border-allq-purple/20">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-allq-purple" /> AI Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                { icon: '📚', text: 'Practice Algorithms — your weakest topic at 48%' },
                { icon: '🔥', text: 'You\'re on a streak! Keep going to beat your record' },
                { icon: '🏆', text: 'Try an Advanced quiz — your accuracy is high enough' },
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-2.5 text-slate-300">
                  <span className="text-base leading-none mt-0.5">{s.icon}</span>
                  <span className="text-xs leading-relaxed">{s.text}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Subjects breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-allq-cyan" /> By Subject
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { name: 'JavaScript', quizzes: 14, accuracy: '84%' },
                { name: 'React Hooks', quizzes: 8, accuracy: '71%' },
                { name: 'Web APIs', quizzes: 6, accuracy: '66%' },
              ].map((s) => (
                <div key={s.name} className="flex items-center gap-3 py-1.5">
                  <div className="h-8 w-8 rounded-lg bg-allq-purple/10 flex items-center justify-center text-xs font-bold text-allq-purple flex-shrink-0">
                    {s.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{s.name}</p>
                    <p className="text-[10px] text-slate-500">{s.quizzes} quizzes</p>
                  </div>
                  <span className="text-xs font-bold text-allq-green">{s.accuracy}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
