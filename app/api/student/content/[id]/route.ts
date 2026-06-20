import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { apiResponse, apiError } from '@/lib/utils'

// GET /api/student/content/:id — full content (with items) if visible to the student.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getSessionFromRequest(req)
  if (!payload) return apiError('Unauthorized', 401)
  const { id } = await params

  const content = await prisma.teacherContent.findUnique({
    where: { id },
    include: { teacherProfile: { select: { fullName: true } }, module: { select: { name: true } } },
  })
  if (!content || content.status !== 'PUBLISHED') return apiError('Content not found.', 404)

  const sp = await prisma.studentProfile.findUnique({
    where: { userId: payload.sub },
    select: { universityId: true, departmentId: true, programmeId: true, enrolments: { select: { moduleId: true } } },
  })

  // Visibility check (same rules as the list).
  const visible = !!sp && content.universityId === sp.universityId && (
    content.targetStudentId === payload.sub ||
    (!!content.moduleId && sp.enrolments.some((e) => e.moduleId === content.moduleId)) ||
    (!!content.departmentId && content.departmentId === sp.departmentId) ||
    (!!content.programmeId && content.programmeId === sp.programmeId)
  )
  if (!visible) return apiError('You do not have access to this content.', 403)

  return apiResponse({ content })
}
