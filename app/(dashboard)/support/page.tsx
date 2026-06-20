'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { STATUS_BADGE, PRIORITY_BADGE } from '@/lib/support-ui'
import { MessageSquare, Plus, MessageSquarePlus } from 'lucide-react'

const FILTERS = ['ALL', 'SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'ANSWERED', 'RESOLVED'] as const

export default function SupportListPage() {
  const { isTeacher, isUniversityAdmin } = useAuth()
  const [filter, setFilter] = useState<string>('ALL')

  const { data, isLoading } = useQuery({
    queryKey: ['support-requests', filter],
    queryFn: async () => (await fetch(`/api/support/requests${filter !== 'ALL' ? `?status=${filter}` : ''}`)).json().then((j) => j.data),
  })
  const items = data?.items || []

  const heading = isUniversityAdmin ? 'Support Requests' : isTeacher ? 'Student Questions' : 'My Questions'

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">{heading}</h1>
          <p className="text-slate-400 text-sm">{isTeacher ? 'Questions assigned to you.' : isUniversityAdmin ? 'All requests in your university.' : 'Your teacher-support requests.'}</p>
        </div>
        {!isTeacher && !isUniversityAdmin && (
          <Link href="/support/new"><Button><Plus className="h-4 w-4" /> Ask a Teacher</Button></Link>
        )}
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border',
            filter === f ? 'bg-allq-purple/15 text-allq-purple border-allq-purple/30' : 'text-slate-400 border-white/5 hover:border-white/15',
          )}>{f === 'ALL' ? 'All' : f.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}</button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-20 w-full rounded-2xl" />)}</div>
      ) : items.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <MessageSquarePlus className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">No questions {filter !== 'ALL' ? 'in this status' : 'yet'}</p>
          {!isTeacher && !isUniversityAdmin && <p className="text-slate-400 text-sm">Ask a teacher when you&apos;re stuck on a topic.</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((r: { id: string; title: string; status: string; priority: string; student?: { name: string }; teacherProfile?: { fullName: string }; module?: { name: string }; department?: { name: string }; _count?: { messages: number }; updatedAt: string }) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Link href={`/support/${r.id}`}>
                <div className="glass-hover rounded-2xl p-4 cursor-pointer">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-white truncate">{r.title}</h3>
                        <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-semibold', STATUS_BADGE[r.status])}>{r.status.replace(/_/g, ' ')}</span>
                        {r.priority !== 'NORMAL' && <span className={cn('text-[10px] font-bold uppercase', PRIORITY_BADGE[r.priority])}>{r.priority}</span>}
                      </div>
                      <p className="text-xs text-slate-400">
                        {(isTeacher || isUniversityAdmin) ? (r.student?.name || 'Student') : (r.teacherProfile?.fullName || 'Awaiting assignment')}
                        {r.module?.name && ` · ${r.module.name}`}{!r.module?.name && r.department?.name && ` · ${r.department.name}`}
                      </p>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-slate-500 flex-shrink-0"><MessageSquare className="h-3.5 w-3.5" /> {r._count?.messages ?? 0}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
