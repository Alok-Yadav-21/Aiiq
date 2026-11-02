import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { apiResponse, apiError } from '@/lib/utils'

const createSchema = z.object({
  receiverId: z.string().min(1),
  subjectId: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return apiError('Unauthorized', 401)

    const challenges = await prisma.challenge.findMany({
      where: {
        OR: [
          { senderId: session.sub },
          { receiverId: session.sub },
        ],
      },
      include: {
        sender: { select: { id: true, name: true, profile: { select: { eloRating: true } } } },
        receiver: { select: { id: true, name: true, profile: { select: { eloRating: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    // Fetch subject titles for challenges that have a subjectId
    const subjectIds = Array.from(new Set(challenges.filter((c) => c.subjectId).map((c) => c.subjectId!)))
    const subjects = subjectIds.length > 0
      ? await prisma.subject.findMany({
          where: { id: { in: subjectIds } },
          select: { id: true, title: true },
        })
      : []
    const subjectMap = Object.fromEntries(subjects.map((s) => [s.id, s]))

    const mapped = challenges.map((c) => ({
      id: c.id,
      status: c.status,
      expiresAt: c.expiresAt.toISOString(),
      createdAt: c.createdAt.toISOString(),
      subject: c.subjectId ? subjectMap[c.subjectId] ?? null : null,
      challenger: { id: c.sender.id, name: c.sender.name, profile: c.sender.profile },
      challenged: { id: c.receiver.id, name: c.receiver.name, profile: c.receiver.profile },
    }))

    return apiResponse(mapped)
  } catch (error) {
    console.error('[challenges GET]', error)
    return apiError('Failed to fetch challenges', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return apiError('Unauthorized', 401)

    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.errors[0]?.message || 'Invalid input')

    const { receiverId, subjectId } = parsed.data

    if (receiverId === session.sub) {
      return apiError('You cannot challenge yourself')
    }

    const receiver = await prisma.user.findUnique({ where: { id: receiverId } })
    if (!receiver) return apiError('User not found', 404)

    const existing = await prisma.challenge.findFirst({
      where: {
        senderId: session.sub,
        receiverId,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
    })
    if (existing) return apiError('You already have a pending challenge against this player')

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    const challenge = await prisma.challenge.create({
      data: {
        senderId: session.sub,
        receiverId,
        subjectId: subjectId || null,
        entryFee: 0,
        status: 'PENDING',
        expiresAt,
      },
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
      },
    })

    const subjectTitle = subjectId
      ? (await prisma.subject.findUnique({ where: { id: subjectId }, select: { title: true } }))?.title
      : null

    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: 'CHALLENGE',
        title: 'New Challenge!',
        body: `${challenge.sender.name || 'Someone'} has challenged you to a quiz duel${subjectTitle ? ` on ${subjectTitle}` : ''}.`,
        data: { challengeId: challenge.id },
      },
    })

    return apiResponse(challenge, 201)
  } catch (error) {
    console.error('[challenges POST]', error)
    return apiError('Failed to create challenge', 500)
  }
}
