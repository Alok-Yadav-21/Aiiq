import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { constructWebhookEvent } from '@/lib/stripe'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return Response.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = constructWebhookEvent(Buffer.from(body), signature)
  } catch (err) {
    console.error('[stripe webhook] Invalid signature', err)
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        if (!userId || session.mode !== 'subscription') break

        const subscription = await import('stripe').then((s) =>
          new s.default(process.env.STRIPE_SECRET_KEY || '').subscriptions.retrieve(
            session.subscription as string
          )
        )

        await prisma.userSubscription.upsert({
          where: { userId },
          create: {
            userId,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            plan: 'FREE',
            status: subscription.status,
          },
          update: {
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            status: subscription.status,
          },
        })
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.userId

        if (!userId) break

        const priceId = sub.items.data[0]?.price.id
        const plan = priceId === process.env.STRIPE_PRO_PRICE_ID ? 'PRO' :
                     priceId === process.env.STRIPE_STARTER_PRICE_ID ? 'STARTER' : 'FREE'

        await prisma.userSubscription.upsert({
          where: { userId },
          create: {
            userId,
            stripeCustomerId: sub.customer as string,
            stripeSubscriptionId: sub.id,
            stripePriceId: priceId,
            plan: event.type === 'customer.subscription.deleted' ? 'FREE' : plan,
            status: sub.status,
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
          update: {
            stripePriceId: priceId,
            plan: event.type === 'customer.subscription.deleted' ? 'FREE' : plan,
            status: sub.status,
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
        })

        await prisma.user.update({
          where: { id: userId },
          data: {
            role: event.type === 'customer.subscription.deleted' ? 'FREE' :
                  plan === 'PRO' ? 'PRO' : 'STARTER',
          },
        })
        break
      }
    }

    return Response.json({ received: true })
  } catch (error) {
    console.error('[stripe webhook] Processing error', error)
    return Response.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
