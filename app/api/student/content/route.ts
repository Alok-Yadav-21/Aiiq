import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { apiResponse, apiError } from '@/lib/utils'

// GET /api/student/content — learning content published to this student.
export async function GET(req: NextRequest) {
  const payload = await getSessionFromRequest(req)
  if (!payload) return apiError('Unauthorized', 401)

  const sp = await prisma.studentProfile.findUnique({
    where: { userId: payload.sub },
    select: { universityId: true, departmentId: true, programmeId: true, enrolments: { select: { moduleId: true } } },
  })
  if (!sp) return apiResponse({ items: [] })

  const moduleIds = sp.enrolments.map((e) => e.moduleId)
  const or: object[] = [{ targetStudentId: payload.sub }]
  if (moduleIds.length) or.push({ moduleId: { in: moduleIds } })
  if (sp.departmentId) or.push({ departmentId: sp.departmentId })
  if (sp.programmeId) or.push({ programmeId: sp.programmeId })

  const items = await prisma.teacherContent.findMany({
    where: {
      universityId: sp.universityId,
      status: 'PUBLISHED',
      OR: or,
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, type: true, title: true, instructions: true, difficulty: true,
      deadline: true, audience: true, provenance: true, createdAt: true,
      module: { select: { name: true } }, department: { select: { name: true } },
      teacherProfile: { select: { fullName: true } },
    },
    take: 100,
  })
  return apiResponse({ items })
}
