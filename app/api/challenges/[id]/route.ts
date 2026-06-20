import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { apiResponse, apiError } from '@/lib/utils'

const patchSchema = z.object({
  action: z.enum(['accept', 'reject']),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return apiError('Unauthorized', 401)

    const body = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return apiError('Invalid action')

    const { action } = parsed.data
    const { id } = await params

    const challenge = await prisma.challenge.findUnique({ where: { id } })
    if (!challenge) return apiError('Challenge not found', 404)
    if (challenge.receiverId !== session.sub) return apiError('Not authorized', 403)
    if (challenge.status !== 'PENDING') return apiError('Challenge is no longer pending')
    if (challenge.expiresAt < new Date()) return apiError('Challenge has expired')

    const updated = await prisma.challenge.update({
      where: { id },
      data: { status: action === 'accept' ? 'ACCEPTED' : 'REJECTED' },
    })

    if (action === 'accept') {
      await prisma.notification.create({
        data: {
          userId: challenge.senderId,
          type: 'CHALLENGE',
          title: 'Challenge Accepted!',
          body: 'Your challenge has been accepted. Head to Compete to start the match.',
          data: { challengeId: id },
        },
      })
    }

    return apiResponse(updated)
  } catch (error) {
    console.error('[challenges PATCH]', error)
    return apiError('Failed to update challenge', 500)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return apiError('Unauthorized', 401)

    const { id } = await params

    const challenge = await prisma.challenge.findUnique({ where: { id } })
    if (!challenge) return apiError('Challenge not found', 404)
    if (challenge.senderId !== session.sub) return apiError('Not authorized', 403)
    if (challenge.status !== 'PENDING') return apiError('Can only cancel pending challenges')

    await prisma.challenge.delete({ where: { id } })

    return apiResponse({ success: true })
  } catch (error) {
    console.error('[challenges DELETE]', error)
    return apiError('Failed to delete challenge', 500)
  }
}
