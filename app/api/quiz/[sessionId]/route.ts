import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { apiResponse, apiError, calculateScore, getDifficultyMultiplier } from '@/lib/utils'
import { calculateStreak } from '@/lib/stats'

/**
 * Load a quiz session so it can be started, resumed after a refresh, or — once
 * completed — reviewed. Correct answers are withheld until the quiz is
 * submitted, so this is safe to call while the quiz is in progress.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params
    const payload = await getSessionFromRequest(req)
    if (!payload) return apiError('Unauthorized', 401)

    const session = await prisma.quizSession.findFirst({
      where: { id: sessionId, userId: payload.sub },
      include: { subject: { select: { id: true, title: true } } },
    })
    if (!session) return apiError('Quiz session not found', 404)

    const questions = await prisma.questionBank.findMany({
      where: { id: { in: session.questionIds } },
      select: {
        id: true,
        questionText: true,
        questionType: true,
        options: true,
        difficulty: true,
        topicTag: true,
        timeLimitSeconds: true,
      },
    })

    // findMany does not preserve the `in` order — restore presentation order.
    const byId = new Map(questions.map((q) => [q.id, q]))
    const ordered = session.questionIds.map((id) => byId.get(id)).filter(Boolean)

    const isComplete = session.completedAt !== null

    // Completed sessions return the full review payload instead.
    if (isComplete) {
      const attempt = await prisma.quizAttempt.findFirst({
        where: { sessionId, userId: payload.sub },
        orderBy: { createdAt: 'desc' },
        include: {
          answers: {
            include: {
              question: {
                select: {
                  id: true, questionText: true, questionType: true, options: true,
                  correctAnswer: true, explanation: true, topicTag: true, difficulty: true,
                },
              },
            },
          },
        },
      })

      if (attempt) {
        const correct = attempt.answers.filter((a) => a.isCorrect).length
        const total = attempt.answers.length
        return apiResponse({
          sessionId,
          subject: session.subject,
          status: 'COMPLETED',
          totalQuestions: total,
          result: {
            attemptId: attempt.id,
            score: attempt.score,
            maxScore: attempt.maxScore,
            correctAnswers: correct,
            totalQuestions: total,
            accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
            answers: attempt.answers.map((a) => ({
              questionId: a.questionId,
              questionText: a.question.questionText,
              options: a.question.options,
              topicTag: a.question.topicTag,
              difficulty: a.question.difficulty,
              selectedAnswer: a.selectedAnswer,
              correctAnswer: a.question.correctAnswer,
              explanation: a.question.explanation,
              isCorrect: a.isCorrect,
              pointsEarned: a.pointsEarned,
            })),
          },
        })
      }
    }

    return apiResponse({
      sessionId,
      subject: session.subject,
      status: 'IN_PROGRESS',
      totalQuestions: ordered.length,
      estimatedDuration: session.durationSeconds,
      questions: ordered,
    })
  } catch (error) {
    console.error('[quiz GET]', error)
    return apiError('Failed to load quiz', 500)
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params
    const payload = await getSessionFromRequest(req)
    if (!payload) return apiError('Unauthorized', 401)

    const body = await req.json()
    const { answers } = body as {
      answers: Array<{ questionId: string; selectedAnswer: string; timeSpentMs: number }>
    }

    if (!Array.isArray(answers) || answers.length === 0) {
      return apiError('Answers are required', 400)
    }

    const session = await prisma.quizSession.findFirst({
      where: { id: sessionId, userId: payload.sub },
    })
    if (!session) return apiError('Quiz session not found', 404)
    // A session scores once. Re-posting would stack duplicate attempts and
    // inflate every derived statistic.
    if (session.completedAt) return apiError('This quiz has already been submitted', 409)

    const questionIds = answers.map((a) => a.questionId)
    const questions = await prisma.questionBank.findMany({
      where: { id: { in: questionIds } },
      select: { id: true, correctAnswer: true, difficulty: true, timeLimitSeconds: true, explanation: true },
    })

    const questionMap = new Map(questions.map((q) => [q.id, q]))

    let totalScore = 0
    const processedAnswers = answers.map((a) => {
      const question = questionMap.get(a.questionId)
      if (!question) return null

      const isCorrect = a.selectedAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()
      const totalTimeMs = question.timeLimitSeconds * 1000
      const timeRemainingMs = Math.max(0, totalTimeMs - a.timeSpentMs)
      const multiplier = getDifficultyMultiplier(question.difficulty)
      const points = calculateScore(isCorrect, timeRemainingMs, totalTimeMs, multiplier)

      totalScore += points

      return {
        questionId: a.questionId,
        selectedAnswer: a.selectedAnswer,
        isCorrect,
        timeSpentMs: a.timeSpentMs,
        pointsEarned: points,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
      }
    }).filter(Boolean) as any[]

    const attempt = await prisma.quizAttempt.create({
      data: {
        sessionId,
        userId: payload.sub,
        score: totalScore,
        maxScore: session.maxScore || questions.length * 100,
        timeTaken: answers.reduce((sum, a) => sum + a.timeSpentMs, 0),
        completedAt: new Date(),
        answers: {
          create: processedAnswers.map((a) => ({
            questionId: a.questionId,
            selectedAnswer: a.selectedAnswer,
            isCorrect: a.isCorrect,
            timeSpentMs: a.timeSpentMs,
            pointsEarned: a.pointsEarned,
          })),
        },
      },
    })

    await prisma.quizSession.update({
      where: { id: sessionId },
      data: { score: totalScore, completedAt: new Date() },
    })

    // ── Record study activity ──────────────────────────────────────────────
    // Without this the profile's streak and last-active date never move, which
    // is why every dashboard stat used to read zero forever.
    const completedDates = await prisma.quizAttempt.findMany({
      where: { userId: payload.sub, completedAt: { not: null } },
      select: { completedAt: true },
    })
    const streak = calculateStreak(
      completedDates.map((a) => a.completedAt).filter((d): d is Date => d !== null),
    )
    await prisma.userProfile.upsert({
      where: { userId: payload.sub },
      update: { weeklyStreak: streak, lastActiveAt: new Date() },
      create: { userId: payload.sub, weeklyStreak: streak, lastActiveAt: new Date() },
    })

    // Keep question usage counts honest so difficulty tuning has data to use.
    await prisma.questionBank.updateMany({
      where: { id: { in: questionIds } },
      data: { usageCount: { increment: 1 } },
    })

    const correctCount = processedAnswers.filter((a) => a.isCorrect).length
    const accuracy = Math.round((correctCount / processedAnswers.length) * 100)

    return apiResponse({
      attemptId: attempt.id,
      score: totalScore,
      maxScore: session.maxScore || questions.length * 100,
      correctAnswers: correctCount,
      totalQuestions: processedAnswers.length,
      accuracy,
      answers: processedAnswers,
      // Tell the client it can request adaptive narration
      narrationAvailable: true,
      exportFormats: ['json', 'csv'],
    })
  } catch (error) {
    console.error('[quiz submit]', error)
    return apiError('Failed to submit quiz', 500)
  }
}
