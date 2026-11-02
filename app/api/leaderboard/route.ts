import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiResponse, apiError } from '@/lib/utils'

/**
 * Global standings.
 *
 * Ranked on what users actually do — points earned and accuracy across
 * completed quizzes — rather than on stored battle counters. The previous
 * implementation ordered by totalWins/eloRating, fields nothing ever wrote,
 * so every row tied at 0 / 1200 and the board was meaningless.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') // 'week' | 'month' | null (all time)

    const since = (() => {
      if (period === 'week') {
        const d = new Date()
        d.setDate(d.getDate() - 7)
        return d
      }
      if (period === 'month') {
        const d = new Date()
        d.setMonth(d.getMonth() - 1)
        return d
      }
      return undefined
    })()

    const attemptWhere = {
      completedAt: since ? { gte: since } : { not: null as never },
    }

    // Points and quiz volume per user.
    const grouped = await prisma.quizAttempt.groupBy({
      by: ['userId'],
      where: attemptWhere,
      _sum: { score: true },
      _count: { _all: true },
      orderBy: { _sum: { score: 'desc' } },
      take: 50,
    })

    if (grouped.length === 0) return apiResponse([])

    const userIds = grouped.map((g) => g.userId)

    const [users, answersTotal, answersCorrect] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          name: true,
          image: true,
          profile: { select: { eloRating: true, weeklyStreak: true } },
          subscription: { select: { plan: true } },
        },
      }),
      prisma.quizAnswer.groupBy({
        by: ['attemptId'],
        where: { attempt: { userId: { in: userIds }, ...attemptWhere } },
        _count: { _all: true },
      }),
      prisma.quizAnswer.groupBy({
        by: ['attemptId'],
        where: { attempt: { userId: { in: userIds }, ...attemptWhere }, isCorrect: true },
        _count: { _all: true },
      }),
    ])

    // Map attempt-level answer counts back onto users.
    const attempts = await prisma.quizAttempt.findMany({
      where: { userId: { in: userIds }, ...attemptWhere },
      select: { id: true, userId: true },
    })
    const attemptOwner = new Map(attempts.map((a) => [a.id, a.userId]))

    const totals = new Map<string, number>()
    const corrects = new Map<string, number>()
    for (const row of answersTotal) {
      const uid = attemptOwner.get(row.attemptId)
      if (uid) totals.set(uid, (totals.get(uid) ?? 0) + row._count._all)
    }
    for (const row of answersCorrect) {
      const uid = attemptOwner.get(row.attemptId)
      if (uid) corrects.set(uid, (corrects.get(uid) ?? 0) + row._count._all)
    }

    const userMap = new Map(users.map((u) => [u.id, u]))

    const leaderboard = grouped.map((g, index) => {
      const user = userMap.get(g.userId)
      const answered = totals.get(g.userId) ?? 0
      const correct = corrects.get(g.userId) ?? 0
      return {
        rank: index + 1,
        userId: g.userId,
        name: user?.name ?? 'Anonymous',
        image: user?.image ?? null,
        points: g._sum.score ?? 0,
        quizzesCompleted: g._count._all,
        questionsAnswered: answered,
        correctAnswers: correct,
        accuracy: answered > 0 ? Math.round((correct / answered) * 100) : 0,
        streak: user?.profile?.weeklyStreak ?? 0,
        eloRating: user?.profile?.eloRating ?? 1200,
        plan: user?.subscription?.plan ?? 'FREE',
      }
    })

    return apiResponse(leaderboard)
  } catch (error) {
    console.error('[leaderboard GET]', error)
    return apiError('Failed to fetch leaderboard', 500)
  }
}
