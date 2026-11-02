'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { MarketingShell } from '@/components/marketing/marketing-shell'
import { formatDuration, cn } from '@/lib/utils'
import { Users, Swords, Lock, ArrowRight, Clock, HelpCircle } from 'lucide-react'

interface Room {
  id: string
  title: string
  status: string
  maxPlayers: number
  questionCount: number
  timeLimitSeconds: number
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

  return (
    <MarketingShell>
      <section className="px-7 sm:px-12 py-14 sm:py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="label-eyebrow mb-3">The arena</p>
          <h1 className="display text-3xl sm:text-5xl mb-4">Live quiz rooms.</h1>
          <p className="text-sm text-ink-secondary max-w-lg mx-auto leading-relaxed">
            Same questions, same clock, everyone answering at once. Accuracy and speed
            decide the ranking — there are no entry fees and nothing to win but rank.
          </p>
        </div>

        {/* Rooms */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-56 rounded-[1.25rem]" />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          /* No invented rooms here — an empty arena is shown as empty. */
          <div className="surface-card p-12 text-center max-w-lg mx-auto">
            <span className="h-12 w-12 rounded-2xl bg-gold-50 border border-gold-200 flex items-center justify-center mx-auto mb-4">
              <Swords className="h-5 w-5 text-gold-700" />
            </span>
            <h2 className="font-bold text-ink mb-1.5">No open rooms right now</h2>
            <p className="text-sm text-ink-muted mb-6 max-w-sm mx-auto leading-relaxed">
              Rooms appear here the moment someone opens one. Create an account to host
              the first — you only need a subject with some material in it.
            </p>
            <Link href="/signup">
              <Button>Create a free account <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {rooms.map((room, i) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.06, 0.3) }}
                className="surface-card-hover overflow-hidden flex flex-col"
              >
                <div
                  className={cn(
                    'h-1',
                    room.status === 'ACTIVE' ? 'bg-danger' : 'bg-success',
                  )}
                />
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span
                      className={cn(
                        'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                        room.status === 'ACTIVE'
                          ? 'bg-danger-tint text-danger'
                          : 'bg-success-tint text-success',
                      )}
                    >
                      {room.status === 'ACTIVE' ? 'Live' : 'Open'}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-ink-muted">
                      <Users className="h-3.5 w-3.5" />
                      {room._count?.players ?? 0}/{room.maxPlayers}
                    </span>
                  </div>

                  <h3 className="font-bold text-ink mb-1 text-sm">{room.title}</h3>
                  <p className="text-xs text-ink-muted mb-4">
                    {room.subject?.title || 'Open subject'}
                    {room.subject?.difficulty && ` · ${room.subject.difficulty}`}
                  </p>

                  <div className="grid grid-cols-2 gap-2 mb-4 text-center">
                    <div className="surface-sunken p-2">
                      <div className="text-xs font-bold text-ink flex items-center justify-center gap-1">
                        <HelpCircle className="h-3 w-3 text-ink-faint" />
                        {room.questionCount}
                      </div>
                      <div className="text-[10px] text-ink-faint">Questions</div>
                    </div>
                    <div className="surface-sunken p-2">
                      <div className="text-xs font-bold text-ink flex items-center justify-center gap-1">
                        <Clock className="h-3 w-3 text-ink-faint" />
                        {formatDuration(room.timeLimitSeconds)}
                      </div>
                      <div className="text-[10px] text-ink-faint">Duration</div>
                    </div>
                  </div>

                  <Link href="/signup" className="mt-auto">
                    <Button className="w-full" size="sm" variant="secondary">
                      <Lock className="h-3.5 w-3.5" /> Sign in to join
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-14 pt-12 border-t border-line-soft text-center">
          <h2 className="display text-2xl sm:text-3xl mb-3">Ready to compete?</h2>
          <p className="text-sm text-ink-secondary mb-7 max-w-md mx-auto leading-relaxed">
            Create a free account to generate quizzes from your own notes, join live rooms,
            and climb the leaderboard.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signup">
              <Button size="lg">Create free account <ArrowRight className="h-4 w-4" /></Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="secondary">Sign in</Button>
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
