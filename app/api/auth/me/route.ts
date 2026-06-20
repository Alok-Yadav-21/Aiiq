import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiResponse, apiError } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const payload = await getSessionFromRequest(req)
  if (!payload) return apiError('Unauthorized', 401)

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      platformRole: true,
      createdAt: true,
      managedUniversityId: true,
      studentProfile: {
        select: { universityId: true, departmentId: true, programmeId: true, academicYearId: true },
      },
      profile: {
        select: {
          bio: true,
          country: true,
          eloRating: true,
          totalWins: true,
          totalLosses: true,
          totalEarnings: true,
          weeklyStreak: true,
        },
      },
      subscription: {
        select: {
          plan: true,
          status: true,
          currentPeriodEnd: true,
          cancelAtPeriodEnd: true,
        },
      },
    },
  })

  if (!user) return apiError('User not found', 404)
  return apiResponse(user)
}
