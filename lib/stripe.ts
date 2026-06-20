import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2023-10-16',
  typescript: true,
})

export const PLANS = {
  STARTER: {
    name: 'Starter',
    tagline: 'Learner',
    price: 499,
    currency: 'gbp',
    priceId: process.env.STRIPE_STARTER_PRICE_ID || 'price_starter',
    features: [
      'Up to 5 subjects',
      '10 uploads per subject',
      '50 questions per quiz',
      'Unlimited attempts',
      'Global quiz rooms (view only)',
      'AI explanations for wrong answers',
      'Basic analytics',
      'Ad-free experience',
    ],
  },
  PRO: {
    name: 'Pro',
    tagline: 'Champion',
    price: 1499,
    currency: 'gbp',
    priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro',
    features: [
      'Unlimited subjects',
      'Unlimited uploads',
      '100 questions per quiz',
      'Unlimited attempts',
      'Full competitive quiz rooms',
      'Win real prize money',
      'Advanced AI tutoring',
      'Full analytics & heatmaps',
      'Priority AI model routing',
      'Export PDF reports',
    ],
  },
}

export async function createCustomer(email: string, name: string): Promise<string> {
  const customer = await stripe.customers.create({ email, name })
  return customer.id
}

export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  userId: string,
  successUrl: string,
  cancelUrl: string
) {
  return stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId },
    subscription_data: { metadata: { userId } },
  })
}

export async function createPaymentIntent(
  amount: number,
  currency: string,
  customerId: string,
  metadata: Record<string, string>
) {
  return stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency,
    customer: customerId,
    automatic_payment_methods: { enabled: true },
    metadata,
  })
}

export async function createPortalSession(customerId: string, returnUrl: string) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}

export function constructWebhookEvent(payload: Buffer, signature: string) {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder'
  )
}
