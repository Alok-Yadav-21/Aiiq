import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { canAccessRequest } from '@/lib/support'
import { audit } from '@/lib/audit'
import { apiResponse, apiError } from '@/lib/utils'

const TEACHER_STATUSES = ['VIEWED', 'IN_PROGRESS', 'ANSWERED', 'NEEDS_INFO', 'RESOLVED', 'CLOSED']
const STUDENT_STATUSES = ['RESOLVED', 'CLOSED']

// GET /api/support/requests/:id — full thread (access-controlled).
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getSessionFromRequest(req)
  if (!payload) return apiError('Unauthorized', 401)
  const { id } = await params

  const request = await prisma.supportRequest.findUnique({
    where: { id },
    include: {
      student: { select: { id: true, name: true, email: true } },
      module: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
      subject: { select: { id: true, title: true } },
      teacherProfile: { select: { id: true, fullName: true } },
      attachments: { select: { id: true, fileName: true, mimeType: true, sizeBytes: true } },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: {
          sender: { select: { id: true, name: true } },
          attachments: { select: { id: true, fileName: true, mimeType: true, sizeBytes: true } },
        },
      },
    },
  })
  if (!request) return apiError('Request not found.', 404)

  const access = await canAccessRequest(payload, request)
  if (!access.allowed) return apiError('You do not have access to this request.', 403)

  // Teacher opening an assigned request marks it VIEWED.
  if (access.viewerRole === 'TEACHER' && request.status === 'ASSIGNED') {
    await prisma.supportRequest.update({ where: { id }, data: { status: 'VIEWED' } })
    request.status = 'VIEWED'
  }

  // Hide teacher-only internal notes from the student.
  const messages = access.viewerRole === 'STUDENT' ? request.messages.filter((m) => !m.isInternalNote) : request.messages

  return apiResponse({ request: { ...request, messages }, viewerRole: access.viewerRole })
}

// PATCH /api/support/requests/:id — { status?, rating? } (role-aware).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getSessionFromRequest(req)
  if (!payload) return apiError('Unauthorized', 401)
  const { id } = await params

  const request = await prisma.supportRequest.findUnique({ where: { id }, select: { id: true, studentId: true, teacherProfileId: true, universityId: true } })
  if (!request) return apiError('Request not found.', 404)
  const access = await canAccessRequest(payload, request)
  if (!access.allowed) return apiError('You do not have access to this request.', 403)

  const body = await req.json().catch(() => null)
  const data: Record<string, unknown> = {}

  if (typeof body?.status === 'string') {
    const allowed = access.viewerRole === 'STUDENT' ? STUDENT_STATUSES
      : access.viewerRole === 'TEACHER' || access.viewerRole === 'ADMIN' ? TEACHER_STATUSES
      : []
    if (!allowed.includes(body.status)) return apiError('You cannot set that status.', 400)
    data.status = body.status
    if (body.status === 'RESOLVED' || body.status === 'CLOSED') data.resolvedAt = new Date()
  }

  if (body?.rating !== undefined) {
    if (access.viewerRole !== 'STUDENT') return apiError('Only the student can rate the support.', 403)
    const rating = parseInt(body.rating)
    if (!(rating >= 1 && rating <= 5)) return apiError('Rating must be 1-5.', 400)
    data.rating = rating
  }

  if (Object.keys(data).length === 0) return apiError('Nothing to update.', 400)

  const updated = await prisma.supportRequest.update({ where: { id }, data })
  await audit({ userId: payload.sub, action: 'support.update', resource: 'SupportRequest', resourceId: id, metadata: data })
  return apiResponse({ id: updated.id, status: updated.status, rating: updated.rating })
}
