'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RoomCardSkeleton } from '@/components/ui/skeleton'
import { Modal } from '@/components/ui/modal'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import {
  Swords, Users, Trophy, Clock, Plus,
  Play, Lock, Crown, TrendingUp, Zap, Globe
} from 'lucide-react'
import { formatDuration, cn } from '@/lib/utils'
import { createRoomSchema, type CreateRoomInput } from '@/lib/validations'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

type RoomStatus = 'WAITING' | 'STARTING' | 'ACTIVE'

const statusConfig: Record<RoomStatus, { label: string; color: string; badge: string }> = {
  WAITING: { label: 'Open', color: 'text-allq-green', badge: 'green' },
  STARTING: { label: 'Starting', color: 'text-allq-amber', badge: 'amber' },
  ACTIVE: { label: 'Live', color: 'text-allq-red', badge: 'red' },
}

export default function CompetePage() {
  const { user, isPro, isStarter } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'WAITING' | 'ACTIVE'>('WAITING')

  const { data: rooms, isLoading } = useQuery({
    queryKey: ['rooms', statusFilter],
    queryFn: async () => {
      const res = await fetch(`/api/rooms?status=${statusFilter}`)
      const json = await res.json()
      return json.data || []
    },
    refetchInterval: 5000,
  })

  const { data: subjects } = useQuery({
    queryKey: ['subjects-list'],
    queryFn: async () => {
      const res = await fetch('/api/subjects?isPublic=true&perPage=50')
      const json = await res.json()
      return json.data?.items || []
    },
  })

  const joinRoom = useMutation({
    mutationFn: async (roomId: string) => {
      const res = await fetch(`/api/rooms/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      return json.data
    },
    onSuccess: (_, roomId) => {
      router.push(`/compete/room/${roomId}`)
    },
    onError: (err: Error) => {
      toast.error('Failed to join room', err.message)
    },
  })

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<CreateRoomInput>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: { maxPlayers: 10, questionCount: 10, timeLimitSeconds: 300 },
  })

  const onCreateRoom = async (data: CreateRoomInput) => {
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('Room created!', 'Waiting for players to join...')
      setShowCreate(false)
      reset()
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      router.push(`/compete/room/${json.data.id}`)
    } catch (err: unknown) {
      toast.error('Failed to create room', err instanceof Error ? err.message : 'Try again')
    }
  }

  const canAccess = isStarter || isPro

  return (
    <div className="px-5 py-7 lg:px-9 lg:py-9 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Swords className="h-8 w-8 text-allq-purple" />
            Compete
          </h1>
          <p className="text-sm text-ink-secondary mt-1">Live quiz rooms against other learners. Same questions, same clock.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} disabled={!canAccess}>
          <Plus className="h-4 w-4" />
          Host a Room
        </Button>
      </div>

      {/* Plan gate banner */}
      {!canAccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface-card rounded-2xl p-5 border border-allq-amber/20 bg-amber-50 mb-6 flex items-center justify-between flex-wrap gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-allq-amber/15 flex items-center justify-center">
              <Crown className="h-5 w-5 text-allq-amber" />
            </div>
            <div>
              <p className="font-bold text-ink">Upgrade to join live battles</p>
              <p className="text-sm text-ink-muted">A Starter plan or above is needed to join and host quiz rooms.</p>
            </div>
          </div>
          <Link href="/pricing">
            <Button variant="secondary" className="border-allq-amber/30 text-allq-amber hover:border-allq-amber/60">
              <Zap className="h-4 w-4" /> Upgrade Now
            </Button>
          </Link>
        </motion.div>
      )}

      {/* Live counts — derived from the rooms actually returned */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          { icon: Globe, label: 'Open rooms', value: rooms?.filter((r: any) => r.status === 'WAITING').length ?? 0 },
          { icon: Swords, label: 'In progress', value: rooms?.filter((r: any) => r.status === 'ACTIVE').length ?? 0 },
        ].map((s) => (
          <div key={s.label} className="surface-card p-4 text-center">
            <s.icon className="h-4 w-4 text-gold-700 mx-auto mb-2" />
            <div className="text-xl font-black text-ink">{s.value}</div>
            <div className="label-eyebrow mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {(['WAITING', 'ACTIVE'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              'px-5 py-2 rounded-xl text-sm font-semibold transition-all border',
              statusFilter === s
                ? 'bg-allq-purple/10 text-allq-purple border-allq-purple/30'
                : 'text-slate-500 bg-white hover:text-slate-900 border-slate-200 hover:border-slate-300'
            )}
          >
            {s === 'WAITING' ? '🟢 Open Rooms' : '🔴 Live Rooms'}
          </button>
        ))}
      </div>

      {/* Rooms Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <RoomCardSkeleton key={i} />)}
        </div>
      ) : rooms?.length === 0 ? (
        <div className="text-center py-16">
          <Swords className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-slate-900 font-bold mb-2">No {statusFilter.toLowerCase()} rooms</h3>
          <p className="text-slate-500 mb-6">Be the first to host a quiz battle!</p>
          <Button onClick={() => setShowCreate(true)} disabled={!canAccess}>
            <Plus className="h-4 w-4" /> Host Room
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rooms.map((room: any, i: number) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="surface-card-hover rounded-2xl overflow-hidden flex flex-col">
                {/* Status bar */}
                <div className={cn('h-1', {
                  'bg-allq-green': room.status === 'WAITING',
                  'bg-allq-amber': room.status === 'STARTING',
                  'bg-allq-red': room.status === 'ACTIVE',
                })} />

                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <Badge
                      variant={statusConfig[room.status as RoomStatus]?.badge as any || 'default'}
                      size="sm"
                    >
                      {statusConfig[room.status as RoomStatus]?.label || room.status}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Users className="h-3.5 w-3.5" />
                      <span>{room._count?.players || 0}/{room.maxPlayers}</span>
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 mb-1">{room.title}</h3>
                  <p className="text-xs text-slate-500 mb-3">
                    {room.subject?.title} · {room.subject?.difficulty}
                  </p>

                  <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                    <div className="surface-sunken p-2">
                      <div className="text-xs font-bold text-ink">{room.questionCount}</div>
                      <div className="text-[10px] text-ink-faint">Questions</div>
                    </div>
                    <div className="surface-sunken p-2">
                      <div className="text-xs font-bold text-ink">{formatDuration(room.timeLimitSeconds)}</div>
                      <div className="text-[10px] text-ink-faint">Duration</div>
                    </div>
                    <div className="surface-sunken p-2">
                      <div className="text-xs font-bold text-ink">{room._count?.players ?? 0}/{room.maxPlayers}</div>
                      <div className="text-[10px] text-ink-faint">Players</div>
                    </div>
                  </div>


                  <Button
                    className="w-full"
                    variant={room.status === 'ACTIVE' ? 'secondary' : 'primary'}
                    size="sm"
                    disabled={!canAccess || room.status === 'ACTIVE' || joinRoom.isPending}
                    loading={joinRoom.isPending && joinRoom.variables === room.id}
                    onClick={() => joinRoom.mutate(room.id)}
                  >
                    {!canAccess ? (
                      <><Lock className="h-3.5 w-3.5" /> Upgrade to Join</>
                    ) : room.status === 'ACTIVE' ? (
                      'In Progress'
                    ) : (
                      <><Play className="h-3.5 w-3.5" /> Join Battle</>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Room Modal */}
      <Modal
        open={showCreate}
        onOpenChange={setShowCreate}
        title="Host a Quiz Room"
        description="Set up a live room. Other learners can join until it starts."
      >
        <form onSubmit={handleSubmit(onCreateRoom)} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Room Title</label>
            <input
              {...register('title')}
              placeholder="e.g., JavaScript Masters Battle"
              className="input-light w-full rounded-xl px-4 py-3 text-sm"
            />
            {errors.title && <p className="text-xs text-allq-red">{errors.title.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Subject</label>
            <select {...register('subjectId')} className="input-light w-full rounded-xl px-4 py-3 text-sm">
              <option value="">Select a subject...</option>
              {subjects?.map((s: any) => (
                <option key={s.id} value={s.id} className="bg-white">{s.title}</option>
              ))}
            </select>
            {errors.subjectId && <p className="text-xs text-allq-red">{errors.subjectId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Max Players</label>
              <input type="number" {...register('maxPlayers', { valueAsNumber: true })} min="2" max="50" className="input-light w-full rounded-xl px-4 py-3 text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Questions</label>
              <input type="number" {...register('questionCount', { valueAsNumber: true })} min="5" max="50" className="input-light w-full rounded-xl px-4 py-3 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Time limit (seconds)</label>
              <input type="number" {...register('timeLimitSeconds', { valueAsNumber: true })} min="60" max="3600" className="input-light w-full rounded-xl px-4 py-3 text-sm" />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>
              <Swords className="h-4 w-4" /> Create Room
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
