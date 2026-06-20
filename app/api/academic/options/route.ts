import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { apiResponse, apiError } from '@/lib/utils'

// GET /api/academic/options[?universityId=...]
// Read-only id+name lists for dropdowns (teacher apply, student profile).
// Any authenticated user. Returns universities always; when universityId is
// given, also returns that university's faculties/departments/programmes/years.
export async function GET(req: NextRequest) {
  const payload = await getSessionFromRequest(req)
  if (!payload) return apiError('Unauthorized', 401)

  const universityId = new URL(req.url).searchParams.get('universityId') || undefined

  const universities = await prisma.university.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  if (!universityId) return apiResponse({ universities })

  const [faculties, departments, programmes, academicYears, modules] = await Promise.all([
    prisma.faculty.findMany({ where: { universityId, deletedAt: null }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.department.findMany({ where: { universityId, deletedAt: null }, select: { id: true, name: true, facultyId: true }, orderBy: { name: 'asc' } }),
    prisma.programme.findMany({ where: { universityId, deletedAt: null }, select: { id: true, name: true, departmentId: true }, orderBy: { name: 'asc' } }),
    prisma.academicYear.findMany({ where: { universityId }, select: { id: true, name: true, isCurrent: true }, orderBy: { name: 'desc' } }),
    prisma.module.findMany({ where: { universityId, deletedAt: null }, select: { id: true, name: true, departmentId: true }, orderBy: { name: 'asc' } }),
  ])

  return apiResponse({ universities, faculties, departments, programmes, academicYears, modules })
}
