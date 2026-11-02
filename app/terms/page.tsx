import Link from 'next/link'
import type { Metadata } from 'next'
import { MarketingShell } from '@/components/marketing/marketing-shell'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'AIIQ Terms of Service — rules and guidelines for using the platform.',
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

export default function TermsPage() {
  return (
    <MarketingShell>

        {/* ── HERO ── */}
        <section className="px-7 sm:px-12 pt-16 sm:pt-20 pb-12 text-center">
          <Label>LEGAL</Label>
          <h1 className="mt-4 text-4xl sm:text-5xl font-black tracking-tight">Terms of Service</h1>
          <p className="mt-4 text-[13px] text-[#8b8b87]">Last updated: {LAST_UPDATED}</p>
        </section>

        {/* ── BODY ── */}
        <div className="px-7 sm:px-12 pb-16 max-w-3xl mx-auto space-y-10">
          <Section n="01" title="Acceptance of Terms">
            <p>By accessing or using AIIQ (&ldquo;the Platform&rdquo;), you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree to these Terms, please do not use the Platform.</p>
            <p>We reserve the right to modify these Terms at any time. Changes become effective immediately upon posting. Your continued use of the Platform after any changes constitutes your acceptance of the revised Terms. We will notify you of material changes via email or in-app notification.</p>
            <p>You must be at least 18 years old to create an account and participate in paid competitions. Users between 13–17 years may use the free learning features only, with parental consent.</p>
          </Section>

          <Section n="02" title="Use of Service">
            <p>AIIQ grants you a limited, non-exclusive, non-transferable licence to access and use the Platform for personal, educational, and competitive purposes in accordance with these Terms.</p>
            <p>You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must notify us immediately at{' '}
              <a href="mailto:security@aiiq.app" className="font-semibold hover:underline" style={{ color: '#9c6d44' }}>security@aiiq.app</a>{' '}of any unauthorised use of your account.</p>
            <p>AIIQ uses AI to generate quiz questions from materials you upload. You acknowledge that AI-generated content may contain inaccuracies, and AIIQ is not liable for errors in generated questions or explanations.</p>
          </Section>

          <Section n="03" title="Competitions and Ranking">
            <p>Live quiz rooms (&ldquo;Battles&rdquo;) are available to Learner and Champion plan subscribers. Competitions on AIIQ are purely skill-based: there are <strong>no entry fees, no wagers, and no cash or prize-money awards</strong>. The only payment AIIQ collects is your optional subscription.</p>
            <p>Outcomes are determined by answer accuracy and response speed. Results contribute to your ELO rating and your position on the leaderboard. Rank and rating are the only rewards.</p>
            <p>Ties share the same rank. Where a tiebreak is required, the faster average answer time takes the higher position.</p>
            <p>Leaderboard standings are calculated from completed quizzes and may be recalculated if we detect manipulation or correct a scoring error.</p>
          </Section>

          <Section n="04" title="Prohibited Conduct">
            <p>You must not, and must not attempt to:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Use automated tools, bots, scripts, or extensions to gain an unfair advantage in quizzes</li>
              <li>Share answers or collude with other participants during active competitions</li>
              <li>Reverse-engineer, decompile, or extract the Platform&apos;s source code or AI models</li>
              <li>Upload material that infringes third-party intellectual property rights</li>
              <li>Upload illegal, defamatory, obscene, or harmful content</li>
              <li>Create multiple accounts to circumvent plan limits or bans</li>
              <li>Manipulate the ELO rating system through arranged wins or losses</li>
              <li>Interfere with Platform infrastructure, including DDoS attacks or injection attempts</li>
              <li>Resell or sublicense access to the Platform</li>
            </ul>
            <p>Violations may result in immediate account suspension, removal of affected results and ratings, and permanent ban. Serious violations will be reported to relevant authorities.</p>
          </Section>

          <Section n="05" title="Intellectual Property">
            <p>AIIQ and its licensors own all intellectual property rights in the Platform, including its design, software, AI models, and generated content. These Terms do not grant you any rights in the Platform other than the limited licence described above.</p>
            <p>By uploading study materials to AIIQ, you grant us a non-exclusive, worldwide, royalty-free licence to process, store, and use that content solely for the purpose of providing the Service to you. We do not use your uploaded content to train AI models or share it with third parties without your consent.</p>
            <p>Quiz questions generated from your materials remain associated with your account. You may export your quiz data at any time via the export function. Upon account deletion, your materials and generated quizzes are permanently deleted within 30 days.</p>
          </Section>

          <Section n="06" title="Limitation of Liability">
            <p>To the fullest extent permitted by law, AIIQ shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising from your use of the Platform.</p>
            <p>Our total liability to you for any claims arising under these Terms shall not exceed the greater of: (a) the amount you paid to AIIQ in the 3 months preceding the claim, or (b) £100.</p>
            <p>AIIQ makes no warranties, express or implied, regarding the accuracy of AI-generated quiz content, the availability of the Platform, or the suitability of the Platform for any particular purpose.</p>
          </Section>

          <Section n="07" title="Governing Law">
            <p>These Terms are governed by and construed in accordance with the laws of England and Wales. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
            <p>If any provision of these Terms is found to be unenforceable, the remaining provisions shall continue in full force and effect.</p>
            <p>For any questions about these Terms, please contact us at{' '}
              <a href="mailto:legal@aiiq.app" className="font-semibold hover:underline" style={{ color: '#9c6d44' }}>legal@aiiq.app</a>.</p>
          </Section>
        </div>

    </MarketingShell>
  )
}
