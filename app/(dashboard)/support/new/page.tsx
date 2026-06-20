'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/useToast'
import { MessageSquarePlus, Paperclip, X } from 'lucide-react'

const PRIORITIES = [
  { v: 'LOW', label: 'Low' },
  { v: 'NORMAL', label: 'Normal' },
  { v: 'HIGH', label: 'High' },
  { v: 'URGENT', label: 'Urgent' },
]

function readBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => { const s = String(r.result || ''); const i = s.indexOf(','); resolve(i >= 0 ? s.slice(i + 1) : s) }
    r.onerror = () => reject(new Error('read failed'))
    r.readAsDataURL(file)
  })
}

function AskForm() {
  const router = useRouter()
  const sp = useSearchParams()
  const { toast } = useToast()
  const subjectId = sp.get('subjectId') || undefined

  const { data: prof, isLoading } = useQuery({
    queryKey: ['student-profile'],
    queryFn: async () => (await fetch('/api/student/profile')).json().then((j) => j.data?.profile),
  })
  const { data: opts } = useQuery({
    queryKey: ['academic-options', prof?.university?.id],
    enabled: !!prof?.university?.id,
    queryFn: async () => (await fetch(`/api/academic/options?universityId=${prof.university.id}`)).json().then((j) => j.data),
  })

  const [form, setForm] = useState({ title: '', body: '', priority: 'NORMAL', departmentId: '', moduleId: '', aiAnswerShared: '' })
  const [files, setFiles] = useState<{ fileName: string; mimeType: string; contentBase64: string; sizeBytes: number }[]>([])
  const [submitting, setSubmitting] = useState(false)
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const modules = (opts?.modules || []).filter((m: { departmentId: string }) => !form.departmentId || m.departmentId === form.departmentId)

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || [])
    for (const f of picked) {
      if (f.size > 5 * 1024 * 1024) { toast.error('Too large', `${f.name} exceeds 5MB`); continue }
      const contentBase64 = await readBase64(f)
      setFiles((prev) => [...prev, { fileName: f.name, mimeType: f.type || 'application/octet-stream', contentBase64, sizeBytes: f.size }])
    }
    e.target.value = ''
  }

  const submit = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/support/requests', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, subjectId, departmentId: form.departmentId || undefined, moduleId: form.moduleId || undefined, aiAnswerShared: form.aiAnswerShared || undefined, attachments: files }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('Question sent!', json.data.routed ? 'Routed to a teacher in your department.' : 'Submitted — an administrator will assign a teacher.')
      router.push(`/support/${json.data.id}`)
    } catch (err) {
      toast.error('Could not submit', err instanceof Error ? err.message : 'Try again')
    } finally { setSubmitting(false) }
  }

  if (isLoading) return <div className="skeleton h-64 w-full rounded-2xl" />
  if (!prof) {
    return (
      <div className="glass rounded-2xl p-8 text-center max-w-lg">
        <MessageSquarePlus className="h-10 w-10 text-slate-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white mb-2">Set up your academic profile first</h2>
        <p className="text-slate-400 text-sm mb-5">Tell us your university and department so we can route your questions to the right teacher.</p>
        <Link href="/settings"><Button>Set up profile</Button></Link>
      </div>
    )
  }

  const canSubmit = form.title.trim().length >= 3 && form.body.trim().length >= 5

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-allq-purple to-allq-cyan flex items-center justify-center">
          <MessageSquarePlus className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Ask a Teacher</h1>
          <p className="text-slate-400 text-sm">Stuck on something? A verified teacher in your department will help.</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 space-y-4">
        <Input label="Title" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. I don't understand overfitting" />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Your question</label>
          <textarea value={form.body} onChange={(e) => set('body', e.target.value)} placeholder="Describe what you're confused about…" className="input-glass w-full rounded-xl px-4 py-3 text-sm resize-none h-32" />
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Priority</label>
            <select value={form.priority} onChange={(e) => set('priority', e.target.value)} className="input-glass w-full rounded-xl px-3 py-2.5 text-sm">
              {PRIORITIES.map((p) => <option key={p.v} value={p.v} className="bg-bg-surface">{p.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Department</label>
            <select value={form.departmentId} onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value, moduleId: '' }))} className="input-glass w-full rounded-xl px-3 py-2.5 text-sm">
              <option value="" className="bg-bg-surface">{prof.department?.name || 'My department'}</option>
              {(opts?.departments || []).map((d: { id: string; name: string }) => <option key={d.id} value={d.id} className="bg-bg-surface">{d.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Module</label>
            <select value={form.moduleId} onChange={(e) => set('moduleId', e.target.value)} className="input-glass w-full rounded-xl px-3 py-2.5 text-sm">
              <option value="" className="bg-bg-surface">Optional…</option>
              {modules.map((m: { id: string; name: string }) => <option key={m.id} value={m.id} className="bg-bg-surface">{m.name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Share an AI answer (optional)</label>
          <textarea value={form.aiAnswerShared} onChange={(e) => set('aiAnswerShared', e.target.value)} placeholder="Paste the AI explanation you got, so the teacher can verify or correct it…" className="input-glass w-full rounded-xl px-4 py-3 text-sm resize-none h-20" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Attachments (optional)</label>
          <label className="flex items-center gap-2 glass-hover rounded-xl px-3 py-2.5 text-sm text-slate-300 cursor-pointer border border-white/10 hover:border-allq-purple/30 w-fit">
            <Paperclip className="h-4 w-4" /> Add files
            <input type="file" multiple className="hidden" onChange={onPick} accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.txt,.docx,.pptx" />
          </label>
          {files.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {files.map((f, i) => (
                <span key={i} className="flex items-center gap-1 bg-white/5 text-slate-300 px-2.5 py-1 rounded-full text-xs">
                  {f.fileName}
                  <X className="h-3 w-3 cursor-pointer hover:text-allq-red" onClick={() => setFiles(files.filter((_, j) => j !== i))} />
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-1">
          <Button onClick={submit} loading={submitting} disabled={!canSubmit}>Send to a teacher</Button>
        </div>
      </div>
    </motion.div>
  )
}

export default function AskTeacherPage() {
  return (
    <div className="p-6 lg:p-8">
      <Suspense fallback={<div className="skeleton h-64 w-full max-w-2xl rounded-2xl" />}>
        <AskForm />
      </Suspense>
    </div>
  )
}
