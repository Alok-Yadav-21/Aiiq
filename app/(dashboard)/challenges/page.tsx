'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { cn, getRankBadge, formatCurrency, formatRelativeTime } from '@/lib/utils'
import {
  Swords, Trophy, Crown, Clock, CheckCircle, XCircle,
  Zap, Users, Target, Plus, Lock, AlertCircle
} from 'lucide-react'

type ChallengeStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'EXPIRED'

interface Challenge {
  id: string
  status: ChallengeStatus
  wagerAmount: number
  expiresAt: string
  createdAt: string
  subject?: { title: string; id: string }
  challenger: { id: string; name: string; profile?: { eloRating: number } }
  challenged: { id: string; name: string; profile?: { eloRating: number } }
  winnerId?: string
}

function ChallengeCard({ challenge, userId, onAccept, onDecline }: {
  challenge: Challenge
  userId: string
  onAccept: (id: string) => void
  onDecline: (id: string) => void
}) {
  const isChallenger = challenge.challenger.id === userId
  const opponent = isChallenger ? challenge.challenged : challenge.challenger
  const opponentRank = getRankBadge(opponent.profile?.eloRating || 1200)
  const isExpired = new Date(challenge.expiresAt) < new Date()
  const isPending = challenge.status === 'PENDING' && !isExpired
  const canRespond = isPending && !isChallenger

  const statusConfig: Record<ChallengeStatus | 'EXPIRED', { label: string; color: string; icon: React.ElementType }> = {
    PENDING: { label: 'Pending', color: 'text-allq-amber', icon: Clock },
    ACCEPTED: { label: 'Accepted', color: 'text-allq-green', icon: CheckCircle },
    REJECTED: { label: 'Declined', color: 'text-allq-red', icon: XCircle },
    COMPLETED: { label: 'Completed', color: 'text-slate-400', icon: Trophy },
    EXPIRED: { label: 'Expired', color: 'text-slate-500', icon: AlertCircle },
  }

  const displayStatus = isExpired && challenge.status === 'PENDING' ? 'EXPIRED' : challenge.status
  const status = statusConfig[displayStatus]
  const StatusIcon = status.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      layout
    >
      <Card className={cn(
        'transition-all',
        canRespond && 'border-allq-purple/30 shadow-neon-purple/10'
      )}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              {/* Opponent avatar */}
              <div className="relative">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-allq-purple to-allq-cyan flex items-center justify-center text-white font-bold flex-shrink-0">
                  {(opponent.name || 'U')[0].toUpperCase()}
                </div>
                {isChallenger && (
                  <div className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-allq-purple flex items-center justify-center">
                    <Swords className="h-2.5 w-2.5 text-white" />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-white">{opponent.name || 'Anonymous'}</span>
                  <span className="text-xs font-medium" style={{ color: opponentRank.color }}>
                    {opponentRank.label}
                  </span>
                  <span className="text-xs text-slate-500">{opponent.profile?.eloRating || 1200} ELO</span>
                </div>
                {challenge.subject && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    Subject: <span className="text-slate-300">{challenge.subject.title}</span>
                  </p>
                )}
                <p className="text-xs text-slate-500 mt-0.5">{formatRelativeTime(challenge.createdAt)}</p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              {challenge.wagerAmount > 0 && (
                <div className="flex items-center gap-1.5 text-allq-amber font-bold text-sm">
                  <Trophy className="h-3.5 w-3.5" />
                  {formatCurrency(challenge.wagerAmount)}
                </div>
              )}
              <div className={cn('flex items-center gap-1 text-xs font-medium', status.color)}>
                <StatusIcon className="h-3.5 w-3.5" />
                {status.label}
              </div>
            </div>
          </div>

          {canRespond && (
            <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => onAccept(challenge.id)}
              >
                <CheckCircle className="h-3.5 w-3.5" /> Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-allq-red/30 text-allq-red hover:bg-allq-red/10"
                onClick={() => onDecline(challenge.id)}
              >
                <XCircle className="h-3.5 w-3.5" /> Decline
              </Button>
            </div>
          )}

          {challenge.status === 'ACCEPTED' && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <Link href="/compete">
                <Button size="sm" className="w-full gap-2">
                  <Swords className="h-3.5 w-3.5" /> Play Now
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function ChallengesPage() {
  const { user, isPro, isStarter } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<'all' | 'incoming' | 'outgoing' | 'completed'>('all')

  const canUseChallenge = isPro || isStarter

  const { data: challenges, isLoading } = useQuery<Challenge[]>({
    queryKey: ['challenges'],
    queryFn: async () => {
      const res = await fetch('/api/challenges')
      const json = await res.json()
      return json.data || []
    },
    enabled: canUseChallenge,
    refetchInterval: 30000,
  })

  const respondMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'accept' | 'reject' }) => {
      const res = await fetch(`/api/challenges/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      return json.data
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] })
      toast.success(
        action === 'accept' ? 'Challenge accepted!' : 'Challenge declined',
        action === 'accept' ? 'Head to Compete to start the match.' : 'The challenge has been declined.'
      )
    },
    onError: (err: Error) => {
      toast.error('Failed to respond', err.message)
    },
  })

  if (!canUseChallenge) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl">
        <h1 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
          <Swords className="h-7 w-7 text-allq-purple" /> Challenges
        </h1>
        <p className="text-slate-400 mb-8">1v1 direct challenges with other players</p>

        <div className="glass rounded-2xl p-10 text-center border border-allq-amber/20">
          <div className="h-16 w-16 rounded-2xl bg-allq-amber/10 flex items-center justify-center mx-auto mb-4">
            <Crown className="h-8 w-8 text-allq-amber" />
          </div>
          <h2 className="text-xl font-black text-white mb-2">Starter+ Required</h2>
          <p className="text-slate-400 mb-6 max-w-sm mx-auto">
            Challenge other players directly, set wagers, and compete head-to-head on any subject.
          </p>
          <Link href="/pricing">
            <Button><Zap className="h-4 w-4" /> Upgrade Now</Button>
          </Link>
        </div>
      </div>
    )
  }

  const filtered = challenges?.filter((c) => {
    if (filter === 'incoming') return c.challenged.id === user?.id && c.status === 'PENDING'
    if (filter === 'outgoing') return c.challenger.id === user?.id && c.status === 'PENDING'
    if (filter === 'completed') return c.status === 'COMPLETED'
    return true
  }) || []

  const incomingCount = challenges?.filter(
    (c) => c.challenged.id === user?.id && c.status === 'PENDING' && new Date(c.expiresAt) > new Date()
  ).length || 0

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Swords className="h-7 w-7 text-allq-purple" /> Challenges
            {incomingCount > 0 && (
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-allq-red text-white text-xs font-bold">
                {incomingCount}
              </span>
            )}
          </h1>
          <p className="text-slate-400 mt-0.5">1v1 direct match challenges</p>
        </div>
        <Link href="/compete">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Find Opponent
          </Button>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          {
            label: 'Pending',
            value: challenges?.filter((c) => c.status === 'PENDING').length || 0,
            icon: Clock,
            color: '#f59e0b',
          },
          {
            label: 'Won',
            value: challenges?.filter((c) => c.status === 'COMPLETED' && c.winnerId === user?.id).length || 0,
            icon: Trophy,
            color: '#10b981',
          },
          {
            label: 'Total',
            value: challenges?.length || 0,
            icon: Target,
            color: '#8b5cf6',
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="glass rounded-2xl p-4 text-center"
          >
            <div className="h-9 w-9 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ background: stat.color + '15' }}>
              <stat.icon className="h-4.5 w-4.5" style={{ color: stat.color }} />
            </div>
            <div className="text-2xl font-black text-white">{stat.value}</div>
            <div className="text-xs text-slate-400">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {[
          { key: 'all', label: 'All' },
          { key: 'incoming', label: `Incoming${incomingCount > 0 ? ` (${incomingCount})` : ''}` },
          { key: 'outgoing', label: 'Outgoing' },
          { key: 'completed', label: 'Completed' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as typeof filter)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap',
              filter === tab.key
                ? 'bg-allq-purple/15 text-allq-purple border border-allq-purple/30'
                : 'text-slate-400 border border-white/5 hover:text-white hover:border-white/15'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Challenge list */}
      <div className="space-y-3">
        {isLoading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
        ) : filtered.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {filtered.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                userId={user?.id || ''}
                onAccept={(id) => respondMutation.mutate({ id, action: 'accept' })}
                onDecline={(id) => respondMutation.mutate({ id, action: 'reject' })}
              />
            ))}
          </AnimatePresence>
        ) : (
          <div className="glass rounded-2xl py-16 text-center">
            <Swords className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-300 font-semibold mb-1">No challenges yet</p>
            <p className="text-slate-500 text-sm mb-6">
              {filter === 'incoming'
                ? 'No one has challenged you yet.'
                : filter === 'outgoing'
                ? "You haven't sent any challenges."
                : 'Head to Compete to challenge someone.'}
            </p>
            <Link href="/compete">
              <Button variant="outline" size="sm">Go to Compete</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
