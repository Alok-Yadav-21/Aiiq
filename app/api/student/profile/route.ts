import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { apiResponse, apiError } from '@/lib/utils'

// GET /api/student/profile — the signed-in student's academic profile.
export async function GET(req: NextRequest) {
  const payload = await getSessionFromRequest(req)
  if (!payload) return apiError('Unauthorized', 401)

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: payload.sub },
    include: {
      university: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
      programme: { select: { id: true, name: true } },
      academicYear: { select: { id: true, name: true } },
    },
  })
  return apiResponse({ profile })
}

// PUT /api/student/profile — set/update the student's own academic placement.
export async function PUT(req: NextRequest) {
  const payload = await getSessionFromRequest(req)
  if (!payload) return apiError('Unauthorized', 401)

  const body = await req.json().catch(() => null)
  const universityId = typeof body?.universityId === 'string' ? body.universityId : ''
  const departmentId = typeof body?.departmentId === 'string' ? body.departmentId : null
  const programmeId = typeof body?.programmeId === 'string' ? body.programmeId : null
  const academicYearId = typeof body?.academicYearId === 'string' ? body.academicYearId : null
  const studentIdNumber = typeof body?.studentIdNumber === 'string' ? body.studentIdNumber.trim() || null : null

  if (!universityId) return apiError('Please select your university.', 400)
  const uni = await prisma.university.findFirst({ where: { id: universityId, deletedAt: null } })
  if (!uni) return apiError('Invalid university.', 400)

  // Every referenced entity must belong to the chosen university (data isolation).
  if (departmentId) {
    const d = await prisma.department.findUnique({ where: { id: departmentId }, select: { universityId: true } })
    if (!d || d.universityId !== universityId) return apiError('Invalid department for this university.', 400)
  }
  if (programmeId) {
    const p = await prisma.programme.findUnique({ where: { id: programmeId }, select: { universityId: true, departmentId: true } })
    if (!p || p.universityId !== universityId) return apiError('Invalid programme for this university.', 400)
    if (departmentId && p.departmentId !== departmentId) return apiError('Programme does not belong to the selected department.', 400)
  }
  if (academicYearId) {
    const y = await prisma.academicYear.findUnique({ where: { id: academicYearId }, select: { universityId: true } })
    if (!y || y.universityId !== universityId) return apiError('Invalid academic year for this university.', 400)
  }

  const profile = await prisma.studentProfile.upsert({
    where: { userId: payload.sub },
    create: { userId: payload.sub, universityId, departmentId, programmeId, academicYearId, studentIdNumber },
    update: { universityId, departmentId, programmeId, academicYearId, studentIdNumber },
  })
  return apiResponse({ profile })
}
