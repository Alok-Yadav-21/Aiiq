import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'
import { Zap } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'AllQ Privacy Policy — how we collect, use, and protect your data.',
}

const LAST_UPDATED = 'June 11, 2025'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg-base">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 pt-28 pb-20">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 mb-4 text-sm text-slate-500">
            <Zap className="h-4 w-4 text-allq-purple" />
            <span>Legal</span>
            <span>/</span>
            <span className="text-slate-300">Privacy Policy</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-3">Privacy Policy</h1>
          <p className="text-slate-400">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="space-y-10">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Data We Collect</h2>
            <div className="glass rounded-xl p-6 text-slate-300 leading-relaxed space-y-3">
              <p>We collect the following categories of data when you use AllQ:</p>
              <div className="space-y-4 mt-2">
                <div>
                  <h4 className="text-white font-semibold mb-1">Account Information</h4>
                  <p className="text-sm">Name, email address, and password hash (bcrypt, never stored in plain text). If you sign in via Google or GitHub, we receive your profile information from those providers.</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Usage Data</h4>
                  <p className="text-sm">Quiz attempts, scores, ELO rating changes, subjects created, and time spent on the platform. This data powers your analytics dashboard and adaptive learning engine.</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Uploaded Content</h4>
                  <p className="text-sm">Study materials you upload (PDF, images, text). These are stored securely and processed by AI to generate quiz questions. They are never shared with other users or used to train AI models.</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Payment Information</h4>
                  <p className="text-sm">Payment data is handled entirely by Stripe. We never store card numbers, CVVs, or bank account details. We store only a Stripe Customer ID and subscription status.</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Technical Data</h4>
                  <p className="text-sm">IP address, browser type, device type, and operating system — used for security, fraud detection, and performance monitoring.</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. How We Use Your Data</h2>
            <div className="glass rounded-xl p-6 text-slate-300 leading-relaxed space-y-3">
              <p>We use your data to:</p>
              <ul className="list-disc list-inside space-y-2 ml-2 text-sm">
                <li>Provide, operate, and improve the AllQ platform</li>
                <li>Generate AI-powered quizzes from your uploaded materials</li>
                <li>Calculate your ELO rating and place you on global leaderboards</li>
                <li>Process subscription payments and prize payouts</li>
                <li>Send transactional emails (receipts, password resets, challenge notifications)</li>
                <li>Detect and prevent fraud, cheating, and abuse</li>
                <li>Comply with legal obligations</li>
                <li>Send product updates (you can opt out at any time)</li>
              </ul>
              <p className="text-sm">
                We do <strong className="text-white">not</strong> sell your personal data to third parties. We do not use your study materials or quiz performance data for advertising purposes.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Cookies</h2>
            <div className="glass rounded-xl p-6 text-slate-300 leading-relaxed space-y-3">
              <p>We use the following types of cookies:</p>
              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <span className="text-allq-green font-semibold whitespace-nowrap">Essential</span>
                  <p>Authentication tokens (<code className="text-allq-cyan bg-white/5 px-1.5 py-0.5 rounded text-xs">allq_token</code>) required for you to stay logged in. These cannot be disabled.</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-allq-amber font-semibold whitespace-nowrap">Analytics</span>
                  <p>We use first-party analytics to understand which features are most used. No third-party tracking cookies (e.g. Google Analytics) are set without your explicit consent.</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-allq-purple font-semibold whitespace-nowrap">Preferences</span>
                  <p>Local storage is used to remember your UI preferences (e.g., theme, sidebar state). This data never leaves your device.</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Third Parties</h2>
            <div className="glass rounded-xl p-6 text-slate-300 leading-relaxed space-y-4">
              {[
                {
                  name: 'Stripe',
                  purpose: 'Payment processing and prize payouts. Stripe processes all financial transactions.',
                  link: 'https://stripe.com/privacy',
                },
                {
                  name: 'OpenAI',
                  purpose: 'AI-powered quiz generation and chat. Your uploaded content is sent to OpenAI\'s API for processing. OpenAI does not use API data to train models.',
                  link: 'https://openai.com/policies/privacy-policy',
                },
                {
                  name: 'Google OAuth',
                  purpose: 'Optional sign-in method. If used, we receive your name, email, and profile picture from Google.',
                  link: 'https://policies.google.com/privacy',
                },
                {
                  name: 'GitHub OAuth',
                  purpose: 'Optional sign-in method. If used, we receive your name, email, and avatar from GitHub.',
                  link: 'https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement',
                },
              ].map((tp) => (
                <div key={tp.name}>
                  <h4 className="text-white font-semibold mb-1">{tp.name}</h4>
                  <p className="text-sm">{tp.purpose}{' '}
                    <a href={tp.link} target="_blank" rel="noopener noreferrer" className="text-allq-purple hover:underline text-xs">
                      Privacy Policy ↗
                    </a>
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Data Retention</h2>
            <div className="glass rounded-xl p-6 text-slate-300 leading-relaxed space-y-3">
              <p>We retain your data as follows:</p>
              <ul className="list-disc list-inside space-y-2 ml-2 text-sm">
                <li><strong className="text-white">Account data:</strong> Retained while your account is active and for 90 days after deletion</li>
                <li><strong className="text-white">Uploaded materials:</strong> Deleted within 30 days of account deletion</li>
                <li><strong className="text-white">Quiz history:</strong> Retained for 2 years for leaderboard integrity; anonymised after account deletion</li>
                <li><strong className="text-white">Payment records:</strong> Retained for 7 years as required by UK financial regulations</li>
                <li><strong className="text-white">Server logs:</strong> Retained for 30 days, then permanently deleted</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Your Rights (GDPR)</h2>
            <div className="glass rounded-xl p-6 text-slate-300 leading-relaxed space-y-3">
              <p>
                If you are in the European Economic Area (EEA) or United Kingdom, you have the following rights
                under GDPR / UK GDPR:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2 text-sm">
                <li><strong className="text-white">Access:</strong> Request a copy of all personal data we hold about you</li>
                <li><strong className="text-white">Rectification:</strong> Correct inaccurate or incomplete data</li>
                <li><strong className="text-white">Erasure:</strong> Request deletion of your personal data ("right to be forgotten")</li>
                <li><strong className="text-white">Portability:</strong> Receive your data in a structured, machine-readable format</li>
                <li><strong className="text-white">Restriction:</strong> Request that we restrict processing of your data</li>
                <li><strong className="text-white">Objection:</strong> Object to processing based on legitimate interests</li>
                <li><strong className="text-white">Withdraw consent:</strong> Withdraw any consent previously given at any time</li>
              </ul>
              <p className="text-sm mt-3">
                To exercise any of these rights, email us at{' '}
                <a href="mailto:privacy@allq.app" className="text-allq-purple hover:underline">privacy@allq.app</a>.
                We will respond within 30 days. You also have the right to lodge a complaint with the UK ICO
                at <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-allq-purple hover:underline">ico.org.uk</a>.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. Contact</h2>
            <div className="glass rounded-xl p-6 text-slate-300 leading-relaxed space-y-3">
              <p>
                AllQ is operated by AllQ Ltd, registered in England and Wales.
              </p>
              <p className="text-sm">
                Data Protection Officer:{' '}
                <a href="mailto:privacy@allq.app" className="text-allq-purple hover:underline">privacy@allq.app</a>
              </p>
              <p className="text-sm">
                General enquiries:{' '}
                <a href="mailto:hello@allq.app" className="text-allq-purple hover:underline">hello@allq.app</a>
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-allq-purple to-allq-cyan flex items-center justify-center">
                <Zap className="h-4 w-4 text-white fill-white" />
              </div>
              <span className="text-lg font-black gradient-text">AllQ</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link href="/leaderboard" className="hover:text-white transition-colors">Leaderboard</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/privacy" className="text-white transition-colors">Privacy</Link>
              <Link href="/about" className="hover:text-white transition-colors">About</Link>
            </div>
            <p className="text-sm text-slate-600">© 2025 AllQ · Learn It. Quiz It. Win It.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
