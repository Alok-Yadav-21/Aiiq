'use client'

import Link from 'next/link'
import { CheckCircle, X, Zap, Crown, Star } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { MarketingShell } from '@/components/marketing/marketing-shell'

/* Champagne / rose-gold accent (matches home & about). */
const goldText = {
  backgroundImage: 'linear-gradient(135deg,#cda06f 0%,#9c6d44 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
} as const

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
  { text: 'Host competitive rooms', included: false },
]

const PRO_FEATURES = [
  { text: 'Unlimited subjects', included: true },
  { text: 'Unlimited uploads', included: true },
  { text: '100 questions per quiz', included: true },
  { text: 'Unlimited attempts', included: true },
  { text: 'Host & join competitive rooms', included: true },
  { text: 'Ranked ELO competition', included: true },
  { text: 'Advanced AI tutoring', included: true },
  { text: 'Full analytics & heatmaps', included: true },
  { text: 'Priority AI model routing', included: true },
  { text: 'Export PDF quiz reports', included: true },
]

const PLANS = [
  { name: 'Explorer', plan: 'FREE', price: '£0', period: 'forever', description: 'Perfect for trying AIIQ', features: FREE_FEATURES, ctaLabel: 'Get Started Free', highlight: false, badge: null, icon: Star },
  { name: 'Learner', plan: 'STARTER', price: '£4.99', period: '/month', description: 'For serious students', features: STARTER_FEATURES, ctaLabel: 'Start Learning', highlight: false, badge: null, icon: Zap },
  { name: 'Champion', plan: 'PRO', price: '£14.99', period: '/month', description: 'For competitive learners', features: PRO_FEATURES, ctaLabel: 'Become a Champion', highlight: true, badge: 'Most Popular', icon: Crown },
]

const FAQ = [
  { q: 'Does competing cost money?', a: 'No. Live rooms and leaderboards are skill-based — there are no entry fees, wagers or cash prizes. Ranking is the reward. The only payment on AIIQ is your optional subscription.' },
  { q: 'Can I cancel my subscription anytime?', a: 'Absolutely. Cancel from Settings at any time. You keep access until the end of your billing period.' },
  { q: 'How does AI quiz generation work?', a: 'Upload your notes or paste text. Our AI reads your material and generates contextually accurate questions — strictly from your content, never generic.' },
  { q: 'What happens if there is a tie?', a: 'Tied players share the same rank. Where a tiebreak is needed, the faster average answer time takes the higher position.' },
]

const Label = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[11px] font-semibold tracking-[0.28em] text-[#9a8260]">{children}</p>
)

export default function PricingPage() {
  const { isAuthenticated } = useAuth()
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
    <MarketingShell>

        {/* ── HERO ── */}
        <section className="px-7 sm:px-12 pt-16 sm:pt-20 pb-14 text-center">
          <Label>PRICING</Label>
          <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[0.98]">
            Choose your <span style={goldText}>battle level</span>
          </h1>
          <p className="mt-5 text-[15px] text-[#666] max-w-xl mx-auto">
            Start free and upgrade when you want more subjects, longer quizzes and full analytics.
          </p>
        </section>

        {/* ── PLANS ── */}
        <section className="px-7 sm:px-12 pb-8">
          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {PLANS.map((plan) => (
              <div
                key={plan.plan}
                className="relative rounded-3xl flex flex-col p-7"
                style={
                  plan.highlight
                    ? { background: 'linear-gradient(160deg,#1c1814 0%,#2a2218 100%)', boxShadow: '0 30px 60px -28px rgba(120,80,40,0.5)' }
                    : { background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)' }
                }
              >
                {plan.badge && (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-bold tracking-[0.15em] text-white"
                    style={{ background: 'linear-gradient(135deg,#cda06f,#9c6d44)' }}
                  >
                    {plan.badge.toUpperCase()}
                  </span>
                )}

                <div className="flex-1">
                  <div
                    className="inline-flex p-2.5 rounded-xl mb-5"
                    style={plan.highlight ? { background: 'rgba(205,160,111,0.18)' } : { background: '#f3eadb' }}
                  >
                    <plan.icon className="h-5 w-5" style={{ color: plan.highlight ? '#e6c9a3' : '#9c6d44' }} />
                  </div>

                  <h3 className={`text-xl font-black ${plan.highlight ? 'text-white' : 'text-[#111]'}`}>{plan.name}</h3>
                  <p className={`text-[13px] mt-0.5 ${plan.highlight ? 'text-white/55' : 'text-[#8b8b87]'}`}>{plan.description}</p>

                  <div className="flex items-baseline gap-1 mt-6 mb-7">
                    <span className="text-4xl font-black" style={plan.highlight ? goldText : { color: '#111' }}>{plan.price}</span>
                    <span className={`text-[13px] ${plan.highlight ? 'text-white/50' : 'text-[#8b8b87]'}`}>{plan.period}</span>
                  </div>

                  <ul className="space-y-3">
                    {plan.features.map((f) => (
                      <li key={f.text} className="flex items-start gap-2.5">
                        {f.included ? (
                          <CheckCircle className="h-[18px] w-[18px] flex-shrink-0 mt-0.5" style={{ color: plan.highlight ? '#cda06f' : '#10b981' }} />
                        ) : (
                          <X className={`h-[18px] w-[18px] flex-shrink-0 mt-0.5 ${plan.highlight ? 'text-white/25' : 'text-[#cfcfcc]'}`} />
                        )}
                        <span className={`text-[13px] ${f.included ? (plan.highlight ? 'text-white/85' : 'text-[#555]') : (plan.highlight ? 'text-white/35' : 'text-[#aaa]')}`}>
                          {f.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleUpgrade(plan.plan)}
                  className={
                    'mt-7 w-full rounded-full py-3 text-[12px] font-semibold tracking-[0.16em] transition-colors ' +
                    (plan.highlight
                      ? 'text-[#1a1a1a] bg-white hover:bg-[#f3eadb]'
                      : 'border border-[#1a1a1a] hover:bg-[#111] hover:text-white')
                  }
                >
                  {plan.ctaLabel.toUpperCase()}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="px-7 sm:px-12 py-16 border-t border-black/[0.07] mt-8">
          <div className="text-center mb-10">
            <Label>FAQ</Label>
            <h2 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight">Common questions</h2>
          </div>
          <div className="max-w-2xl mx-auto space-y-4">
            {FAQ.map((faq) => (
              <div key={faq.q} className="rounded-2xl border border-black/[0.07] bg-white/70 p-5">
                <p className="font-bold text-[14px] text-[#111] mb-2">{faq.q}</p>
                <p className="text-[13px] text-[#666] leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

    </MarketingShell>
  )
}
