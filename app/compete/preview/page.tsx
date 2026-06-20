'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Navbar } from '@/components/layout/navbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Swords, Users, Trophy, Clock, Globe,
  Lock, Play, Zap, ChevronRight, TrendingUp
} from 'lucide-react'
import { formatCurrency, formatDuration, cn } from '@/lib/utils'

interface Room {
  id: string
  title: string
  status: string
  maxPlayers: number
  questionCount: number
  timeLimitSeconds: number
  prizePool: number
  entryFee: number
  subject?: { title: string; difficulty: string }
  _count?: { players: number }
}

export default function CompetePreviewPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRooms = () => {
      fetch('/api/rooms?status=WAITING')
        .then((r) => r.json())
        .then((j) => setRooms(j.data || []))
        .catch(() => {})
        .finally(() => setIsLoading(false))
    }
    fetchRooms()
    const interval = setInterval(fetchRooms, 10000)
    return () => clearInterval(interval)
  }, [])

  const mockRooms: Room[] = [
    {
      id: 'mock-1',
      title: 'JavaScript Masters Battle',
      status: 'ACTIVE',
      maxPlayers: 10,
      questionCount: 20,
      timeLimitSeconds: 600,
      prizePool: 180,
      entryFee: 20,
      subject: { title: 'Advanced JavaScript', difficulty: 'ADVANCED' },
      _count: { players: 8 },
    },
    {
      id: 'mock-2',
      title: 'Medicine Finals Blitz',
      status: 'WAITING',
      maxPlayers: 6,
      questionCount: 15,
      timeLimitSeconds: 300,
      prizePool: 90,
      entryFee: 15,
      subject: { title: 'Human Anatomy', difficulty: 'EXPERT' },
      _count: { players: 4 },
    },
    {
      id: 'mock-3',
      title: 'CS Fundamentals Sprint',
      status: 'WAITING',
      maxPlayers: 8,
      questionCount: 10,
      timeLimitSeconds: 300,
      prizePool: 0,
      entryFee: 0,
      subject: { title: 'Computer Science', difficulty: 'BEGINNER' },
      _count: { players: 3 },
    },
  ]

  const displayRooms = rooms.length > 0 ? rooms : mockRooms

  return (
    <div className="min-h-screen bg-bg-base">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="text-center mb-10">
          <Badge variant="red" size="lg" className="mb-4 animate-pulse-slow">
            <div className="h-2 w-2 rounded-full bg-allq-red animate-pulse mr-1" />
            Live Arena Preview
          </Badge>
          <h1 className="text-4xl font-black text-white mb-3">
            Watch Live Quiz Battles
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Browse active and open rooms. Sign in to join a battle and compete for real prize money.
          </p>
        </div>

        {/* Live stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: Globe, label: 'Live Rooms', value: displayRooms.filter((r) => r.status === 'ACTIVE').length },
            { icon: Users, label: 'Players Online', value: '1.2K' },
            { icon: Trophy, label: "Today's Prize Pool", value: formatCurrency(4800) },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass rounded-2xl p-4 text-center"
            >
              <s.icon className="h-5 w-5 text-allq-purple mx-auto mb-2" />
              <div className="text-xl font-black text-white">{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Room grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass rounded-2xl overflow-hidden animate-pulse">
                <div className="h-1 bg-white/5" />
                <div className="p-5 space-y-3">
                  <div className="skeleton h-4 w-16 rounded" />
                  <div className="skeleton h-5 w-40 rounded" />
                  <div className="skeleton h-3 w-28 rounded" />
                  <div className="skeleton h-16 w-full rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayRooms.map((room, i) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="glass-hover rounded-2xl overflow-hidden flex flex-col"
              >
                <div
                  className={cn('h-1', {
                    'bg-allq-green': room.status === 'WAITING',
                    'bg-allq-red': room.status === 'ACTIVE',
                    'bg-allq-amber': room.status === 'STARTING',
                  })}
                />
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <Badge
                      variant={room.status === 'ACTIVE' ? 'red' : 'green'}
                      size="sm"
                    >
                      {room.status === 'ACTIVE' ? (
                        <><div className="h-1.5 w-1.5 rounded-full bg-allq-red animate-pulse" /> LIVE</>
                      ) : 'Open'}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Users className="h-3.5 w-3.5" />
                      {room._count?.players || 0}/{room.maxPlayers}
                    </div>
                  </div>

                  <h3 className="font-bold text-white mb-1 text-sm">{room.title}</h3>
                  <p className="text-xs text-slate-400 mb-3">
                    {room.subject?.title || 'Open Subject'} · {room.subject?.difficulty || 'Mixed'}
                  </p>

                  <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                    <div className="bg-white/3 rounded-lg p-2">
                      <div className="text-xs font-bold text-allq-purple">{room.questionCount}</div>
                      <div className="text-[10px] text-slate-500">Qs</div>
                    </div>
                    <div className="bg-white/3 rounded-lg p-2">
                      <div className="text-xs font-bold text-allq-cyan">{formatDuration(room.timeLimitSeconds)}</div>
                      <div className="text-[10px] text-slate-500">Time</div>
                    </div>
                    <div className="bg-white/3 rounded-lg p-2">
                      <div className="text-xs font-bold text-allq-green">
                        {Number(room.prizePool) > 0 ? formatCurrency(Number(room.prizePool)) : 'Free'}
                      </div>
                      <div className="text-[10px] text-slate-500">Prize</div>
                    </div>
                  </div>

                  <Link href="/signup" className="mt-auto">
                    <Button className="w-full" size="sm" variant="outline">
                      <Lock className="h-3.5 w-3.5" />
                      Sign In to Join
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* CTA banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 glass rounded-2xl p-8 border border-allq-purple/20 text-center"
          style={{ boxShadow: '0 0 40px rgba(139,92,246,0.1)' }}
        >
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-allq-purple to-allq-cyan flex items-center justify-center mx-auto mb-5">
            <Swords className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Ready to compete?</h2>
          <p className="text-slate-400 mb-6 max-w-md mx-auto text-sm">
            Create a free account to join quiz battles, generate AI quizzes from your study notes,
            and climb the global leaderboard.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signup">
              <Button size="lg" className="group">
                <Zap className="h-4 w-4" />
                Create Free Account
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="secondary">
                Sign In
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
