'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { Trophy, Crown, Star, TrendingUp, Zap } from 'lucide-react'
import { cn, formatCurrency, getRankBadge } from '@/lib/utils'

export default function LeaderboardPage() {
  const { user } = useAuth()

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['leaderboard', 'global'],
    queryFn: async () => {
      const res = await fetch('/api/leaderboard')
      const json = await res.json()
      return json.data || []
    },
  })

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <Trophy className="h-8 w-8 text-allq-amber" />
          Global Leaderboard
        </h1>
        <p className="text-slate-400 mt-0.5">Top players ranked by ELO rating and wins</p>
      </div>

      {/* Podium (top 3) */}
      {leaderboard && leaderboard.length >= 3 && (
        <div className="flex items-end justify-center gap-4 mb-10">
          {[leaderboard[1], leaderboard[0], leaderboard[2]].map((entry: any, i: number) => {
            const actualRank = i === 1 ? 1 : i === 0 ? 2 : 3
            const heights = ['h-28', 'h-36', 'h-24']
            const colors = ['bg-slate-500', 'bg-allq-amber', 'bg-amber-700']
            const emojis = ['🥈', '🥇', '🥉']

            return (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center gap-2"
              >
                <div className="text-3xl">{emojis[i]}</div>
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-allq-purple to-allq-cyan flex items-center justify-center text-white text-xl font-black">
                  {(entry.name || 'U')[0]}
                </div>
                <p className="text-xs font-semibold text-white">{entry.name?.split(' ')[0] || 'User'}</p>
                <p className="text-xs text-allq-purple font-bold">{entry.eloRating} ELO</p>
                <div className={cn('w-20 rounded-t-xl', heights[i], colors[i], 'opacity-60 flex items-start justify-center pt-2')}>
                  <span className="text-white font-black text-2xl">#{actualRank}</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Full table */}
      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Rank</th>
              <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Player</th>
              <th className="text-right p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">ELO</th>
              <th className="text-right p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Wins</th>
              <th className="text-right p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Earnings</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? [...Array(10)].map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td colSpan={5} className="p-4">
                      <div className="skeleton h-8 w-full rounded" />
                    </td>
                  </tr>
                ))
              : leaderboard?.map((entry: any, i: number) => {
                  const rank = getRankBadge(entry.eloRating)
                  const isMe = entry.userId === user?.id

                  return (
                    <motion.tr
                      key={entry.userId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className={cn(
                        'border-b border-white/5 hover:bg-white/3 transition-colors',
                        isMe && 'bg-allq-purple/5'
                      )}
                    >
                      <td className="p-4">
                        <span className={cn(
                          'text-lg font-black',
                          i === 0 ? 'text-allq-amber' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-700' : 'text-slate-500'
                        )}>
                          #{i + 1}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-allq-purple to-allq-cyan flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {(entry.name || 'U')[0]}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {entry.name || 'Anonymous'}
                              {isMe && <span className="text-allq-purple text-xs ml-1">(You)</span>}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-xs font-medium" style={{ color: rank.color }}>
                                {rank.label}
                              </span>
                              <Badge
                                variant={entry.plan === 'PRO' ? 'pro' : entry.plan === 'STARTER' ? 'starter' : 'default'}
                                size="sm"
                              >
                                {entry.plan}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right hidden sm:table-cell">
                        <span className="text-sm font-bold text-allq-purple">{entry.eloRating}</span>
                      </td>
                      <td className="p-4 text-right hidden md:table-cell">
                        <span className="text-sm font-bold text-white">{entry.totalWins}</span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-sm font-bold text-allq-green">
                          {formatCurrency(Number(entry.totalEarnings || 0))}
                        </span>
                      </td>
                    </motion.tr>
                  )
                })}
          </tbody>
        </table>

        {!isLoading && (!leaderboard || leaderboard.length === 0) && (
          <div className="text-center py-12">
            <Trophy className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No rankings yet. Be the first to compete!</p>
          </div>
        )}
      </div>
    </div>
  )
}
