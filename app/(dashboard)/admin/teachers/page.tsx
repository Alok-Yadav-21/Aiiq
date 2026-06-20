'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import { ShieldCheck, Mail, CreditCard, Check, X, Ban, Plus, BookOpen, RotateCcw } from 'lucide-react'

const TABS = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'] as const
type Status = typeof TABS[number]

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-allq-amber/15 text-allq-amber border-allq-amber/30',
  APPROVED: 'bg-allq-green/15 text-allq-green border-allq-green/30',
  REJECTED: 'bg-allq-red/15 text-allq-red border-allq-red/30',
  SUSPENDED: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
}

type Teacher = {
  id: string; fullName: string; universityEmail: string; staffId: string; status: Status
  professionalTitle?: string; requestedModules: string[]
  user: { email: string; name: string | null }
  university?: { name: string }
  assignments: { id: string; department?: { name: string }; programme?: { name: string }; module?: { name: string } }[]
}

export default function AdminTeachersPage() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [tab, setTab] = useState<Status>('PENDING')
  const [assignFor, setAssignFor] = useState<Teacher | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-teachers', tab],
    queryFn: async () => (await fetch(`/api/admin/teachers?status=${tab}`)).json().then((j) => j.data),
  })
  const teachers: Teacher[] = data?.items || []

  const act = async (id: string, action: string, reason?: string) => {
    setBusy(id)
    try {
      const res = await fetch(`/api/admin/teachers/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('Done', `Teacher ${action}d.`)
      qc.invalidateQueries({ queryKey: ['admin-teachers'] })
    } catch (err) {
      toast.error('Action failed', err instanceof Error ? err.message : 'Try again')
    } finally { setBusy(null) }
  }

  const reject = (id: string) => {
    const reason = window.prompt('Reason for rejection (shown to the applicant):') || undefined
    act(id, 'reject', reason)
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-allq-purple to-allq-cyan flex items-center justify-center">
          <ShieldCheck className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Teacher Approvals</h1>
          <p className="text-slate-400 text-sm">Review, verify, and manage teacher accounts in your university.</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn(
            'px-4 py-2 rounded-xl text-sm font-semibold transition-all border',
            tab === t ? 'bg-allq-purple/10 text-allq-purple border-allq-purple/30' : 'text-slate-400 border-transparent hover:bg-white/5',
          )}>{t.charAt(0) + t.slice(1).toLowerCase()}</button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-28 w-full rounded-2xl" />)}</div>
      ) : teachers.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <ShieldCheck className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <p className="text-white font-semibold">No {tab.toLowerCase()} applications</p>
        </div>
      ) : (
        <div className="space-y-3">
          {teachers.map((t) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-white">{t.fullName}</h3>
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-semibold', STATUS_BADGE[t.status])}>{t.status}</span>
                  </div>
                  <p className="text-xs text-slate-400">{t.professionalTitle || 'Teacher'} · {t.university?.name}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {t.universityEmail}</span>
                    <span className="flex items-center gap-1"><CreditCard className="h-3.5 w-3.5" /> {t.staffId}</span>
                  </div>
                  {t.requestedModules?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {t.requestedModules.map((m) => <span key={m} className="text-[10px] bg-white/5 text-slate-400 px-2 py-0.5 rounded-full">{m}</span>)}
                    </div>
                  )}
                  {t.assignments?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {t.assignments.map((a) => <span key={a.id} className="text-[10px] bg-allq-cyan/10 text-allq-cyan border border-allq-cyan/20 px-2 py-0.5 rounded-full">{a.module?.name || a.programme?.name || a.department?.name}</span>)}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {t.status === 'PENDING' && (<>
                    <Button size="sm" loading={busy === t.id} onClick={() => act(t.id, 'approve')}><Check className="h-4 w-4" /> Approve</Button>
                    <Button size="sm" variant="ghost" onClick={() => reject(t.id)}><X className="h-4 w-4" /> Reject</Button>
                  </>)}
                  {t.status === 'APPROVED' && (<>
                    <Button size="sm" variant="secondary" onClick={() => setAssignFor(t)}><Plus className="h-4 w-4" /> Assign</Button>
                    <Button size="sm" variant="ghost" loading={busy === t.id} onClick={() => act(t.id, 'suspend')}><Ban className="h-4 w-4" /> Suspend</Button>
                  </>)}
                  {(t.status === 'REJECTED' || t.status === 'SUSPENDED') && (
                    <Button size="sm" loading={busy === t.id} onClick={() => act(t.id, 'reinstate')}><RotateCcw className="h-4 w-4" /> Reinstate</Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {assignFor && <AssignModal teacher={assignFor} onClose={() => setAssignFor(null)} onDone={() => { qc.invalidateQueries({ queryKey: ['admin-teachers'] }) }} />}
    </div>
  )
}

function AssignModal({ teacher, onClose, onDone }: { teacher: Teacher; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast()
  const [departmentId, setDepartmentId] = useState('')
  const [moduleId, setModuleId] = useState('')
  const [saving, setSaving] = useState(false)

  // Load this admin's academic options (universityId resolved server-side for uni admins via the admin list — but options needs an id; we fetch all and filter client-side isn't possible without uni). Use the teacher's university via admin departments list.
  const { data } = useQuery({
    queryKey: ['assign-options', teacher.id],
    queryFn: async () => {
      const [depts, mods] = await Promise.all([
        fetch('/api/admin/departments').then((r) => r.json()).then((j) => j.data?.items || []),
        fetch('/api/admin/modules').then((r) => r.json()).then((j) => j.data?.items || []),
      ])
      return { depts, mods }
    },
  })
  const depts = data?.depts || []
  const mods = data?.mods || []

  const save = async () => {
    if (!departmentId && !moduleId) { toast.error('Pick a department or module'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/teacher-assignments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherProfileId: teacher.id, departmentId: departmentId || undefined, moduleId: moduleId || undefined }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('Assigned', 'Teacher scope updated.')
      onDone(); onClose()
    } catch (err) {
      toast.error('Failed', err instanceof Error ? err.message : 'Try again')
    } finally { setSaving(false) }
  }

  return (
    <Modal open onOpenChange={onClose} title={`Assign ${teacher.fullName}`} description="Give this teacher access to a department or module.">
      <div className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-1.5"><BookOpen className="h-4 w-4" /> Department</label>
          <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="input-glass w-full rounded-xl px-3 py-2.5 text-sm">
            <option value="" className="bg-bg-surface">None</option>
            {depts.map((d: { id: string; name: string }) => <option key={d.id} value={d.id} className="bg-bg-surface">{d.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-1.5"><BookOpen className="h-4 w-4" /> Module</label>
          <select value={moduleId} onChange={(e) => setModuleId(e.target.value)} className="input-glass w-full rounded-xl px-3 py-2.5 text-sm">
            <option value="" className="bg-bg-surface">None</option>
            {mods.map((m: { id: string; name: string }) => <option key={m.id} value={m.id} className="bg-bg-surface">{m.name}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} loading={saving}>Add assignment</Button>
        </div>
      </div>
    </Modal>
  )
}
