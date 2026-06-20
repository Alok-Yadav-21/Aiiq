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
  const faculties = await prisma.faculty.findMany({
    where: { deletedAt: null, ...(universityId ? { universityId } : {}) },
    orderBy: { name: 'asc' },
    include: { _count: { select: { departments: true } } },
  })
  return apiResponse({ items: faculties })
}

export async function POST(req: NextRequest) {
  const auth = await authorize(req, ['UNIVERSITY_ADMIN'])
  if (!auth.ok) return auth.res
  const body = await req.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  if (name.length < 2) return apiError('Faculty name is required.', 400)

  const scoped = await resolveScopedUniversity(auth.payload, body?.universityId)
  if (!scoped.ok) return scoped.res

  const dup = await prisma.faculty.findFirst({ where: { universityId: scoped.universityId, name } })
  if (dup) return apiError('A faculty with that name already exists.', 409)

  const faculty = await prisma.faculty.create({ data: { universityId: scoped.universityId, name } })
  await audit({ userId: auth.payload.sub, action: 'faculty.create', resource: 'Faculty', resourceId: faculty.id, metadata: { name } })
  return apiResponse(faculty, 201)
}
