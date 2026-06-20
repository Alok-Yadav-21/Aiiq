'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import { STATUS_BADGE } from '@/lib/support-ui'
import { ChevronLeft, Paperclip, X, Send, Sparkles, GraduationCap, User as UserIcon, Star, CheckCircle, Lock } from 'lucide-react'

function readBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => { const s = String(r.result || ''); const i = s.indexOf(','); resolve(i >= 0 ? s.slice(i + 1) : s) }
    r.onerror = () => reject(new Error('read failed')); r.readAsDataURL(file)
  })
}

type Att = { id: string; fileName: string; mimeType: string; sizeBytes: number }
type Msg = { id: string; body: string; senderRole: string; isInternalNote: boolean; createdAt: string; sender: { id: string; name: string | null }; attachments: Att[] }

export default function SupportDetailPage() {
  const { id } = useParams()
  const { toast } = useToast()
  const qc = useQueryClient()
  const [reply, setReply] = useState('')
  const [internal, setInternal] = useState(false)
  const [files, setFiles] = useState<{ fileName: string; mimeType: string; contentBase64: string; sizeBytes: number }[]>([])
  const [busy, setBusy] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['support', id],
    queryFn: async () => (await fetch(`/api/support/requests/${id}`)).json().then((j) => j.data),
  })

  const r = data?.request
  const viewerRole: string | null = data?.viewerRole
  const isTeacherView = viewerRole === 'TEACHER' || viewerRole === 'ADMIN'

  const refresh = () => qc.invalidateQueries({ queryKey: ['support', id] })

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    for (const f of Array.from(e.target.files || [])) {
      if (f.size > 5 * 1024 * 1024) { toast.error('Too large', `${f.name} exceeds 5MB`); continue }
      const contentBase64 = await readBase64(f)
      setFiles((p) => [...p, { fileName: f.name, mimeType: f.type || 'application/octet-stream', contentBase64, sizeBytes: f.size }])
    }
    e.target.value = ''
  }

  const send = async () => {
    if (!reply.trim() && files.length === 0) return
    setBusy(true)
    try {
      const res = await fetch(`/api/support/requests/${id}/messages`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: reply, isInternalNote: internal, attachments: files }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setReply(''); setFiles([]); setInternal(false); refresh()
    } catch (err) { toast.error('Failed to send', err instanceof Error ? err.message : 'Try again') } finally { setBusy(false) }
  }

  const setStatus = async (status: string) => {
    setBusy(true)
    try {
      const res = await fetch(`/api/support/requests/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Updated'); refresh()
    } catch (err) { toast.error('Failed', err instanceof Error ? err.message : 'Try again') } finally { setBusy(false) }
  }

  const rate = async (rating: number) => {
    try {
      const res = await fetch(`/api/support/requests/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rating }) })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Thanks for your feedback!'); refresh()
    } catch (err) { toast.error('Failed', err instanceof Error ? err.message : 'Try again') }
  }

  if (isLoading) return <div className="p-8"><div className="skeleton h-96 w-full max-w-3xl rounded-2xl" /></div>
  if (!r) return <div className="p-8 text-slate-400">Request not found or you don&apos;t have access.</div>

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <Link href="/support" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-4"><ChevronLeft className="h-4 w-4" /> Back</Link>

      <div className="glass rounded-2xl p-6 mb-4">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
          <h1 className="text-xl font-black text-white">{r.title}</h1>
          <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-semibold', STATUS_BADGE[r.status])}>{r.status.replace(/_/g, ' ')}</span>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          {isTeacherView ? r.student?.name : (r.teacherProfile?.fullName || 'Awaiting teacher assignment')}
          {r.module?.name && ` · ${r.module.name}`} · {r.priority}
        </p>
        <p className="text-sm text-slate-200 whitespace-pre-wrap">{r.body}</p>
        <Attachments list={r.attachments} />

        {r.aiAnswerShared && (
          <div className="mt-4 p-3 rounded-xl bg-allq-cyan/5 border border-allq-cyan/20">
            <p className="text-[11px] font-bold text-allq-cyan flex items-center gap-1 mb-1"><Sparkles className="h-3.5 w-3.5" /> AI-GENERATED — shared for the teacher to verify</p>
            <p className="text-xs text-slate-300 whitespace-pre-wrap">{r.aiAnswerShared}</p>
          </div>
        )}
      </div>

      {/* Conversation */}
      <div className="space-y-3 mb-4">
        {(r.messages as Msg[]).map((m) => {
          const fromTeacher = m.senderRole === 'TEACHER' || m.senderRole === 'ADMIN'
          return (
            <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={cn('rounded-2xl p-4 border', m.isInternalNote ? 'bg-allq-amber/5 border-allq-amber/20' : fromTeacher ? 'bg-allq-purple/5 border-allq-purple/20' : 'bg-white/[0.03] border-white/8')}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={cn('h-6 w-6 rounded-full flex items-center justify-center', fromTeacher ? 'bg-allq-purple/20' : 'bg-white/10')}>
                  {fromTeacher ? <GraduationCap className="h-3.5 w-3.5 text-allq-purple" /> : <UserIcon className="h-3.5 w-3.5 text-slate-300" />}
                </span>
                <span className="text-xs font-semibold text-white">{m.sender.name || (fromTeacher ? 'Teacher' : 'Student')}</span>
                {fromTeacher && !m.isInternalNote && <span className="text-[9px] font-bold bg-allq-green/15 text-allq-green border border-allq-green/30 px-1.5 py-0.5 rounded-full">TEACHER-VERIFIED</span>}
                {m.isInternalNote && <span className="text-[9px] font-bold bg-allq-amber/15 text-allq-amber border border-allq-amber/30 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Lock className="h-2.5 w-2.5" /> INTERNAL NOTE</span>}
                <span className="text-[10px] text-slate-500 ml-auto">{new Date(m.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm text-slate-200 whitespace-pre-wrap">{m.body}</p>
              <Attachments list={m.attachments} />
            </motion.div>
          )
        })}
        {r.messages.length === 0 && <p className="text-center text-sm text-slate-500 py-4">No replies yet.</p>}
      </div>

      {/* Actions */}
      {!['CLOSED'].includes(r.status) && (
        <div className="glass rounded-2xl p-4">
          <textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder={isTeacherView ? 'Write your verified answer…' : 'Reply or add more detail…'} className="input-glass w-full rounded-xl px-4 py-3 text-sm resize-none h-24" />
          {files.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {files.map((f, i) => <span key={i} className="flex items-center gap-1 bg-white/5 text-slate-300 px-2.5 py-1 rounded-full text-xs">{f.fileName}<X className="h-3 w-3 cursor-pointer hover:text-allq-red" onClick={() => setFiles(files.filter((_, j) => j !== i))} /></span>)}
            </div>
          )}
          <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer hover:text-white">
                <Paperclip className="h-4 w-4" /> Attach
                <input type="file" multiple className="hidden" onChange={onPick} accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.txt,.docx,.pptx" />
              </label>
              {isTeacherView && (
                <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                  <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} className="accent-allq-amber" /> Internal note
                </label>
              )}
            </div>
            <Button size="sm" onClick={send} loading={busy} disabled={!reply.trim() && files.length === 0}><Send className="h-4 w-4" /> Send</Button>
          </div>

          {/* Status controls */}
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/5">
            {isTeacherView && (<>
              <Button size="sm" variant="secondary" onClick={() => setStatus('IN_PROGRESS')}>In progress</Button>
              <Button size="sm" variant="secondary" onClick={() => setStatus('NEEDS_INFO')}>Needs info</Button>
              <Button size="sm" variant="secondary" onClick={() => setStatus('RESOLVED')}><CheckCircle className="h-4 w-4" /> Resolve</Button>
              <Link href={`/teacher/content?fromRequest=${r.id}&studentId=${r.student?.id || ''}`}>
                <Button size="sm" variant="ghost"><Sparkles className="h-4 w-4" /> Create practice</Button>
              </Link>
            </>)}
            {viewerRole === 'STUDENT' && r.status !== 'RESOLVED' && (
              <Button size="sm" variant="secondary" onClick={() => setStatus('RESOLVED')}><CheckCircle className="h-4 w-4" /> Mark resolved</Button>
            )}
          </div>

          {/* Student rating once resolved */}
          {viewerRole === 'STUDENT' && (r.status === 'RESOLVED' || r.status === 'CLOSED') && (
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2">
              <span className="text-xs text-slate-400">Rate this support:</span>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => rate(n)}><Star className={cn('h-4 w-4', (r.rating ?? 0) >= n ? 'text-allq-amber fill-allq-amber' : 'text-slate-600')} /></button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Attachments({ list }: { list?: Att[] }) {
  if (!list || list.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {list.map((a) => (
        <a key={a.id} href={`/api/support/attachments/${a.id}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 bg-white/5 hover:bg-white/10 text-slate-300 px-2.5 py-1 rounded-full text-xs">
          <Paperclip className="h-3 w-3" /> {a.fileName}
        </a>
      ))}
    </div>
  )
}
