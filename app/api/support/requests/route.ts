import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { routeToTeacher } from '@/lib/support'
import { audit } from '@/lib/audit'
import { notify } from '@/lib/notify'
import { apiResponse, apiError } from '@/lib/utils'

const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT']
const MAX_ATTACH_BYTES = 5 * 1024 * 1024 // 5MB each
const MAX_ATTACH_COUNT = 5

type AttachmentInput = { fileName: string; mimeType: string; contentBase64: string; sizeBytes: number }

function validateAttachments(raw: unknown): { ok: true; list: AttachmentInput[] } | { ok: false; error: string } {
  if (!Array.isArray(raw)) return { ok: true, list: [] }
  if (raw.length > MAX_ATTACH_COUNT) return { ok: false, error: `Max ${MAX_ATTACH_COUNT} attachments.` }
  const list: AttachmentInput[] = []
  for (const a of raw) {
    if (!a || typeof a.fileName !== 'string' || typeof a.contentBase64 !== 'string') return { ok: false, error: 'Invalid attachment.' }
    const sizeBytes = typeof a.sizeBytes === 'number' ? a.sizeBytes : Math.floor(a.contentBase64.length * 0.75)
    if (sizeBytes > MAX_ATTACH_BYTES) return { ok: false, error: `Each attachment must be under 5MB ("${a.fileName}").` }
    list.push({ fileName: a.fileName.slice(0, 255), mimeType: typeof a.mimeType === 'string' ? a.mimeType : 'application/octet-stream', contentBase64: a.contentBase64, sizeBytes })
  }
  return { ok: true, list }
}

// POST /api/support/requests — student submits a question (auto-routed to a teacher).
export async function POST(req: NextRequest) {
  const payload = await getSessionFromRequest(req)
  if (!payload) return apiError('Unauthorized', 401)

  const profile = await prisma.studentProfile.findUnique({ where: { userId: payload.sub }, select: { universityId: true, departmentId: true } })
  if (!profile) return apiError('Set up your student profile (university & department) before asking a teacher.', 422)

  const body = await req.json().catch(() => null)
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  const text = typeof body?.body === 'string' ? body.body.trim() : ''
  const priority = PRIORITIES.includes(body?.priority) ? body.priority : 'NORMAL'
  const moduleId = typeof body?.moduleId === 'string' ? body.moduleId : null
  let departmentId = typeof body?.departmentId === 'string' ? body.departmentId : profile.departmentId
  const subjectId = typeof body?.subjectId === 'string' ? body.subjectId : null
  const aiAnswerShared = typeof body?.aiAnswerShared === 'string' ? body.aiAnswerShared.slice(0, 8000) : null
  if (title.length < 3) return apiError('Please add a short title.', 400)
  if (text.length < 5) return apiError('Please describe your question.', 400)

  const att = validateAttachments(body?.attachments)
  if (!att.ok) return apiError(att.error, 400)

  // Data isolation: module/department must belong to the student's university.
  if (moduleId) {
    const m = await prisma.module.findUnique({ where: { id: moduleId }, select: { universityId: true, departmentId: true } })
    if (!m || m.universityId !== profile.universityId) return apiError('Invalid module for your university.', 400)
    departmentId = departmentId || m.departmentId
  }
  if (departmentId) {
    const d = await prisma.department.findUnique({ where: { id: departmentId }, select: { universityId: true } })
    if (!d || d.universityId !== profile.universityId) return apiError('Invalid department for your university.', 400)
  }
  if (subjectId) {
    const s = await prisma.subject.findFirst({ where: { id: subjectId, creatorId: payload.sub }, select: { id: true } })
    if (!s) return apiError('Invalid subject.', 400)
  }

  // Auto-route to the best teacher within the student's academic scope.
  const teacherProfileId = await routeToTeacher(profile.universityId, departmentId, moduleId)

  const request = await prisma.supportRequest.create({
    data: {
      universityId: profile.universityId,
      departmentId,
      moduleId,
      subjectId,
      studentId: payload.sub,
      teacherProfileId,
      title,
      body: text,
      aiAnswerShared,
      priority: priority as 'NORMAL',
      status: teacherProfileId ? 'ASSIGNED' : 'SUBMITTED',
      ...(att.list.length ? { attachments: { create: att.list } } : {}),
    },
  })

  await audit({ userId: payload.sub, action: 'support.create', resource: 'SupportRequest', resourceId: request.id, metadata: { routed: !!teacherProfileId } })

  // Notify the assigned teacher (in-app + email).
  if (teacherProfileId) {
    const tp = await prisma.teacherProfile.findUnique({ where: { id: teacherProfileId }, select: { userId: true } })
    if (tp) await notify({ userId: tp.userId, type: 'SUPPORT_NEW', title: 'New student question', body: `A student asked: "${title}"`, data: { requestId: request.id }, email: true })
  }
  return apiResponse({ id: request.id, status: request.status, routed: !!teacherProfileId }, 201)
}

// GET /api/support/requests?status= — role-aware list.
export async function GET(req: NextRequest) {
  const payload = await getSessionFromRequest(req)
  if (!payload) return apiError('Unauthorized', 401)
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || undefined

  let where: Record<string, unknown> = {}
  if (payload.platformRole === 'TEACHER') {
    const tp = await prisma.teacherProfile.findUnique({ where: { userId: payload.sub }, select: { id: true } })
    if (!tp) return apiResponse({ items: [] })
    where = { teacherProfileId: tp.id }
  } else if (payload.platformRole === 'UNIVERSITY_ADMIN') {
    const admin = await prisma.user.findUnique({ where: { id: payload.sub }, select: { managedUniversityId: true } })
    where = { universityId: admin?.managedUniversityId ?? '__none__' }
  } else if (payload.platformRole === 'PLATFORM_ADMIN') {
    where = {}
  } else {
    where = { studentId: payload.sub } // student → own
  }
  if (status) where.status = status

  const items = await prisma.supportRequest.findMany({
    where,
    orderBy: [{ updatedAt: 'desc' }],
    include: {
      student: { select: { name: true, email: true } },
      module: { select: { name: true } },
      department: { select: { name: true } },
      teacherProfile: { select: { fullName: true } },
      _count: { select: { messages: true } },
    },
    take: 100,
  })
  return apiResponse({ items })
}
