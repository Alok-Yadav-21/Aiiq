import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'
import { Zap } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'AllQ Terms of Service — rules and guidelines for using the platform.',
}

const LAST_UPDATED = 'June 11, 2025'

export default function TermsPage() {
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
            <span className="text-slate-300">Terms of Service</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-3">Terms of Service</h1>
          <p className="text-slate-400">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-10">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Acceptance of Terms</h2>
            <div className="glass rounded-xl p-6 text-slate-300 leading-relaxed space-y-3">
              <p>
                By accessing or using AllQ ("the Platform"), you agree to be bound by these Terms of Service
                ("Terms"). If you do not agree to these Terms, please do not use the Platform.
              </p>
              <p>
                We reserve the right to modify these Terms at any time. Changes become effective immediately upon
                posting. Your continued use of the Platform after any changes constitutes your acceptance of the
                revised Terms. We will notify you of material changes via email or in-app notification.
              </p>
              <p>
                You must be at least 18 years old to create an account and participate in paid competitions. Users
                between 13–17 years may use the free learning features only, with parental consent.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Use of Service</h2>
            <div className="glass rounded-xl p-6 text-slate-300 leading-relaxed space-y-3">
              <p>
                AllQ grants you a limited, non-exclusive, non-transferable licence to access and use the Platform
                for personal, educational, and competitive purposes in accordance with these Terms.
              </p>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials and for all
                activity that occurs under your account. You must notify us immediately at{' '}
                <a href="mailto:security@allq.app" className="text-allq-purple hover:underline">security@allq.app</a>{' '}
                of any unauthorised use of your account.
              </p>
              <p>
                AllQ uses AI (GPT-4o by OpenAI) to generate quiz questions from materials you upload. You
                acknowledge that AI-generated content may contain inaccuracies, and AllQ is not liable for errors
                in generated questions or explanations.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Prize Money Rules</h2>
            <div className="glass rounded-xl p-6 text-slate-300 leading-relaxed space-y-3">
              <p>
                Paid quiz competitions ("Battles") are available to Learner and Champion plan subscribers. Entry
                fees are collected via Stripe and form the prize pool for each Battle room.
              </p>
              <p>
                AllQ retains a platform fee of 10% of each prize pool to cover operational costs, AI processing,
                and Stripe payment processing fees. The remaining 90% is distributed to winners via Stripe Connect.
              </p>
              <p>
                Prize payouts are processed within 24 hours of a Battle's completion. You must have a verified
                Stripe Connect account to receive payouts. Minimum payout threshold is £1.00.
              </p>
              <p>
                Ties are resolved by splitting the prize pool equally among tied players. Time-based tiebreaking
                applies only when configured by the room host.
              </p>
              <p>
                AllQ complies with applicable gambling regulations. Competitions are classified as skill-based
                contests. By entering paid Battles, you represent that you are legally permitted to participate in
                skill-based competitions involving prize money in your jurisdiction.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Prohibited Conduct</h2>
            <div className="glass rounded-xl p-6 text-slate-300 leading-relaxed space-y-3">
              <p>You must not, and must not attempt to:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Use automated tools, bots, scripts, or extensions to gain an unfair advantage in quizzes</li>
                <li>Share answers or collude with other participants during active competitions</li>
                <li>Reverse-engineer, decompile, or extract the Platform's source code or AI models</li>
                <li>Upload material that infringes third-party intellectual property rights</li>
                <li>Upload illegal, defamatory, obscene, or harmful content</li>
                <li>Create multiple accounts to circumvent plan limits or bans</li>
                <li>Manipulate the ELO rating system through arranged wins or losses</li>
                <li>Interfere with Platform infrastructure, including DDoS attacks or injection attempts</li>
                <li>Resell or sublicense access to the Platform</li>
              </ul>
              <p>
                Violations may result in immediate account suspension, forfeiture of prize winnings, and permanent
                ban. Serious violations will be reported to relevant authorities.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Intellectual Property</h2>
            <div className="glass rounded-xl p-6 text-slate-300 leading-relaxed space-y-3">
              <p>
                AllQ and its licensors own all intellectual property rights in the Platform, including its design,
                software, AI models, and generated content. These Terms do not grant you any rights in the Platform
                other than the limited licence described above.
              </p>
              <p>
                By uploading study materials to AllQ, you grant us a non-exclusive, worldwide, royalty-free licence
                to process, store, and use that content solely for the purpose of providing the Service to you. We
                do not use your uploaded content to train AI models or share it with third parties without your
                consent.
              </p>
              <p>
                Quiz questions generated from your materials remain associated with your account. You may export
                your quiz data at any time via the export function. Upon account deletion, your materials and
                generated quizzes are permanently deleted within 30 days.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Limitation of Liability</h2>
            <div className="glass rounded-xl p-6 text-slate-300 leading-relaxed space-y-3">
              <p>
                To the fullest extent permitted by law, AllQ shall not be liable for any indirect, incidental,
                special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising
                from your use of the Platform.
              </p>
              <p>
                Our total liability to you for any claims arising under these Terms shall not exceed the greater of:
                (a) the amount you paid to AllQ in the 3 months preceding the claim, or (b) £100.
              </p>
              <p>
                AllQ makes no warranties, express or implied, regarding the accuracy of AI-generated quiz content,
                the availability of the Platform, or the suitability of the Platform for any particular purpose.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. Governing Law</h2>
            <div className="glass rounded-xl p-6 text-slate-300 leading-relaxed space-y-3">
              <p>
                These Terms are governed by and construed in accordance with the laws of England and Wales. Any
                disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts of
                England and Wales.
              </p>
              <p>
                If any provision of these Terms is found to be unenforceable, the remaining provisions shall
                continue in full force and effect.
              </p>
              <p>
                For any questions about these Terms, please contact us at{' '}
                <a href="mailto:legal@allq.app" className="text-allq-purple hover:underline">legal@allq.app</a>.
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
              <Link href="/terms" className="text-white transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/about" className="hover:text-white transition-colors">About</Link>
            </div>
            <p className="text-sm text-slate-600">© 2025 AllQ · Learn It. Quiz It. Win It.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
