import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest, getPlanLimits } from '@/lib/auth'
import { createRoomSchema } from '@/lib/validations'
import { apiResponse, apiError } from '@/lib/utils'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'WAITING'
    const subjectId = searchParams.get('subjectId') || undefined

    const rooms = await prisma.quizRoom.findMany({
      where: {
        status: status as any,
        ...(subjectId && { subjectId }),
      },
      include: {
        subject: { select: { title: true, category: true, difficulty: true } },
        _count: { select: { players: true } },
        players: {
          include: {
            user: { select: { name: true, image: true, profile: { select: { eloRating: true } } } },
          },
          take: 6,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return apiResponse(rooms)
  } catch (error) {
    console.error('[rooms GET]', error)
    return apiError('Failed to fetch rooms', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await getSessionFromRequest(req)
    if (!payload) return apiError('Unauthorized', 401)

    const subscription = await prisma.userSubscription.findUnique({
      where: { userId: payload.sub },
    })
    const limits = getPlanLimits(subscription?.plan || 'FREE')

    if (!limits.canCompete) {
      return apiError('Upgrade to Starter or Pro to create quiz rooms', 403)
    }

    const body = await req.json()
    const parsed = createRoomSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 400)

    const subject = await prisma.subject.findFirst({
      where: { id: parsed.data.subjectId },
      select: { id: true, title: true },
    })
    if (!subject) return apiError('Subject not found', 404)

    const room = await prisma.quizRoom.create({
      data: {
        ...parsed.data,
        hostId: payload.sub,
        // Competition on AIIQ is skill-based: no entry fees, no prize pools.
        entryFee: 0,
        prizePool: 0,
        title: parsed.data.title || `${subject.title} Battle`,
      },
      include: {
        subject: { select: { title: true, category: true, difficulty: true } },
        _count: { select: { players: true } },
      },
    })

    return apiResponse(room, 201)
  } catch (error) {
    console.error('[rooms POST]', error)
    return apiError('Failed to create room', 500)
  }
}
