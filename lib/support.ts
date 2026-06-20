import { prisma } from '@/lib/prisma'
import type { SupportStatus } from '@prisma/client'
import type { JWTPayload } from '@/lib/auth'

const OPEN_STATUSES = ['SUBMITTED', 'ASSIGNED', 'VIEWED', 'IN_PROGRESS', 'ANSWERED', 'NEEDS_INFO'] as const

/**
 * Auto-route a support request to the best teacher.
 * Preference: a teacher assigned to the exact module → else the department.
 * Among candidates, pick the APPROVED teacher in the same university with the
 * lightest current workload (fewest open requests). Returns a teacherProfileId
 * or null when no eligible teacher exists (admin can route manually later).
 */
export async function routeToTeacher(
  universityId: string,
  departmentId: string | null,
  moduleId: string | null,
): Promise<string | null> {
  const or: object[] = []
  if (moduleId) or.push({ moduleId })
  if (departmentId) or.push({ departmentId })
  if (or.length === 0) return null

  const assignments = await prisma.teacherAssignment.findMany({
    where: { OR: or, teacherProfile: { status: 'APPROVED', universityId } },
    select: { teacherProfileId: true, moduleId: true },
  })
  if (assignments.length === 0) return null

  // Prefer teachers assigned to the exact module.
  const moduleMatches = moduleId ? assignments.filter((a) => a.moduleId === moduleId).map((a) => a.teacherProfileId) : []
  const pool = moduleMatches.length ? moduleMatches : assignments.map((a) => a.teacherProfileId)
  const candidates = [...new Set(pool)]
  if (candidates.length === 1) return candidates[0]

  // Balance by open-request workload.
  const counts = await prisma.supportRequest.groupBy({
    by: ['teacherProfileId'],
    where: { teacherProfileId: { in: candidates }, status: { in: OPEN_STATUSES as unknown as SupportStatus[] } },
    _count: true,
  })
  const load = new Map(counts.map((c) => [c.teacherProfileId as string, c._count]))
  candidates.sort((a, b) => (load.get(a) || 0) - (load.get(b) || 0))
  return candidates[0]
}

/**
 * Can this user view/act on a support request?
 * - student owner
 * - the assigned teacher (their teacherProfile)
 * - a university admin for the request's university (PLATFORM_ADMIN always)
 */
export async function canAccessRequest(
  payload: JWTPayload,
  request: { studentId: string; teacherProfileId: string | null; universityId: string },
): Promise<{ allowed: boolean; viewerRole: 'STUDENT' | 'TEACHER' | 'ADMIN' | null }> {
  if (payload.platformRole === 'PLATFORM_ADMIN') return { allowed: true, viewerRole: 'ADMIN' }
  if (request.studentId === payload.sub) return { allowed: true, viewerRole: 'STUDENT' }

  if (payload.platformRole === 'TEACHER' && request.teacherProfileId) {
    const tp = await prisma.teacherProfile.findUnique({ where: { id: request.teacherProfileId }, select: { userId: true } })
    if (tp?.userId === payload.sub) return { allowed: true, viewerRole: 'TEACHER' }
  }

  if (payload.platformRole === 'UNIVERSITY_ADMIN') {
    const admin = await prisma.user.findUnique({ where: { id: payload.sub }, select: { managedUniversityId: true } })
    if (admin?.managedUniversityId === request.universityId) return { allowed: true, viewerRole: 'ADMIN' }
  }

  return { allowed: false, viewerRole: null }
}

export const SUPPORT_OPEN_STATUSES = OPEN_STATUSES
