import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authorize, adminUniversityScope } from '@/lib/rbac'
import { audit } from '@/lib/audit'
import { apiResponse, apiError } from '@/lib/utils'

// GET /api/admin/universities — list (scoped for university admins)
export async function GET(req: NextRequest) {
  const auth = await authorize(req, ['UNIVERSITY_ADMIN'])
  if (!auth.ok) return auth.res
  const scope = await adminUniversityScope(auth.payload)
  const universities = await prisma.university.findMany({
    where: { deletedAt: null, ...(scope ? { id: scope } : {}) },
    orderBy: { name: 'asc' },
    include: { _count: { select: { departments: true, faculties: true, studentProfiles: true } } },
  })
  return apiResponse({ items: universities })
}

// POST /api/admin/universities — create (platform admin only)
export async function POST(req: NextRequest) {
  const auth = await authorize(req, ['PLATFORM_ADMIN'])
  if (!auth.ok) return auth.res

  const body = await req.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const domain = typeof body?.domain === 'string' ? body.domain.trim().toLowerCase() || null : null
  if (name.length < 2) return apiError('University name is required.', 400)

  const existing = await prisma.university.findFirst({ where: { name } })
  if (existing) return apiError('A university with that name already exists.', 409)

  const university = await prisma.university.create({ data: { name, domain } })
  await audit({ userId: auth.payload.sub, action: 'university.create', resource: 'University', resourceId: university.id, metadata: { name } })
  return apiResponse(university, 201)
}
