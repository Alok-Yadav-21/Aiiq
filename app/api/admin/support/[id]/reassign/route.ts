import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authorize, assertUniversityAccess } from '@/lib/rbac'
import { audit } from '@/lib/audit'
import { notify } from '@/lib/notify'
import { apiResponse, apiError } from '@/lib/utils'

// POST /api/admin/support/:id/reassign  { teacherProfileId }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(req, ['UNIVERSITY_ADMIN'])
  if (!auth.ok) return auth.res
  const { id } = await params

  const request = await prisma.supportRequest.findUnique({ where: { id }, select: { id: true, universityId: true } })
  if (!request) return apiError('Request not found.', 404)
  const forbidden = await assertUniversityAccess(auth.payload, request.universityId)
  if (forbidden) return forbidden

  const body = await req.json().catch(() => null)
  const teacherProfileId = typeof body?.teacherProfileId === 'string' ? body.teacherProfileId : ''
  if (!teacherProfileId) return apiError('teacherProfileId is required.', 400)

  const teacher = await prisma.teacherProfile.findUnique({ where: { id: teacherProfileId }, select: { universityId: true, status: true, userId: true } })
  if (!teacher || teacher.universityId !== request.universityId) return apiError('Teacher is not in this university.', 400)
  if (teacher.status !== 'APPROVED') return apiError('Teacher is not approved.', 400)

  await prisma.supportRequest.update({ where: { id }, data: { teacherProfileId, status: 'ASSIGNED' } })
  await audit({ userId: auth.payload.sub, action: 'support.reassign', resource: 'SupportRequest', resourceId: id, metadata: { teacherProfileId } })
  await notify({ userId: teacher.userId, type: 'SUPPORT_NEW', title: 'Question assigned to you', body: 'An administrator assigned a student question to you.', data: { requestId: id }, email: true })
  return apiResponse({ ok: true })
}
