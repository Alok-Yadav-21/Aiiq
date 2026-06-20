'use client'

import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Bell, Check, GraduationCap, MessageSquare, BookOpenCheck, ShieldCheck } from 'lucide-react'

const ICON: Record<string, typeof Bell> = {
  SUPPORT_NEW: MessageSquare, SUPPORT_REPLY: MessageSquare, SUPPORT_ANSWER: MessageSquare,
  TEACHER_STATUS: ShieldCheck, CONTENT_NEW: BookOpenCheck,
}
function hrefFor(n: { type: string; data?: unknown }): string | null {
  const d = (n.data || {}) as Record<string, string>
  if (n.type?.startsWith('SUPPORT') && d.requestId) return `/support/${d.requestId}`
  if (n.type === 'CONTENT_NEW' && d.contentId) return `/learning/${d.contentId}`
  if (n.type === 'TEACHER_STATUS') return '/teacher/status'
  return null
}

export default function NotificationsPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['notifications'], queryFn: async () => (await fetch('/api/notifications?limit=50')).json().then((j) => j.data) })
  const notifications = data?.notifications || []

  const markAll = async () => { await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ markAll: true }) }); qc.invalidateQueries({ queryKey: ['notifications'] }) }
  const markOne = async (id: string) => { await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [id] }) }); qc.invalidateQueries({ queryKey: ['notifications'] }) }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-allq-purple to-allq-cyan flex items-center justify-center"><Bell className="h-6 w-6 text-white" /></div>
          <div>
            <h1 className="text-2xl font-black text-white">Notifications</h1>
            {data?.unreadCount > 0 && <p className="text-slate-400 text-sm">{data.unreadCount} unread</p>}
          </div>
        </div>
        {data?.unreadCount > 0 && <Button size="sm" variant="secondary" onClick={markAll}><Check className="h-4 w-4" /> Mark all read</Button>}
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-16 w-full rounded-xl" />)}</div>
      ) : notifications.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Bell className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <p className="text-white font-semibold">You&apos;re all caught up</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n: { id: string; type: string; title: string; body: string; read: boolean; createdAt: string; data?: unknown }) => {
            const Icon = ICON[n.type] || Bell
            const href = hrefFor(n)
            const inner = (
              <div className={cn('flex items-start gap-3 rounded-xl p-3.5 border transition-all', n.read ? 'bg-white/[0.02] border-white/5' : 'bg-allq-purple/5 border-allq-purple/20')}>
                <span className={cn('h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0', n.read ? 'bg-white/5' : 'bg-allq-purple/15')}><Icon className={cn('h-4 w-4', n.read ? 'text-slate-400' : 'text-allq-purple')} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">{n.title}</p>
                  <p className="text-xs text-slate-400">{n.body}</p>
                  <p className="text-[10px] text-slate-600 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                {!n.read && <button onClick={(e) => { e.preventDefault(); markOne(n.id) }} className="text-[10px] text-allq-purple hover:underline flex-shrink-0">Mark read</button>}
              </div>
            )
            return (
              <motion.div key={n.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} onClick={() => !n.read && markOne(n.id)}>
                {href ? <Link href={href}>{inner}</Link> : inner}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
