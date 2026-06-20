import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { getTeacherScope } from '@/lib/teacher'
import { audit } from '@/lib/audit'
import { apiResponse, apiError } from '@/lib/utils'

async function ownContent(userId: string, id: string) {
  const scope = await getTeacherScope(userId)
  if (!scope) return { error: apiError('Approved teachers only.', 403) }
  const content = await prisma.teacherContent.findUnique({ where: { id } })
  if (!content) return { error: apiError('Content not found.', 404) }
  if (content.teacherProfileId !== scope.teacherProfileId) return { error: apiError('Not your content.', 403) }
  return { content }
}

// GET — full content (teacher owner).
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getSessionFromRequest(req)
  if (!payload) return apiError('Unauthorized', 401)
  const { id } = await params
  const r = await ownContent(payload.sub, id)
  if ('error' in r) return r.error
  return apiResponse({ content: r.content })
}

// PATCH — edit title/instructions/items/status/etc.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getSessionFromRequest(req)
  if (!payload) return apiError('Unauthorized', 401)
  const { id } = await params
  const r = await ownContent(payload.sub, id)
  if ('error' in r) return r.error

  const body = await req.json().catch(() => null)
  const data: Record<string, unknown> = {}
  if (typeof body?.title === 'string' && body.title.trim().length >= 3) data.title = body.title.trim()
  if (typeof body?.instructions === 'string') data.instructions = body.instructions
  if (Array.isArray(body?.items)) data.items = body.items
  if (body?.status === 'DRAFT' || body?.status === 'PUBLISHED') data.status = body.status
  if (body?.deadline !== undefined) data.deadline = body.deadline ? new Date(body.deadline) : null
  if (Object.keys(data).length === 0) return apiError('Nothing to update.', 400)

  const updated = await prisma.teacherContent.update({ where: { id }, data })
  await audit({ userId: payload.sub, action: 'content.update', resource: 'TeacherContent', resourceId: id })
  return apiResponse({ id: updated.id, status: updated.status })
}

// DELETE — remove content.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getSessionFromRequest(req)
  if (!payload) return apiError('Unauthorized', 401)
  const { id } = await params
  const r = await ownContent(payload.sub, id)
  if ('error' in r) return r.error
  await prisma.teacherContent.delete({ where: { id } })
  await audit({ userId: payload.sub, action: 'content.delete', resource: 'TeacherContent', resourceId: id })
  return apiResponse({ ok: true })
}
