'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Users, Trophy, Clock, CheckCircle, Loader2, Zap,
  ChevronLeft, Crown, Target, Flame
} from 'lucide-react'
import { cn, formatDuration, calculateScore, getDifficultyMultiplier } from '@/lib/utils'
import { io, Socket } from 'socket.io-client'

type RoomPhase = 'lobby' | 'countdown' | 'question' | 'reveal' | 'results'

interface Player {
  userId: string
  name: string | null
  image: string | null
  score: number
  isReady: boolean
  eloRating?: number
  answered?: boolean
}

interface Question {
  id: string
  questionText: string
  questionType: string
  options: string[] | null
  difficulty: string
  topicTag: string | null
  timeLimitSeconds: number
}

interface RoomResult {
  userId: string
  rank: number
  score: number
  correctAnswers: number
  name: string | null
}

export default function QuizRoomPage() {
  const params = useParams()
  const router = useRouter()
  const { user, token } = useAuth()
  const { toast } = useToast()

  const socketRef = useRef<Socket | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const [phase, setPhase] = useState<RoomPhase>('lobby')
  const [players, setPlayers] = useState<Player[]>([])
  const [countdown, setCountdown] = useState(30)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [answerSubmitted, setAnswerSubmitted] = useState(false)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [results, setResults] = useState<RoomResult[]>([])
  const [answerStartTime, setAnswerStartTime] = useState<number>(0)

  const { data: room, isLoading } = useQuery({
    queryKey: ['room', params.id],
    queryFn: async () => {
      const res = await fetch(`/api/rooms/${params.id}`)
      if (!res.ok) throw new Error('Room not found')
      const json = await res.json()
      return json.data
    },
  })

  useEffect(() => {
    if (!user || !token) return

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001'
    const socket = io(wsUrl, {
      auth: { token },
      reconnection: true,
      transports: ['websocket', 'polling'],
    })
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('room:join', { roomId: params.id, token })
    })

    socket.on('room:joined', ({ room: roomData, players: roomPlayers }) => {
      setPlayers(roomPlayers.map((p: any) => ({
        userId: p.userId,
        name: p.user?.name,
        image: p.user?.image,
        score: p.score,
        isReady: p.isReady,
        eloRating: p.user?.profile?.eloRating,
      })))
    })

    socket.on('room:player_joined', ({ player }) => {
      setPlayers((prev) => {
        if (prev.find((p) => p.userId === player.userId)) return prev
        return [...prev, {
          userId: player.userId,
          name: player.user?.name,
          image: player.user?.image,
          score: 0,
          isReady: false,
          eloRating: player.user?.profile?.eloRating,
        }]
      })
      toast.info(`${player.user?.name || 'A player'} joined the room`)
    })

    socket.on('room:player_left', ({ userId }) => {
      setPlayers((prev) => prev.filter((p) => p.userId !== userId))
    })

    socket.on('room:starting', ({ countdown: cd }) => {
      setPhase('countdown')
      setCountdown(cd)
    })

    socket.on('quiz:question', ({ question, questionIndex: qi, totalQuestions: total }) => {
      setCurrentQuestion(question)
      setQuestionIndex(qi)
      setTotalQuestions(total)
      setTimeLeft(question.timeLimitSeconds)
      setSelectedAnswer(null)
      setAnswerSubmitted(false)
      setAnswerStartTime(Date.now())
      setPlayers((prev) => prev.map((p) => ({ ...p, answered: false })))
      setPhase('question')
    })

    socket.on('quiz:player_answered', ({ userId }) => {
      setPlayers((prev) => prev.map((p) => p.userId === userId ? { ...p, answered: true } : p))
    })

    socket.on('quiz:scores', ({ scores: s }) => {
      setScores(s)
      setPlayers((prev) => prev.map((p) => ({ ...p, score: s[p.userId] || p.score })))
      setPhase('reveal')
    })

    socket.on('quiz:completed', ({ results: r }) => {
      setResults(r)
      setPhase('results')
      if (timerRef.current) clearInterval(timerRef.current)
    })

    socket.on('room:error', ({ message }) => {
      toast.error('Room Error', message)
    })

    return () => {
      socket.emit('room:leave', { roomId: params.id })
      socket.disconnect()
    }
  }, [user, token, params.id])

  // Question timer
  useEffect(() => {
    if (phase !== 'question') return

    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          if (!answerSubmitted) {
            submitAnswer(null)
          }
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, currentQuestion?.id])

  const submitAnswer = useCallback((answer: string | null) => {
    if (answerSubmitted || !currentQuestion || !socketRef.current) return
    const timeSpentMs = Date.now() - answerStartTime
    setAnswerSubmitted(true)
    setSelectedAnswer(answer)
    socketRef.current.emit('quiz:answer', {
      roomId: params.id,
      questionId: currentQuestion.id,
      answer: answer || '',
      timeSpentMs,
    })
  }, [answerSubmitted, currentQuestion, answerStartTime, params.id])

  const setReady = () => {
    socketRef.current?.emit('room:ready', { roomId: params.id })
  }

  const myScore = scores[user?.id || ''] || 0
  const myResult = results.find((r) => r.userId === user?.id)
  const timerPct = currentQuestion ? (timeLeft / currentQuestion.timeLimitSeconds) * 100 : 100
  const isDanger = timerPct < 25

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-allq-purple" />
      </div>
    )
  }

  /* ─── RESULTS PHASE ─── */
  if (phase === 'results' && results.length > 0) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">
              {myResult?.rank === 1 ? '🏆' : myResult?.rank === 2 ? '🥈' : myResult?.rank === 3 ? '🥉' : '🎯'}
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-1">
              {myResult?.rank === 1 ? 'You Won!' : `Rank #${myResult?.rank || '?'}`}
            </h2>
          </div>

          <div className="space-y-3 mb-8">
            {results.map((result, i) => (
              <motion.div
                key={result.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  'surface-card rounded-xl p-4 flex items-center gap-4',
                  result.userId === user?.id && 'border border-allq-purple/30 bg-allq-purple/5'
                )}
              >
                <span className={cn(
                  'text-2xl font-black w-8 text-center',
                  i === 0 ? 'text-allq-amber' : i === 1 ? 'text-slate-700' : i === 2 ? 'text-amber-700' : 'text-slate-500'
                )}>
                  {i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`}
                </span>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-allq-purple to-allq-cyan flex items-center justify-center text-white font-bold flex-shrink-0">
                  {(result.name || 'U')[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900">
                    {result.name || 'Anonymous'}
                    {result.userId === user?.id && ' (You)'}
                  </p>
                  <p className="text-xs text-slate-500">{result.correctAnswers}/{totalQuestions} correct</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">{result.score} pts</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => router.push('/compete')}>
              <ChevronLeft className="h-4 w-4" /> Back to Lobby
            </Button>
            <Button className="flex-1" onClick={() => router.push('/dashboard')}>
              <Trophy className="h-4 w-4" /> Dashboard
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  /* ─── QUESTION PHASE ─── */
  if ((phase === 'question' || phase === 'reveal') && currentQuestion) {
    return (
      <div className="min-h-screen p-4 lg:p-6 max-w-4xl mx-auto flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Badge variant="purple" size="sm">
              Q{questionIndex + 1}/{totalQuestions}
            </Badge>
            <Badge variant={isDanger ? 'red' : 'cyan'} size="sm" className={isDanger ? 'animate-pulse' : ''}>
              <Clock className="h-3 w-3" /> {timeLeft}s
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-allq-purple">{myScore} pts</span>
          </div>
        </div>

        {/* Timer bar */}
        <div className="h-2 bg-slate-100 rounded-full mb-6 overflow-hidden">
          <motion.div
            className={cn('h-full rounded-full', isDanger ? 'bg-allq-red' : 'bg-gradient-to-r from-allq-purple to-allq-cyan')}
            style={{ width: `${timerPct}%` }}
            transition={{ duration: 1, ease: 'linear' }}
          />
        </div>

        {/* Question */}
        <div className="surface-card rounded-2xl p-6 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="purple" size="sm">{currentQuestion.difficulty}</Badge>
            {currentQuestion.topicTag && <Badge variant="default" size="sm">{currentQuestion.topicTag}</Badge>}
          </div>
          <p className="text-xl lg:text-2xl font-bold text-slate-900 leading-relaxed">
            {currentQuestion.questionText}
          </p>
        </div>

        {/* Options */}
        <div className={cn(
          'grid gap-3 flex-1',
          currentQuestion.options && currentQuestion.options.length > 2 ? 'sm:grid-cols-2' : 'grid-cols-1'
        )}>
          {currentQuestion.options?.map((option, i) => {
            const isSelected = selectedAnswer === option
            const letters = ['A', 'B', 'C', 'D']
            return (
              <motion.button
                key={option}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => !answerSubmitted && submitAnswer(option)}
                disabled={answerSubmitted}
                className={cn(
                  'w-full text-left bg-white rounded-xl px-5 py-4 border transition-all duration-200',
                  isSelected
                    ? 'border-allq-purple/60 bg-allq-purple/15 shadow-sm'
                    : 'border-slate-200 hover:border-allq-purple/30 hover:bg-allq-purple/5',
                  answerSubmitted && !isSelected && 'opacity-50',
                  'disabled:cursor-not-allowed'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'h-8 w-8 rounded-lg font-bold text-sm flex items-center justify-center flex-shrink-0',
                    isSelected ? 'bg-allq-purple text-white' : 'bg-slate-100 text-slate-500'
                  )}>
                    {letters[i]}
                  </div>
                  <span className={cn('font-medium', isSelected ? 'text-slate-900' : 'text-slate-700')}>
                    {option}
                  </span>
                  {isSelected && (
                    <CheckCircle className="h-4.5 w-4.5 text-allq-purple ml-auto" />
                  )}
                </div>
              </motion.button>
            )
          })}

          {/* Short answer */}
          {!currentQuestion.options && (
            <div className="relative">
              <input
                value={selectedAnswer || ''}
                onChange={(e) => setSelectedAnswer(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && selectedAnswer) submitAnswer(selectedAnswer) }}
                placeholder="Type your answer and press Enter..."
                disabled={answerSubmitted}
                className="input-light w-full rounded-xl px-5 py-4 text-base"
              />
              {!answerSubmitted && selectedAnswer && (
                <Button
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  size="sm"
                  onClick={() => submitAnswer(selectedAnswer)}
                >
                  Submit
                </Button>
              )}
            </div>
          )}
        </div>

        {answerSubmitted && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-sm text-emerald-600 mt-4"
          >
            <CheckCircle className="h-4 w-4 inline mr-1" />
            Answer submitted! Waiting for others...
          </motion.p>
        )}

        {/* Live player scores sidebar */}
        <div className="mt-5 flex items-center gap-3 overflow-x-auto pb-1">
          {players.sort((a, b) => b.score - a.score).map((p) => (
            <div key={p.userId} className={cn(
              'flex-shrink-0 text-center surface-card rounded-xl p-2.5 min-w-[72px] border',
              p.userId === user?.id ? 'border-allq-purple/30' : 'border-slate-200'
            )}>
              <div className={cn(
                'h-7 w-7 rounded-lg mx-auto mb-1 flex items-center justify-center text-white text-xs font-bold',
                p.answered ? 'bg-allq-green' : 'bg-gradient-to-br from-allq-purple/50 to-allq-cyan/50'
              )}>
                {p.answered ? '✓' : (p.name || 'U')[0].toUpperCase()}
              </div>
              <p className="text-[10px] text-slate-500 truncate max-w-[64px]">{p.name?.split(' ')[0] || 'User'}</p>
              <p className="text-xs font-bold text-slate-900">{p.score}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  /* ─── COUNTDOWN PHASE ─── */
  if (phase === 'countdown') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div className="text-center">
          <motion.div
            key={countdown}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-8xl font-black gradient-text mb-4"
          >
            {countdown}
          </motion.div>
          <p className="text-xl text-slate-500">Battle starting...</p>
        </motion.div>
      </div>
    )
  }

  /* ─── LOBBY PHASE ─── */
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors">
        <ChevronLeft className="h-4 w-4" /> Back to Lobby
      </button>

      {room && (
        <>
          <div className="surface-card rounded-2xl p-6 mb-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="green" size="sm">Waiting for players</Badge>
                  <Badge variant="default" size="sm">{room.subject?.title}</Badge>
                </div>
                <h1 className="text-2xl font-black text-slate-900">{room.title}</h1>
                <p className="text-slate-500 mt-1">
                  {room._count?.players}/{room.maxPlayers} players · {room.questionCount} questions · {formatDuration(room.timeLimitSeconds)}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-ink">{room.questionCount}</div>
                <div className="text-xs text-ink-muted">Questions</div>
              </div>
            </div>
          </div>

          {/* Players */}
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-allq-cyan" />
            Players ({players.length}/{room.maxPlayers})
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
            {players.map((player) => (
              <div key={player.userId} className={cn(
                'surface-card rounded-xl p-4 flex items-center gap-3 border',
                player.userId === user?.id ? 'border-allq-purple/30' : 'border-slate-200'
              )}>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-allq-purple to-allq-cyan flex items-center justify-center text-white font-bold flex-shrink-0">
                  {(player.name || 'U')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {player.name || 'Anonymous'}
                    {player.userId === user?.id && <span className="text-allq-purple"> (You)</span>}
                  </p>
                  <p className="text-xs text-slate-500">ELO: {player.eloRating || 1200}</p>
                </div>
                {player.isReady && (
                  <CheckCircle className="h-4.5 w-4.5 text-emerald-600 flex-shrink-0" />
                )}
              </div>
            ))}

            {/* Empty slots */}
            {[...Array(Math.max(0, room.maxPlayers - players.length))].slice(0, 6 - players.length).map((_, i) => (
              <div key={`empty-${i}`} className="rounded-xl p-4 flex items-center gap-3 border border-dashed border-slate-300 bg-slate-50">
                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Users className="h-4.5 w-4.5 text-slate-400" />
                </div>
                <p className="text-sm text-slate-400">Waiting...</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => router.push('/compete')}>
              Leave Room
            </Button>
            <Button className="flex-1" onClick={setReady}>
              <Zap className="h-4 w-4" /> Ready to Battle!
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
