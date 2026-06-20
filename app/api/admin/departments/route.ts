import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authorize, adminUniversityScope, resolveScopedUniversity } from '@/lib/rbac'
import { audit } from '@/lib/audit'
import { apiResponse, apiError } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const auth = await authorize(req, ['UNIVERSITY_ADMIN'])
  if (!auth.ok) return auth.res
  const scope = await adminUniversityScope(auth.payload)
  const { searchParams } = new URL(req.url)
  const universityId = scope ?? searchParams.get('universityId') ?? undefined
  const departments = await prisma.department.findMany({
    where: { deletedAt: null, ...(universityId ? { universityId } : {}) },
    orderBy: { name: 'asc' },
    include: {
      faculty: { select: { id: true, name: true } },
      _count: { select: { programmes: true, modules: true, studentProfiles: true } },
    },
  })
  return apiResponse({ items: departments })
}

export async function POST(req: NextRequest) {
  const auth = await authorize(req, ['UNIVERSITY_ADMIN'])
  if (!auth.ok) return auth.res
  const body = await req.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const code = typeof body?.code === 'string' ? body.code.trim() || null : null
  const facultyId = typeof body?.facultyId === 'string' ? body.facultyId : null
  if (name.length < 2) return apiError('Department name is required.', 400)

  const scoped = await resolveScopedUniversity(auth.payload, body?.universityId)
  if (!scoped.ok) return scoped.res

  // If a faculty is given, it must belong to the same university.
  if (facultyId) {
    const fac = await prisma.faculty.findUnique({ where: { id: facultyId }, select: { universityId: true } })
    if (!fac || fac.universityId !== scoped.universityId) return apiError('Invalid faculty for this university.', 400)
  }

  const dup = await prisma.department.findFirst({ where: { universityId: scoped.universityId, name } })
  if (dup) return apiError('A department with that name already exists.', 409)

  const department = await prisma.department.create({
    data: { universityId: scoped.universityId, facultyId, name, code },
  })
  await audit({ userId: auth.payload.sub, action: 'department.create', resource: 'Department', resourceId: department.id, metadata: { name } })
  return apiResponse(department, 201)
}
