import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { getTeacherScope, audienceInScope } from '@/lib/teacher'
import { audit } from '@/lib/audit'
import { notify } from '@/lib/notify'
import { apiResponse, apiError } from '@/lib/utils'

const TYPES = ['QUIZ', 'MCQ', 'FLASHCARDS', 'QA', 'SHORT_ANSWER', 'LONG_ANSWER', 'PRACTICE_TEST', 'ASSIGNMENT', 'REVISION', 'TOPIC_EXPLANATION', 'STUDY_GUIDE']
const AUDIENCES = ['STUDENT', 'MODULE', 'DEPARTMENT', 'PROGRAMME']
const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD', 'EXPERT']

// GET /api/teacher/content — the teacher's own created content.
export async function GET(req: NextRequest) {
  const payload = await getSessionFromRequest(req)
  if (!payload) return apiError('Unauthorized', 401)
  const scope = await getTeacherScope(payload.sub)
  if (!scope) return apiError('Approved teachers only.', 403)

  const items = await prisma.teacherContent.findMany({
    where: { teacherProfileId: scope.teacherProfileId },
    orderBy: { createdAt: 'desc' },
    include: { module: { select: { name: true } }, department: { select: { name: true } }, programme: { select: { name: true } } },
  })
  return apiResponse({ items })
}

// POST /api/teacher/content — create & publish learning content.
export async function POST(req: NextRequest) {
  const payload = await getSessionFromRequest(req)
  if (!payload) return apiError('Unauthorized', 401)
  const scope = await getTeacherScope(payload.sub)
  if (!scope) return apiError('Approved teachers only.', 403)

  const body = await req.json().catch(() => null)
  const type = TYPES.includes(body?.type) ? body.type : null
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  const audience = AUDIENCES.includes(body?.audience) ? body.audience : null
  const items = Array.isArray(body?.items) ? body.items : []
  if (!type) return apiError('Invalid content type.', 400)
  if (title.length < 3) return apiError('Title is required.', 400)
  if (!audience) return apiError('Choose an audience.', 400)
  if (items.length === 0 && !['TOPIC_EXPLANATION', 'STUDY_GUIDE'].includes(type)) return apiError('Add at least one item.', 400)

  const ids = {
    moduleId: typeof body?.moduleId === 'string' ? body.moduleId : null,
    departmentId: typeof body?.departmentId === 'string' ? body.departmentId : null,
    programmeId: typeof body?.programmeId === 'string' ? body.programmeId : null,
    targetStudentId: typeof body?.targetStudentId === 'string' ? body.targetStudentId : null,
  }

  // Authorisation: the audience must be inside the teacher's assigned scope.
  if (!(await audienceInScope(scope, audience, ids))) {
    return apiError('You can only publish to your assigned modules, departments, or your students.', 403)
  }

  const content = await prisma.teacherContent.create({
    data: {
      teacherProfileId: scope.teacherProfileId,
      universityId: scope.universityId,
      type,
      title,
      instructions: typeof body?.instructions === 'string' ? body.instructions : null,
      difficulty: DIFFICULTIES.includes(body?.difficulty) ? body.difficulty : null,
      items,
      audience,
      moduleId: ids.moduleId,
      departmentId: ids.departmentId,
      programmeId: ids.programmeId,
      targetStudentId: ids.targetStudentId,
      deadline: body?.deadline ? new Date(body.deadline) : null,
      maxAttempts: Number.isInteger(body?.maxAttempts) ? body.maxAttempts : null,
      passingScore: Number.isInteger(body?.passingScore) ? body.passingScore : null,
      marks: Number.isInteger(body?.marks) ? body.marks : null,
      status: body?.status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED',
      sourceRequestId: typeof body?.sourceRequestId === 'string' ? body.sourceRequestId : null,
      provenance: 'TEACHER_CREATED',
    },
  })

  await audit({ userId: payload.sub, action: 'content.create', resource: 'TeacherContent', resourceId: content.id, metadata: { type, audience } })

  // Notify the target student for student-specific content (module/dept fan-out
  // is intentionally deferred to avoid mass notifications).
  if (content.status === 'PUBLISHED' && audience === 'STUDENT' && ids.targetStudentId) {
    await notify({ userId: ids.targetStudentId, type: 'CONTENT_NEW', title: 'New learning content', body: `Your teacher shared: "${title}"`, data: { contentId: content.id }, email: true })
  }
  return apiResponse({ id: content.id, status: content.status }, 201)
}
