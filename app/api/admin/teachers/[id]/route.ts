import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authorize, assertUniversityAccess } from '@/lib/rbac'
import { audit } from '@/lib/audit'
import { notify } from '@/lib/notify'
import { apiResponse, apiError } from '@/lib/utils'

// PATCH /api/admin/teachers/:id  body { action: 'approve'|'reject'|'suspend'|'reinstate', reason? }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(req, ['UNIVERSITY_ADMIN'])
  if (!auth.ok) return auth.res
  const { id } = await params

  const body = await req.json().catch(() => null)
  const action = body?.action
  const reason = typeof body?.reason === 'string' ? body.reason.trim() : null
  if (!['approve', 'reject', 'suspend', 'reinstate'].includes(action)) {
    return apiError('Invalid action. Use approve, reject, suspend, or reinstate.', 400)
  }

  const profile = await prisma.teacherProfile.findUnique({ where: { id } })
  if (!profile) return apiError('Teacher application not found.', 404)

  // University isolation — admins can only act on their own university's teachers.
  const forbidden = await assertUniversityAccess(auth.payload, profile.universityId)
  if (forbidden) return forbidden

  let status: 'APPROVED' | 'REJECTED' | 'SUSPENDED'
  let platformRole: 'STUDENT' | 'TEACHER'
  if (action === 'approve' || action === 'reinstate') { status = 'APPROVED'; platformRole = 'TEACHER' }
  else if (action === 'reject') { status = 'REJECTED'; platformRole = 'STUDENT' }
  else { status = 'SUSPENDED'; platformRole = 'STUDENT' } // suspend

  // Update profile + the user's platformRole atomically.
  const [updated] = await prisma.$transaction([
    prisma.teacherProfile.update({
      where: { id },
      data: { status, rejectionReason: action === 'reject' ? reason : null, reviewedById: auth.payload.sub, reviewedAt: new Date() },
    }),
    prisma.user.update({ where: { id: profile.userId }, data: { platformRole } }),
    // Approving auto-creates an assignment to the stated department (admin can add more).
    ...((action === 'approve' || action === 'reinstate') && profile.requestedDepartmentId
      ? [prisma.teacherAssignment.createMany({ data: [{ teacherProfileId: id, departmentId: profile.requestedDepartmentId }], skipDuplicates: true })]
      : []),
    // Revoking access removes their authorised scope.
    ...(action === 'reject' || action === 'suspend'
      ? [prisma.teacherAssignment.deleteMany({ where: { teacherProfileId: id } })]
      : []),
  ])

  await audit({ userId: auth.payload.sub, action: `teacher.${action}`, resource: 'TeacherProfile', resourceId: id, metadata: { reason } })

  // Notify the applicant of the verification decision.
  const decisionText: Record<string, string> = {
    APPROVED: 'Your teacher account has been approved. You now have access to the teacher dashboard.',
    REJECTED: `Your teacher application was not approved.${reason ? ` Reason: ${reason}` : ''}`,
    SUSPENDED: 'Your teacher access has been suspended. Contact your university administrator.',
  }
  await notify({ userId: profile.userId, type: 'TEACHER_STATUS', title: `Teacher status: ${status}`, body: decisionText[status] || '', email: true })
  return apiResponse({ id: updated.id, status: updated.status })
}
