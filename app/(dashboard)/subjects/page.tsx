'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SubjectCardSkeleton } from '@/components/ui/skeleton'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { useQueryClient } from '@tanstack/react-query'
import {
  Plus, Search, BookOpen, Users, ThumbsUp, Globe,
  Lock, Sparkles, Filter
} from 'lucide-react'
import type { Subject } from '@/types'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createSubjectSchema, type CreateSubjectInput } from '@/lib/validations'
import { cn } from '@/lib/utils'

const CATEGORIES = ['All', 'MATHEMATICS', 'SCIENCE', 'HISTORY', 'TECHNOLOGY', 'LANGUAGES', 'ARTS', 'BUSINESS', 'OTHER']
const DIFFICULTIES = ['All', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']

const difficultyColor = {
  BEGINNER: 'green', INTERMEDIATE: 'cyan', ADVANCED: 'amber', EXPERT: 'red',
} as const

export default function SubjectsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [tab, setTab] = useState<'explore' | 'mine'>('explore')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [difficulty, setDifficulty] = useState('All')

  const { data, isLoading } = useQuery({
    queryKey: ['subjects', tab, search, category, difficulty],
    queryFn: async () => {
      const params = new URLSearchParams({
        mine: String(tab === 'mine'),
        ...(search && { search }),
        ...(category !== 'All' && { category }),
        ...(difficulty !== 'All' && { difficulty }),
        perPage: '24',
      })
      const res = await fetch(`/api/subjects?${params}`)
      const json = await res.json()
      return json.data
    },
  })

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch } = useForm<CreateSubjectInput>({
    resolver: zodResolver(createSubjectSchema),
    defaultValues: { difficulty: 'BEGINNER', category: 'OTHER', isPublic: true, tags: [] },
  })

  const [tagInput, setTagInput] = useState('')
  const tags = watch('tags') || []

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t) && tags.length < 10) {
      setValue('tags', [...tags, t])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => setValue('tags', tags.filter((t) => t !== tag))

  const onCreateSubmit = async (data: CreateSubjectInput) => {
    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('Subject created!', `"${data.title}" is ready for materials.`)
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      setShowCreate(false)
      reset()
    } catch (err: unknown) {
      toast.error('Failed to create subject', err instanceof Error ? err.message : 'Try again')
    }
  }

  return (
    <div className="px-5 py-7 lg:px-9 lg:py-9 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Subjects</h1>
          <p className="text-slate-500 mt-0.5">Browse, create, and master any subject</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> New Subject
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['explore', 'mine'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-5 py-2 rounded-xl text-sm font-semibold transition-all',
              tab === t
                ? 'bg-purple-50 text-allq-purple border border-purple-200'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
            )}
          >
            {t === 'explore' ? (
              <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" />Explore</span>
            ) : (
              <span className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" />My Subjects</span>
            )}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="space-y-3 mb-6">
        {/* Search + difficulty */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subjects..."
              className="input-light w-full pl-9 pr-4 py-2.5 text-sm rounded-xl"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                  difficulty === d
                    ? 'bg-allq-purple/15 text-allq-purple border-allq-purple/30'
                    : 'text-slate-500 hover:text-slate-900 bg-white border-slate-200 hover:border-slate-300'
                )}
              >
                {d === 'All' ? 'All Levels' : d.charAt(0) + d.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Category filter row */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border whitespace-nowrap flex-shrink-0',
                category === cat
                  ? 'bg-allq-cyan/15 text-cyan-700 border-allq-cyan/30'
                  : 'text-slate-500 hover:text-slate-900 bg-white border-slate-200 hover:border-slate-300'
              )}
            >
              {cat === 'All' ? 'All Categories' : cat.charAt(0) + cat.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Subjects Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => <SubjectCardSkeleton key={i} />)}
        </div>
      ) : data?.items?.length === 0 ? (
        <div className="text-center py-20">
          <Sparkles className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-slate-900 font-bold text-lg mb-2">No subjects found</h3>
          <p className="text-slate-500 mb-6">
            {tab === 'mine' ? 'Create your first subject to get started' : 'Try different filters'}
          </p>
          {tab === 'mine' && (
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" /> Create Subject
            </Button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {data?.items?.map((subject: Subject, i: number) => (
            <motion.div
              key={subject.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link href={`/subjects/${subject.id}`}>
                <div className="surface-card-hover rounded-2xl overflow-hidden cursor-pointer group h-full flex flex-col">
                  {/* Color Banner */}
                  <div className="h-2 bg-gradient-to-r from-allq-purple to-allq-cyan" />

                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <Badge variant={difficultyColor[subject.difficulty as keyof typeof difficultyColor] || 'default'} size="sm">
                        {subject.difficulty}
                      </Badge>
                      <div className="flex items-center gap-1.5">
                        {subject.isPublic
                          ? <Globe className="h-3.5 w-3.5 text-slate-500" />
                          : <Lock className="h-3.5 w-3.5 text-slate-500" />
                        }
                      </div>
                    </div>

                    <h3 className="font-bold text-slate-900 mb-1.5 group-hover:text-allq-purple transition-colors line-clamp-2 flex-1">
                      {subject.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-4">{subject.description}</p>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {subject.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> {subject.enrolledCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3.5 w-3.5" /> {subject.upvoteCount}
                      </span>
                      <span>{subject._count?.questionBank || 0} Qs</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onOpenChange={setShowCreate} title="Create New Subject" description="Set up your study subject. You can add materials and generate quizzes after.">
        <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
          <Input label="Subject Title" placeholder="e.g., Advanced JavaScript" error={errors.title?.message} {...register('title')} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Description <span className="text-slate-500 font-normal">(optional)</span></label>
            <textarea
              {...register('description')}
              placeholder="Optional — add a short description, or skip it and just upload materials."
              className="input-light w-full rounded-xl px-4 py-3 text-sm resize-none h-24"
            />
            {errors.description && <p className="text-xs text-allq-red">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Category</label>
              <select {...register('category')} className="input-light w-full rounded-xl px-4 py-3 text-sm">
                {['MATHEMATICS', 'SCIENCE', 'HISTORY', 'GEOGRAPHY', 'LANGUAGES', 'TECHNOLOGY', 'ARTS', 'BUSINESS', 'MEDICINE', 'LAW', 'OTHER'].map((c) => (
                  <option key={c} value={c} className="bg-white">{c}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Difficulty</label>
              <select {...register('difficulty')} className="input-light w-full rounded-xl px-4 py-3 text-sm">
                {['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'].map((d) => (
                  <option key={d} value={d} className="bg-white">{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Tags</label>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                placeholder="Add a tag..."
                className="input-light flex-1 rounded-xl px-4 py-2.5 text-sm"
              />
              <Button type="button" variant="secondary" size="sm" onClick={addTag}>Add</Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    onClick={() => removeTag(tag)}
                    className="flex items-center gap-1 bg-allq-purple/15 text-allq-purple border border-allq-purple/30 px-2.5 py-1 rounded-full text-xs cursor-pointer hover:bg-allq-red/15 hover:text-allq-red hover:border-allq-red/30 transition-all"
                  >
                    {tag} ×
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('isPublic')} className="w-4 h-4 accent-allq-purple" />
              <span className="text-sm text-slate-700">Make subject public</span>
            </label>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" size="sm" loading={isSubmitting}>Create Subject</Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}
