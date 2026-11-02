'use client'

import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Check, X, RotateCcw, LayoutDashboard, ChevronDown,
  Sparkles, Download, Loader2, Lightbulb,
} from 'lucide-react'
import { RichText } from '@/components/ui/rich-text'
import { useToast } from '@/hooks/useToast'

type ResultAnswer = {
  questionId: string
  questionText?: string
  topicTag?: string | null
  difficulty?: string
  selectedAnswer: string | null
  correctAnswer: string
  explanation?: string | null
  isCorrect: boolean
  pointsEarned: number
}

type Narration = {
  headline: string
  weakTopics: { topic: string; wrongCount: number; suggestion: string }[]
  strongTopics: string[]
  nextStepMessage: string
  recommendedFocusQuestions: string[]
}

export type QuizResult = {
  score: number
  maxScore: number
  correctAnswers: number
  totalQuestions: number
  accuracy: number
  answers: ResultAnswer[]
}

function verdict(accuracy: number) {
  if (accuracy >= 85) return { title: 'Excellent work.', note: 'You have this material down.' }
  if (accuracy >= 65) return { title: 'Solid effort.', note: 'A few gaps left to close.' }
  if (accuracy >= 40) return { title: 'Getting there.', note: 'Worth another pass over the weak topics.' }
  return { title: 'Keep going.', note: 'Re-read the material, then try again.' }
}

export function QuizResults({
  sessionId,
  result,
  subject,
  onRetry,
}: {
  sessionId: string
  result: QuizResult
  subject?: { id: string; title: string }
  onRetry: () => void
}) {
  const [openReview, setOpenReview] = useState(false)
  const { toast } = useToast()
  const v = verdict(result.accuracy)

  /* Adaptive coaching — the /narrate endpoint existed from the start but
     nothing ever called it, so this feedback was never reachable. */
  const narrate = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/quiz/${sessionId}/narrate`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Could not generate feedback')
      return json.data.narration as Narration
    },
    onError: (e: Error) => toast.error('Could not generate feedback', e.message),
  })
  const narration = narrate.data

  /* Per-topic breakdown — the old results screen threw this away even though
     every question carries a topicTag. It is the most actionable part. */
  const topics = useMemo(() => {
    const map = new Map<string, { correct: number; total: number }>()
    for (const a of result.answers) {
      const key = a.topicTag || 'General'
      const row = map.get(key) ?? { correct: 0, total: 0 }
      row.total++
      if (a.isCorrect) row.correct++
      map.set(key, row)
    }
    return [...map.entries()]
      .map(([topic, r]) => ({
        topic,
        ...r,
        accuracy: Math.round((r.correct / r.total) * 100),
      }))
      .sort((a, b) => a.accuracy - b.accuracy)
  }, [result.answers])

  const weakest = topics.filter((t) => t.accuracy < 100)

  return (
    <div className="min-h-screen">
      <header className="border-b border-line-warm bg-white/85 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between">
          <span className="text-sm font-black tracking-[0.18em] text-ink">AIIQ</span>
          <Link href="/dashboard" className="text-xs text-ink-muted hover:text-ink transition-colors">
            Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          {/* Verdict */}
          <div className="text-center mb-9">
            <p className="label-eyebrow mb-3">Quiz complete</p>
            <h1 className="display text-3xl sm:text-4xl mb-2">{v.title}</h1>
            <p className="text-sm text-ink-muted">{v.note}</p>
            {subject && (
              <p className="text-xs text-ink-faint mt-2">{subject.title}</p>
            )}
          </div>

          {/* Score */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Accuracy', value: `${result.accuracy}%` },
              { label: 'Correct', value: `${result.correctAnswers}/${result.totalQuestions}` },
              { label: 'Points', value: result.score, sub: `of ${result.maxScore}` },
            ].map((s) => (
              <div key={s.label} className="surface-card p-5 text-center">
                <div className="text-2xl font-black text-ink tracking-tight">{s.value}</div>
                {s.sub && <div className="text-[11px] text-ink-faint">{s.sub}</div>}
                <div className="label-eyebrow mt-1.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Topic breakdown */}
          {topics.length > 1 && (
            <div className="surface-card p-6 mb-6">
              <h2 className="text-sm font-bold text-ink mb-1">How you did by topic</h2>
              <p className="text-xs text-ink-faint mb-5">Weakest first.</p>
              <div className="space-y-3.5">
                {topics.map((t) => (
                  <div key={t.topic}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-ink-secondary truncate pr-3">{t.topic}</span>
                      <span className="text-ink-faint flex-shrink-0">
                        <span className="font-bold text-ink">{t.accuracy}%</span>
                        {' · '}{t.correct}/{t.total}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-black/[0.06] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${t.accuracy}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className={cn(
                          'h-full rounded-full',
                          t.accuracy >= 80 ? 'bg-success' : t.accuracy >= 50 ? 'bg-warning' : 'bg-danger',
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {weakest.length > 0 && (
                <p className="text-xs text-ink-secondary mt-5 pt-4 border-t border-line-soft leading-relaxed">
                  <span className="font-semibold text-ink">Revise next:</span>{' '}
                  {weakest.slice(0, 3).map((t) => t.topic).join(', ')}.
                </p>
              )}
            </div>
          )}

          {/* Adaptive coaching */}
          <div className="surface-card p-6 mb-6">
            {!narration ? (
              <div className="text-center py-2">
                <span className="h-11 w-11 rounded-2xl bg-gold-50 border border-gold-200 flex items-center justify-center mx-auto mb-3.5">
                  <Lightbulb className="h-5 w-5 text-gold-700" />
                </span>
                <h2 className="text-sm font-bold text-ink mb-1.5">Want feedback on this attempt?</h2>
                <p className="text-xs text-ink-muted mb-5 max-w-sm mx-auto leading-relaxed">
                  AIIQ can read through your answers and tell you what to do next.
                </p>
                <Button size="sm" onClick={() => narrate.mutate()} loading={narrate.isPending}>
                  <Sparkles className="h-4 w-4" /> Get personalised feedback
                </Button>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <p className="label-eyebrow mb-3">Your coach</p>
                <h2 className="text-lg font-black text-ink tracking-tight mb-4">
                  <RichText>{narration.headline}</RichText>
                </h2>

                {narration.weakTopics?.length > 0 && (
                  <div className="space-y-3 mb-5">
                    {narration.weakTopics.map((w) => (
                      <div key={w.topic} className="surface-sunken p-4">
                        <div className="flex items-center justify-between gap-3 mb-1.5">
                          <p className="text-sm font-bold text-ink">{w.topic}</p>
                          <span className="text-[11px] text-ink-faint flex-shrink-0">
                            {w.wrongCount} missed
                          </span>
                        </div>
                        <p className="text-xs text-ink-secondary leading-relaxed">
                          <RichText>{w.suggestion}</RichText>
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {narration.strongTopics?.length > 0 && (
                  <p className="text-xs text-ink-secondary mb-4">
                    <span className="font-semibold text-ink">Strong on:</span>{' '}
                    {narration.strongTopics.join(', ')}.
                  </p>
                )}

                {narration.recommendedFocusQuestions?.length > 0 && (
                  <div className="mb-5">
                    <p className="label-eyebrow mb-2.5">Try answering these</p>
                    <ul className="space-y-2">
                      {narration.recommendedFocusQuestions.map((q, i) => (
                        <li key={i} className="flex gap-2.5 text-xs text-ink-secondary leading-relaxed">
                          <span className="h-1.5 w-1.5 rounded-full bg-gold-deep mt-1.5 flex-shrink-0" />
                          <span><RichText>{q}</RichText></span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="text-xs text-ink-secondary leading-relaxed pt-4 border-t border-line-soft">
                  <RichText>{narration.nextStepMessage}</RichText>
                </p>
              </motion.div>
            )}
          </div>

          {/* Answer review */}
          <div className="surface-card overflow-hidden mb-8">
            <button
              onClick={() => setOpenReview((v) => !v)}
              aria-expanded={openReview}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-black/[0.02] transition-colors"
            >
              <span className="text-sm font-bold text-ink">Review all {result.totalQuestions} answers</span>
              <ChevronDown className={cn('h-4 w-4 text-ink-muted transition-transform', openReview && 'rotate-180')} />
            </button>

            {openReview && (
              <div className="divide-y divide-line-soft border-t border-line-soft">
                {result.answers.map((a, i) => (
                  <div key={a.questionId} className="px-6 py-5">
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          'h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                          a.isCorrect ? 'bg-success-tint' : 'bg-danger-tint',
                        )}
                      >
                        {a.isCorrect
                          ? <Check className="h-3.5 w-3.5 text-success" />
                          : <X className="h-3.5 w-3.5 text-danger" />}
                      </span>

                      <div className="flex-1 min-w-0">
                        {a.questionText && (
                          <p className="text-sm font-semibold text-ink mb-2.5 leading-snug">
                            <span className="text-ink-faint mr-1.5">{i + 1}.</span>
                            {a.questionText}
                          </p>
                        )}
                        <div className="space-y-1">
                          <p className="text-xs text-ink-muted">
                            Your answer:{' '}
                            <span className={cn('font-medium', a.isCorrect ? 'text-success' : 'text-danger')}>
                              {a.selectedAnswer || 'Not answered'}
                            </span>
                          </p>
                          {!a.isCorrect && (
                            <p className="text-xs text-ink-muted">
                              Correct answer:{' '}
                              <span className="font-medium text-success">{a.correctAnswer}</span>
                            </p>
                          )}
                          {a.explanation && (
                            <p className="text-xs text-ink-secondary mt-2 leading-relaxed surface-sunken p-3">
                              {a.explanation}
                            </p>
                          )}
                        </div>
                      </div>

                      <span className={cn('text-xs font-bold flex-shrink-0', a.isCorrect ? 'text-success' : 'text-ink-faint')}>
                        +{a.pointsEarned}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Next actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="secondary" className="flex-1" onClick={onRetry}>
              <RotateCcw className="h-4 w-4" /> Another quiz on this subject
            </Button>
            <Link href="/dashboard" className="flex-1">
              <Button variant="ghost" className="w-full">
                <LayoutDashboard className="h-4 w-4" /> Back to dashboard
              </Button>
            </Link>
          </div>

          {/* Export — the endpoint shipped with the app but had no entry point */}
          <div className="flex items-center justify-center gap-4 mt-7 pt-6 border-t border-line-soft">
            <span className="label-eyebrow">Export results</span>
            {(['csv', 'json'] as const).map((fmt) => (
              <a
                key={fmt}
                href={`/api/quiz/${sessionId}/export?format=${fmt}`}
                download
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-secondary hover:text-gold-700 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                {fmt.toUpperCase()}
              </a>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  )
}
