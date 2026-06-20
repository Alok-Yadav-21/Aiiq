import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { canAccessRequest } from '@/lib/support'
import { apiError } from '@/lib/utils'

// GET /api/support/attachments/:id — stream an attachment (access-controlled).
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getSessionFromRequest(req)
  if (!payload) return apiError('Unauthorized', 401)
  const { id } = await params

  const att = await prisma.supportAttachment.findUnique({
    where: { id },
    include: {
      request: { select: { studentId: true, teacherProfileId: true, universityId: true } },
      message: { include: { request: { select: { studentId: true, teacherProfileId: true, universityId: true } } } },
    },
  })
  if (!att) return apiError('Attachment not found.', 404)

  const reqMeta = att.request ?? att.message?.request
  if (!reqMeta) return apiError('Attachment not found.', 404)

  const access = await canAccessRequest(payload, reqMeta)
  if (!access.allowed) return apiError('You do not have access to this attachment.', 403)

  const buffer = Buffer.from(att.contentBase64, 'base64')
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': att.mimeType || 'application/octet-stream',
      'Content-Disposition': `inline; filename="${att.fileName.replace(/"/g, '')}"`,
      'Content-Length': String(buffer.length),
      'Cache-Control': 'private, max-age=300',
    },
  })
}
