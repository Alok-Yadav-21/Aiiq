import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Zap, Brain, Swords, Trophy, Shield, Globe, ChevronRight,
  Target, TrendingUp, Users, Code, Database, Server
} from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About AllQ',
  description: 'Learn about AllQ — the AI-powered competitive quiz platform built for the next generation of learners.',
}

const TECH_STACK = [
  { name: 'Next.js 15', desc: 'App Router, Server Components, Edge Runtime', icon: Code, color: 'text-allq-cyan' },
  { name: 'OpenAI GPT-4o', desc: 'Quiz generation, vision OCR, adaptive tutoring', icon: Brain, color: 'text-allq-purple' },
  { name: 'WebSockets', desc: 'Real-time quiz battles with <50ms P99 latency', icon: Server, color: 'text-allq-red' },
  { name: 'PostgreSQL + Prisma', desc: 'ACID-compliant data layer with ELO rating system', icon: Database, color: 'text-allq-green' },
  { name: 'Stripe Connect', desc: 'PCI DSS compliant payments and instant payouts', icon: Trophy, color: 'text-allq-amber' },
  { name: 'Redis', desc: 'Session cache, rate limiting, room state management', icon: Shield, color: 'text-allq-pink' },
]

const VALUES = [
  {
    icon: Brain,
    title: 'AI That Actually Teaches',
    desc: 'Our AI generates questions grounded in YOUR material, not generic internet facts. Every question has a linked explanation so you understand why you got it wrong.',
  },
  {
    icon: Shield,
    title: 'Zero Tolerance for Cheating',
    desc: 'Server-side answer validation, randomised option ordering, fingerprint deduplication, and timing analysis ensure every leaderboard position is earned.',
  },
  {
    icon: Globe,
    title: 'Global, Fair Competition',
    desc: 'Chess.com-inspired ELO rating system means you always compete against people at your skill level. Climb the ranks as you improve.',
  },
  {
    icon: Target,
    title: 'Adaptive Learning',
    desc: 'Every quiz session identifies your weak topics and generates personalised next steps. The harder you practice, the smarter the AI gets about what you need.',
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-bg-base">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="purple" size="lg" className="mb-6">
            <Zap className="h-3.5 w-3.5" /> Our Mission
          </Badge>
          <h1 className="text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
            Turning study time into{' '}
            <span className="gradient-text">competitive sport</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            AllQ was built on a simple belief: the best way to learn is to be tested, challenged,
            and — when you excel — rewarded. We combine AI-powered study tools with real-money
            competition to make every revision session count.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-white/5">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { value: '50K+', label: 'Active Learners' },
              { value: '2M+', label: 'Questions Generated' },
              { value: '<50ms', label: 'Battle Latency' },
              { value: '£200K+', label: 'Prize Money Paid' },
            ].map((stat) => (
              <div key={stat.label} className="text-center glass rounded-xl p-5">
                <div className="text-3xl font-black gradient-text mb-1">{stat.value}</div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How AllQ Works */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="cyan" size="lg" className="mb-4">How It Works</Badge>
            <h2 className="text-3xl font-black text-white">The AllQ learning loop</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {[
              { step: '01', icon: '📄', title: 'Upload Your Material', desc: 'Drop in PDFs, photos of textbooks, or handwritten notes. Our GPT-4o vision model extracts every piece of text and diagram.' },
              { step: '02', icon: '⚡', title: 'AI Generates Your Quiz', desc: 'Receive up to 100 questions drawn directly from your content, with difficulty calibrated to your current ELO level.' },
              { step: '03', icon: '📊', title: 'Practice & Track Progress', desc: 'AI narration after each quiz identifies your weak topics and suggests what to review next. Your accuracy improves measurably over time.' },
              { step: '04', icon: '🏆', title: 'Compete & Win', desc: 'Join live quiz rooms, battle players globally, and win real prize money. Every win increases your ELO and global rank.' },
            ].map((item) => (
              <div key={item.step} className="glass-hover rounded-2xl p-6 flex gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-allq-purple/20 to-allq-cyan/10 flex items-center justify-center text-2xl flex-shrink-0">
                  {item.icon}
                </div>
                <div>
                  <div className="text-xs font-bold text-allq-purple mb-1">STEP {item.step}</div>
                  <h3 className="font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="amber" size="lg" className="mb-4">Our Values</Badge>
            <h2 className="text-3xl font-black text-white">What we stand for</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {VALUES.map((v) => (
              <div key={v.title} className="glass rounded-2xl p-6">
                <div className="h-11 w-11 rounded-xl bg-allq-purple/10 flex items-center justify-center mb-4">
                  <v.icon className="h-5.5 w-5.5 text-allq-purple" />
                </div>
                <h3 className="font-bold text-white mb-2">{v.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology */}
      <section className="py-20 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="purple" size="lg" className="mb-4">Technology</Badge>
            <h2 className="text-3xl font-black text-white mb-3">Built for scale from Day 1</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              AllQ is engineered to the same infrastructure standards as Chess.com and Duolingo —
              built to handle millions of concurrent quiz battles without breaking a sweat.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TECH_STACK.map((tech) => (
              <div key={tech.name} className="glass rounded-xl p-5">
                <tech.icon className={`h-5 w-5 ${tech.color} mb-3`} />
                <h4 className="font-bold text-white text-sm mb-1">{tech.name}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="green" size="lg" className="mb-4">Team</Badge>
            <h2 className="text-3xl font-black text-white mb-3">Who builds AllQ</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              AllQ is built by a small team of engineers and educators who believe competitive
              learning is the future of education.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { initials: 'AY', name: 'Alok Yadav', role: 'Founder & Lead Engineer', bio: 'Full-stack engineer obsessed with real-time systems and AI-assisted learning.' },
              { initials: 'TM', name: 'Tech Team', role: 'Engineering', bio: 'Building the infrastructure that powers sub-50ms quiz battles across the globe.' },
              { initials: 'ED', name: 'Education Team', role: 'Pedagogy & Content', bio: 'Designing AI prompts and learning flows grounded in proven educational research.' },
            ].map((member) => (
              <div key={member.name} className="glass rounded-2xl p-6 text-center">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-allq-purple to-allq-cyan flex items-center justify-center text-white text-xl font-black mx-auto mb-4">
                  {member.initials}
                </div>
                <h4 className="font-bold text-white mb-0.5">{member.name}</h4>
                <p className="text-xs text-allq-purple font-semibold mb-3">{member.role}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <div className="glass rounded-3xl p-12 border border-allq-purple/20">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-allq-purple to-allq-cyan flex items-center justify-center mx-auto mb-5">
              <Swords className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-3xl font-black text-white mb-3">Ready to join the battle?</h2>
            <p className="text-slate-400 mb-7">
              Create your free account and generate your first quiz in under 2 minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/signup">
                <Button size="lg" className="group">
                  Get Started Free
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="secondary">View Pricing</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

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
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/about" className="text-white transition-colors">About</Link>
            </div>
            <p className="text-sm text-slate-600">© 2025 AllQ · Learn It. Quiz It. Win It.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
