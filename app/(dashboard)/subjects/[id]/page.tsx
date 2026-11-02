'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { FileUploader } from '@/components/ui/file-uploader'
import { useToast } from '@/hooks/useToast'
import { useAuth } from '@/hooks/useAuth'
import { FlashcardDeck } from '@/components/subject/flashcard-deck'
import { StudyNotes } from '@/components/subject/study-notes'
import { AskPanel } from '@/components/subject/ask-panel'
import {
  Upload, Brain, ChevronLeft, FileText, Image as ImageIcon, Type,
  Sparkles, Loader2, AlertTriangle, Layers, MessageSquare, BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'material', label: 'Material', icon: BookOpen },
  { id: 'flashcards', label: 'Flashcards', icon: Layers },
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'ask', label: 'Ask AIIQ', icon: MessageSquare },
] as const

type TabId = (typeof TABS)[number]['id']

export default function SubjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [tab, setTab] = useState<TabId>('material')
  const [showUpload, setShowUpload] = useState(false)
  const [showGenerateQuiz, setShowGenerateQuiz] = useState(false)
  const [uploadText, setUploadText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [quizConfig, setQuizConfig] = useState({
    questionCount: 10,
    difficulty: 'MEDIUM',
    types: ['MCQ', 'TRUE_FALSE'],
  })

  const { data: subject, isLoading } = useQuery({
    queryKey: ['subject', params.id],
    queryFn: async () => {
      const res = await fetch(`/api/subjects/${params.id}`)
      if (!res.ok) throw new Error('Not found')
      return res.json().then((d: any) => d.data)
    },
  })

  const generateQuiz = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: params.id,
          questionCount: quizConfig.questionCount,
          difficulty: quizConfig.difficulty,
          questionTypes: quizConfig.types,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      return json.data
    },
    onSuccess: (data) => {
      setShowGenerateQuiz(false)
      toast.success('Quiz ready', `${data.totalQuestions} questions generated.`)
      router.push(`/quiz/${data.sessionId}`)
    },
    onError: (err: Error) => toast.error('Generation failed', err.message),
  })

  const uploadMaterial = async () => {
    if (!uploadText.trim()) return
    setUploading(true)
    try {
      const res = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: params.id,
          type: 'TEXT',
          content: uploadText,
          fileName: 'pasted-notes.txt',
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('Material added', 'You can now generate study tools from it.')
      setShowUpload(false)
      setUploadText('')
      queryClient.invalidateQueries({ queryKey: ['subject', params.id] })
    } catch (err: unknown) {
      toast.error('Upload failed', err instanceof Error ? err.message : 'Try again')
    } finally {
      setUploading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="app-canvas flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gold-deep" />
      </div>
    )
  }

  if (!subject) {
    return (
      <div className="app-canvas flex items-center justify-center p-6">
        <div className="surface-card p-10 text-center max-w-sm">
          <h1 className="font-bold text-ink mb-2">Subject not found</h1>
          <p className="text-sm text-ink-muted mb-5">
            It may have been deleted, or you do not have access to it.
          </p>
          <Button variant="secondary" onClick={() => router.push('/subjects')}>
            Back to subjects
          </Button>
        </div>
      </div>
    )
  }

  const materials = subject.materials ?? []
  const readyMaterials = materials.filter((m: any) => m.status === 'READY')
  const hasMaterials = readyMaterials.length > 0
  // Only the subject's creator can add material or generate quizzes — the API
  // enforces this (returns "Subject not found or access denied" otherwise), so
  // we hide those actions on subjects the current user does not own.
  const isOwner = !!user && subject.creator?.id === user.id

  return (
    <div className="app-canvas px-5 py-7 lg:px-9 lg:py-9">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => router.push('/subjects')}
          className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors mb-6"
        >
          <ChevronLeft className="h-4 w-4" /> Subjects
        </button>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gold-50 text-gold-700 border border-gold-200">
              {subject.difficulty}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/[0.04] text-ink-muted">
              {subject.category}
            </span>
          </div>
          <h1 className="display text-3xl sm:text-4xl mb-2">{subject.title}</h1>
          {subject.description && (
            <p className="text-sm text-ink-secondary max-w-2xl leading-relaxed">
              {subject.description}
            </p>
          )}
        </motion.div>

        {/* Primary actions — only the creator can add material / generate quizzes */}
        {isOwner ? (
          <div className="flex flex-wrap gap-2.5 mt-6">
            <Button onClick={() => setShowGenerateQuiz(true)} disabled={!hasMaterials}>
              <Brain className="h-4 w-4" /> Generate quiz
            </Button>
            <Button variant="secondary" onClick={() => setShowUpload(true)}>
              <Upload className="h-4 w-4" /> Add material
            </Button>
          </div>
        ) : (
          <div className="flex items-start gap-2.5 mt-6 p-4 rounded-xl bg-black/[0.03] border border-line-warm">
            <BookOpen className="h-4 w-4 text-ink-muted flex-shrink-0 mt-0.5" />
            <p className="text-xs text-ink-secondary leading-relaxed">
              You&apos;re viewing a public subject{subject.creator?.name ? ` by ${subject.creator.name}` : ''}.
              Only its creator can add material or generate quizzes.{' '}
              <button onClick={() => router.push('/subjects')} className="font-semibold text-gold-700 hover:underline">
                Create your own subject
              </button>{' '}to upload notes and build quizzes.
            </p>
          </div>
        )}

        {!hasMaterials && (
          <div className="flex items-start gap-2.5 mt-5 p-4 rounded-xl bg-warning-tint border border-warning/25">
            <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-xs text-warning leading-relaxed">
              This subject has no readable material yet. Everything AIIQ generates —
              quizzes, flashcards, notes and answers — comes strictly from what you upload.
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mt-8 border-b border-line-warm overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-[13px] font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
                tab === t.id
                  ? 'border-gold-deep text-ink'
                  : 'border-transparent text-ink-muted hover:text-ink',
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Panels */}
        <div className="mt-7">
          {tab === 'material' && (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <h2 className="text-sm font-bold text-ink mb-4">
                  Uploaded material ({materials.length})
                </h2>

                {materials.length === 0 ? (
                  <div className="surface-card p-10 text-center">
                    <span className="h-12 w-12 rounded-2xl bg-gold-50 border border-gold-200 flex items-center justify-center mx-auto mb-4">
                      <Upload className="h-5 w-5 text-gold-700" />
                    </span>
                    <h3 className="font-bold text-ink mb-1.5">Nothing uploaded yet</h3>
                    <p className="text-sm text-ink-muted mb-5 max-w-sm mx-auto leading-relaxed">
                      {isOwner
                        ? 'Add a PDF, Word doc, slides, an image of your notes, or paste text directly. This is the only source AIIQ will use.'
                        : 'The creator of this subject has not added any material yet.'}
                    </p>
                    {isOwner && (
                      <Button onClick={() => setShowUpload(true)}>
                        <Upload className="h-4 w-4" /> Add material
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {materials.map((mat: any) => (
                      <div key={mat.id} className="surface-card px-4 py-3.5 flex items-center gap-3">
                        <span className="h-9 w-9 rounded-lg surface-sunken flex items-center justify-center flex-shrink-0">
                          {mat.type === 'PDF' ? <FileText className="h-4 w-4 text-ink-muted" />
                            : mat.type === 'IMAGE' ? <ImageIcon className="h-4 w-4 text-ink-muted" />
                            : <Type className="h-4 w-4 text-ink-muted" />}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink truncate">{mat.fileName}</p>
                          <p className="text-xs text-ink-faint">
                            {mat.type} · {(mat.fileSize / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <span
                          className={cn(
                            'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex-shrink-0',
                            mat.status === 'READY' ? 'bg-success-tint text-success'
                              : mat.status === 'FAILED' ? 'bg-danger-tint text-danger'
                              : 'bg-warning-tint text-warning',
                          )}
                        >
                          {mat.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Side stats */}
              <div className="space-y-4">
                <div className="surface-card p-5">
                  <p className="label-eyebrow mb-4">This subject</p>
                  <div className="space-y-3">
                    {[
                      { label: 'Materials', value: subject._count?.materials ?? materials.length },
                      { label: 'Questions', value: subject._count?.questionBank ?? 0 },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center justify-between text-sm">
                        <span className="text-ink-muted">{s.label}</span>
                        <span className="font-bold text-ink">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {subject.tags?.length > 0 && (
                  <div className="surface-card p-5">
                    <p className="label-eyebrow mb-3">Tags</p>
                    <div className="flex flex-wrap gap-1.5">
                      {subject.tags.map((tag: string) => (
                        <span key={tag} className="text-xs surface-sunken text-ink-secondary px-2.5 py-1">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'flashcards' && (
            <FlashcardDeck subjectId={String(params.id)} hasMaterials={hasMaterials} />
          )}

          {tab === 'notes' && (
            <StudyNotes subjectId={String(params.id)} hasMaterials={hasMaterials} />
          )}

          {tab === 'ask' && (
            <AskPanel
              subjectId={String(params.id)}
              subjectTitle={subject.title}
              hasMaterials={hasMaterials}
            />
          )}
        </div>
      </div>

      {/* Upload modal */}
      <Modal
        open={showUpload}
        onOpenChange={setShowUpload}
        size="lg"
        title="Add study material"
        description="PDFs, Word docs, slides, text files or images. Everything AIIQ generates comes from these — and only these."
      >
        <div className="space-y-5">
          <FileUploader
            subjectId={String(params.id)}
            onUploaded={() => queryClient.invalidateQueries({ queryKey: ['subject', params.id] })}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink-secondary">…or paste text directly</label>
            <textarea
              value={uploadText}
              onChange={(e) => setUploadText(e.target.value)}
              placeholder="Paste lecture notes, a textbook section, revision notes…"
              className="input-light w-full px-4 py-3 text-sm resize-none h-28"
            />
            {uploadText.trim().length > 0 && (
              <div className="flex justify-end">
                <Button onClick={uploadMaterial} loading={uploading} size="sm">
                  <Upload className="h-4 w-4" /> Add text
                </Button>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="ghost" onClick={() => setShowUpload(false)}>Done</Button>
          </div>
        </div>
      </Modal>

      {/* Generate quiz modal */}
      <Modal
        open={showGenerateQuiz}
        onOpenChange={setShowGenerateQuiz}
        title="Generate a quiz"
        description="Questions are written from your uploaded material only."
      >
        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium text-ink-secondary block mb-2">
              Questions: <span className="font-bold text-gold-700">{quizConfig.questionCount}</span>
            </label>
            <input
              type="range" min="5" max="50" step="5"
              value={quizConfig.questionCount}
              onChange={(e) => setQuizConfig((c) => ({ ...c, questionCount: Number(e.target.value) }))}
              className="w-full accent-gold-deep"
            />
            <div className="flex justify-between text-xs text-ink-faint mt-1">
              <span>5</span><span>50</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-ink-secondary block mb-2">Difficulty</label>
            <div className="grid grid-cols-4 gap-2">
              {['EASY', 'MEDIUM', 'HARD', 'EXPERT'].map((d) => (
                <button
                  key={d}
                  onClick={() => setQuizConfig((c) => ({ ...c, difficulty: d }))}
                  className={cn(
                    'py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-colors border',
                    quizConfig.difficulty === d
                      ? 'bg-gold-50 text-gold-700 border-gold-300'
                      : 'text-ink-muted border-line-warm hover:border-gold-200',
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-ink-secondary block mb-2">Question types</label>
            <div className="grid grid-cols-2 gap-2">
              {['MCQ', 'TRUE_FALSE', 'FILL_IN_THE_BLANK', 'SHORT_ANSWER'].map((type) => {
                const active = quizConfig.types.includes(type)
                return (
                  <button
                    key={type}
                    onClick={() => setQuizConfig((c) => ({
                      ...c,
                      types: active ? c.types.filter((t) => t !== type) : [...c.types, type],
                    }))}
                    className={cn(
                      'py-2 rounded-lg text-xs font-medium transition-colors border',
                      active
                        ? 'bg-gold-50 text-gold-700 border-gold-300'
                        : 'text-ink-muted border-line-warm hover:border-gold-200',
                    )}
                  >
                    {type.replace(/_/g, ' ')}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button variant="ghost" onClick={() => setShowGenerateQuiz(false)}>Cancel</Button>
            <Button
              loading={generateQuiz.isPending}
              onClick={() => generateQuiz.mutate()}
              disabled={quizConfig.types.length === 0 || !hasMaterials}
            >
              <Sparkles className="h-4 w-4" /> Generate
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
