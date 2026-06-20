import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest, getPlanLimits } from '@/lib/auth'
import { apiResponse, apiError } from '@/lib/utils'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const room = await prisma.quizRoom.findUnique({
      where: { id },
      include: {
        subject: { select: { title: true, category: true, difficulty: true, description: true } },
        players: {
          include: {
            user: {
              select: { name: true, image: true, profile: { select: { eloRating: true, totalWins: true } } },
            },
          },
        },
        _count: { select: { players: true } },
      },
    })

    if (!room) return apiError('Room not found', 404)
    return apiResponse(room)
  } catch (error) {
    console.error('[room GET]', error)
    return apiError('Failed to fetch room', 500)
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { action } = await req.json()
    const payload = await getSessionFromRequest(req)
    if (!payload) return apiError('Unauthorized', 401)

    const room = await prisma.quizRoom.findUnique({
      where: { id },
      include: { _count: { select: { players: true } } },
    })
    if (!room) return apiError('Room not found', 404)

    if (action === 'join') {
      if (room.status !== 'WAITING') return apiError('Room is not accepting players', 400)
      if (room._count.players >= room.maxPlayers) return apiError('Room is full', 400)

      const subscription = await prisma.userSubscription.findUnique({
        where: { userId: payload.sub },
      })
      const limits = getPlanLimits(subscription?.plan || 'FREE')

      if (!limits.canCompete) {
        return apiError('Upgrade to Starter or Pro to join competitive rooms', 403)
      }

      const existing = await prisma.quizRoomPlayer.findUnique({
        where: { roomId_userId: { roomId: id, userId: payload.sub } },
      })
      if (existing) return apiError('Already in this room', 400)

      const player = await prisma.quizRoomPlayer.create({
        data: { roomId: id, userId: payload.sub },
        include: {
          user: { select: { name: true, image: true, profile: { select: { eloRating: true } } } },
        },
      })

      await prisma.quizRoom.update({
        where: { id },
        data: { prizePool: { increment: Number(room.entryFee) } },
      })

      return apiResponse(player)
    }

    if (action === 'leave') {
      await prisma.quizRoomPlayer.delete({
        where: { roomId_userId: { roomId: id, userId: payload.sub } },
      })
      await prisma.quizRoom.update({
        where: { id },
        data: { prizePool: { decrement: Number(room.entryFee) } },
      })
      return apiResponse({ left: true })
    }

    return apiError('Unknown action', 400)
  } catch (error) {
    console.error('[room action]', error)
    return apiError('Failed to perform action', 500)
  }
}
