import Link from 'next/link'
import type { Metadata } from 'next'
import { MarketingShell } from '@/components/marketing/marketing-shell'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'AIIQ Privacy Policy — how we collect, use, and protect your data.',
}

const LAST_UPDATED = 'June 11, 2025'

const Label = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[11px] font-semibold tracking-[0.28em] text-[#9a8260]">{children}</p>
)

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-baseline gap-3 mb-3">
        <span className="text-sm font-black tabular-nums" style={{ background: 'linear-gradient(135deg,#cda06f,#9c6d44)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{n}</span>
        <h2 className="text-lg font-bold text-[#111]">{title}</h2>
      </div>
      <div className="rounded-2xl border border-black/[0.07] bg-white/70 p-6 text-[13px] leading-relaxed text-[#555] space-y-3">
        {children}
      </div>
    </section>
  )
}

const goldLink = { color: '#9c6d44' }

const THIRD_PARTIES = [
  { name: 'Stripe', purpose: 'Subscription billing. Stripe processes all payment transactions; we never store card details.', link: 'https://stripe.com/privacy' },
  { name: 'AI Provider', purpose: 'AI-powered quiz generation and chat. Your uploaded content is sent to the AI API for processing and is not used to train models.', link: 'https://ai.google.dev/gemini-api/terms' },
  { name: 'Google OAuth', purpose: 'Optional sign-in method. If used, we receive your name, email, and profile picture from Google.', link: 'https://policies.google.com/privacy' },
  { name: 'GitHub OAuth', purpose: 'Optional sign-in method. If used, we receive your name, email, and avatar from GitHub.', link: 'https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement' },
]

export default function PrivacyPage() {
  return (
    <MarketingShell>

        {/* ── HERO ── */}
        <section className="px-7 sm:px-12 pt-16 sm:pt-20 pb-12 text-center">
          <Label>LEGAL</Label>
          <h1 className="mt-4 text-4xl sm:text-5xl font-black tracking-tight">Privacy Policy</h1>
          <p className="mt-4 text-[13px] text-[#8b8b87]">Last updated: {LAST_UPDATED}</p>
        </section>

        {/* ── BODY ── */}
        <div className="px-7 sm:px-12 pb-16 max-w-3xl mx-auto space-y-10">
          <Section n="01" title="Data We Collect">
            <p>We collect the following categories of data when you use AIIQ:</p>
            <div className="space-y-4">
              <div>
                <h4 className="text-[#111] font-semibold mb-1">Account Information</h4>
                <p>Name, email address, and password hash (bcrypt, never stored in plain text). If you sign in via Google or GitHub, we receive your profile information from those providers.</p>
              </div>
              <div>
                <h4 className="text-[#111] font-semibold mb-1">Usage Data</h4>
                <p>Quiz attempts, scores, ELO rating changes, subjects created, and time spent on the platform. This data powers your analytics dashboard and adaptive learning engine.</p>
              </div>
              <div>
                <h4 className="text-[#111] font-semibold mb-1">Uploaded Content</h4>
                <p>Study materials you upload (PDF, images, text). These are stored securely and processed by AI to generate quiz questions. They are never shared with other users or used to train AI models.</p>
              </div>
              <div>
                <h4 className="text-[#111] font-semibold mb-1">Payment Information</h4>
                <p>Payment data is handled entirely by Stripe. We never store card numbers, CVVs, or bank account details. We store only a Stripe Customer ID and subscription status.</p>
              </div>
              <div>
                <h4 className="text-[#111] font-semibold mb-1">Technical Data</h4>
                <p>IP address, browser type, device type, and operating system — used for security, fraud detection, and performance monitoring.</p>
              </div>
            </div>
          </Section>

          <Section n="02" title="How We Use Your Data">
            <p>We use your data to:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Provide, operate, and improve the AIIQ platform</li>
              <li>Generate AI-powered quizzes from your uploaded materials</li>
              <li>Calculate your ELO rating and place you on global leaderboards</li>
              <li>Process subscription payments</li>
              <li>Send transactional emails (receipts, password resets, challenge notifications)</li>
              <li>Detect and prevent fraud, cheating, and abuse</li>
              <li>Comply with legal obligations</li>
              <li>Send product updates (you can opt out at any time)</li>
            </ul>
            <p>We do <strong className="text-[#111]">not</strong> sell your personal data to third parties. We do not use your study materials or quiz performance data for advertising purposes.</p>
          </Section>

          <Section n="03" title="Cookies">
            <p>We use the following types of cookies:</p>
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="font-semibold whitespace-nowrap" style={{ color: '#9c6d44' }}>Essential</span>
                <p>Authentication tokens (<code className="bg-[#f3eadb] px-1.5 py-0.5 rounded text-xs" style={{ color: '#8a5e38' }}>allq_token</code>) required for you to stay logged in. These cannot be disabled.</p>
              </div>
              <div className="flex gap-3">
                <span className="font-semibold whitespace-nowrap" style={{ color: '#9c6d44' }}>Analytics</span>
                <p>We use first-party analytics to understand which features are most used. No third-party tracking cookies are set without your explicit consent.</p>
              </div>
              <div className="flex gap-3">
                <span className="font-semibold whitespace-nowrap" style={{ color: '#9c6d44' }}>Preferences</span>
                <p>Local storage is used to remember your UI preferences (e.g., theme, sidebar state). This data never leaves your device.</p>
              </div>
            </div>
          </Section>

          <Section n="04" title="Third Parties">
            {THIRD_PARTIES.map((tp) => (
              <div key={tp.name}>
                <h4 className="text-[#111] font-semibold mb-1">{tp.name}</h4>
                <p>{tp.purpose}{' '}
                  <a href={tp.link} target="_blank" rel="noopener noreferrer" className="text-xs hover:underline" style={goldLink}>Privacy Policy ↗</a>
                </p>
              </div>
            ))}
          </Section>

          <Section n="05" title="Data Retention">
            <p>We retain your data as follows:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong className="text-[#111]">Account data:</strong> Retained while your account is active and for 90 days after deletion</li>
              <li><strong className="text-[#111]">Uploaded materials:</strong> Deleted within 30 days of account deletion</li>
              <li><strong className="text-[#111]">Quiz history:</strong> Retained for 2 years for leaderboard integrity; anonymised after account deletion</li>
              <li><strong className="text-[#111]">Payment records:</strong> Retained for 7 years as required by UK financial regulations</li>
              <li><strong className="text-[#111]">Server logs:</strong> Retained for 30 days, then permanently deleted</li>
            </ul>
          </Section>

          <Section n="06" title="Your Rights (GDPR)">
            <p>If you are in the European Economic Area (EEA) or United Kingdom, you have the following rights under GDPR / UK GDPR:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong className="text-[#111]">Access:</strong> Request a copy of all personal data we hold about you</li>
              <li><strong className="text-[#111]">Rectification:</strong> Correct inaccurate or incomplete data</li>
              <li><strong className="text-[#111]">Erasure:</strong> Request deletion of your personal data (&ldquo;right to be forgotten&rdquo;)</li>
              <li><strong className="text-[#111]">Portability:</strong> Receive your data in a structured, machine-readable format</li>
              <li><strong className="text-[#111]">Restriction:</strong> Request that we restrict processing of your data</li>
              <li><strong className="text-[#111]">Objection:</strong> Object to processing based on legitimate interests</li>
              <li><strong className="text-[#111]">Withdraw consent:</strong> Withdraw any consent previously given at any time</li>
            </ul>
            <p>To exercise any of these rights, email us at{' '}
              <a href="mailto:privacy@aiiq.app" className="font-semibold hover:underline" style={goldLink}>privacy@aiiq.app</a>. We will respond within 30 days. You also have the right to lodge a complaint with the UK ICO at{' '}
              <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={goldLink}>ico.org.uk</a>.</p>
          </Section>

          <Section n="07" title="Contact">
            <p>AIIQ is operated by AIIQ Ltd, registered in England and Wales.</p>
            <p>Data Protection Officer:{' '}
              <a href="mailto:privacy@aiiq.app" className="font-semibold hover:underline" style={goldLink}>privacy@aiiq.app</a></p>
            <p>General enquiries:{' '}
              <a href="mailto:hello@aiiq.app" className="font-semibold hover:underline" style={goldLink}>hello@aiiq.app</a></p>
          </Section>
        </div>

    </MarketingShell>
  )
}
