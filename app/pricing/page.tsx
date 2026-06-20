'use client'

import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { CheckCircle, X, Zap, Crown, Users, Star } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'

const FREE_FEATURES = [
  { text: '1 subject', included: true },
  { text: '1 upload (10 pages max)', included: true },
  { text: '10 questions per quiz', included: true },
  { text: '3 quiz attempts total', included: true },
  { text: 'Competitive rooms', included: false },
  { text: 'AI explanations', included: false },
  { text: 'Analytics', included: false },
  { text: 'Ad-free', included: false },
]

const STARTER_FEATURES = [
  { text: '5 subjects', included: true },
  { text: '10 uploads per subject', included: true },
  { text: '50 questions per quiz', included: true },
  { text: 'Unlimited attempts', included: true },
  { text: 'View public quiz rooms', included: true },
  { text: 'AI explanations for wrong answers', included: true },
  { text: 'Basic analytics dashboard', included: true },
  { text: 'Ad-free experience', included: true },
  { text: 'Host competitive rooms', included: false },
  { text: 'Win real prize money', included: false },
]

const PRO_FEATURES = [
  { text: 'Unlimited subjects', included: true },
  { text: 'Unlimited uploads', included: true },
  { text: '100 questions per quiz', included: true },
  { text: 'Unlimited attempts', included: true },
  { text: 'Host & join competitive rooms', included: true },
  { text: 'Win real prize money', included: true },
  { text: 'Advanced AI tutoring', included: true },
  { text: 'Full analytics & heatmaps', included: true },
  { text: 'Priority AI model routing', included: true },
  { text: 'Export PDF quiz reports', included: true },
]

const PLANS = [
  {
    name: 'Explorer',
    plan: 'FREE',
    price: '£0',
    period: 'forever',
    description: 'Perfect for trying AllQ',
    features: FREE_FEATURES,
    ctaLabel: 'Get Started Free',
    ctaHref: '/signup',
    highlight: false,
    badge: null,
    icon: Star,
    color: 'text-slate-400',
    borderColor: 'border-white/10',
  },
  {
    name: 'Learner',
    plan: 'STARTER',
    price: '£4.99',
    period: '/month',
    description: 'For serious students',
    features: STARTER_FEATURES,
    ctaLabel: 'Start Learning',
    highlight: false,
    badge: null,
    icon: Zap,
    color: 'text-allq-green',
    borderColor: 'border-allq-green/20',
  },
  {
    name: 'Champion',
    plan: 'PRO',
    price: '£14.99',
    period: '/month',
    description: 'For competitive winners',
    features: PRO_FEATURES,
    ctaLabel: 'Become a Champion',
    highlight: true,
    badge: 'Most Popular',
    icon: Crown,
    color: 'text-allq-purple',
    borderColor: 'border-allq-purple/40',
  },
]

export default function PricingPage() {
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()

  const handleUpgrade = async (plan: string) => {
    if (!isAuthenticated) {
      window.location.href = '/signup'
      return
    }
    if (plan === 'FREE') {
      window.location.href = '/dashboard'
      return
    }

    try {
      const res = await fetch('/api/payments/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const json = await res.json()
      if (json.data?.url) window.location.href = json.data.url
      else throw new Error(json.error)
    } catch (err: unknown) {
      toast.error('Failed to start checkout', err instanceof Error ? err.message : 'Try again')
    }
  }

  return (
    <div className="min-h-screen hero-bg">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 pt-28 pb-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <Badge variant="purple" size="lg" className="mb-4">Simple, transparent pricing</Badge>
          <h1 className="text-5xl font-black text-white mb-4">
            Choose your <span className="gradient-text">battle level</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Start free and upgrade when you're ready to compete for real prizes
          </p>
        </motion.div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.plan}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                'relative glass rounded-2xl flex flex-col border',
                plan.highlight
                  ? 'border-allq-purple/50 shadow-neon-purple'
                  : plan.borderColor
              )}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="pro" size="md">{plan.badge}</Badge>
                </div>
              )}

              <div className="p-6 flex-1">
                <div className={`inline-flex p-2.5 rounded-xl ${plan.highlight ? 'bg-allq-purple/15' : 'bg-white/5'} mb-4`}>
                  <plan.icon className={`h-5 w-5 ${plan.color}`} />
                </div>

                <h3 className="text-xl font-black text-white mb-0.5">{plan.name}</h3>
                <p className="text-sm text-slate-400 mb-5">{plan.description}</p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className={`text-4xl font-black ${plan.highlight ? 'gradient-text' : 'text-white'}`}>
                    {plan.price}
                  </span>
                  <span className="text-sm text-slate-400">{plan.period}</span>
                </div>

                <ul className="space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature.text} className="flex items-start gap-2.5">
                      {feature.included ? (
                        <CheckCircle className={`h-4.5 w-4.5 flex-shrink-0 mt-0.5 ${plan.highlight ? 'text-allq-purple' : 'text-allq-green'}`} />
                      ) : (
                        <X className="h-4.5 w-4.5 text-slate-600 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={`text-sm ${feature.included ? 'text-slate-300' : 'text-slate-600'}`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 pt-0">
                <Button
                  className="w-full"
                  variant={plan.highlight ? 'primary' : 'secondary'}
                  size="lg"
                  onClick={() => handleUpgrade(plan.plan)}
                >
                  {plan.ctaLabel}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-2xl mx-auto">
          <h2 className="text-2xl font-black text-white text-center mb-8">Common Questions</h2>
          <div className="space-y-4">
            {[
              { q: 'Is it safe to compete with real money?', a: 'Yes. AllQ is PCI DSS compliant via Stripe. We never store card details. Payouts are instant via Stripe Connect.' },
              { q: 'Can I cancel my subscription anytime?', a: 'Absolutely. Cancel from Settings at any time. You keep access until the end of your billing period.' },
              { q: 'How does AI quiz generation work?', a: 'Upload your notes or paste text. Our AI (GPT-4o) reads your material and generates contextually accurate questions — not generic questions.' },
              { q: 'What happens if there is a tie?', a: 'Prize pools are split equally among tied players. Every penny of your share goes directly to your Stripe account.' },
            ].map((faq) => (
              <div key={faq.q} className="glass rounded-xl p-5">
                <p className="font-semibold text-white mb-2">{faq.q}</p>
                <p className="text-sm text-slate-400 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
