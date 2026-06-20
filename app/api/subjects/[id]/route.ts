import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { updateSubjectSchema } from '@/lib/validations'
import { apiResponse, apiError } from '@/lib/utils'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const payload = await getSessionFromRequest(req)

    const subject = await prisma.subject.findFirst({
      where: {
        id,
        OR: [
          { isPublic: true },
          ...(payload ? [{ creatorId: payload.sub }] : []),
        ],
      },
      include: {
        creator: { select: { id: true, name: true, image: true } },
        materials: {
          select: {
            id: true, fileName: true, type: true, status: true, fileSize: true, createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { materials: true, questionBank: true, enrollments: true } },
      },
    })

    if (!subject) return apiError('Subject not found', 404)
    return apiResponse(subject)
  } catch (error) {
    console.error('[subject GET]', error)
    return apiError('Failed to fetch subject', 500)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const payload = await getSessionFromRequest(req)
    if (!payload) return apiError('Unauthorized', 401)

    const subject = await prisma.subject.findFirst({
      where: { id, creatorId: payload.sub },
    })
    if (!subject) return apiError('Subject not found or access denied', 404)

    const body = await req.json()
    const parsed = updateSubjectSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 400)

    const updated = await prisma.subject.update({
      where: { id },
      data: parsed.data,
    })

    return apiResponse(updated)
  } catch (error) {
    console.error('[subject PATCH]', error)
    return apiError('Failed to update subject', 500)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const payload = await getSessionFromRequest(req)
    if (!payload) return apiError('Unauthorized', 401)

    const subject = await prisma.subject.findFirst({
      where: { id, creatorId: payload.sub },
    })
    if (!subject) return apiError('Subject not found or access denied', 404)

    await prisma.subject.delete({ where: { id } })
    return apiResponse({ deleted: true })
  } catch (error) {
    console.error('[subject DELETE]', error)
    return apiError('Failed to delete subject', 500)
  }
}
