import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { teacherApplySchema } from '@/lib/validations'
import { audit } from '@/lib/audit'
import { apiResponse, apiError } from '@/lib/utils'

// POST /api/teacher/apply — submit (or re-submit after rejection) a teacher application.
export async function POST(req: NextRequest) {
  const payload = await getSessionFromRequest(req)
  if (!payload) return apiError('Unauthorized', 401)

  const body = await req.json().catch(() => null)
  const parsed = teacherApplySchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.errors[0].message, 400)
  const d = parsed.data

  // Validate university + that faculty/department belong to it (data integrity).
  const uni = await prisma.university.findFirst({ where: { id: d.universityId, deletedAt: null } })
  if (!uni) return apiError('Invalid university.', 400)
  if (d.facultyId) {
    const f = await prisma.faculty.findUnique({ where: { id: d.facultyId }, select: { universityId: true } })
    if (!f || f.universityId !== d.universityId) return apiError('Invalid faculty for this university.', 400)
  }
  if (d.departmentId) {
    const dep = await prisma.department.findUnique({ where: { id: d.departmentId }, select: { universityId: true } })
    if (!dep || dep.universityId !== d.universityId) return apiError('Invalid department for this university.', 400)
  }

  const existing = await prisma.teacherProfile.findUnique({ where: { userId: payload.sub } })
  if (existing && (existing.status === 'PENDING' || existing.status === 'APPROVED' || existing.status === 'SUSPENDED')) {
    return apiError(`You already have a teacher application (status: ${existing.status}).`, 409)
  }

  const data = {
    universityId: d.universityId,
    facultyId: d.facultyId ?? null,
    requestedDepartmentId: d.departmentId ?? null,
    fullName: d.fullName,
    universityEmail: d.universityEmail.toLowerCase(),
    staffId: d.staffId,
    professionalTitle: d.professionalTitle ?? null,
    requestedModules: d.modulesTaught,
    verificationDocUrl: d.verificationDocUrl ?? null,
    status: 'PENDING' as const,
    rejectionReason: null,
    reviewedById: null,
    reviewedAt: null,
  }

  // Upsert so a rejected applicant can re-apply.
  const profile = await prisma.teacherProfile.upsert({
    where: { userId: payload.sub },
    create: { userId: payload.sub, ...data },
    update: data,
  })

  await audit({ userId: payload.sub, action: 'teacher.apply', resource: 'TeacherProfile', resourceId: profile.id })
  return apiResponse({ id: profile.id, status: profile.status, message: 'Application submitted. An administrator will review it shortly.' }, 201)
}
