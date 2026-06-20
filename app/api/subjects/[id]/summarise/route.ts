import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { summariseDocument, checkRateLimit } from '@/lib/ai'
import { apiResponse, apiError } from '@/lib/utils'

// POST /api/subjects/:id/summarise
// Generates an AI summary of all uploaded materials in a subject.
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

    // Load subject with materials
    const subject = await prisma.subject.findFirst({
      where: {
        id: subjectId,
        OR: [{ isPublic: true }, { creatorId: payload.sub }],
      },
      include: {
        materials: {
          where: { status: 'READY' },
          select: { extractedText: true, fileName: true, wordCount: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!subject) return apiError('Subject not found', 404)

    const combinedText = subject.materials
      .map((m) => m.extractedText || '')
      .filter(Boolean)
      .join('\n\n---\n\n')
      .trim()

    if (combinedText.length < 100) {
      return apiError(
        'Not enough content to summarise. Upload at least one study material with readable text.',
        422
      )
    }

    const summary = await summariseDocument(combinedText, subject.title)

    return apiResponse({
      subjectId,
      subjectTitle: subject.title,
      summary,
      materialCount: subject.materials.length,
      totalWords: subject.materials.reduce((s, m) => s + (m.wordCount || 0), 0),
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[summarise]', msg)

    if (msg.includes('rate limit') || msg.includes('429')) {
      return apiError('AI service busy. Please try again shortly.', 503)
    }
    return apiError('Failed to generate summary. Please try again.', 500)
  }
}
