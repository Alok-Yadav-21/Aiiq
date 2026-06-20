import { prisma } from '@/lib/prisma'

export interface TeacherScope {
  teacherProfileId: string
  universityId: string
  departmentIds: string[]
  programmeIds: string[]
  moduleIds: string[]
}

/**
 * The approved teacher's authorised academic scope, derived from their
 * assignments. Returns null if the user is not an approved teacher.
 */
export async function getTeacherScope(userId: string): Promise<TeacherScope | null> {
  const profile = await prisma.teacherProfile.findUnique({
    where: { userId },
    select: { id: true, status: true, universityId: true, assignments: { select: { departmentId: true, programmeId: true, moduleId: true } } },
  })
  if (!profile || profile.status !== 'APPROVED') return null
  return {
    teacherProfileId: profile.id,
    universityId: profile.universityId,
    departmentIds: [...new Set(profile.assignments.map((a) => a.departmentId).filter(Boolean) as string[])],
    programmeIds: [...new Set(profile.assignments.map((a) => a.programmeId).filter(Boolean) as string[])],
    moduleIds: [...new Set(profile.assignments.map((a) => a.moduleId).filter(Boolean) as string[])],
  }
}

/** Does a target audience fall within the teacher's assigned scope? */
export async function audienceInScope(
  scope: TeacherScope,
  audience: string,
  ids: { moduleId?: string | null; departmentId?: string | null; programmeId?: string | null; targetStudentId?: string | null },
): Promise<boolean> {
  if (audience === 'MODULE') return !!ids.moduleId && scope.moduleIds.includes(ids.moduleId)
  if (audience === 'DEPARTMENT') return !!ids.departmentId && scope.departmentIds.includes(ids.departmentId)
  if (audience === 'PROGRAMME') return !!ids.programmeId && scope.programmeIds.includes(ids.programmeId)
  if (audience === 'STUDENT') {
    if (!ids.targetStudentId) return false
    const sp = await prisma.studentProfile.findUnique({ where: { userId: ids.targetStudentId }, select: { universityId: true, departmentId: true, programmeId: true, enrolments: { select: { moduleId: true } } } })
    if (!sp || sp.universityId !== scope.universityId) return false
    // In scope if the student is in one of the teacher's departments/programmes/modules.
    if (sp.departmentId && scope.departmentIds.includes(sp.departmentId)) return true
    if (sp.programmeId && scope.programmeIds.includes(sp.programmeId)) return true
    if (sp.enrolments.some((e) => scope.moduleIds.includes(e.moduleId))) return true
    return false
  }
  return false
}
