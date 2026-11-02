'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/useAuth'
import { getRankBadge } from '@/lib/utils'
import {
  Trophy, Target, Flame, TrendingUp, Swords,
  Crown, Star, ChevronLeft, BookOpen, Users
} from 'lucide-react'

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: string | number; icon: React.ElementType; color: string
}) {
  return (
    <div className="surface-card rounded-2xl p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '15' }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div>
        <div className="text-lg font-black text-slate-900">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { user: currentUser } = useAuth()
  const isOwnProfile = currentUser?.id === id

  const { data, isLoading } = useQuery({
    queryKey: ['profile', id],
    queryFn: async () => {
      const res = await fetch(`/api/users/${id}`)
      if (!res.ok) throw new Error('User not found')
      const json = await res.json()
      return json.data
    },
    retry: false,
  })

  if (isLoading) {
    return (
      <div className="px-5 py-7 lg:px-9 lg:py-9 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-48 rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl">
        <div className="surface-card rounded-2xl p-12 text-center">
          <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-900 mb-2">User Not Found</h2>
          <p className="text-slate-500 mb-6">This profile doesn't exist or has been removed.</p>
          <Link href="/leaderboard">
            <Button variant="outline">View Leaderboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  const profile = data.profile
  const rank = getRankBadge(profile?.eloRating || 1200)
  const winRate = (profile?.totalWins || 0) + (profile?.totalLosses || 0) > 0
    ? Math.round(((profile?.totalWins || 0) / ((profile?.totalWins || 0) + (profile?.totalLosses || 0))) * 100)
    : 0

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <Link
        href="/leaderboard"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-6"
      >
        <ChevronLeft className="h-4 w-4" /> Back to Leaderboard
      </Link>

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="surface-card rounded-2xl p-6 mb-6 relative overflow-hidden"
      >
        {/* Background gradient */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ background: `radial-gradient(circle at 20% 50%, ${rank.color}, transparent 60%)` }}
        />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <div className="relative">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-allq-purple to-allq-cyan flex items-center justify-center text-white text-3xl font-black shadow-neon-purple">
              {(data.name || 'U')[0].toUpperCase()}
            </div>
            {data.subscription?.plan === 'PRO' && (
              <div className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-allq-amber flex items-center justify-center border-2 border-white">
                <Crown className="h-3.5 w-3.5 text-white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-black text-slate-900">
                  {data.name || 'Anonymous'}
                  {isOwnProfile && (
                    <span className="text-allq-purple text-sm font-normal ml-2">(You)</span>
                  )}
                </h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-sm font-bold" style={{ color: rank.color }}>
                    {rank.label}
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-sm text-slate-500">{profile?.eloRating || 1200} ELO</span>
                  <Badge
                    variant={data.subscription?.plan === 'PRO' ? 'pro' : data.subscription?.plan === 'STARTER' ? 'starter' : 'default'}
                    size="sm"
                  >
                    {data.subscription?.plan || 'FREE'}
                  </Badge>
                </div>
              </div>

              {isOwnProfile && (
                <Link href="/settings">
                  <Button variant="outline" size="sm">Edit Profile</Button>
                </Link>
              )}
            </div>

            {/* ELO bar */}
            <div className="mt-3 max-w-xs">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Progress to next rank</span>
                <span style={{ color: rank.color }}>{profile?.eloRating || 1200}</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, ((profile?.eloRating || 1200) / 2200) * 100)}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="h-full rounded-full"
                  style={{ background: rank.color }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats grid */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        <StatCard label="Total Wins" value={profile?.totalWins || 0} icon={Trophy} color="#f59e0b" />
        <StatCard label="Win Rate" value={`${winRate}%`} icon={Target} color="#8b5cf6" />
        <StatCard label="Streak" value={`${profile?.weeklyStreak || 0}d`} icon={Flame} color="#ef4444" />
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Battle Record */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Swords className="h-4.5 w-4.5 text-allq-purple" /> Battle Record
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="text-center flex-1">
                  <div className="text-3xl font-black text-emerald-600">{profile?.totalWins || 0}</div>
                  <div className="text-xs text-slate-500">Wins</div>
                </div>
                <div className="text-2xl font-black text-slate-400">—</div>
                <div className="text-center flex-1">
                  <div className="text-3xl font-black text-allq-red">{profile?.totalLosses || 0}</div>
                  <div className="text-xs text-slate-500">Losses</div>
                </div>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex">
                <motion.div
                  className="bg-allq-green rounded-l-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${winRate}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
                <div className="flex-1 bg-allq-red/50 rounded-r-full" />
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>{winRate}% win rate</span>
                <span>{(profile?.totalWins || 0) + (profile?.totalLosses || 0)} total games</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Subjects */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-4.5 w-4.5 text-allq-cyan" /> Public Subjects
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.subjects && data.subjects.length > 0 ? (
                <div className="space-y-2">
                  {data.subjects.slice(0, 5).map((sub: any) => (
                    <Link
                      key={sub.id}
                      href={`/subjects/${sub.id}`}
                      className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-slate-100 transition-colors group"
                    >
                      <div className="h-8 w-8 rounded-lg bg-allq-purple/10 flex items-center justify-center text-xs font-bold text-allq-purple flex-shrink-0">
                        {sub.title[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate group-hover:text-allq-purple transition-colors">
                          {sub.title}
                        </p>
                        <p className="text-xs text-slate-500">{sub.category}</p>
                      </div>
                      <Star className="h-3.5 w-3.5 text-slate-400 group-hover:text-allq-amber transition-colors" />
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">No public subjects yet</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
