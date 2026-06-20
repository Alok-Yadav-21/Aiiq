import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { apiResponse, apiError, calculateScore, getDifficultyMultiplier } from '@/lib/utils'

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
