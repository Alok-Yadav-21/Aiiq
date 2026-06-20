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
  const years = await prisma.academicYear.findMany({
    where: { ...(universityId ? { universityId } : {}) },
    orderBy: { name: 'desc' },
  })
  return apiResponse({ items: years })
}

export async function POST(req: NextRequest) {
  const auth = await authorize(req, ['UNIVERSITY_ADMIN'])
  if (!auth.ok) return auth.res
  const body = await req.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const isCurrent = body?.isCurrent === true
  const startDate = body?.startDate ? new Date(body.startDate) : null
  const endDate = body?.endDate ? new Date(body.endDate) : null
  if (name.length < 4) return apiError('Academic year name is required (e.g. "2025/2026").', 400)

  const scoped = await resolveScopedUniversity(auth.payload, body?.universityId)
  if (!scoped.ok) return scoped.res

  const dup = await prisma.academicYear.findFirst({ where: { universityId: scoped.universityId, name } })
  if (dup) return apiError('That academic year already exists.', 409)

  // Only one current year per university.
  if (isCurrent) {
    await prisma.academicYear.updateMany({ where: { universityId: scoped.universityId, isCurrent: true }, data: { isCurrent: false } })
  }

  const year = await prisma.academicYear.create({
    data: { universityId: scoped.universityId, name, isCurrent, startDate, endDate },
  })
  await audit({ userId: auth.payload.sub, action: 'academicYear.create', resource: 'AcademicYear', resourceId: year.id, metadata: { name } })
  return apiResponse(year, 201)
}
