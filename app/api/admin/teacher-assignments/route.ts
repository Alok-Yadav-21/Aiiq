import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authorize, assertUniversityAccess } from '@/lib/rbac'
import { audit } from '@/lib/audit'
import { apiResponse, apiError } from '@/lib/utils'

async function loadTeacherInScope(req: NextRequest, teacherProfileId: string, payload: Parameters<typeof assertUniversityAccess>[0]) {
  const teacher = await prisma.teacherProfile.findUnique({ where: { id: teacherProfileId }, select: { id: true, universityId: true } })
  if (!teacher) return { error: apiError('Teacher not found.', 404) }
  const forbidden = await assertUniversityAccess(payload, teacher.universityId)
  if (forbidden) return { error: forbidden }
  return { teacher }
}

// GET /api/admin/teacher-assignments?teacherProfileId=...
export async function GET(req: NextRequest) {
  const auth = await authorize(req, ['UNIVERSITY_ADMIN'])
  if (!auth.ok) return auth.res
  const teacherProfileId = new URL(req.url).searchParams.get('teacherProfileId')
  if (!teacherProfileId) return apiError('teacherProfileId is required.', 400)
  const scope = await loadTeacherInScope(req, teacherProfileId, auth.payload)
  if ('error' in scope) return scope.error

  const items = await prisma.teacherAssignment.findMany({
    where: { teacherProfileId },
    include: {
      department: { select: { id: true, name: true } },
      programme: { select: { id: true, name: true } },
      module: { select: { id: true, name: true } },
    },
  })
  return apiResponse({ items })
}

// POST /api/admin/teacher-assignments  { teacherProfileId, departmentId?, programmeId?, moduleId? }
export async function POST(req: NextRequest) {
  const auth = await authorize(req, ['UNIVERSITY_ADMIN'])
  if (!auth.ok) return auth.res
  const body = await req.json().catch(() => null)
  const teacherProfileId = typeof body?.teacherProfileId === 'string' ? body.teacherProfileId : ''
  const departmentId = typeof body?.departmentId === 'string' ? body.departmentId : null
  const programmeId = typeof body?.programmeId === 'string' ? body.programmeId : null
  const moduleId = typeof body?.moduleId === 'string' ? body.moduleId : null
  if (!teacherProfileId) return apiError('teacherProfileId is required.', 400)
  if (!departmentId && !programmeId && !moduleId) return apiError('Provide at least one of department, programme, or module.', 400)

  const scope = await loadTeacherInScope(req, teacherProfileId, auth.payload)
  if ('error' in scope) return scope.error
  const uniId = scope.teacher.universityId

  // Each referenced academic entity must belong to the teacher's university.
  if (departmentId) {
    const d = await prisma.department.findUnique({ where: { id: departmentId }, select: { universityId: true } })
    if (!d || d.universityId !== uniId) return apiError('Department is not in this university.', 400)
  }
  if (programmeId) {
    const p = await prisma.programme.findUnique({ where: { id: programmeId }, select: { universityId: true } })
    if (!p || p.universityId !== uniId) return apiError('Programme is not in this university.', 400)
  }
  if (moduleId) {
    const m = await prisma.module.findUnique({ where: { id: moduleId }, select: { universityId: true } })
    if (!m || m.universityId !== uniId) return apiError('Module is not in this university.', 400)
  }

  const assignment = await prisma.teacherAssignment.create({ data: { teacherProfileId, departmentId, programmeId, moduleId } })
  await audit({ userId: auth.payload.sub, action: 'teacher.assign', resource: 'TeacherAssignment', resourceId: assignment.id, metadata: { teacherProfileId, departmentId, programmeId, moduleId } })
  return apiResponse(assignment, 201)
}

// DELETE /api/admin/teacher-assignments?id=...
export async function DELETE(req: NextRequest) {
  const auth = await authorize(req, ['UNIVERSITY_ADMIN'])
  if (!auth.ok) return auth.res
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return apiError('id is required.', 400)

  const assignment = await prisma.teacherAssignment.findUnique({ where: { id }, select: { teacherProfileId: true } })
  if (!assignment) return apiError('Assignment not found.', 404)
  const scope = await loadTeacherInScope(req, assignment.teacherProfileId, auth.payload)
  if ('error' in scope) return scope.error

  await prisma.teacherAssignment.delete({ where: { id } })
  await audit({ userId: auth.payload.sub, action: 'teacher.unassign', resource: 'TeacherAssignment', resourceId: id })
  return apiResponse({ ok: true })
}
