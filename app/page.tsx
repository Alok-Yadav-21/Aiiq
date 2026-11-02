'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  ChevronDown, ArrowRight, Upload, Sparkles, TrendingUp,
  Brain, Swords, Trophy, BarChart3, Layers,
} from 'lucide-react'
import { MarketingShell } from '@/components/marketing/marketing-shell'
import { StudyObject } from '@/components/marketing/study-object'
import { cn } from '@/lib/utils'

/* The three-step promise: Learn It → Quiz It → Win It. */
const STEPS = [
  {
    n: '01',
    icon: Upload,
    title: 'Learn it',
    body: 'Upload a lecture, a chapter, a PDF or your own notes. AIIQ reads the material and indexes what it actually contains.',
  },
  {
    n: '02',
    icon: Sparkles,
    title: 'Quiz it',
    body: 'Get questions, flashcards and summaries generated strictly from that material — never invented, never generic.',
  },
  {
    n: '03',
    icon: TrendingUp,
    title: 'Win it',
    body: 'Track mastery topic by topic, close your weak spots, and climb the leaderboard against learners worldwide.',
  },
]

/* The capability index — an editorial list, not a product carousel. */
const SYSTEM = [
  {
    n: '01',
    name: 'AI quiz generation',
    icon: Brain,
    desc: 'Documents become grounded questions in seconds — multiple choice, true/false, fill-in-the-blank and short answer, at the difficulty you choose.',
    href: '/signup',
    cta: 'Start generating',
  },
  {
    n: '02',
    name: 'Flashcards',
    icon: Layers,
    desc: 'Adaptive recall built from the same upload, tuned to the concepts you keep getting wrong.',
    href: '/signup',
    cta: 'Build a deck',
  },
  {
    n: '03',
    name: 'Performance analytics',
    icon: BarChart3,
    desc: 'See accuracy per topic over time, so revision goes where it is actually needed.',
    href: '/signup',
    cta: 'See your progress',
  },
  {
    n: '04',
    name: 'Live battles',
    icon: Swords,
    desc: 'Real-time quiz rooms against other learners. Same questions, same clock, ranked outcome.',
    href: '/compete/preview',
    cta: 'Preview the arena',
  },
  {
    n: '05',
    name: 'Global leaderboards',
    icon: Trophy,
    desc: 'ELO-rated standings earned through accuracy and speed. Rank is the reward.',
    href: '/leaderboard',
    cta: 'View rankings',
  },
]

export default function LandingPage() {
  const [idx, setIdx] = useState(0)
  const active = SYSTEM[idx]
  const ActiveIcon = active.icon

  return (
    <MarketingShell>
      {/* ───────────────────────── HERO ───────────────────────── */}
      <section id="home" className="relative px-7 sm:px-12 pt-10 sm:pt-14 pb-16">
        <div
          className="absolute inset-0 pointer-events-none opacity-70"
          style={{
            background:
              'radial-gradient(120% 80% at 70% 20%, rgba(205,160,111,0.10), transparent 60%)',
          }}
        />

        <div className="relative text-center">
          <h1 className="display text-[24vw] sm:text-[19vw] md:text-[170px] leading-[0.86]">
            AIIQ
          </h1>
          <p className="text-[11px] sm:text-xs font-bold tracking-[0.28em] uppercase mt-1 text-ink-secondary">
            Learn It. Quiz It. Win It.
          </p>
        </div>

        <div className="relative flex justify-center mt-10 sm:mt-12">
          <div className="relative flex flex-col items-center">
            <div className="relative z-10">
              <StudyObject size={300} />
            </div>
            {/* Pedestal — keeps the object staged like a product */}
            <div
              className="-mt-8 w-40 sm:w-52 h-28 sm:h-36 rounded-b-[14px]"
              style={{
                background: 'linear-gradient(180deg,#fbfbfa,#eceae7)',
                boxShadow: '0 30px 50px -28px rgba(0,0,0,0.25)',
              }}
            />
          </div>
        </div>

        <div className="relative mt-4 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6">
          <div className="max-w-xs text-center sm:text-left">
            <p className="text-[13px] leading-relaxed text-ink-secondary">
              Your material, turned into practice that actually tests you on it.
              Nothing invented, nothing off-syllabus.
            </p>
            <Link
              href="/signup"
              className="group inline-flex items-center gap-1.5 mt-3 text-[12px] font-bold tracking-wide gradient-text"
            >
              Start for free
              <ArrowRight className="h-3.5 w-3.5 text-gold-deep transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <a
            href="#how"
            aria-label="Scroll to how it works"
            className="order-first sm:order-none h-9 w-14 rounded-full border border-black/20 flex items-center justify-center hover:bg-black/[0.03] transition-colors"
          >
            <ChevronDown className="h-4 w-4 text-ink-secondary" />
          </a>

          <div className="hidden sm:block max-w-[150px] text-right">
            <p className="label-eyebrow leading-relaxed">
              Grounded
              <br />
              in your
              <br />
              own sources
            </p>
          </div>
        </div>
      </section>

      {/* ───────────────────── HOW IT WORKS ───────────────────── */}
      <section id="how" className="px-7 sm:px-12 py-16 sm:py-24 border-t border-line-soft">
        <div className="text-center mb-12">
          <p className="label-eyebrow mb-3">How it works</p>
          <h2 className="display text-2xl sm:text-4xl">Three steps, one loop.</h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-8 sm:gap-6 max-w-5xl mx-auto">
          {STEPS.map((step) => (
            <div key={step.n} className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-3 mb-4">
                <span className="h-10 w-10 rounded-full border border-line-warm bg-gold-50 flex items-center justify-center flex-shrink-0">
                  <step.icon className="h-4.5 w-4.5 text-gold-700" />
                </span>
                <span className="label-eyebrow">{step.n}</span>
              </div>
              <h3 className="text-lg font-black tracking-tight mb-2">{step.title}</h3>
              <p className="text-[13px] leading-relaxed text-ink-secondary">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────── THE SYSTEM ─────────────────────── */}
      <section id="system" className="px-7 sm:px-12 py-16 sm:py-20 border-t border-line-soft">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="label-eyebrow mb-3">The system</p>
            <h2 className="display text-3xl sm:text-5xl">
              Everything
              <br />
              in one place.
            </h2>
          </div>
          <p className="text-[13px] leading-relaxed text-ink-muted max-w-xs sm:text-right">
            Five parts of one platform — not five separate tools bolted together.
          </p>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,340px)_1fr] gap-8 lg:gap-14">
          {/* Index */}
          <ul className="flex flex-col">
            {SYSTEM.map((item, i) => {
              const isActive = i === idx
              return (
                <li key={item.n}>
                  <button
                    onClick={() => setIdx(i)}
                    aria-current={isActive}
                    className={cn(
                      'w-full text-left flex items-baseline gap-5 py-4 border-t border-line-soft transition-colors group',
                      i === SYSTEM.length - 1 && 'border-b'
                    )}
                  >
                    <span
                      className={cn(
                        'text-[11px] font-semibold tracking-[0.2em] transition-colors',
                        isActive ? 'text-gold-700' : 'text-ink-faint'
                      )}
                    >
                      {item.n}
                    </span>
                    <span
                      className={cn(
                        'text-base font-bold tracking-tight transition-colors',
                        isActive ? 'text-ink' : 'text-ink-muted group-hover:text-ink'
                      )}
                    >
                      {item.name}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          {/* Detail */}
          <div className="surface-card p-8 sm:p-10 flex flex-col justify-center min-h-[280px]">
            <div className="flex items-center gap-4 mb-5">
              <span className="h-12 w-12 rounded-2xl bg-gold-50 border border-line-warm flex items-center justify-center flex-shrink-0">
                <ActiveIcon className="h-5 w-5 text-gold-700" />
              </span>
              <div>
                <p className="label-eyebrow">{active.n}</p>
                <h3 className="text-xl font-black tracking-tight">{active.name}</h3>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-ink-secondary max-w-md mb-7">
              {active.desc}
            </p>
            <Link
              href={active.href}
              className="group inline-flex items-center gap-2 text-[12px] font-bold tracking-[0.12em] uppercase text-ink hover:text-gold-700 transition-colors self-start"
            >
              {active.cta}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ───────────────────────── CTA ───────────────────────── */}
      <section className="px-7 sm:px-12 py-16 sm:py-20 border-t border-line-soft text-center">
        <p className="label-eyebrow mb-4">Ready when you are</p>
        <h2 className="display text-3xl sm:text-5xl mb-5">
          Upload something.
          <br />
          See what it asks you.
        </h2>
        <p className="text-[13px] text-ink-secondary max-w-md mx-auto mb-8 leading-relaxed">
          Free to start, no card required. Your first subject takes about a minute to set up.
        </p>
        <Link href="/signup" className="btn-pill inline-block px-9 py-3.5">
          Get started
        </Link>
      </section>
    </MarketingShell>
  )
}
