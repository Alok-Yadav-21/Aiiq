import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authorize, adminUniversityScope } from '@/lib/rbac'
import { apiResponse } from '@/lib/utils'

const OPEN = ['SUBMITTED', 'ASSIGNED', 'VIEWED', 'IN_PROGRESS', 'NEEDS_INFO']

// GET /api/admin/analytics — university-level dashboard metrics.
export async function GET(req: NextRequest) {
  const auth = await authorize(req, ['UNIVERSITY_ADMIN'])
  if (!auth.ok) return auth.res
  const scope = await adminUniversityScope(auth.payload)
  const uniWhere = scope ? { universityId: scope } : {}

  const [teacherCounts, studentCount, deptCount, programmeCount, moduleCount, requests] = await Promise.all([
    prisma.teacherProfile.groupBy({ by: ['status'], where: uniWhere, _count: true }),
    prisma.studentProfile.count({ where: uniWhere }),
    prisma.department.count({ where: { ...uniWhere, deletedAt: null } }),
    prisma.programme.count({ where: { ...uniWhere, deletedAt: null } }),
    prisma.module.count({ where: { ...uniWhere, deletedAt: null } }),
    prisma.supportRequest.findMany({
      where: uniWhere,
      select: { id: true, status: true, priority: true, createdAt: true, resolvedAt: true, teacherProfileId: true, rating: true,
        teacherProfile: { select: { fullName: true } } },
    }),
  ])

  const total = requests.length
  const open = requests.filter((r) => OPEN.includes(r.status)).length
  const unassigned = requests.filter((r) => r.status === 'SUBMITTED' && !r.teacherProfileId).length
  const urgentOpen = requests.filter((r) => r.priority === 'URGENT' && OPEN.includes(r.status)).length
  const resolved = requests.filter((r) => r.status === 'RESOLVED' || r.status === 'CLOSED')
  const resolutionRate = total ? Math.round((resolved.length / total) * 100) : 0

  // Avg resolution time (hours) over resolved requests.
  const resolvedWithTime = resolved.filter((r) => r.resolvedAt)
  const avgResolutionHours = resolvedWithTime.length
    ? Math.round(resolvedWithTime.reduce((s, r) => s + (new Date(r.resolvedAt!).getTime() - new Date(r.createdAt).getTime()), 0) / resolvedWithTime.length / 3_600_000 * 10) / 10
    : null

  // Avg student rating.
  const rated = requests.filter((r) => typeof r.rating === 'number')
  const avgRating = rated.length ? Math.round(rated.reduce((s, r) => s + (r.rating || 0), 0) / rated.length * 10) / 10 : null

  // Teacher workloads (open requests per teacher).
  const workloadMap = new Map<string, { name: string; open: number; total: number }>()
  for (const r of requests) {
    if (!r.teacherProfileId) continue
    const name = r.teacherProfile?.fullName || 'Teacher'
    const w = workloadMap.get(r.teacherProfileId) || { name, open: 0, total: 0 }
    w.total++
    if (OPEN.includes(r.status)) w.open++
    workloadMap.set(r.teacherProfileId, w)
  }
  const workloads = [...workloadMap.entries()].map(([id, w]) => ({ teacherProfileId: id, ...w })).sort((a, b) => b.open - a.open)

  const teachers = { PENDING: 0, APPROVED: 0, REJECTED: 0, SUSPENDED: 0 } as Record<string, number>
  for (const t of teacherCounts) teachers[t.status] = t._count

  return apiResponse({
    teachers, studentCount, deptCount, programmeCount, moduleCount,
    support: { total, open, unassigned, urgentOpen, resolutionRate, avgResolutionHours, avgRating },
    workloads,
  })
}
