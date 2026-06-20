import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { generateAdaptiveNarration, checkRateLimit } from '@/lib/ai'
import { apiResponse, apiError } from '@/lib/utils'

// POST /api/quiz/:sessionId/narrate
// Generates adaptive learning narration after a quiz attempt.
// Identifies weak topics, provides personalised feedback, and suggests next steps.

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const payload = await getSessionFromRequest(req)
    if (!payload) return apiError('Unauthorized', 401)

    if (!checkRateLimit(payload.sub, 10)) {
      return apiError('Too many requests. Please wait a moment.', 429)
    }

    // Load quiz session with subject info
    const session = await prisma.quizSession.findFirst({
      where: { id: sessionId, userId: payload.sub },
      include: { subject: { select: { title: true } } },
    })
    if (!session) return apiError('Quiz session not found', 404)

    // Load the latest attempt for this session
    const attempt = await prisma.quizAttempt.findFirst({
      where: { sessionId, userId: payload.sub },
      orderBy: { createdAt: 'desc' },
      include: {
        answers: {
          include: {
            question: {
              select: {
                questionText: true,
                topicTag: true,
                difficulty: true,
                correctAnswer: true,
              },
            },
          },
        },
      },
    })

    if (!attempt) {
      return apiError('No completed attempt found for this session. Complete the quiz first.', 404)
    }

    if (attempt.answers.length === 0) {
      return apiError('No answers recorded for this attempt.', 422)
    }

    // Build narration input
    const narrationInput = attempt.answers.map((a) => ({
      questionText: a.question.questionText,
      topicTag: a.question.topicTag || 'General',
      isCorrect: a.isCorrect,
      difficulty: a.question.difficulty,
      correctAnswer: a.question.correctAnswer,
      selectedAnswer: a.selectedAnswer || '',
    }))

    const narration = await generateAdaptiveNarration(
      session.subject.title,
      narrationInput
    )

    const accuracy = Math.round(
      (attempt.answers.filter((a) => a.isCorrect).length / attempt.answers.length) * 100
    )

    return apiResponse({
      sessionId,
      attemptId: attempt.id,
      score: attempt.score,
      maxScore: attempt.maxScore,
      accuracy,
      narration,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[narrate]', msg)

    if (msg.includes('rate limit') || msg.includes('429')) {
      return apiError('AI service busy. Please try again shortly.', 503)
    }
    return apiError('Failed to generate narration. Please try again.', 500)
  }
}
