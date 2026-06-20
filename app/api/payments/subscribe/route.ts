import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { stripe, PLANS, createCustomer, createCheckoutSession, createPortalSession } from '@/lib/stripe'
import { apiResponse, apiError } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const payload = await getSessionFromRequest(req)
    if (!payload) return apiError('Unauthorized', 401)

    const { plan, action } = await req.json()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { subscription: true },
    })
    if (!user) return apiError('User not found', 404)

    if (action === 'portal') {
      if (!user.subscription?.stripeCustomerId) {
        return apiError('No active subscription', 400)
      }
      const session = await createPortalSession(
        user.subscription.stripeCustomerId,
        `${appUrl}/settings`
      )
      return apiResponse({ url: session.url })
    }

    if (!plan || !PLANS[plan as keyof typeof PLANS]) {
      return apiError('Invalid plan', 400)
    }

    const planData = PLANS[plan as keyof typeof PLANS]

    let customerId = user.subscription?.stripeCustomerId
    if (!customerId) {
      customerId = await createCustomer(user.email, user.name || user.email)
      await prisma.userSubscription.upsert({
        where: { userId: user.id },
        create: { userId: user.id, plan: 'FREE', stripeCustomerId: customerId },
        update: { stripeCustomerId: customerId },
      })
    }

    const session = await createCheckoutSession(
      customerId,
      planData.priceId,
      user.id,
      `${appUrl}/dashboard?upgraded=true`,
      `${appUrl}/pricing`
    )

    return apiResponse({ url: session.url })
  } catch (error) {
    console.error('[subscribe]', error)
    return apiError('Payment setup failed', 500)
  }
}
