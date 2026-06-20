'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BookOpenCheck, Layers, MessageCircleQuestion, NotebookPen, GraduationCap } from 'lucide-react'

const ICON: Record<string, typeof Layers> = { FLASHCARDS: Layers, MCQ: BookOpenCheck, QA: MessageCircleQuestion, STUDY_GUIDE: NotebookPen }

export default function LearningPage() {
  const { data, isLoading } = useQuery({ queryKey: ['student-content'], queryFn: async () => (await fetch('/api/student/content')).json().then((j) => j.data) })
  const items = data?.items || []

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-allq-purple to-allq-cyan flex items-center justify-center"><GraduationCap className="h-6 w-6 text-white" /></div>
        <div>
          <h1 className="text-2xl font-black text-white">Teacher Content</h1>
          <p className="text-slate-400 text-sm">Verified learning materials created by your teachers.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 w-full rounded-2xl" />)}</div>
      ) : items.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <BookOpenCheck className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">No teacher content yet</p>
          <p className="text-slate-400 text-sm">When your teachers publish quizzes, flashcards, or notes, they&apos;ll appear here.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {items.map((c: { id: string; type: string; title: string; teacherProfile?: { fullName: string }; module?: { name: string }; difficulty?: string }) => {
            const Icon = ICON[c.type] || BookOpenCheck
            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Link href={`/learning/${c.id}`}>
                  <div className="glass-hover rounded-2xl p-5 cursor-pointer h-full">
                    <div className="flex items-center justify-between mb-3">
                      <Icon className="h-6 w-6 text-allq-cyan" />
                      <span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold bg-allq-green/15 text-allq-green border-allq-green/30">TEACHER-VERIFIED</span>
                    </div>
                    <h3 className="font-bold text-white mb-1">{c.title}</h3>
                    <p className="text-xs text-slate-400">{c.teacherProfile?.fullName || 'Teacher'}{c.module?.name && ` · ${c.module.name}`}</p>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
