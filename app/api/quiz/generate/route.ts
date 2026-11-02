import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest, getPlanLimits } from '@/lib/auth'
import { generateQuizSchema } from '@/lib/validations'
import { generateQuizFromText, fingerprintQuestion, checkRateLimit } from '@/lib/ai'
import { apiResponse, apiError } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const payload = await getSessionFromRequest(req)
    if (!payload) return apiError('Unauthorized', 401)

    // AI rate limit: 10 quiz generations per minute per user
    if (!checkRateLimit(payload.sub, 10)) {
      return apiError('Too many requests. Please wait a moment before generating another quiz.', 429)
    }

    // ── Validate input ─────────────────────────────────────────────────────────
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return apiError('Invalid JSON body', 400)
    }

    const parsed = generateQuizSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, 400)
    }

    const { subjectId, questionCount, difficulty, questionTypes, topicFocus } = parsed.data

    if (questionCount < 1) return apiError('Question count must be at least 1', 400)

    // ── Subject & plan checks ──────────────────────────────────────────────────
    const subject = await prisma.subject.findFirst({
      where: {
        id: subjectId,
        OR: [{ isPublic: true }, { creatorId: payload.sub }],
      },
      include: {
        materials: {
          where: { status: 'READY' },
          select: { extractedText: true, fileName: true },
          take: 10,
        },
      },
    })

    if (!subject) return apiError('Subject not found or access denied', 404)

    const subscription = await prisma.userSubscription.findUnique({
      where: { userId: payload.sub },
    })
    const limits = getPlanLimits(subscription?.plan || 'FREE')
    const clampedCount = Math.min(questionCount, limits.maxQuestions)

    // ── Build text corpus (grounded ONLY in uploaded materials) ─────────────────
    const combinedText = subject.materials
      .map((m) => m.extractedText || '')
      .filter(Boolean)
      .join('\n\n')
      .trim()

    // Strict grounding: never generate from subject metadata or generic knowledge.
    if (combinedText.length < 50) {
      return apiError('Upload study material to this subject first — quizzes are generated only from your uploaded files.', 422)
    }
    const textToUse = combinedText

    // ── Load existing fingerprints for deduplication ───────────────────────────
    const existingQuestions = await prisma.questionBank.findMany({
      where: { subjectId, isActive: true },
      select: { fingerprint: true, questionText: true },
    })

    const existingFingerprints = new Set<string>(
      existingQuestions.map((q) => q.fingerprint || fingerprintQuestion(q.questionText))
    )

    // ── Generate questions ─────────────────────────────────────────────────────
    let questions
    try {
      questions = await generateQuizFromText(
        textToUse,
        clampedCount,
        difficulty,
        questionTypes,
        existingFingerprints,
        topicFocus
      )
    } catch (aiError: unknown) {
      const message = aiError instanceof Error ? aiError.message : 'Unknown AI error'
      console.error('[quiz generate] AI error:', message)

      if (message === 'AI_NOT_CONFIGURED') {
        return apiError('AI is not configured yet. Add a free GOOGLE_API_KEY to enable quiz generation.', 503)
      }
      if (message.includes('rate limit') || message.includes('429')) {
        return apiError('AI service is temporarily busy. Please try again in 30 seconds.', 503)
      }
      if (message.includes('insufficient_quota') || message.includes('credit')) {
        return apiError('AI quota exhausted. Please check your Anthropic API key billing.', 503)
      }
      return apiError('Quiz generation failed. Please try again.', 500)
    }

    if (questions.length === 0) {
      return apiError(
        'Could not generate unique questions from this material. Try a different question type, difficulty, or upload more detailed content.',
        422
      )
    }

    // ── Persist to question bank ───────────────────────────────────────────────
    await prisma.questionBank.createMany({
      data: questions.map((q) => ({
        subjectId,
        questionText: q.questionText,
        questionType: q.questionType as any,
        options: q.options ?? undefined,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: q.difficulty as any,
        topicTag: q.topicTag,
        timeLimitSeconds: q.timeLimitSeconds,
        fingerprint: q.fingerprint,
        sourceChunk: q.sourceChunk ?? null,
        confidenceScore: q.confidenceScore ?? 0.8,
      })),
      skipDuplicates: true,
    })

    // ── Create quiz session ────────────────────────────────────────────────────
    const totalDuration = questions.reduce((sum, q) => sum + q.timeLimitSeconds, 0)

    // Fetch saved questions from DB so we have their actual IDs
    const newFingerprints = questions.map((q) => q.fingerprint)
    const bankQuestions = await prisma.questionBank.findMany({
      where: {
        subjectId,
        isActive: true,
        fingerprint: { in: newFingerprints },
      },
      select: {
        id: true,
        questionText: true,
        questionType: true,
        options: true,
        difficulty: true,
        topicTag: true,
        timeLimitSeconds: true,
        sourceChunk: true,
        confidenceScore: true,
      },
      orderBy: { createdAt: 'desc' },
      take: questions.length,
    })

    // Persist the exact question set so the session can be reloaded and resumed.
    const session = await prisma.quizSession.create({
      data: {
        subjectId,
        userId: payload.sub,
        questionCount: bankQuestions.length,
        questionIds: bankQuestions.map((q) => q.id),
        durationSeconds: totalDuration,
        maxScore: bankQuestions.length * 100,
      },
    })

    return apiResponse({
      sessionId: session.id,
      questions: bankQuestions,
      totalQuestions: bankQuestions.length,
      estimatedDuration: totalDuration,
      topicOnly: combinedText.length < 50,
      uniqueQuestions: bankQuestions.length,
      previouslyDeduped: clampedCount - questions.length > 0
        ? clampedCount - questions.length
        : 0,
    })
  } catch (error) {
    console.error('[quiz generate]', error)
    return apiError('Failed to generate quiz. Please try again.', 500)
  }
}
