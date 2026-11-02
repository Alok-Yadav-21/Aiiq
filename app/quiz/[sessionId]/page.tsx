'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import {
  ChevronLeft, ChevronRight, Clock, Check, X, Loader2,
  AlertTriangle, RotateCcw, ArrowRight,
} from 'lucide-react'
import { QuizResults } from './results'

type QuizQuestion = {
  id: string
  questionText: string
  questionType: string
  options: string[] | null
  difficulty: string
  topicTag: string | null
  timeLimitSeconds: number
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

/** Answers survive a refresh; the server only learns them on submit. */
function storageKey(sessionId: string) {
  return `aiiq:quiz:${sessionId}`
}

function loadProgress(sessionId: string): { answers: Record<string, string>; index: number } | null {
  try {
    const raw = localStorage.getItem(storageKey(sessionId))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveProgress(sessionId: string, answers: Record<string, string>, index: number) {
  try {
    localStorage.setItem(storageKey(sessionId), JSON.stringify({ answers, index }))
  } catch {
    /* private mode / quota — progress simply isn't preserved */
  }
}

function clearProgress(sessionId: string) {
  try {
    localStorage.removeItem(storageKey(sessionId))
  } catch {
    /* nothing to do */
  }
}

export default function QuizPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const sessionId = String(params.sessionId)

  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [index, setIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [confirmExit, setConfirmExit] = useState(false)
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const [restored, setRestored] = useState(false)

  const [timeLeft, setTimeLeft] = useState(0)
  const questionStartRef = useRef(Date.now())
  const timeSpentRef = useRef<Record<string, number>>({})

  const { data, isLoading, error } = useQuery({
    queryKey: ['quiz', sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/quiz/${sessionId}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load quiz')
      return json.data
    },
    retry: false,
  })

  const questions: QuizQuestion[] = data?.questions ?? []
  const question = questions[index]
  const total = questions.length
  const answeredCount = Object.keys(answers).length

  // An already-completed session opens straight into review.
  useEffect(() => {
    if (data?.status === 'COMPLETED' && data.result && !result) {
      setResult(data.result)
      clearProgress(sessionId)
    }
  }, [data, result, sessionId])

  // Restore in-progress answers after a refresh.
  useEffect(() => {
    if (restored || !total || data?.status === 'COMPLETED') return
    const saved = loadProgress(sessionId)
    if (saved) {
      setAnswers(saved.answers ?? {})
      setIndex(Math.min(saved.index ?? 0, total - 1))
      if (Object.keys(saved.answers ?? {}).length > 0) {
        toast.info('Progress restored', 'Your answers were saved on this device.')
      }
    }
    setRestored(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, sessionId, data?.status, restored])

  useEffect(() => {
    if (restored && !result) saveProgress(sessionId, answers, index)
  }, [answers, index, sessionId, restored, result])

  const recordTime = useCallback(() => {
    if (!question) return
    timeSpentRef.current[question.id] = Math.min(
      Date.now() - questionStartRef.current,
      question.timeLimitSeconds * 1000,
    )
  }, [question])

  const goTo = useCallback(
    (next: number) => {
      recordTime()
      setIndex(Math.max(0, Math.min(next, total - 1)))
    },
    [recordTime, total],
  )

  const submit = useCallback(async () => {
    if (!questions.length || submitting) return
    recordTime()
    setSubmitting(true)
    try {
      const payload = questions.map((q) => ({
        questionId: q.id,
        selectedAnswer: answers[q.id] || '',
        timeSpentMs: timeSpentRef.current[q.id] ?? q.timeLimitSeconds * 1000,
      }))
      const res = await fetch(`/api/quiz/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: payload }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Submission failed')

      // Attach question context so review can render without a second fetch.
      const byId = new Map(questions.map((q) => [q.id, q]))
      setResult({
        ...json.data,
        answers: json.data.answers.map((a: any) => ({
          ...a,
          questionText: byId.get(a.questionId)?.questionText,
          options: byId.get(a.questionId)?.options,
          topicTag: byId.get(a.questionId)?.topicTag,
          difficulty: byId.get(a.questionId)?.difficulty,
        })),
      })
      clearProgress(sessionId)
      // Dashboard stats and leaderboard are now stale.
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
    } catch (err) {
      toast.error('Could not submit', err instanceof Error ? err.message : 'Please try again')
    } finally {
      setSubmitting(false)
      setConfirmSubmit(false)
    }
  }, [answers, questions, sessionId, submitting, recordTime, toast, queryClient])

  // Per-question countdown. Reaching zero locks the question and moves on —
  // previously the timer hit zero and simply sat there doing nothing.
  useEffect(() => {
    if (!question || result) return
    setTimeLeft(question.timeLimitSeconds)
    questionStartRef.current = Date.now()

    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id)
          if (index < total - 1) {
            setIndex((i) => i + 1)
          } else {
            setConfirmSubmit(true)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.id, result])

  // Keyboard: 1–6 select an option, arrows navigate.
  useEffect(() => {
    if (!question || result) return
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      const num = parseInt(e.key, 10)
      if (question.options && num >= 1 && num <= question.options.length) {
        setAnswers((prev) => ({ ...prev, [question.id]: question.options![num - 1] }))
        return
      }
      if (e.key === 'ArrowRight' && index < total - 1) goTo(index + 1)
      if (e.key === 'ArrowLeft' && index > 0) goTo(index - 1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [question, index, total, goTo, result])

  /* ─── Loading / error ─────────────────────────────────────────────────── */

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-gold-deep" />
        <p className="text-sm text-ink-muted">Loading your quiz…</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="surface-card p-10 text-center max-w-sm">
          <span className="h-12 w-12 rounded-2xl bg-danger-tint flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-5 w-5 text-danger" />
          </span>
          <h1 className="text-lg font-black text-ink mb-2">Quiz unavailable</h1>
          <p className="text-sm text-ink-muted mb-6 leading-relaxed">
            {error instanceof Error ? error.message : 'This quiz could not be loaded.'}
          </p>
          <Link href="/subjects">
            <Button variant="secondary" className="w-full">Back to subjects</Button>
          </Link>
        </div>
      </div>
    )
  }

  /* ─── Results ─────────────────────────────────────────────────────────── */

  if (result) {
    return (
      <QuizResults
        sessionId={sessionId}
        result={result}
        subject={data.subject}
        onRetry={() => router.push(`/subjects/${data.subject.id}`)}
      />
    )
  }

  if (!question) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="surface-card p-10 text-center max-w-sm">
          <h1 className="text-lg font-black text-ink mb-2">This quiz has no questions</h1>
          <Link href={`/subjects/${data.subject?.id ?? ''}`}>
            <Button variant="secondary" className="w-full mt-4">Back to subject</Button>
          </Link>
        </div>
      </div>
    )
  }

  /* ─── Active quiz ─────────────────────────────────────────────────────── */

  const progress = ((index + 1) / total) * 100
  const timerPct = (timeLeft / question.timeLimitSeconds) * 100
  const urgent = timerPct < 33
  const isAnswered = !!answers[question.id]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Slim quiz chrome */}
      <header className="border-b border-line-warm bg-white/85 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-sm font-black tracking-[0.18em] text-ink flex-shrink-0">AIIQ</span>
            <span className="text-xs text-ink-muted truncate hidden sm:block">
              {data.subject?.title}
            </span>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <span
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono font-bold text-xs border transition-colors',
                urgent
                  ? 'text-danger border-danger/30 bg-danger-tint'
                  : 'text-ink-secondary border-line-warm bg-white',
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              {timeLeft}s
            </span>
            <button
              onClick={() => setConfirmExit(true)}
              className="text-xs text-ink-muted hover:text-ink transition-colors px-1"
            >
              Exit
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="h-0.5 bg-black/[0.06]">
          <motion.div
            className="h-full bg-gold-deep"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-5 py-7 flex flex-col">
        {/* Question index + dots */}
        <div className="flex items-center justify-between gap-4 mb-5">
          <p className="label-eyebrow">
            Question {index + 1} of {total}
          </p>
          <div className="flex gap-1 flex-wrap justify-end">
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => goTo(i)}
                aria-label={`Go to question ${i + 1}`}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === index
                    ? 'w-5 bg-gold-deep'
                    : answers[q.id]
                    ? 'w-1.5 bg-success'
                    : 'w-1.5 bg-black/[0.12] hover:bg-black/25',
                )}
              />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.18 }}
            className="flex-1"
          >
            {/* Question */}
            <div className="surface-card p-6 mb-5">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gold-50 text-gold-700 border border-gold-200">
                  {question.difficulty}
                </span>
                {question.topicTag && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/[0.04] text-ink-muted">
                    {question.topicTag}
                  </span>
                )}
              </div>
              <p className="text-lg md:text-xl font-semibold text-ink leading-relaxed">
                {question.questionText}
              </p>
            </div>

            {/* Options */}
            {question.options ? (
              <div className="space-y-2.5">
                {question.options.map((option, i) => {
                  const selected = answers[question.id] === option
                  return (
                    <button
                      key={option}
                      onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: option }))}
                      className={cn(
                        'w-full text-left rounded-xl px-4 py-3.5 text-sm font-medium transition-all border group',
                        selected
                          ? 'border-gold-400 bg-gold-50 text-ink'
                          : 'border-line-card bg-white text-ink-secondary hover:border-gold-300 hover:text-ink',
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={cn(
                            'h-7 w-7 rounded-lg border flex items-center justify-center flex-shrink-0 text-xs font-bold transition-colors',
                            selected
                              ? 'border-gold-deep bg-gold-deep text-white'
                              : 'border-line-warm text-ink-faint group-hover:border-gold-300',
                          )}
                        >
                          {selected ? <Check className="h-3.5 w-3.5" /> : LETTERS[i]}
                        </span>
                        <span>{option}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <input
                value={answers[question.id] || ''}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))}
                placeholder="Type your answer…"
                className="input-light w-full px-4 py-4 text-base"
                autoFocus
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3 mt-7 pt-5 border-t border-line-soft">
          <Button variant="ghost" disabled={index === 0} onClick={() => goTo(index - 1)}>
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>

          <span className="text-[11px] text-ink-faint hidden sm:block">
            {question.options ? `Press 1–${question.options.length} to answer` : 'Type your answer'}
          </span>

          {index < total - 1 ? (
            <Button variant={isAnswered ? 'primary' : 'secondary'} onClick={() => goTo(index + 1)}>
              {isAnswered ? 'Next' : 'Skip'} <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => setConfirmSubmit(true)} loading={submitting}>
              Finish quiz
            </Button>
          )}
        </div>
      </main>

      {/* Exit confirmation — a timed quiz should not be abandoned by accident */}
      <Modal
        open={confirmExit}
        onOpenChange={setConfirmExit}
        size="sm"
        title="Leave this quiz?"
        description="Your answers are saved on this device, so you can come back to this quiz and pick up where you left off."
      >
        <div className="flex gap-3 justify-end mt-2">
          <Button variant="ghost" onClick={() => setConfirmExit(false)}>Keep going</Button>
          <Button variant="secondary" onClick={() => router.push(`/subjects/${data.subject?.id ?? ''}`)}>
            Leave quiz
          </Button>
        </div>
      </Modal>

      {/* Submit confirmation */}
      <Modal
        open={confirmSubmit}
        onOpenChange={setConfirmSubmit}
        size="sm"
        title="Submit your answers?"
        description={
          answeredCount < total
            ? `You have answered ${answeredCount} of ${total}. Unanswered questions score zero.`
            : `All ${total} questions answered. Ready to see how you did?`
        }
      >
        <div className="flex gap-3 justify-end mt-2">
          <Button variant="ghost" onClick={() => setConfirmSubmit(false)} disabled={submitting}>
            Review answers
          </Button>
          <Button onClick={submit} loading={submitting}>
            Submit <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </Modal>
    </div>
  )
}
