import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiResponse, apiError } from '@/lib/utils'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const scope = searchParams.get('scope') || 'global'
    const subjectId = searchParams.get('subjectId') || undefined
    const period = searchParams.get('period') || undefined

    const topUsers = await prisma.userProfile.findMany({
      orderBy: [{ totalWins: 'desc' }, { eloRating: 'desc' }],
      take: 50,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            subscription: { select: { plan: true } },
          },
        },
      },
    })

    const leaderboard = topUsers.map((profile, index) => ({
      rank: index + 1,
      userId: profile.userId,
      name: profile.user.name,
      image: profile.user.image,
      eloRating: profile.eloRating,
      totalWins: profile.totalWins,
      totalLosses: profile.totalLosses,
      totalEarnings: Number(profile.totalEarnings),
      plan: profile.user.subscription?.plan || 'FREE',
    }))

    return apiResponse(leaderboard)
  } catch (error) {
    console.error('[leaderboard GET]', error)
    return apiError('Failed to fetch leaderboard', 500)
  }
}
