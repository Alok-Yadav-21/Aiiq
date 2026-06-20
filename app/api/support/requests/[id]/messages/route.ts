import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { canAccessRequest } from '@/lib/support'
import { audit } from '@/lib/audit'
import { notify } from '@/lib/notify'
import { apiResponse, apiError } from '@/lib/utils'

const MAX_ATTACH_BYTES = 5 * 1024 * 1024
const MAX_ATTACH_COUNT = 5

// POST /api/support/requests/:id/messages — add a message to the thread.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getSessionFromRequest(req)
  if (!payload) return apiError('Unauthorized', 401)
  const { id } = await params

  const request = await prisma.supportRequest.findUnique({ where: { id }, select: { id: true, studentId: true, teacherProfileId: true, universityId: true, status: true } })
  if (!request) return apiError('Request not found.', 404)
  const access = await canAccessRequest(payload, request)
  if (!access.allowed) return apiError('You do not have access to this request.', 403)

  const body = await req.json().catch(() => null)
  const text = typeof body?.body === 'string' ? body.body.trim() : ''
  const isInternalNote = body?.isInternalNote === true && (access.viewerRole === 'TEACHER' || access.viewerRole === 'ADMIN')
  if (text.length < 1 && !Array.isArray(body?.attachments)) return apiError('Message cannot be empty.', 400)

  // Validate attachments.
  const attachments: { fileName: string; mimeType: string; contentBase64: string; sizeBytes: number }[] = []
  if (Array.isArray(body?.attachments)) {
    if (body.attachments.length > MAX_ATTACH_COUNT) return apiError(`Max ${MAX_ATTACH_COUNT} attachments.`, 400)
    for (const a of body.attachments) {
      if (!a || typeof a.fileName !== 'string' || typeof a.contentBase64 !== 'string') return apiError('Invalid attachment.', 400)
      const sizeBytes = typeof a.sizeBytes === 'number' ? a.sizeBytes : Math.floor(a.contentBase64.length * 0.75)
      if (sizeBytes > MAX_ATTACH_BYTES) return apiError(`Attachment "${a.fileName}" exceeds 5MB.`, 400)
      attachments.push({ fileName: a.fileName.slice(0, 255), mimeType: typeof a.mimeType === 'string' ? a.mimeType : 'application/octet-stream', contentBase64: a.contentBase64, sizeBytes })
    }
  }

  const message = await prisma.supportMessage.create({
    data: {
      requestId: id,
      senderId: payload.sub,
      senderRole: access.viewerRole || 'STUDENT',
      body: text,
      isInternalNote,
      ...(attachments.length ? { attachments: { create: attachments } } : {}),
    },
  })

  // Status side-effects (skip for internal notes).
  if (!isInternalNote) {
    let newStatus: 'IN_PROGRESS' | 'ANSWERED' | null = null
    if (access.viewerRole === 'STUDENT') {
      // A student reply reactivates an answered/closed thread.
      if (['ANSWERED', 'NEEDS_INFO', 'RESOLVED'].includes(request.status)) newStatus = 'IN_PROGRESS'
    } else {
      // A teacher reply marks the thread answered.
      newStatus = 'ANSWERED'
    }
    if (newStatus && newStatus !== request.status) {
      await prisma.supportRequest.update({ where: { id }, data: { status: newStatus } })
    } else {
      await prisma.supportRequest.update({ where: { id }, data: { updatedAt: new Date() } })
    }
  }

  // Mark the other party's messages as read.
  await prisma.supportMessage.updateMany({
    where: { requestId: id, senderId: { not: payload.sub }, readAt: null },
    data: { readAt: new Date() },
  })

  await audit({ userId: payload.sub, action: 'support.message', resource: 'SupportRequest', resourceId: id })

  // Notify the other party (skip for internal notes — those are teacher-only).
  if (!isInternalNote) {
    if (access.viewerRole === 'STUDENT') {
      if (request.teacherProfileId) {
        const tp = await prisma.teacherProfile.findUnique({ where: { id: request.teacherProfileId }, select: { userId: true } })
        if (tp) await notify({ userId: tp.userId, type: 'SUPPORT_REPLY', title: 'Student follow-up', body: 'A student replied to a support request.', data: { requestId: id } })
      }
    } else {
      await notify({ userId: request.studentId, type: 'SUPPORT_ANSWER', title: 'Your teacher replied', body: 'A teacher answered your question.', data: { requestId: id }, email: true })
    }
  }
  return apiResponse({ id: message.id }, 201)
}
