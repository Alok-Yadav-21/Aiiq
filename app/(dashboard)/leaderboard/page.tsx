'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

type Entry = {
  rank: number
  userId: string
  name: string
  points: number
  quizzesCompleted: number
  questionsAnswered: number
  correctAnswers: number
  accuracy: number
  streak: number
  plan: string
}

const PERIODS = [
  { id: '', label: 'All time' },
  { id: 'month', label: 'This month' },
  { id: 'week', label: 'This week' },
] as const

export default function LeaderboardPage() {
  const { user } = useAuth()
  const [period, setPeriod] = useState<string>('')

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['leaderboard', period],
    queryFn: async () => {
      const res = await fetch(`/api/leaderboard${period ? `?period=${period}` : ''}`)
      const json = await res.json()
      return (json.data || []) as Entry[]
    },
  })

  const top3 = leaderboard?.slice(0, 3) ?? []

  return (
    <div className="app-canvas px-5 py-7 lg:px-9 lg:py-9">
      <div className="max-w-4xl mx-auto">
        <div className="mb-7">
          <p className="label-eyebrow mb-2">Standings</p>
          <h1 className="display text-3xl sm:text-4xl mb-2">Leaderboard</h1>
          <p className="text-sm text-ink-secondary">
            Ranked by points earned and accuracy across completed quizzes.
          </p>
        </div>

        {/* Period filter */}
        <div className="flex gap-1 mb-7 border-b border-line-warm">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={cn(
                'px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors',
                period === p.id
                  ? 'border-gold-deep text-ink'
                  : 'border-transparent text-ink-muted hover:text-ink',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Podium */}
        {!isLoading && top3.length === 3 && (
          <div className="flex items-end justify-center gap-3 sm:gap-5 mb-10">
            {[top3[1], top3[0], top3[2]].map((entry, i) => {
              const actualRank = i === 1 ? 1 : i === 0 ? 2 : 3
              const heights = ['h-20', 'h-28', 'h-16']
              return (
                <motion.div
                  key={entry.userId}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex flex-col items-center gap-2 flex-1 max-w-[140px]"
                >
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-gold-light to-gold-deep flex items-center justify-center text-white text-lg font-black">
                    {(entry.name || 'U')[0].toUpperCase()}
                  </div>
                  <p className="text-xs font-semibold text-ink truncate max-w-full">
                    {entry.name?.split(' ')[0] || 'User'}
                  </p>
                  <p className="text-[11px] text-ink-muted">{entry.points} pts</p>
                  <div
                    className={cn(
                      'w-full rounded-t-xl flex items-start justify-center pt-2 border border-b-0 border-line-warm',
                      heights[i],
                      actualRank === 1 ? 'bg-gold-100' : 'bg-white',
                    )}
                  >
                    <span className="font-black text-xl text-ink-secondary">#{actualRank}</span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Table */}
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px]">
              <thead>
                <tr className="border-b border-line-warm bg-black/[0.015]">
                  {['Rank', 'Learner', 'Accuracy', 'Quizzes', 'Points'].map((col, i) => (
                    <th
                      key={col}
                      className={cn(
                        'p-4 text-[10px] font-semibold text-ink-muted uppercase tracking-[0.12em]',
                        i === 0 || i === 1 ? 'text-left' : 'text-right',
                        col === 'Quizzes' && 'hidden sm:table-cell',
                      )}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(8)].map((_, i) => (
                    <tr key={i} className="border-b border-line-soft">
                      <td colSpan={5} className="p-4">
                        <div className="skeleton h-8 w-full rounded" />
                      </td>
                    </tr>
                  ))
                ) : (
                  leaderboard?.map((entry, i) => {
                    const isMe = entry.userId === user?.id
                    return (
                      <motion.tr
                        key={entry.userId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: Math.min(i * 0.02, 0.3) }}
                        className={cn(
                          'border-b border-line-soft transition-colors',
                          isMe ? 'bg-gold-50' : 'hover:bg-black/[0.02]',
                        )}
                      >
                        <td className="p-4">
                          <span
                            className={cn(
                              'text-base font-black',
                              i < 3 ? 'text-gold-deep' : 'text-ink-faint',
                            )}
                          >
                            {entry.rank}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <span className="h-9 w-9 rounded-xl bg-gradient-to-br from-gold-light to-gold-deep flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                              {(entry.name || 'U')[0].toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-ink truncate">
                                {entry.name || 'Anonymous'}
                                {isMe && <span className="text-gold-700 text-xs ml-1.5">You</span>}
                              </p>
                              <p className="text-[11px] text-ink-faint">
                                {entry.questionsAnswered} questions
                                {entry.streak > 0 && ` · ${entry.streak}-day streak`}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <span
                            className={cn(
                              'text-sm font-bold',
                              entry.accuracy >= 80 ? 'text-success'
                                : entry.accuracy >= 50 ? 'text-warning'
                                : 'text-ink-secondary',
                            )}
                          >
                            {entry.accuracy}%
                          </span>
                        </td>
                        <td className="p-4 text-right hidden sm:table-cell">
                          <span className="text-sm text-ink-secondary">{entry.quizzesCompleted}</span>
                        </td>
                        <td className="p-4 text-right">
                          <span className="text-sm font-bold text-ink">{entry.points}</span>
                        </td>
                      </motion.tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {!isLoading && (!leaderboard || leaderboard.length === 0) && (
            <div className="text-center py-14 px-6">
              <span className="h-12 w-12 rounded-2xl bg-gold-50 border border-gold-200 flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-5 w-5 text-gold-700" />
              </span>
              <h3 className="font-bold text-ink mb-1.5">No rankings yet</h3>
              <p className="text-sm text-ink-muted max-w-xs mx-auto leading-relaxed">
                {period
                  ? 'Nobody has completed a quiz in this period yet.'
                  : 'Complete a quiz to put yourself on the board.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
