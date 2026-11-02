'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { useToast } from '@/hooks/useToast'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { createSubjectSchema, type CreateSubjectInput } from '@/lib/validations'
import { cn } from '@/lib/utils'
import { BookOpen, ChevronLeft, Tag, Globe, Lock, Sparkles } from 'lucide-react'

const CATEGORIES = [
  'MATHEMATICS', 'SCIENCE', 'HISTORY', 'GEOGRAPHY', 'LANGUAGES',
  'TECHNOLOGY', 'ARTS', 'BUSINESS', 'MEDICINE', 'LAW', 'PHILOSOPHY', 'OTHER',
]
const DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']

const DIFFICULTY_META = {
  BEGINNER:     { label: 'Beginner',     color: 'green',  desc: 'Introduction level, no prior knowledge needed' },
  INTERMEDIATE: { label: 'Intermediate', color: 'cyan',   desc: 'Some familiarity with the topic required' },
  ADVANCED:     { label: 'Advanced',     color: 'amber',  desc: 'Deep knowledge and experience expected' },
  EXPERT:       { label: 'Expert',       color: 'red',    desc: 'Professional / exam-level challenge' },
} as const

export default function NewSubjectPage() {
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [tagInput, setTagInput] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<CreateSubjectInput>({
    resolver: zodResolver(createSubjectSchema),
    defaultValues: { difficulty: 'BEGINNER', category: 'OTHER', isPublic: true, tags: [] },
  })

  const difficulty = watch('difficulty')
  const isPublic = watch('isPublic')
  const tags = watch('tags') || []

  const addTag = (raw: string) => {
    const t = raw.trim().toLowerCase().replace(/\s+/g, '-')
    if (t && !tags.includes(t) && tags.length < 10) {
      setValue('tags', [...tags, t])
    }
    setTagInput('')
  }

  const onSubmit = async (data: CreateSubjectInput) => {
    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('Subject created!', `"${data.title}" is ready. Upload materials to generate quizzes.`)
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      router.push(`/subjects/${json.data.id}`)
    } catch (err: unknown) {
      toast.error('Failed to create', err instanceof Error ? err.message : 'Please try again')
    }
  }

  return (
    <div className="px-5 py-7 lg:px-9 lg:py-9 max-w-3xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-6"
      >
        <ChevronLeft className="h-4 w-4" /> Back
      </button>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-allq-purple to-allq-cyan flex items-center justify-center shadow-neon-sm">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Create New Subject</h1>
            <p className="text-slate-500 text-sm">Fill in the details — you can always edit later</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title + Description */}
          <div className="surface-card rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Basic Info</h2>
            <Input
              label="Subject Title"
              placeholder="e.g., Advanced JavaScript Fundamentals"
              error={errors.title?.message}
              {...register('title')}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Description</label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="What will learners understand after studying this subject? Be specific — the AI uses this to generate better questions."
                className="input-light w-full rounded-xl px-4 py-3 text-sm resize-none"
              />
              {errors.description && <p className="text-xs text-allq-red">{errors.description.message}</p>}
            </div>
          </div>

          {/* Category */}
          <div className="surface-card rounded-2xl p-6">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Category</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => {
                const selected = watch('category') === cat
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setValue('category', cat as CreateSubjectInput['category'])}
                    className={cn(
                      'py-2 px-3 rounded-xl text-xs font-medium transition-all border text-left',
                      selected
                        ? 'bg-allq-purple/15 text-allq-purple border-allq-purple/40'
                        : 'text-slate-500 bg-white border-slate-200 hover:border-slate-300 hover:text-slate-900'
                    )}
                  >
                    {cat.charAt(0) + cat.slice(1).toLowerCase()}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Difficulty */}
          <div className="surface-card rounded-2xl p-6">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Difficulty Level</h2>
            <div className="grid grid-cols-2 gap-3">
              {DIFFICULTIES.map((d) => {
                const meta = DIFFICULTY_META[d as keyof typeof DIFFICULTY_META]
                const selected = difficulty === d
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setValue('difficulty', d as CreateSubjectInput['difficulty'])}
                    className={cn(
                      'p-4 rounded-xl border text-left transition-all',
                      selected
                        ? `bg-allq-${meta.color}/10 border-allq-${meta.color}/40`
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-slate-900">{meta.label}</span>
                      {selected && <Badge variant={meta.color as any} size="sm">Selected</Badge>}
                    </div>
                    <p className="text-xs text-slate-500">{meta.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tags */}
          <div className="surface-card rounded-2xl p-6">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Tags ({tags.length}/10)</h2>
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput) }
                    if (e.key === ',') { e.preventDefault(); addTag(tagInput) }
                  }}
                  placeholder="Type a tag and press Enter..."
                  className="input-light w-full pl-9 pr-4 py-2.5 text-sm rounded-xl"
                />
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={() => addTag(tagInput)}>
                Add
              </Button>
            </div>

            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setValue('tags', tags.filter((t) => t !== tag))}
                    className="flex items-center gap-1.5 bg-allq-purple/10 text-allq-purple border border-allq-purple/25 px-3 py-1.5 rounded-full text-xs font-medium hover:bg-allq-red/10 hover:text-allq-red hover:border-allq-red/25 transition-all"
                  >
                    #{tag} <span className="opacity-60">×</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Add tags to help others discover your subject</p>
            )}
          </div>

          {/* Visibility */}
          <div className="surface-card rounded-2xl p-6">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Visibility</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setValue('isPublic', true)}
                className={cn(
                  'p-4 rounded-xl border text-left transition-all',
                  isPublic ? 'bg-allq-green/10 border-allq-green/30' : 'bg-white border-slate-200 hover:border-slate-300'
                )}
              >
                <Globe className={cn('h-5 w-5 mb-2', isPublic ? 'text-emerald-600' : 'text-slate-400')} />
                <p className="text-sm font-bold text-slate-900">Public</p>
                <p className="text-xs text-slate-500">Anyone can find & enrol</p>
              </button>
              <button
                type="button"
                onClick={() => setValue('isPublic', false)}
                className={cn(
                  'p-4 rounded-xl border text-left transition-all',
                  !isPublic ? 'bg-allq-cyan/10 border-allq-cyan/30' : 'bg-white border-slate-200 hover:border-slate-300'
                )}
              >
                <Lock className={cn('h-5 w-5 mb-2', !isPublic ? 'text-cyan-600' : 'text-slate-400')} />
                <p className="text-sm font-bold text-slate-900">Private</p>
                <p className="text-xs text-slate-500">Only visible to you</p>
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={() => router.back()} className="flex-shrink-0">
              Cancel
            </Button>
            <Button type="submit" size="lg" className="flex-1" loading={isSubmitting}>
              <Sparkles className="h-4 w-4" />
              Create Subject
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
