import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { apiError } from '@/lib/utils'
import { formatDate } from '@/lib/utils'

// GET /api/quiz/:sessionId/export?format=json|csv
// Exports the quiz attempt results in the requested format.
// JSON is the default; CSV is a flat table suitable for spreadsheets.

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const payload = await getSessionFromRequest(req)
    if (!payload) return apiError('Unauthorized', 401)

    const { searchParams } = new URL(req.url)
    const format = (searchParams.get('format') || 'json').toLowerCase()

    if (!['json', 'csv'].includes(format)) {
      return apiError('format must be "json" or "csv"', 400)
    }

    // Load session + latest attempt
    const session = await prisma.quizSession.findFirst({
      where: { id: sessionId, userId: payload.sub },
      include: { subject: { select: { title: true, category: true } } },
    })
    if (!session) return apiError('Quiz session not found', 404)

    const attempt = await prisma.quizAttempt.findFirst({
      where: { sessionId, userId: payload.sub },
      orderBy: { createdAt: 'desc' },
      include: {
        answers: {
          include: {
            question: {
              select: {
                questionText: true,
                questionType: true,
                options: true,
                correctAnswer: true,
                explanation: true,
                difficulty: true,
                topicTag: true,
              },
            },
          },
        },
      },
    })

    if (!attempt) return apiError('No completed attempt found for this session.', 404)

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { name: true, email: true },
    })

    const correctCount = attempt.answers.filter((a) => a.isCorrect).length
    const accuracy = Math.round((correctCount / attempt.answers.length) * 100)

    if (format === 'csv') {
      const rows: string[] = [
        // Header
        ['#', 'Question', 'Type', 'Topic', 'Difficulty', 'Your Answer', 'Correct Answer', 'Result', 'Points', 'Explanation']
          .map((h) => `"${h}"`).join(','),
        // Data rows
        ...attempt.answers.map((a, i) => [
          i + 1,
          `"${a.question.questionText.replace(/"/g, '""')}"`,
          a.question.questionType,
          a.question.topicTag || 'General',
          a.question.difficulty,
          `"${(a.selectedAnswer || '').replace(/"/g, '""')}"`,
          `"${a.question.correctAnswer.replace(/"/g, '""')}"`,
          a.isCorrect ? 'CORRECT' : 'WRONG',
          a.pointsEarned,
          `"${(a.question.explanation || '').replace(/"/g, '""')}"`,
        ].join(',')),
      ]

      const csvContent = [
        `# AIIQ Quiz Results Export`,
        `# Subject: ${session.subject.title}`,
        `# Date: ${formatDate(attempt.createdAt)}`,
        `# Student: ${user?.name || 'Unknown'} (${user?.email || ''})`,
        `# Score: ${attempt.score}/${attempt.maxScore} (${accuracy}%)`,
        `# Correct: ${correctCount}/${attempt.answers.length}`,
        '',
        ...rows,
      ].join('\n')

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="aiiq-quiz-${sessionId.slice(-8)}-${Date.now()}.csv"`,
        },
      })
    }

    // JSON format
    const exportData = {
      exportedAt: new Date().toISOString(),
      student: { name: user?.name, email: user?.email },
      subject: { title: session.subject.title, category: session.subject.category },
      quiz: {
        sessionId,
        attemptId: attempt.id,
        date: attempt.createdAt,
        score: attempt.score,
        maxScore: attempt.maxScore,
        accuracy,
        correctAnswers: correctCount,
        totalQuestions: attempt.answers.length,
        timeTakenMs: attempt.timeTaken,
      },
      questions: attempt.answers.map((a, i) => ({
        number: i + 1,
        question: a.question.questionText,
        type: a.question.questionType,
        topic: a.question.topicTag || 'General',
        difficulty: a.question.difficulty,
        options: a.question.options,
        yourAnswer: a.selectedAnswer,
        correctAnswer: a.question.correctAnswer,
        isCorrect: a.isCorrect,
        pointsEarned: a.pointsEarned,
        timeSpentMs: a.timeSpentMs,
        explanation: a.question.explanation,
      })),
    }

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="aiiq-quiz-${sessionId.slice(-8)}-${Date.now()}.json"`,
      },
    })
  } catch (error) {
    console.error('[quiz export]', error)
    return apiError('Failed to export quiz results.', 500)
  }
}
