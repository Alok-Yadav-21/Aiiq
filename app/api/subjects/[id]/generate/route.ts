import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest, getPlanLimits } from '@/lib/auth'
import { apiResponse, apiError } from '@/lib/utils'
import {
  generateQuizFromText,
  generateFlashcards,
  generateKeyConcepts,
  generateStudyNotes,
  fingerprintQuestion,
  checkRateLimit,
  type GeneratedQuestion,
} from '@/lib/ai'

/**
 * Unified, subject-grounded study-material generation.
 *
 * Body: { types: string[], questionCount?, difficulty? }
 *   types ∈ "MCQ" | "QA" | "FLASHCARDS" | "KEY_CONCEPTS" | "STUDY_NOTES" | "ALL"
 *
 * Rules (per product spec):
 *  - "MCQ"          → MCQs only
 *  - "QA"           → Questions & Answers only (SHORT_ANSWER)
 *  - "FLASHCARDS"   → flashcards only
 *  - "MCQ" + "QA"   → both
 *  - "ALL"          → MCQs + Flashcards + Q&A + Key Concepts + Study Notes
 *
 * Everything is generated STRICTLY from the subject's uploaded materials.
 */

const VALID = new Set(['MCQ', 'QA', 'FLASHCARDS', 'KEY_CONCEPTS', 'STUDY_NOTES', 'ALL'])

function aiErrorResponse(message: string) {
  if (message === 'AI_NOT_CONFIGURED') {
    return apiError('AI is not configured yet. Add a free GOOGLE_API_KEY to enable content generation.', 503)
  }
  if (message.includes('rate limit') || message.includes('429')) {
    return apiError('AI service is temporarily busy. Please try again in a moment.', 503)
  }
  if (message.includes('insufficient_quota') || message.includes('credit')) {
    return apiError('AI quota exhausted. Please check your Anthropic API key billing.', 503)
  }
  return apiError('Content generation failed. Please try again.', 500)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: subjectId } = await params
    const payload = await getSessionFromRequest(req)
    if (!payload) return apiError('Unauthorized', 401)

    if (!checkRateLimit(payload.sub, 6)) {
      return apiError('Too many requests. Please wait a moment before generating again.', 429)
    }

    const body = await req.json().catch(() => null)
    let types: string[] = Array.isArray(body?.types) ? body.types.filter((t: unknown) => typeof t === 'string') : []
    const questionCount = Math.min(Math.max(parseInt(body?.questionCount) || 10, 1), 100)
    const difficulty = ['EASY', 'MEDIUM', 'HARD', 'EXPERT'].includes(body?.difficulty) ? body.difficulty : 'MEDIUM'

    if (types.length === 0 || types.some((t) => !VALID.has(t))) {
      return apiError('Provide a valid "types" array: MCQ, QA, FLASHCARDS, KEY_CONCEPTS, STUDY_NOTES, or ALL.', 400)
    }
    if (types.includes('ALL')) types = ['MCQ', 'QA', 'FLASHCARDS', 'KEY_CONCEPTS', 'STUDY_NOTES']

    // ── Load subject + materials (grounding source) ─────────────────────────────
    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, OR: [{ isPublic: true }, { creatorId: payload.sub }] },
      include: { materials: { where: { status: 'READY' }, select: { extractedText: true }, take: 20 } },
    })
    if (!subject) return apiError('Subject not found or access denied', 404)

    const sourceText = subject.materials
      .map((m) => m.extractedText || '')
      .filter(Boolean)
      .join('\n\n')
      .trim()

    if (sourceText.length < 50) {
      return apiError('Upload study material to this subject first — content is generated only from your uploaded files.', 422)
    }

    const subscription = await prisma.userSubscription.findUnique({ where: { userId: payload.sub } })
    const limits = getPlanLimits(subscription?.plan || 'FREE')
    const clampedCount = Math.min(questionCount, limits.maxQuestions)

    const result: {
      mcqs?: unknown[]
      qa?: unknown[]
      flashcards?: unknown[]
      keyConcepts?: unknown[]
      studyNotes?: unknown
      sessionId?: string
    } = {}

    // ── Quiz-type generation (MCQ and/or QA) ────────────────────────────────────
    const wantsMcq = types.includes('MCQ')
    const wantsQa = types.includes('QA')
    if (wantsMcq || wantsQa) {
      const questionTypes: string[] = []
      if (wantsMcq) questionTypes.push('MCQ')
      if (wantsQa) questionTypes.push('SHORT_ANSWER')

      const existing = await prisma.questionBank.findMany({
        where: { subjectId, isActive: true },
        select: { fingerprint: true, questionText: true },
      })
      const fingerprints = new Set<string>(existing.map((q) => q.fingerprint || fingerprintQuestion(q.questionText)))

      let questions: GeneratedQuestion[]
      try {
        questions = await generateQuizFromText(sourceText, clampedCount, difficulty, questionTypes, fingerprints)
      } catch (e) {
        return aiErrorResponse(e instanceof Error ? e.message : 'AI error')
      }

      if (questions.length > 0) {
        await prisma.questionBank.createMany({
          data: questions.map((q) => ({
            subjectId,
            questionText: q.questionText,
            questionType: q.questionType as 'MCQ' | 'TRUE_FALSE' | 'FILL_IN_THE_BLANK' | 'SHORT_ANSWER',
            options: q.options ?? undefined,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            difficulty: q.difficulty as 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT',
            topicTag: q.topicTag,
            timeLimitSeconds: q.timeLimitSeconds,
            fingerprint: q.fingerprint,
            sourceChunk: q.sourceChunk ?? null,
            confidenceScore: q.confidenceScore ?? 0.9,
          })),
          skipDuplicates: true,
        })

        // Create a playable quiz session from these questions.
        const totalDuration = questions.reduce((s, q) => s + q.timeLimitSeconds, 0)
        const session = await prisma.quizSession.create({
          data: {
            subjectId,
            userId: payload.sub,
            questionCount: questions.length,
            durationSeconds: totalDuration,
            maxScore: questions.length * 100,
          },
        })
        result.sessionId = session.id

        const bank = await prisma.questionBank.findMany({
          where: { subjectId, isActive: true, fingerprint: { in: questions.map((q) => q.fingerprint) } },
          select: { id: true, questionText: true, questionType: true, options: true, correctAnswer: true, explanation: true, difficulty: true, topicTag: true, timeLimitSeconds: true },
          take: questions.length,
        })
        result.mcqs = bank.filter((q) => q.questionType === 'MCQ')
        result.qa = bank.filter((q) => q.questionType === 'SHORT_ANSWER')
      } else {
        if (wantsMcq) result.mcqs = []
        if (wantsQa) result.qa = []
      }
    }

    // ── Flashcards ──────────────────────────────────────────────────────────────
    if (types.includes('FLASHCARDS')) {
      try {
        const cards = await generateFlashcards(sourceText, 20)
        if (cards.length > 0) {
          await prisma.flashcard.deleteMany({ where: { subjectId, userId: payload.sub } })
          await prisma.flashcard.createMany({
            data: cards.map((f) => ({ subjectId, userId: payload.sub, term: f.term, definition: f.definition, example: f.example ?? null, topicTag: f.topicTag ?? null })),
          })
        }
        result.flashcards = await prisma.flashcard.findMany({ where: { subjectId, userId: payload.sub }, orderBy: { createdAt: 'asc' } })
      } catch (e) {
        return aiErrorResponse(e instanceof Error ? e.message : 'AI error')
      }
    }

    // ── Key Concepts ──────────────────────────────────────────────────────────────
    if (types.includes('KEY_CONCEPTS')) {
      try {
        result.keyConcepts = await generateKeyConcepts(sourceText, 12)
      } catch (e) {
        return aiErrorResponse(e instanceof Error ? e.message : 'AI error')
      }
    }

    // ── Study Notes ───────────────────────────────────────────────────────────────
    if (types.includes('STUDY_NOTES')) {
      try {
        result.studyNotes = await generateStudyNotes(sourceText)
      } catch (e) {
        return aiErrorResponse(e instanceof Error ? e.message : 'AI error')
      }
    }

    return apiResponse({ ...result, generated: types })
  } catch (error) {
    console.error('[subject generate]', error)
    return apiError('Failed to generate study material. Please try again.', 500)
  }
}
