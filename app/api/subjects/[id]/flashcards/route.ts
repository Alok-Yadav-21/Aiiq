import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { generateFlashcards, checkRateLimit } from '@/lib/ai'
import { apiResponse, apiError } from '@/lib/utils'

// GET  /api/subjects/:id/flashcards  — list saved flashcards
// POST /api/subjects/:id/flashcards  — generate new flashcards from materials

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: subjectId } = await params
    const payload = await getSessionFromRequest(req)
    if (!payload) return apiError('Unauthorized', 401)

    const flashcards = await prisma.flashcard.findMany({
      where: { subjectId, userId: payload.sub },
      orderBy: { createdAt: 'asc' },
    })

    return apiResponse({ flashcards, total: flashcards.length })
  } catch (error) {
    console.error('[flashcards GET]', error)
    return apiError('Failed to load flashcards', 500)
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: subjectId } = await params
    const payload = await getSessionFromRequest(req)
    if (!payload) return apiError('Unauthorized', 401)

    if (!checkRateLimit(payload.sub, 5)) {
      return apiError('Too many requests. Please wait a moment.', 429)
    }

    // Optional: override count from body
    let count = 20
    try {
      const body = await req.json()
      if (typeof body.count === 'number' && body.count >= 5 && body.count <= 50) {
        count = body.count
      }
    } catch { /* no body is fine */ }

    // Load subject and materials
    const subject = await prisma.subject.findFirst({
      where: {
        id: subjectId,
        OR: [{ isPublic: true }, { creatorId: payload.sub }],
      },
      include: {
        materials: {
          where: { status: 'READY' },
          select: { extractedText: true },
          take: 5,
        },
      },
    })

    if (!subject) return apiError('Subject not found', 404)

    const combinedText = subject.materials
      .map((m) => m.extractedText || '')
      .filter(Boolean)
      .join('\n\n')
      .trim()

    if (combinedText.length < 50) {
      return apiError(
        'Upload study material before generating flashcards. No readable text found.',
        422
      )
    }

    const generated = await generateFlashcards(combinedText, count)

    if (generated.length === 0) {
      return apiError('Could not generate flashcards from this content. Try uploading more detailed material.', 422)
    }

    // Delete previous flashcards for this user+subject, then save fresh set
    await prisma.flashcard.deleteMany({ where: { subjectId, userId: payload.sub } })

    await prisma.flashcard.createMany({
      data: generated.map((f) => ({
        subjectId,
        userId: payload.sub,
        term: f.term,
        definition: f.definition,
        example: f.example ?? null,
        topicTag: f.topicTag,
      })),
    })

    const saved = await prisma.flashcard.findMany({
      where: { subjectId, userId: payload.sub },
      orderBy: { createdAt: 'asc' },
    })

    return apiResponse({
      flashcards: saved,
      total: saved.length,
      message: `Generated ${saved.length} flashcards for "${subject.title}"`,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[flashcards POST]', msg)

    if (msg === 'AI_NOT_CONFIGURED') {
      return apiError('AI is not configured yet. Add a free GOOGLE_API_KEY to enable flashcard generation.', 503)
    }
    if (msg.includes('rate limit') || msg.includes('429')) {
      return apiError('AI service busy. Please try again shortly.', 503)
    }
    return apiError('Failed to generate flashcards. Please try again.', 500)
  }
}
