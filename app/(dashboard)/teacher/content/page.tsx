'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import { BookOpenCheck, Plus, Trash2, FileText, Layers, MessageCircleQuestion, NotebookPen } from 'lucide-react'

const TYPES = [
  { v: 'FLASHCARDS', label: 'Flashcards', icon: Layers },
  { v: 'MCQ', label: 'MCQs / Quiz', icon: BookOpenCheck },
  { v: 'QA', label: 'Questions & Answers', icon: MessageCircleQuestion },
  { v: 'STUDY_GUIDE', label: 'Study guide / Notes', icon: NotebookPen },
]

type Item = Record<string, unknown>

function ContentWorkspace() {
  const sp = useSearchParams()
  const { toast } = useToast()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)

  const { data: statusData } = useQuery({ queryKey: ['teacher-status'], queryFn: async () => (await fetch('/api/teacher/status')).json().then((j) => j.data) })
  const { data, isLoading } = useQuery({ queryKey: ['teacher-content'], queryFn: async () => (await fetch('/api/teacher/content')).json().then((j) => j.data) })
  const assignments = statusData?.profile?.assignments || []
  const contents = data?.items || []

  const prefillStudentId = sp.get('studentId') || undefined
  const prefillRequestId = sp.get('fromRequest') || undefined

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-allq-purple to-allq-cyan flex items-center justify-center"><BookOpenCheck className="h-6 w-6 text-white" /></div>
          <div>
            <h1 className="text-2xl font-black text-white">Learning Content</h1>
            <p className="text-slate-400 text-sm">Create teacher-verified quizzes, flashcards, and notes for your students.</p>
          </div>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Create content</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-20 w-full rounded-2xl" />)}</div>
      ) : contents.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <FileText className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">No content yet</p>
          <p className="text-slate-400 text-sm">Create your first verified learning resource.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contents.map((c: { id: string; title: string; type: string; audience: string; status: string; module?: { name: string }; department?: { name: string }; programme?: { name: string }; items: unknown[] }) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold text-white truncate">{c.title}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold bg-allq-green/15 text-allq-green border-allq-green/30">TEACHER-CREATED</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border bg-white/5 text-slate-400 border-white/10">{c.type}</span>
                </div>
                <p className="text-xs text-slate-400">{(c.items?.length ?? 0)} item(s) · {c.module?.name || c.department?.name || c.programme?.name || 'Student'} · {c.status}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={async () => { await fetch(`/api/teacher/content/${c.id}`, { method: 'DELETE' }); qc.invalidateQueries({ queryKey: ['teacher-content'] }) }}><Trash2 className="h-4 w-4" /></Button>
            </motion.div>
          ))}
        </div>
      )}

      {open && <CreateModal assignments={assignments} prefillStudentId={prefillStudentId} prefillRequestId={prefillRequestId} onClose={() => setOpen(false)} onDone={() => { qc.invalidateQueries({ queryKey: ['teacher-content'] }); setOpen(false) }} />}
    </div>
  )
}

type Assignment = { id: string; department?: { id: string; name: string }; programme?: { id: string; name: string }; module?: { id: string; name: string } }

function CreateModal({ assignments, prefillStudentId, prefillRequestId, onClose, onDone }: { assignments: Assignment[]; prefillStudentId?: string; prefillRequestId?: string; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast()
  const [type, setType] = useState('FLASHCARDS')
  const [title, setTitle] = useState('')
  const [instructions, setInstructions] = useState('')
  const [target, setTarget] = useState('') // "MODULE:<id>" etc.
  const [items, setItems] = useState<Item[]>([])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const targetOptions = [
    ...assignments.filter((a) => a.module).map((a) => ({ key: `MODULE:${a.module!.id}`, label: `Module · ${a.module!.name}` })),
    ...assignments.filter((a) => a.department).map((a) => ({ key: `DEPARTMENT:${a.department!.id}`, label: `Department · ${a.department!.name}` })),
    ...assignments.filter((a) => a.programme).map((a) => ({ key: `PROGRAMME:${a.programme!.id}`, label: `Programme · ${a.programme!.name}` })),
  ]
  // dedupe
  const seen = new Set<string>()
  const uniqueTargets = targetOptions.filter((o) => (seen.has(o.key) ? false : (seen.add(o.key), true)))

  const addItem = () => {
    if (type === 'FLASHCARDS') setItems((p) => [...p, { term: '', definition: '' }])
    else if (type === 'MCQ') setItems((p) => [...p, { question: '', options: ['', '', '', ''], correctIndex: 0, explanation: '' }])
    else if (type === 'QA') setItems((p) => [...p, { question: '', answer: '' }])
  }
  const upd = (i: number, patch: Item) => setItems((p) => p.map((it, j) => (j === i ? { ...it, ...patch } : it)))

  const submit = async () => {
    setSaving(true)
    try {
      let audience = 'MODULE', ids: Record<string, string> = {}
      if (prefillStudentId) { audience = 'STUDENT'; ids.targetStudentId = prefillStudentId }
      else {
        if (!target) { toast.error('Choose an audience'); setSaving(false); return }
        const [a, id] = target.split(':'); audience = a
        ids = { MODULE: { moduleId: id }, DEPARTMENT: { departmentId: id }, PROGRAMME: { programmeId: id } }[a] || {}
      }
      const finalItems = type === 'STUDY_GUIDE' ? [{ text: notes }] : items
      const res = await fetch('/api/teacher/content', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, title, instructions: instructions || undefined, audience, ...ids, items: finalItems, sourceRequestId: prefillRequestId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('Published!', 'Students can now see this content.')
      onDone()
    } catch (err) { toast.error('Failed', err instanceof Error ? err.message : 'Try again') } finally { setSaving(false) }
  }

  return (
    <Modal open onOpenChange={onClose} size="lg" title="Create learning content" description="Teacher-verified content published to your students.">
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TYPES.map((t) => (
            <button key={t.v} onClick={() => { setType(t.v); setItems([]) }} className={cn('flex flex-col items-center gap-1 rounded-xl p-3 border text-xs transition-all', type === t.v ? 'bg-allq-purple/15 text-allq-purple border-allq-purple/30' : 'text-slate-400 border-white/8 hover:border-white/20')}>
              <t.icon className="h-5 w-5" /> {t.label}
            </button>
          ))}
        </div>

        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Overfitting — revision set" />
        <Input label="Instructions (optional)" value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="How students should use this" />

        {!prefillStudentId && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Publish to</label>
            <select value={target} onChange={(e) => setTarget(e.target.value)} className="input-glass w-full rounded-xl px-3 py-2.5 text-sm">
              <option value="" className="bg-bg-surface">Select audience…</option>
              {uniqueTargets.map((o) => <option key={o.key} value={o.key} className="bg-bg-surface">{o.label}</option>)}
            </select>
            {uniqueTargets.length === 0 && <p className="text-xs text-allq-amber">You have no assigned areas yet. Ask your admin to assign you a module or department.</p>}
          </div>
        )}
        {prefillStudentId && <p className="text-xs text-allq-cyan">This will be published privately to the student from the support request.</p>}

        {/* Item editors */}
        {type === 'STUDY_GUIDE' ? (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Notes / study guide</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input-glass w-full rounded-xl px-4 py-3 text-sm resize-none h-40" placeholder="Write the explanation or study guide…" />
          </div>
        ) : (
          <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
            {items.map((it, i) => (
              <div key={i} className="glass rounded-xl p-3 space-y-2 border border-white/8">
                <div className="flex justify-between"><span className="text-xs text-slate-500">Item {i + 1}</span><button onClick={() => setItems(items.filter((_, j) => j !== i))}><Trash2 className="h-3.5 w-3.5 text-slate-500 hover:text-allq-red" /></button></div>
                {type === 'FLASHCARDS' && (<>
                  <input value={it.term as string} onChange={(e) => upd(i, { term: e.target.value })} placeholder="Term" className="input-glass w-full rounded-lg px-3 py-2 text-sm" />
                  <textarea value={it.definition as string} onChange={(e) => upd(i, { definition: e.target.value })} placeholder="Definition" className="input-glass w-full rounded-lg px-3 py-2 text-sm resize-none h-16" />
                </>)}
                {type === 'MCQ' && (<>
                  <input value={it.question as string} onChange={(e) => upd(i, { question: e.target.value })} placeholder="Question" className="input-glass w-full rounded-lg px-3 py-2 text-sm" />
                  {(it.options as string[]).map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input type="radio" name={`correct-${i}`} checked={it.correctIndex === oi} onChange={() => upd(i, { correctIndex: oi })} className="accent-allq-green" />
                      <input value={opt} onChange={(e) => upd(i, { options: (it.options as string[]).map((o, k) => (k === oi ? e.target.value : o)) })} placeholder={`Option ${oi + 1}`} className="input-glass flex-1 rounded-lg px-3 py-1.5 text-sm" />
                    </div>
                  ))}
                </>)}
                {type === 'QA' && (<>
                  <input value={it.question as string} onChange={(e) => upd(i, { question: e.target.value })} placeholder="Question" className="input-glass w-full rounded-lg px-3 py-2 text-sm" />
                  <textarea value={it.answer as string} onChange={(e) => upd(i, { answer: e.target.value })} placeholder="Model answer" className="input-glass w-full rounded-lg px-3 py-2 text-sm resize-none h-16" />
                </>)}
              </div>
            ))}
            <Button type="button" variant="secondary" size="sm" onClick={addItem}><Plus className="h-4 w-4" /> Add item</Button>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={saving} disabled={title.trim().length < 3}>Publish</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function TeacherContentPage() {
  return <Suspense fallback={<div className="p-8"><div className="skeleton h-40 w-full rounded-2xl" /></div>}><ContentWorkspace /></Suspense>
}
