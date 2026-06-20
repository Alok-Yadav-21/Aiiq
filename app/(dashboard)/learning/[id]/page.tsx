'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ChevronLeft, Check, Eye } from 'lucide-react'

export default function LearningDetailPage() {
  const { id } = useParams()
  const { data, isLoading } = useQuery({ queryKey: ['student-content', id], queryFn: async () => (await fetch(`/api/student/content/${id}`)).json().then((j) => j.data) })

  if (isLoading) return <div className="p-8"><div className="skeleton h-80 w-full max-w-2xl rounded-2xl" /></div>
  const c = data?.content
  if (!c) return <div className="p-8 text-slate-400">Content not found or not available to you.</div>

  const items: Record<string, unknown>[] = Array.isArray(c.items) ? c.items : []

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <Link href="/learning" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-4"><ChevronLeft className="h-4 w-4" /> Back</Link>
      <div className="glass rounded-2xl p-6 mb-4">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h1 className="text-xl font-black text-white">{c.title}</h1>
          <span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold bg-allq-green/15 text-allq-green border-allq-green/30">TEACHER-VERIFIED</span>
        </div>
        <p className="text-xs text-slate-400">{c.teacherProfile?.fullName || 'Teacher'} · {c.type}{c.module?.name && ` · ${c.module.name}`}</p>
        {c.instructions && <p className="text-sm text-slate-300 mt-3">{c.instructions}</p>}
      </div>

      {c.type === 'STUDY_GUIDE' ? (
        <div className="glass rounded-2xl p-6 text-sm text-slate-200 whitespace-pre-wrap">{(items[0]?.text as string) || 'No content.'}</div>
      ) : (
        <div className="space-y-3">
          {items.map((it, i) => <ItemCard key={i} type={c.type} item={it} index={i} />)}
          {items.length === 0 && <p className="text-slate-400 text-sm">No items.</p>}
        </div>
      )}
    </div>
  )
}

function ItemCard({ type, item, index }: { type: string; item: Record<string, unknown>; index: number }) {
  const [reveal, setReveal] = useState(false)

  if (type === 'FLASHCARDS') {
    return (
      <button onClick={() => setReveal((r) => !r)} className="w-full text-left glass rounded-2xl p-5 hover:border-allq-purple/30 border border-transparent transition-all">
        <p className="text-xs text-slate-500 mb-1">Card {index + 1}</p>
        <p className="font-semibold text-white">{item.term as string}</p>
        {reveal ? <p className="text-sm text-slate-300 mt-2">{item.definition as string}</p> : <p className="text-xs text-allq-purple mt-2 flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> Tap to reveal</p>}
      </button>
    )
  }

  if (type === 'MCQ') {
    const opts = (item.options as string[]) || []
    return (
      <div className="glass rounded-2xl p-5">
        <p className="font-semibold text-white mb-3">{index + 1}. {item.question as string}</p>
        <div className="space-y-2">
          {opts.map((o, oi) => (
            <div key={oi} className={cn('rounded-xl px-3 py-2 text-sm border', reveal && oi === item.correctIndex ? 'bg-allq-green/15 text-allq-green border-allq-green/30' : 'border-white/8 text-slate-300')}>
              {o}{reveal && oi === item.correctIndex && <Check className="h-4 w-4 inline ml-2" />}
            </div>
          ))}
        </div>
        <button onClick={() => setReveal((r) => !r)} className="text-xs text-allq-purple mt-3">{reveal ? 'Hide answer' : 'Show answer'}</button>
        {reveal && item.explanation ? <p className="text-xs text-slate-400 mt-2">{item.explanation as string}</p> : null}
      </div>
    )
  }

  // QA
  return (
    <div className="glass rounded-2xl p-5">
      <p className="font-semibold text-white mb-2">{index + 1}. {item.question as string}</p>
      {reveal ? <p className="text-sm text-slate-300">{item.answer as string}</p> : <button onClick={() => setReveal(true)} className="text-xs text-allq-purple flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> Show answer</button>}
    </div>
  )
}
