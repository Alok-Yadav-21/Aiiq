'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { FileUploader } from '@/components/ui/file-uploader'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import {
  BookOpen, Upload, Brain, ChevronLeft,
  FileText, Image as ImageIcon, Type,
  Sparkles, Check, X, Loader2, Clock, AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type QuizQuestion = {
  id: string
  questionText: string
  questionType: string
  options: string[] | null
  difficulty: string
  topicTag: string | null
  timeLimitSeconds: number
}

const LETTER_LABELS = ['A', 'B', 'C', 'D']

export default function SubjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Material state
  const [showUpload, setShowUpload] = useState(false)
  const [showGenerateQuiz, setShowGenerateQuiz] = useState(false)
  const [uploadText, setUploadText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [quizConfig, setQuizConfig] = useState({ questionCount: 10, difficulty: 'MEDIUM', types: ['MCQ', 'TRUE_FALSE'] })

  // Quiz state
  const [generatedSession, setGeneratedSession] = useState<{ sessionId: string; questions: QuizQuestion[] } | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [quizActive, setQuizActive] = useState(false)
  const [quizResult, setQuizResult] = useState<any>(null)

  // Timer
  const [timeLeft, setTimeLeft] = useState(30)
  const questionStartRef = useRef(Date.now())
  const timeSpentMapRef = useRef<Record<string, number>>({})
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { data: subjectData, isLoading } = useQuery({
    queryKey: ['subject', params.id],
    queryFn: async () => {
      const res = await fetch(`/api/subjects/${params.id}`)
      if (!res.ok) throw new Error('Not found')
      return res.json().then((d: any) => d.data)
    },
  })

  const question = generatedSession?.questions[currentQuestion]

  // Per-question countdown timer
  useEffect(() => {
    if (!quizActive || !question) return

    setTimeLeft(question.timeLimitSeconds)
    questionStartRef.current = Date.now()

    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      // Record actual time spent before unmounting
      timeSpentMapRef.current[question.id] = Math.min(
        Date.now() - questionStartRef.current,
        question.timeLimitSeconds * 1000,
      )
    }
  }, [question?.id, quizActive])

  // Keyboard shortcuts: 1-4 to pick MCQ option
  useEffect(() => {
    if (!quizActive || !question?.options) return
    const handler = (e: KeyboardEvent) => {
      const num = parseInt(e.key)
      if (num >= 1 && num <= (question.options?.length ?? 0)) {
        setSelectedAnswers((prev) => ({ ...prev, [question.id]: question.options![num - 1] }))
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [question?.id, question?.options, quizActive])

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
      setGeneratedSession(data)
      setShowGenerateQuiz(false)
      setQuizActive(true)
      setCurrentQuestion(0)
      setSelectedAnswers({})
      timeSpentMapRef.current = {}
      toast.success('Quiz generated!', `${data.totalQuestions} questions ready.`)
    },
    onError: (err: Error) => {
      toast.error('Generation failed', err.message)
    },
  })

  const submitQuiz = async () => {
    if (!generatedSession) return
    // Capture time for the current question
    if (question) {
      timeSpentMapRef.current[question.id] = Math.min(
        Date.now() - questionStartRef.current,
        question.timeLimitSeconds * 1000,
      )
    }
    try {
      const answers = generatedSession.questions.map((q) => ({
        questionId: q.id,
        selectedAnswer: selectedAnswers[q.id] || '',
        timeSpentMs: timeSpentMapRef.current[q.id] ?? q.timeLimitSeconds * 1000,
      }))
      const res = await fetch(`/api/quiz/${generatedSession.sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      // Stash questions so results view can show question text
      setQuizResult({ ...json.data, _questions: generatedSession.questions })
      setQuizActive(false)
    } catch (err: unknown) {
      toast.error('Failed to submit', err instanceof Error ? err.message : 'Try again')
    }
  }

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
          fileName: 'text-material.txt',
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('Material uploaded!', 'You can now generate quizzes from it.')
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-allq-purple" />
      </div>
    )
  }

  const subject = subjectData

  if (!subject) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-400">Subject not found.</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.push('/subjects')}>
          <ChevronLeft className="h-4 w-4" /> Back to Subjects
        </Button>
      </div>
    )
  }

  const isOwner = subject.creator?.id === user?.id
  const totalQuestions = generatedSession?.questions.length ?? 0
  const answeredCount = Object.keys(selectedAnswers).length
  const timerPercent = question ? (timeLeft / question.timeLimitSeconds) * 100 : 100
  const isTimerLow = timerPercent < 33

  /* ─── Quiz Active View ─── */
  if (quizActive && generatedSession && question) {
    const progress = ((currentQuestion + 1) / totalQuestions) * 100
    const isAnswered = !!selectedAnswers[question.id]

    return (
      <div className="min-h-screen p-4 md:p-6 flex flex-col max-w-3xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-400">
              Q {currentQuestion + 1}
              <span className="text-slate-600"> / {totalQuestions}</span>
            </span>
            {/* Progress dots */}
            <div className="flex gap-1">
              {generatedSession.questions.map((q, i) => (
                <div
                  key={q.id}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    i === currentQuestion
                      ? 'w-4 bg-allq-purple'
                      : selectedAnswers[q.id]
                      ? 'w-1.5 bg-allq-green/60'
                      : 'w-1.5 bg-white/10',
                  )}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Timer */}
            <div className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-bold text-sm border transition-all',
              isTimerLow
                ? 'text-allq-red border-allq-red/30 bg-allq-red/10 animate-pulse'
                : timeLeft <= question.timeLimitSeconds / 2
                ? 'text-allq-amber border-allq-amber/20 bg-allq-amber/5'
                : 'text-slate-300 border-white/10 bg-white/5',
            )}>
              <Clock className="h-3.5 w-3.5" />
              {timeLeft}s
            </div>
            <button
              onClick={() => { setQuizActive(false); setGeneratedSession(null) }}
              className="text-xs text-slate-500 hover:text-white transition-colors px-2 py-1.5"
            >
              Exit
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-6">
          <motion.div
            className="h-full bg-gradient-to-r from-allq-purple to-allq-cyan rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
            className="flex-1"
          >
            {/* Question card */}
            <div className="glass rounded-2xl p-5 md:p-6 mb-5">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <Badge variant="purple" size="sm">{question.difficulty}</Badge>
                {question.topicTag && <Badge variant="default" size="sm">{question.topicTag}</Badge>}
                <Badge variant="cyan" size="sm">{question.questionType.replace(/_/g, ' ')}</Badge>
              </div>
              <p className="text-lg md:text-xl font-semibold text-white leading-relaxed">
                {question.questionText}
              </p>
            </div>

            {/* MCQ / TRUE_FALSE options */}
            {question.options && (
              <div className="space-y-2.5">
                {question.options.map((option, idx) => {
                  const selected = selectedAnswers[question.id] === option
                  return (
                    <button
                      key={option}
                      onClick={() => setSelectedAnswers((prev) => ({ ...prev, [question.id]: option }))}
                      className={cn(
                        'w-full text-left glass rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-150 border group',
                        selected
                          ? 'border-allq-purple/60 bg-allq-purple/10 text-white shadow-neon-sm'
                          : 'border-white/5 text-slate-300 hover:border-allq-purple/30 hover:text-white hover:bg-white/5',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'h-7 w-7 rounded-lg border-2 flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all',
                          selected
                            ? 'border-allq-purple bg-allq-purple text-white'
                            : 'border-white/20 text-slate-500 group-hover:border-white/40',
                        )}>
                          {selected ? <Check className="h-3.5 w-3.5" /> : LETTER_LABELS[idx]}
                        </div>
                        <span>{option}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Fill in blank / Short answer */}
            {!question.options && (
              <input
                value={selectedAnswers[question.id] || ''}
                onChange={(e) => setSelectedAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))}
                placeholder="Type your answer here..."
                className="input-glass w-full rounded-xl px-4 py-4 text-base"
                autoFocus
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
          <Button
            variant="ghost"
            disabled={currentQuestion === 0}
            onClick={() => setCurrentQuestion((n) => n - 1)}
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>

          <div className="flex items-center gap-2">
            {!isAnswered && question.options && (
              <span className="text-xs text-slate-600 hidden sm:block">Press 1–{question.options.length} to select</span>
            )}

            {currentQuestion < totalQuestions - 1 ? (
              <Button
                onClick={() => setCurrentQuestion((n) => n + 1)}
                variant={isAnswered ? 'primary' : 'secondary'}
              >
                {isAnswered ? 'Next →' : 'Skip →'}
              </Button>
            ) : (
              <Button
                variant="cyan"
                onClick={submitQuiz}
                disabled={answeredCount === 0}
              >
                Submit Quiz ({answeredCount}/{totalQuestions})
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  /* ─── Quiz Result View ─── */
  if (quizResult) {
    const questionMap = new Map<string, QuizQuestion>(
      (quizResult._questions as QuizQuestion[] || []).map((q) => [q.id, q]),
    )

    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">
              {quizResult.accuracy >= 80 ? '🏆' : quizResult.accuracy >= 60 ? '✨' : '📚'}
            </div>
            <h2 className="text-2xl font-black text-white mb-1">
              {quizResult.accuracy >= 80 ? 'Excellent!' : quizResult.accuracy >= 60 ? 'Good Job!' : 'Keep Learning!'}
            </h2>
            <p className="text-slate-400 text-sm">Quiz completed</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Score', value: quizResult.score, sub: `/ ${quizResult.maxScore}` },
              { label: 'Correct', value: `${quizResult.correctAnswers}/${quizResult.totalQuestions}` },
              { label: 'Accuracy', value: `${quizResult.accuracy}%` },
            ].map((s) => (
              <div key={s.label} className="glass rounded-2xl p-4 text-center">
                <div className="text-xl font-black gradient-text">{s.value}</div>
                {s.sub && <div className="text-xs text-slate-500">{s.sub}</div>}
                <div className="text-xs text-slate-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="space-y-3 mb-6 max-h-[52vh] overflow-y-auto pr-1">
            {quizResult.answers?.map((ans: any, i: number) => {
              const q = questionMap.get(ans.questionId)
              return (
                <div
                  key={i}
                  className={cn(
                    'glass rounded-xl p-4 border',
                    ans.isCorrect ? 'border-allq-green/20' : 'border-allq-red/20',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                      ans.isCorrect ? 'bg-allq-green/15' : 'bg-allq-red/15',
                    )}>
                      {ans.isCorrect
                        ? <Check className="h-3.5 w-3.5 text-allq-green" />
                        : <X className="h-3.5 w-3.5 text-allq-red" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      {q && (
                        <p className="text-sm font-semibold text-white mb-2 leading-snug">{q.questionText}</p>
                      )}
                      <div className="space-y-0.5">
                        <p className="text-xs text-slate-400">
                          Your answer:{' '}
                          <span className={cn('font-medium', ans.isCorrect ? 'text-allq-green' : 'text-allq-red')}>
                            {ans.selectedAnswer || 'Not answered'}
                          </span>
                        </p>
                        {!ans.isCorrect && (
                          <p className="text-xs text-slate-400">
                            Correct: <span className="text-allq-green font-medium">{ans.correctAnswer}</span>
                          </p>
                        )}
                        {ans.explanation && (
                          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{ans.explanation}</p>
                        )}
                      </div>
                    </div>
                    <span className={cn('text-xs font-bold flex-shrink-0', ans.isCorrect ? 'text-allq-green' : 'text-slate-600')}>
                      +{ans.pointsEarned}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => { setQuizResult(null); setGeneratedSession(null) }}>
              Back to Subject
            </Button>
            <Button className="flex-1" onClick={() => { setQuizResult(null); setShowGenerateQuiz(true) }}>
              <Brain className="h-4 w-4" /> New Quiz
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  /* ─── Subject Detail View ─── */
  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-6">
        <ChevronLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="purple">{subject.difficulty}</Badge>
            <Badge variant="default">{subject.category}</Badge>
          </div>
          <h1 className="text-3xl font-black text-white mb-1">{subject.title}</h1>
          <p className="text-slate-400 max-w-2xl">{subject.description}</p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {subject.tags?.map((tag: string) => (
              <span key={tag} className="text-xs bg-white/5 text-slate-400 px-2.5 py-1 rounded-full border border-white/5">{tag}</span>
            ))}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => setShowUpload(true)} variant="secondary">
            <Upload className="h-4 w-4" /> Upload Material
          </Button>
          <Button onClick={() => setShowGenerateQuiz(true)}>
            <Brain className="h-4 w-4" /> Generate Quiz
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-allq-cyan" /> Materials ({subject.materials?.length || 0})
          </h2>

          {subject.materials?.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center">
              <Upload className="h-10 w-10 text-slate-600 mx-auto mb-3" />
              <p className="text-white font-semibold mb-1">No materials yet</p>
              <p className="text-slate-400 text-sm mb-4">Upload your notes, PDFs, or text to generate AI quizzes</p>
              <Button onClick={() => setShowUpload(true)} size="sm">
                <Upload className="h-4 w-4" /> Upload Material
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {subject.materials?.map((mat: any) => (
                <div key={mat.id} className="glass-hover rounded-xl px-4 py-3 flex items-center gap-3">
                  {mat.type === 'PDF' ? <FileText className="h-5 w-5 text-allq-red" /> :
                   mat.type === 'IMAGE' ? <ImageIcon className="h-5 w-5 text-allq-cyan" /> :
                   <Type className="h-5 w-5 text-allq-purple" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{mat.fileName}</p>
                    <p className="text-xs text-slate-500">{mat.type} · {(mat.fileSize / 1024).toFixed(1)} KB</p>
                  </div>
                  <Badge variant={mat.status === 'READY' ? 'green' : mat.status === 'FAILED' ? 'red' : 'amber'} size="sm">
                    {mat.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Subject Stats</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'Materials', value: subject._count?.materials || 0 },
                { label: 'Questions', value: subject._count?.questionBank || 0 },
                { label: 'Enrolled', value: subject._count?.enrollments || 0 },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">{s.label}</span>
                  <span className="font-bold text-white">{s.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Creator</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-allq-purple to-allq-cyan flex items-center justify-center text-white font-bold">
                  {(subject.creator?.name || '?')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{subject.creator?.name || 'Unknown'}</p>
                  <p className="text-xs text-slate-400">Subject Creator</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upload Modal */}
      <Modal open={showUpload} onOpenChange={setShowUpload} size="lg" title="Upload Study Material" description="Upload PDFs, Word docs, PowerPoint, text files or images. AI generates quizzes, flashcards & notes from these — and only these.">
        <div className="space-y-5">
          <FileUploader
            subjectId={String(params.id)}
            onUploaded={() => queryClient.invalidateQueries({ queryKey: ['subject', params.id] })}
          />

          {/* Or paste text */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">…or paste text directly</label>
            <textarea
              value={uploadText}
              onChange={(e) => setUploadText(e.target.value)}
              placeholder="Paste study notes, textbook content, lecture notes…"
              className="input-glass w-full rounded-xl px-4 py-3 text-sm resize-none h-28"
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

      {/* Generate Quiz Modal */}
      <Modal open={showGenerateQuiz} onOpenChange={setShowGenerateQuiz} title="Generate AI Quiz" description="Configure your quiz. Questions are generated from your uploaded materials.">
        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-2">
              Questions: <span className="text-allq-purple font-bold">{quizConfig.questionCount}</span>
            </label>
            <input
              type="range" min="5" max="50" step="5"
              value={quizConfig.questionCount}
              onChange={(e) => setQuizConfig((c) => ({ ...c, questionCount: Number(e.target.value) }))}
              className="w-full accent-allq-purple"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>5</span><span>50</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300 block mb-2">Difficulty</label>
            <div className="grid grid-cols-4 gap-2">
              {['EASY', 'MEDIUM', 'HARD', 'EXPERT'].map((d) => (
                <button
                  key={d}
                  onClick={() => setQuizConfig((c) => ({ ...c, difficulty: d }))}
                  className={cn(
                    'py-2 rounded-lg text-xs font-semibold transition-all border',
                    quizConfig.difficulty === d
                      ? 'bg-allq-purple/15 text-allq-purple border-allq-purple/40'
                      : 'text-slate-400 border-white/5 hover:border-white/15',
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300 block mb-2">Question Types</label>
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
                      'py-2 rounded-lg text-xs font-medium transition-all border',
                      active
                        ? 'bg-allq-cyan/15 text-allq-cyan border-allq-cyan/30'
                        : 'text-slate-400 border-white/5 hover:border-white/15',
                    )}
                  >
                    {type.replace(/_/g, ' ')}
                  </button>
                )
              })}
            </div>
          </div>

          {subject.materials?.length === 0 && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-allq-amber/10 border border-allq-amber/20">
              <AlertTriangle className="h-4 w-4 text-allq-amber flex-shrink-0 mt-0.5" />
              <p className="text-xs text-allq-amber">
                No materials uploaded yet. Upload study files first — questions are generated only from your uploaded content.
              </p>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowGenerateQuiz(false)}>Cancel</Button>
            <Button
              loading={generateQuiz.isPending}
              onClick={() => generateQuiz.mutate()}
              disabled={quizConfig.types.length === 0 || subject.materials?.length === 0}
            >
              <Sparkles className="h-4 w-4" /> Generate Quiz
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
