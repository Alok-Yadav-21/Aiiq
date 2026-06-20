'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/useToast'
import { GraduationCap, Plus, X } from 'lucide-react'

type Opt = { id: string; name: string; facultyId?: string }

export default function TeacherApplyPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [form, setForm] = useState({
    fullName: '', universityEmail: '', staffId: '', professionalTitle: '',
    universityId: '', facultyId: '', departmentId: '', verificationDocUrl: '',
  })
  const [modules, setModules] = useState<string[]>([])
  const [moduleInput, setModuleInput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { data: base } = useQuery({
    queryKey: ['academic-options'],
    queryFn: async () => (await fetch('/api/academic/options')).json().then((j) => j.data),
  })
  const { data: scoped } = useQuery({
    queryKey: ['academic-options', form.universityId],
    enabled: !!form.universityId,
    queryFn: async () => (await fetch(`/api/academic/options?universityId=${form.universityId}`)).json().then((j) => j.data),
  })

  const universities: Opt[] = base?.universities || []
  const faculties: Opt[] = scoped?.faculties || []
  const departments: Opt[] = (scoped?.departments || []).filter((d: Opt) => !form.facultyId || d.facultyId === form.facultyId)

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const addModule = () => { const t = moduleInput.trim(); if (t && !modules.includes(t)) { setModules([...modules, t]); setModuleInput('') } }

  const submit = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/teacher/apply', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName, universityEmail: form.universityEmail, staffId: form.staffId,
          professionalTitle: form.professionalTitle || undefined, universityId: form.universityId,
          facultyId: form.facultyId || undefined, departmentId: form.departmentId || undefined,
          modulesTaught: modules, verificationDocUrl: form.verificationDocUrl || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('Application submitted!', 'An administrator will review your request.')
      router.push('/teacher/status')
    } catch (err) {
      toast.error('Could not submit', err instanceof Error ? err.message : 'Try again')
    } finally { setSubmitting(false) }
  }

  const canSubmit = form.fullName && form.universityEmail && form.staffId && form.universityId

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-allq-purple to-allq-cyan flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Become a Teacher</h1>
            <p className="text-slate-400 text-sm">Apply for a teacher account. A university administrator will verify it.</p>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 mt-6 space-y-4">
          <Input label="Full name" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} placeholder="Dr. Jane Smith" />
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="University email" type="email" value={form.universityEmail} onChange={(e) => set('universityEmail', e.target.value)} placeholder="j.smith@uni.ac.uk" />
            <Input label="Employee / staff ID" value={form.staffId} onChange={(e) => set('staffId', e.target.value)} placeholder="STAFF-12345" />
          </div>
          <Input label="Professional title (optional)" value={form.professionalTitle} onChange={(e) => set('professionalTitle', e.target.value)} placeholder="Senior Lecturer" />

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">University</label>
              <select value={form.universityId} onChange={(e) => setForm((f) => ({ ...f, universityId: e.target.value, facultyId: '', departmentId: '' }))} className="input-glass w-full rounded-xl px-3 py-2.5 text-sm">
                <option value="" className="bg-bg-surface">Select…</option>
                {universities.map((u) => <option key={u.id} value={u.id} className="bg-bg-surface">{u.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Faculty</label>
              <select value={form.facultyId} onChange={(e) => setForm((f) => ({ ...f, facultyId: e.target.value, departmentId: '' }))} disabled={!form.universityId} className="input-glass w-full rounded-xl px-3 py-2.5 text-sm disabled:opacity-50">
                <option value="" className="bg-bg-surface">Optional…</option>
                {faculties.map((f) => <option key={f.id} value={f.id} className="bg-bg-surface">{f.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Department</label>
              <select value={form.departmentId} onChange={(e) => set('departmentId', e.target.value)} disabled={!form.universityId} className="input-glass w-full rounded-xl px-3 py-2.5 text-sm disabled:opacity-50">
                <option value="" className="bg-bg-surface">Optional…</option>
                {departments.map((d) => <option key={d.id} value={d.id} className="bg-bg-surface">{d.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Modules / subjects you teach</label>
            <div className="flex gap-2">
              <input value={moduleInput} onChange={(e) => setModuleInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addModule() } }} placeholder="e.g. Machine Learning" className="input-glass flex-1 rounded-xl px-4 py-2.5 text-sm" />
              <Button type="button" variant="secondary" size="sm" onClick={addModule}><Plus className="h-4 w-4" /></Button>
            </div>
            {modules.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {modules.map((m) => (
                  <span key={m} onClick={() => setModules(modules.filter((x) => x !== m))} className="flex items-center gap-1 bg-allq-purple/15 text-allq-purple border border-allq-purple/30 px-2.5 py-1 rounded-full text-xs cursor-pointer hover:bg-allq-red/15 hover:text-allq-red">
                    {m} <X className="h-3 w-3" />
                  </span>
                ))}
              </div>
            )}
          </div>

          <Input label="Verification document link (optional)" value={form.verificationDocUrl} onChange={(e) => set('verificationDocUrl', e.target.value)} placeholder="https://… (staff page, ID scan link, etc.)" />

          <div className="flex justify-end pt-2">
            <Button onClick={submit} loading={submitting} disabled={!canSubmit}>Submit application</Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
