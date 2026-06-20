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
  const modules = await prisma.module.findMany({
    where: { deletedAt: null, ...(universityId ? { universityId } : {}), ...(departmentId ? { departmentId } : {}) },
    orderBy: { name: 'asc' },
    include: { department: { select: { id: true, name: true } }, programme: { select: { id: true, name: true } } },
  })
  return apiResponse({ items: modules })
}

export async function POST(req: NextRequest) {
  const auth = await authorize(req, ['UNIVERSITY_ADMIN'])
  if (!auth.ok) return auth.res
  const body = await req.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const code = typeof body?.code === 'string' ? body.code.trim() || null : null
  const departmentId = typeof body?.departmentId === 'string' ? body.departmentId : ''
  const programmeId = typeof body?.programmeId === 'string' ? body.programmeId : null
  const academicYearId = typeof body?.academicYearId === 'string' ? body.academicYearId : null
  if (name.length < 2) return apiError('Module name is required.', 400)
  if (!departmentId) return apiError('departmentId is required.', 400)

  const scoped = await resolveScopedUniversity(auth.payload, body?.universityId)
  if (!scoped.ok) return scoped.res

  const dept = await prisma.department.findUnique({ where: { id: departmentId }, select: { universityId: true } })
  if (!dept || dept.universityId !== scoped.universityId) return apiError('Invalid department for this university.', 400)

  if (programmeId) {
    const prog = await prisma.programme.findUnique({ where: { id: programmeId }, select: { departmentId: true } })
    if (!prog || prog.departmentId !== departmentId) return apiError('Invalid programme for this department.', 400)
  }

  const mod = await prisma.module.create({
    data: { universityId: scoped.universityId, departmentId, programmeId, academicYearId, name, code },
  })
  await audit({ userId: auth.payload.sub, action: 'module.create', resource: 'Module', resourceId: mod.id, metadata: { name } })
  return apiResponse(mod, 201)
}
