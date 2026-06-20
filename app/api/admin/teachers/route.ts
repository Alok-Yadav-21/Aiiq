import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authorize, adminUniversityScope } from '@/lib/rbac'
import { apiResponse } from '@/lib/utils'

const STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED']

// GET /api/admin/teachers?status=PENDING — list teacher applications (university-scoped).
export async function GET(req: NextRequest) {
  const auth = await authorize(req, ['UNIVERSITY_ADMIN'])
  if (!auth.ok) return auth.res

  const scope = await adminUniversityScope(auth.payload)
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const universityId = scope ?? searchParams.get('universityId') ?? undefined

  const teachers = await prisma.teacherProfile.findMany({
    where: {
      ...(universityId ? { universityId } : {}),
      ...(status && STATUSES.includes(status) ? { status: status as 'PENDING' } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, email: true, name: true } },
      university: { select: { id: true, name: true } },
      faculty: { select: { id: true, name: true } },
      assignments: {
        include: {
          department: { select: { id: true, name: true } },
          programme: { select: { id: true, name: true } },
          module: { select: { id: true, name: true } },
        },
      },
    },
  })

  const counts = await prisma.teacherProfile.groupBy({
    by: ['status'],
    where: universityId ? { universityId } : {},
    _count: true,
  })

  return apiResponse({ items: teachers, counts })
}
