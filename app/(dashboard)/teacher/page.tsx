'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { GraduationCap, BookOpen, MessageSquare, Inbox } from 'lucide-react'

const STATUS_BADGE: Record<string, string> = {
  ASSIGNED: 'bg-allq-purple/15 text-allq-purple border-allq-purple/30',
  VIEWED: 'bg-allq-purple/15 text-allq-purple border-allq-purple/30',
  IN_PROGRESS: 'bg-allq-amber/15 text-allq-amber border-allq-amber/30',
  ANSWERED: 'bg-allq-green/15 text-allq-green border-allq-green/30',
  NEEDS_INFO: 'bg-allq-amber/15 text-allq-amber border-allq-amber/30',
  RESOLVED: 'bg-allq-green/15 text-allq-green border-allq-green/30',
}
const OPEN = ['ASSIGNED', 'VIEWED', 'IN_PROGRESS', 'NEEDS_INFO']

export default function TeacherDashboardPage() {
  const router = useRouter()
  const { data, isLoading } = useQuery({
    queryKey: ['teacher-status'],
    queryFn: async () => (await fetch('/api/teacher/status')).json().then((j) => j.data),
  })

  const { data: support } = useQuery({
    queryKey: ['support-requests', 'ALL'],
    queryFn: async () => (await fetch('/api/support/requests')).json().then((j) => j.data),
  })

  // Approved teachers only; otherwise send to the status page.
  useEffect(() => {
    if (!isLoading && data && data.profile?.status !== 'APPROVED') router.replace('/teacher/status')
  }, [isLoading, data, router])

  if (isLoading || !data?.profile) {
    return <div className="p-8"><div className="skeleton h-40 w-full rounded-2xl" /></div>
  }

  const profile = data.profile
  const assignments = profile.assignments || []
  type Req = { id: string; title: string; status: string; priority: string; student?: { name: string }; module?: { name: string }; _count?: { messages: number } }
  const requests: Req[] = support?.items || []
  const openCount = requests.filter((r) => OPEN.includes(r.status)).length
  const answeredCount = requests.filter((r) => r.status === 'ANSWERED' || r.status === 'RESOLVED').length
  const urgentCount = requests.filter((r) => r.priority === 'URGENT' && OPEN.includes(r.status)).length
  const studentCount = new Set(requests.map((r) => r.student?.name).filter(Boolean)).size

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-allq-purple to-allq-cyan flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Welcome, {profile.fullName}</h1>
            <p className="text-slate-400 text-sm">{profile.professionalTitle || 'Teacher'} · {profile.university?.name}</p>
          </div>
        </div>

        {/* Live metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { icon: Inbox, label: 'Open questions', value: openCount },
            { icon: MessageSquare, label: 'Answered', value: answeredCount },
            { icon: GraduationCap, label: 'Students', value: studentCount },
            { icon: BookOpen, label: 'Assigned areas', value: assignments.length },
          ].map((m) => (
            <div key={m.label} className="glass rounded-2xl p-4">
              <m.icon className="h-5 w-5 text-allq-cyan mb-2" />
              <p className="text-2xl font-black text-white">{m.value}</p>
              <p className="text-xs text-slate-400">{m.label}</p>
            </div>
          ))}
        </div>

        {urgentCount > 0 && (
          <div className="mb-6 p-3 rounded-xl bg-allq-red/10 border border-allq-red/20 text-sm text-allq-red">
            🔴 You have <strong>{urgentCount}</strong> urgent open question{urgentCount > 1 ? 's' : ''} awaiting a reply.
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white flex items-center gap-2"><Inbox className="h-5 w-5 text-allq-cyan" /> Student Questions</h2>
              {requests.length > 0 && <Link href="/support" className="text-xs text-allq-purple hover:underline">View all</Link>}
            </div>
            {requests.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <p className="text-white font-semibold mb-1">No student questions yet</p>
                <p className="text-slate-400 text-sm">Students in your assigned areas can reach you via <span className="text-allq-purple">Ask a Teacher</span>.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {requests.slice(0, 8).map((r) => (
                  <Link key={r.id} href={`/support/${r.id}`}>
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5 hover:border-allq-purple/30 transition-all">
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">{r.title}</p>
                        <p className="text-xs text-slate-400">{r.student?.name || 'Student'}{r.module?.name && ` · ${r.module.name}`}</p>
                      </div>
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-semibold flex-shrink-0', STATUS_BADGE[r.status] || 'bg-white/5 text-slate-400 border-white/10')}>{r.status.replace(/_/g, ' ')}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="glass rounded-2xl p-6">
            <h2 className="font-bold text-white mb-4 flex items-center gap-2"><BookOpen className="h-5 w-5 text-allq-cyan" /> Your areas</h2>
            {assignments.length === 0 ? (
              <p className="text-slate-400 text-sm">No areas assigned yet. Your administrator assigns the departments, programmes, and modules you cover.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {assignments.map((a: { id: string; department?: { name: string }; programme?: { name: string }; module?: { name: string } }) => (
                  <span key={a.id} className="text-xs bg-allq-purple/15 text-allq-purple border border-allq-purple/30 px-2.5 py-1 rounded-full">
                    {a.module?.name || a.programme?.name || a.department?.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
