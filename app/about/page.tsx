import Link from 'next/link'
import {
  Brain, Swords, Trophy, Shield, Globe,
  Target, Code, Database, Server, ChevronRight,
} from 'lucide-react'
import type { Metadata } from 'next'
import { MarketingShell } from '@/components/marketing/marketing-shell'
import { StudyObject } from '@/components/marketing/study-object'

export const metadata: Metadata = {
  title: 'About AIIQ',
  description: 'Learn about AIIQ — the AI-powered competitive quiz platform built for the next generation of learners.',
}

/* Champagne / rose-gold accent (matches the home page). */
const goldText = {
  backgroundImage: 'linear-gradient(135deg,#cda06f 0%,#9c6d44 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
} as const

/* Capability facts, not invented metrics. Fabricated social proof would be
   both untrue and unnecessary — what the product does is the story. */
const STATS = [
  { value: '100%', label: 'From your own sources' },
  { value: '4', label: 'Question formats' },
  { value: 'Real-time', label: 'Live quiz rooms' },
  { value: 'Per topic', label: 'Mastery tracking' },
]

const LOOP = [
  { step: '01', title: 'Upload Your Material', desc: 'Drop in PDFs, photos of textbooks, or handwritten notes. Our vision model extracts every piece of text and diagram.' },
  { step: '02', title: 'AI Generates Your Quiz', desc: 'Up to 100 questions drawn directly from your content, with difficulty calibrated to your current ELO level.' },
  { step: '03', title: 'Practice & Track Progress', desc: 'AI narration after each quiz identifies your weak topics and suggests what to review next.' },
  { step: '04', title: 'Compete & Climb', desc: 'Join live quiz rooms and go head-to-head with other learners. Accuracy and speed decide the ranking.' },
]

const VALUES = [
  { icon: Brain, title: 'AI That Actually Teaches', desc: 'Questions grounded in YOUR material, not generic internet facts. Every question has a linked explanation so you understand why you got it wrong.' },
  { icon: Shield, title: 'Zero Tolerance for Cheating', desc: 'Server-side validation, randomised option ordering, fingerprint deduplication and timing analysis ensure every leaderboard position is earned.' },
  { icon: Globe, title: 'Global, Fair Competition', desc: 'A Chess.com-inspired ELO rating system means you always compete against people at your skill level. Climb the ranks as you improve.' },
  { icon: Target, title: 'Adaptive Learning', desc: 'Every session identifies your weak topics and generates personalised next steps. The harder you practice, the smarter the AI gets.' },
]

const TECH = [
  { name: 'Next.js 15', desc: 'App Router, Server Components, Edge Runtime', icon: Code },
  { name: 'AI Generation', desc: 'Quiz generation, vision OCR, adaptive tutoring', icon: Brain },
  { name: 'WebSockets', desc: 'Real-time quiz battles with <50ms P99 latency', icon: Server },
  { name: 'PostgreSQL + Prisma', desc: 'ACID-compliant data layer with ELO rating system', icon: Database },
  { name: 'Stripe', desc: 'PCI DSS compliant subscription billing', icon: Trophy },
  { name: 'Redis', desc: 'Session cache, rate limiting, room state management', icon: Shield },
]

const TEAM = [
  { initials: 'AY', name: 'Alok Yadav', role: 'Founder & Lead Engineer', bio: 'Full-stack engineer obsessed with real-time systems and AI-assisted learning.' },
  { initials: 'TM', name: 'Tech Team', role: 'Engineering', bio: 'Building the infrastructure that powers sub-50ms quiz battles across the globe.' },
  { initials: 'ED', name: 'Education Team', role: 'Pedagogy & Content', bio: 'Designing AI prompts and learning flows grounded in proven educational research.' },
]

const Label = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[11px] font-semibold tracking-[0.28em] text-[#9a8260]">{children}</p>
)

export default function AboutPage() {
  return (
    <MarketingShell>

        {/* ── HERO ── */}
        <section className="px-7 sm:px-12 pt-16 sm:pt-20 pb-12 grid lg:grid-cols-[1.4fr_1fr] gap-10 items-center">
          <div>
            <Label>OUR MISSION</Label>
            <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-black leading-[0.98] tracking-tight">
              Turning your notes<br />into <span style={goldText}>real understanding</span>
            </h1>
            <p className="mt-6 max-w-xl text-[14px] leading-relaxed text-[#555]">
              AIIQ was built on a simple belief: the fastest way to learn something is to be tested on it.
              We turn the material you already study from into questions, flashcards and notes — grounded
              strictly in your sources — then track what you have actually mastered.
            </p>
          </div>
          <div className="flex justify-center lg:justify-end">
            <div className="flex flex-col items-center">
              <StudyObject size={230} />
              <div className="-mt-6 w-28 h-24 rounded-b-[12px]" style={{ background: 'linear-gradient(180deg,#fbfbfa,#eceae7)', boxShadow: '0 24px 40px -26px rgba(0,0,0,0.25)' }} />
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <section className="px-7 sm:px-12 py-12 border-y border-black/[0.07]">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-black" style={goldText}>{s.value}</div>
                <div className="text-[12px] text-[#8b8b87] mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── ABOUT US (two-col) ── */}
        <section className="px-7 sm:px-12 py-16 sm:py-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black tracking-[0.12em]">ABOUT US</h2>
            <p className="text-sm text-[#8b8b87] mt-2">Learning in its purest form.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 md:gap-0 max-w-4xl mx-auto">
            <p className="text-[13px] leading-relaxed text-[#555] text-center md:text-right md:pr-10">
              AIIQ is an AI-powered learning platform that turns academic documents into personalised study
              activities — generating grounded questions strictly from the material you upload, never generic facts.
            </p>
            <p className="text-[13px] leading-relaxed text-[#555] text-center md:text-left md:pl-10 md:border-l md:border-black/10">
              Built on real-time infrastructure, AIIQ blends advanced AI with worldwide quiz competitions, global
              leaderboards and per-topic mastery tracking — serious learning with a competitive edge.
            </p>
          </div>
        </section>

        {/* ── THE LEARNING LOOP ── */}
        <section className="px-7 sm:px-12 py-16 border-t border-black/[0.07]">
          <div className="text-center mb-12">
            <Label>HOW IT WORKS</Label>
            <h2 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight">The AIIQ learning loop</h2>
          </div>
          <div className="max-w-3xl mx-auto divide-y divide-black/[0.07]">
            {LOOP.map((s) => (
              <div key={s.step} className="flex gap-6 sm:gap-10 items-start py-6">
                <span className="text-2xl sm:text-3xl font-black tabular-nums" style={goldText}>{s.step}</span>
                <div>
                  <h3 className="text-base font-bold">{s.title}</h3>
                  <p className="text-[13px] text-[#666] mt-1 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── VALUES ── */}
        <section className="px-7 sm:px-12 py-16 border-t border-black/[0.07]">
          <div className="text-center mb-12">
            <Label>OUR VALUES</Label>
            <h2 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight">What we stand for</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-2xl border border-black/[0.07] bg-white/70 p-6">
                <div className="h-11 w-11 rounded-xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg,#f3eadb,#e7d3b4)' }}>
                  <v.icon className="h-5 w-5" style={{ color: '#9c6d44' }} />
                </div>
                <h3 className="font-bold mb-2">{v.title}</h3>
                <p className="text-[13px] text-[#666] leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── TECHNOLOGY ── */}
        <section className="px-7 sm:px-12 py-16 border-t border-black/[0.07]">
          <div className="text-center mb-12">
            <Label>TECHNOLOGY</Label>
            <h2 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight">Built for scale from Day 1</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {TECH.map((t) => (
              <div key={t.name} className="rounded-xl border border-black/[0.07] bg-white/70 p-5">
                <t.icon className="h-5 w-5 mb-3" style={{ color: '#b5835a' }} />
                <h4 className="font-bold text-sm">{t.name}</h4>
                <p className="text-[12px] text-[#777] mt-1 leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── TEAM ── */}
        <section className="px-7 sm:px-12 py-16 border-t border-black/[0.07]">
          <div className="text-center mb-12">
            <Label>THE TEAM</Label>
            <h2 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight">Who builds AIIQ</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {TEAM.map((m) => (
              <div key={m.name} className="rounded-2xl border border-black/[0.07] bg-white/70 p-6 text-center">
                <div className="h-16 w-16 rounded-2xl flex items-center justify-center text-white text-xl font-black mx-auto mb-4" style={{ background: 'linear-gradient(135deg,#cda06f,#9c6d44)' }}>
                  {m.initials}
                </div>
                <h4 className="font-bold mb-0.5">{m.name}</h4>
                <p className="text-[11px] font-semibold tracking-wide mb-3" style={{ color: '#9c6d44' }}>{m.role}</p>
                <p className="text-[12px] text-[#777] leading-relaxed">{m.bio}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="px-7 sm:px-12 py-16 border-t border-black/[0.07]">
          <div
            className="relative rounded-[24px] p-10 sm:p-14 text-center overflow-hidden"
            style={{ background: 'linear-gradient(135deg,#1a1a1a 0%,#2a2218 100%)' }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(120% 80% at 70% 10%, rgba(205,160,111,0.18), transparent 60%)' }} />
            <div className="relative">
              <div className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: 'linear-gradient(135deg,#cda06f,#9c6d44)' }}>
                <Swords className="h-7 w-7 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">Ready to join the battle?</h2>
              <p className="text-[14px] text-white/70 mb-8 max-w-md mx-auto">
                Create your free account and generate your first quiz in under two minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/signup" className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full text-[12px] font-semibold tracking-[0.18em] text-[#1a1a1a] bg-white hover:bg-[#f3eadb] transition-colors">
                  GET STARTED <ChevronRight className="h-4 w-4" />
                </Link>
                <Link href="/pricing" className="inline-flex items-center justify-center px-7 py-3 rounded-full text-[12px] font-semibold tracking-[0.18em] text-white border border-white/30 hover:bg-white/10 transition-colors">
                  VIEW PRICING
                </Link>
              </div>
            </div>
          </div>
        </section>

    </MarketingShell>
  )
}
