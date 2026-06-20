'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Clock, CheckCircle, XCircle, Ban, GraduationCap } from 'lucide-react'

// Static class strings (Tailwind can't see dynamically-built class names).
const STATUS_UI: Record<string, { icon: typeof Clock; box: string; iconColor: string; title: string; desc: string }> = {
  PENDING: { icon: Clock, box: 'bg-allq-amber/10 border-allq-amber/30', iconColor: 'text-allq-amber', title: 'Pending verification', desc: 'Your application is awaiting review by a university administrator.' },
  APPROVED: { icon: CheckCircle, box: 'bg-allq-green/10 border-allq-green/30', iconColor: 'text-allq-green', title: 'Approved', desc: 'You are a verified teacher. Your dashboard is ready.' },
  REJECTED: { icon: XCircle, box: 'bg-allq-red/10 border-allq-red/30', iconColor: 'text-allq-red', title: 'Rejected', desc: 'Your application was not approved. You can review the reason and re-apply.' },
  SUSPENDED: { icon: Ban, box: 'bg-allq-red/10 border-allq-red/30', iconColor: 'text-allq-red', title: 'Suspended', desc: 'Your teacher access has been suspended. Contact your university administrator.' },
}

export default function TeacherStatusPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['teacher-status'],
    queryFn: async () => (await fetch('/api/teacher/status')).json().then((j) => j.data),
  })

  if (isLoading) return <div className="p-8"><div className="skeleton h-48 w-full max-w-lg rounded-2xl" /></div>

  const profile = data?.profile
  if (!profile) {
    return (
      <div className="p-6 lg:p-8 max-w-lg">
        <div className="glass rounded-2xl p-8 text-center">
          <GraduationCap className="h-12 w-12 text-slate-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No teacher application</h2>
          <p className="text-slate-400 text-sm mb-6">You haven&apos;t applied for a teacher account yet.</p>
          <Link href="/teacher/apply"><Button>Apply to be a teacher</Button></Link>
        </div>
      </div>
    )
  }

  const ui = STATUS_UI[profile.status] || STATUS_UI.PENDING
  const Icon = ui.icon

  return (
    <div className="p-6 lg:p-8 max-w-lg">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-8">
        <div className={`h-16 w-16 rounded-2xl border flex items-center justify-center mb-5 ${ui.box}`}>
          <Icon className={`h-8 w-8 ${ui.iconColor}`} />
        </div>
        <h1 className="text-2xl font-black text-white mb-1">{ui.title}</h1>
        <p className="text-slate-400 text-sm mb-5">{ui.desc}</p>

        <div className="space-y-2 text-sm border-t border-white/5 pt-4">
          <Row label="Name" value={profile.fullName} />
          <Row label="University" value={profile.university?.name} />
          <Row label="University email" value={profile.universityEmail} />
          <Row label="Staff ID" value={profile.staffId} />
          {profile.professionalTitle && <Row label="Title" value={profile.professionalTitle} />}
          {profile.requestedModules?.length > 0 && <Row label="Modules" value={profile.requestedModules.join(', ')} />}
        </div>

        {profile.status === 'REJECTED' && profile.rejectionReason && (
          <div className="mt-4 p-3 rounded-xl bg-allq-red/10 border border-allq-red/20 text-sm text-allq-red">
            <span className="font-semibold">Reason:</span> {profile.rejectionReason}
          </div>
        )}

        {profile.status === 'APPROVED' && profile.assignments?.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-slate-500 mb-2">Your assigned areas</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.assignments.map((a: { id: string; department?: { name: string }; programme?: { name: string }; module?: { name: string } }) => (
                <span key={a.id} className="text-xs bg-white/5 text-slate-300 px-2.5 py-1 rounded-full">
                  {a.module?.name || a.programme?.name || a.department?.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-2">
          {profile.status === 'APPROVED' && <Link href="/teacher"><Button>Go to teacher dashboard</Button></Link>}
          {profile.status === 'REJECTED' && <Link href="/teacher/apply"><Button>Re-apply</Button></Link>}
        </div>
      </motion.div>
    </div>
  )
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="text-white text-right">{value || '—'}</span>
    </div>
  )
}
