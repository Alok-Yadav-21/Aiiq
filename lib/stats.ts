import { prisma } from '@/lib/prisma'

/**
 * Learning statistics for AIIQ.
 *
 * Everything here is DERIVED from QuizAttempt / QuizAnswer rather than stored
 * on UserProfile. Stored counters have to be incremented by every code path
 * that could change them, and the moment one forgets, the number silently
 * rots — which is exactly what happened to totalWins/eloRating/weeklyStreak
 * before this module existed. Deriving costs a query and can never drift.
 */

export interface LearningStats {
  quizzesCompleted: number
  questionsAnswered: number
  correctAnswers: number
  accuracy: number
  currentStreak: number
  studyDays: number
  totalPoints: number
  subjectsCreated: number
}

export interface TopicMastery {
  topic: string
  answered: number
  correct: number
  accuracy: number
}

export interface RecentAttempt {
  id: string
  subjectId: string
  subjectTitle: string
  score: number
  maxScore: number
  accuracy: number
  totalQuestions: number
  correctAnswers: number
  completedAt: Date | null
}

/** Local-date key (YYYY-MM-DD) so streaks line up with calendar days. */
function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Consecutive days of study ending today or yesterday. Yesterday still counts
 * so a streak isn't lost simply because the user hasn't studied yet today.
 */
export function calculateStreak(dates: Date[]): number {
  if (dates.length === 0) return 0

  const days = new Set(dates.map(dayKey))
  const cursor = new Date()

  // Allow the streak to start at yesterday if today has no activity yet.
  if (!days.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1)
    if (!days.has(dayKey(cursor))) return 0
  }

  let streak = 0
  while (days.has(dayKey(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export async function getLearningStats(userId: string): Promise<LearningStats> {
  const [attempts, answerAgg, correctCount, subjectsCreated] = await Promise.all([
    prisma.quizAttempt.findMany({
      where: { userId, completedAt: { not: null } },
      select: { completedAt: true, score: true },
    }),
    prisma.quizAnswer.aggregate({
      where: { attempt: { userId } },
      _count: { _all: true },
    }),
    prisma.quizAnswer.count({
      where: { attempt: { userId }, isCorrect: true },
    }),
    prisma.subject.count({ where: { creatorId: userId } }),
  ])

  const questionsAnswered = answerAgg._count._all
  const completedDates = attempts
    .map((a) => a.completedAt)
    .filter((d): d is Date => d !== null)

  return {
    quizzesCompleted: attempts.length,
    questionsAnswered,
    correctAnswers: correctCount,
    accuracy: questionsAnswered > 0 ? Math.round((correctCount / questionsAnswered) * 100) : 0,
    currentStreak: calculateStreak(completedDates),
    studyDays: new Set(completedDates.map(dayKey)).size,
    totalPoints: attempts.reduce((sum, a) => sum + a.score, 0),
    subjectsCreated,
  }
}

/**
 * Accuracy per topic tag, weakest first — this is what drives "revise this next"
 * recommendations. Topics with too few answers are excluded as noise.
 */
export async function getTopicMastery(
  userId: string,
  { minAnswers = 2, limit = 12 }: { minAnswers?: number; limit?: number } = {}
): Promise<TopicMastery[]> {
  const answers = await prisma.quizAnswer.findMany({
    where: { attempt: { userId }, question: { topicTag: { not: null } } },
    select: { isCorrect: true, question: { select: { topicTag: true } } },
  })

  const byTopic = new Map<string, { answered: number; correct: number }>()
  for (const a of answers) {
    const topic = a.question.topicTag
    if (!topic) continue
    const row = byTopic.get(topic) ?? { answered: 0, correct: 0 }
    row.answered++
    if (a.isCorrect) row.correct++
    byTopic.set(topic, row)
  }

  return [...byTopic.entries()]
    .filter(([, v]) => v.answered >= minAnswers)
    .map(([topic, v]) => ({
      topic,
      answered: v.answered,
      correct: v.correct,
      accuracy: Math.round((v.correct / v.answered) * 100),
    }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, limit)
}

export async function getRecentAttempts(userId: string, limit = 5): Promise<RecentAttempt[]> {
  const attempts = await prisma.quizAttempt.findMany({
    where: { userId, completedAt: { not: null } },
    orderBy: { completedAt: 'desc' },
    take: limit,
    select: {
      id: true,
      score: true,
      maxScore: true,
      completedAt: true,
      session: { select: { subjectId: true, subject: { select: { title: true } } } },
      answers: { select: { isCorrect: true } },
    },
  })

  return attempts.map((a) => {
    const total = a.answers.length
    const correct = a.answers.filter((x) => x.isCorrect).length
    return {
      id: a.id,
      subjectId: a.session.subjectId,
      subjectTitle: a.session.subject.title,
      score: a.score,
      maxScore: a.maxScore,
      totalQuestions: total,
      correctAnswers: correct,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      completedAt: a.completedAt,
    }
  })
}

/** Questions answered per day for the last `days` days, oldest first. */
export async function getDailyActivity(userId: string, days = 14): Promise<{ date: string; count: number }[]> {
  const since = new Date()
  since.setDate(since.getDate() - (days - 1))
  since.setHours(0, 0, 0, 0)

  const answers = await prisma.quizAnswer.findMany({
    where: { attempt: { userId, completedAt: { gte: since } } },
    select: { attempt: { select: { completedAt: true } } },
  })

  const counts = new Map<string, number>()
  for (const a of answers) {
    const d = a.attempt.completedAt
    if (!d) continue
    const k = dayKey(d)
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }

  const out: { date: string; count: number }[] = []
  const cursor = new Date(since)
  for (let i = 0; i < days; i++) {
    const k = dayKey(cursor)
    out.push({ date: k, count: counts.get(k) ?? 0 })
    cursor.setDate(cursor.getDate() + 1)
  }
  return out
}
