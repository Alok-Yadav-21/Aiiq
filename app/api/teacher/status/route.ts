import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { apiResponse, apiError } from '@/lib/utils'

// GET /api/teacher/status — the signed-in user's teacher application status (if any).
export async function GET(req: NextRequest) {
  const payload = await getSessionFromRequest(req)
  if (!payload) return apiError('Unauthorized', 401)

  const profile = await prisma.teacherProfile.findUnique({
    where: { userId: payload.sub },
    include: {
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

  return apiResponse({ profile, platformRole: payload.platformRole })
}
