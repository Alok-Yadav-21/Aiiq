import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiResponse, apiError } from '@/lib/utils'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        image: true,
        createdAt: true,
        subscription: { select: { plan: true } },
        profile: {
          select: {
            eloRating: true,
            totalWins: true,
            totalLosses: true,
            totalEarnings: true,
            weeklyStreak: true,
          },
        },
        subjects: {
          where: { isPublic: true },
          select: {
            id: true,
            title: true,
            category: true,
            difficulty: true,
            _count: { select: { enrollments: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!user) return apiError('User not found', 404)

    return apiResponse({
      ...user,
      profile: user.profile
        ? { ...user.profile, totalEarnings: Number(user.profile.totalEarnings) }
        : null,
    })
  } catch (error) {
    console.error('[users GET]', error)
    return apiError('Failed to fetch user', 500)
  }
}
