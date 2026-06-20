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
  const departmentId = searchParams.get('departmentId') ?? undefined
  const programmes = await prisma.programme.findMany({
    where: { deletedAt: null, ...(universityId ? { universityId } : {}), ...(departmentId ? { departmentId } : {}) },
    orderBy: { name: 'asc' },
    include: { department: { select: { id: true, name: true } }, _count: { select: { modules: true, studentProfiles: true } } },
  })
  return apiResponse({ items: programmes })
}

export async function POST(req: NextRequest) {
  const auth = await authorize(req, ['UNIVERSITY_ADMIN'])
  if (!auth.ok) return auth.res
  const body = await req.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const code = typeof body?.code === 'string' ? body.code.trim() || null : null
  const degreeLevel = typeof body?.degreeLevel === 'string' ? body.degreeLevel.trim() || null : null
  const departmentId = typeof body?.departmentId === 'string' ? body.departmentId : ''
  if (name.length < 2) return apiError('Programme name is required.', 400)
  if (!departmentId) return apiError('departmentId is required.', 400)

  const scoped = await resolveScopedUniversity(auth.payload, body?.universityId)
  if (!scoped.ok) return scoped.res

  const dept = await prisma.department.findUnique({ where: { id: departmentId }, select: { universityId: true } })
  if (!dept || dept.universityId !== scoped.universityId) return apiError('Invalid department for this university.', 400)

  const dup = await prisma.programme.findFirst({ where: { departmentId, name } })
  if (dup) return apiError('A programme with that name already exists in this department.', 409)

  const programme = await prisma.programme.create({
    data: { universityId: scoped.universityId, departmentId, name, code, degreeLevel },
  })
  await audit({ userId: auth.payload.sub, action: 'programme.create', resource: 'Programme', resourceId: programme.id, metadata: { name } })
  return apiResponse(programme, 201)
}
