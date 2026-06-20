'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Zap, Brain, Swords, Trophy, Upload, Shield,
  ChevronRight, Star, Globe, Clock, TrendingUp,
  CheckCircle, Play, Users, BookOpen
} from 'lucide-react'

const FEATURES = [
  {
    icon: Upload,
    title: 'Upload Anything',
    description: 'PDF notes, photos of textbooks, handwritten pages. Our OCR extracts and understands everything.',
    color: 'text-allq-cyan',
    bg: 'bg-allq-cyan/10',
  },
  {
    icon: Brain,
    title: 'AI Quiz Generation',
    description: 'GPT-4o generates grounded questions from your material — not generic facts, but YOUR content.',
    color: 'text-allq-purple',
    bg: 'bg-allq-purple/10',
  },
  {
    icon: Swords,
    title: 'Real-Time Battles',
    description: 'Compete globally with live WebSocket connections. Every millisecond counts in the 50ms P99 arena.',
    color: 'text-allq-red',
    bg: 'bg-allq-red/10',
  },
  {
    icon: Trophy,
    title: 'Win Real Money',
    description: 'Prize pools funded by entry fees. Winners receive instant payouts via Stripe Connect.',
    color: 'text-allq-amber',
    bg: 'bg-allq-amber/10',
  },
  {
    icon: TrendingUp,
    title: 'Adaptive Learning',
    description: 'ELO-based difficulty adjusts to your skill. Weak areas are targeted automatically.',
    color: 'text-allq-green',
    bg: 'bg-allq-green/10',
  },
  {
    icon: Shield,
    title: 'Zero Cheating',
    description: 'Server-side answer validation, randomized option order, answer fingerprinting. Fair play guaranteed.',
    color: 'text-allq-pink',
    bg: 'bg-allq-pink/10',
  },
]

const STATS = [
  { value: '50K+', label: 'Active Learners' },
  { value: '2M+', label: 'Questions Generated' },
  { value: '<50ms', label: 'WS Latency P99' },
  { value: '£200K+', label: 'Prize Money Paid' },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Upload Your Material', desc: 'Drop in your PDF, image, or paste text. AI handles the rest.' },
  { step: '02', title: 'Generate Your Quiz', desc: 'Choose difficulty and question count. Get 100 questions in under 3 seconds.' },
  { step: '03', title: 'Practice & Improve', desc: 'Track performance per topic. AI targets your weak spots.' },
  { step: '04', title: 'Compete & Win', desc: 'Join live rooms, battle globally, earn real prize money.' },
]

const TESTIMONIALS = [
  { name: 'Priya K.', role: 'Medical Student', text: 'AllQ turned my 200-page anatomy notes into a real exam. Passed with distinction.', stars: 5 },
  { name: 'Marcus T.', role: 'Software Engineer', text: 'Won £180 in a JavaScript battle last week. The lag is actually unnoticeable.', stars: 5 },
  { name: 'Sophie L.', role: 'Law Graduate', text: 'The AI explanations are scarily good — better than my tutors sometimes.', stars: 5 },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-base overflow-x-hidden">
      <Navbar />

      {/* ─── Hero ─── */}
      <section className="relative hero-bg pt-32 pb-24 px-4">
        {/* Background orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-allq-purple/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-72 h-72 bg-allq-cyan/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge variant="purple" size="lg" className="mb-6 cursor-default">
              <Zap className="h-3.5 w-3.5" /> AI-Powered · Real-Time · Real Prizes
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-6xl sm:text-7xl lg:text-8xl font-black text-white leading-none mb-6 tracking-tight"
          >
            Learn It.{' '}
            <span className="gradient-text neon-text">Quiz It.</span>
            <br />
            Win It.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            The first AI platform that turns your study material into competitive quiz battles —
            with real prize money, global leaderboards, and Chess.com-level real-time infrastructure.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/signup">
              <Button size="xl" className="group">
                Start for Free
                <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/compete/preview">
              <Button size="xl" variant="secondary" className="group">
                <Play className="h-5 w-5" />
                Watch Live Battle
              </Button>
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-slate-500 mt-5"
          >
            Free forever · No credit card · Start in 30 seconds
          </motion.p>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section className="py-16 border-y border-white/5">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl font-black gradient-text mb-1">{stat.value}</div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="cyan" size="lg" className="mb-4">Platform Features</Badge>
            <h2 className="text-4xl lg:text-5xl font-black text-white mb-4">
              Everything you need to{' '}
              <span className="gradient-text">dominate</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Built with the same infrastructure standards as Chess.com and Duolingo — for millions of concurrent users from Day 1.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="glass-hover rounded-2xl p-6"
              >
                <div className={`inline-flex p-3 rounded-2xl ${feature.bg} mb-4`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-24 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="purple" size="lg" className="mb-4">How It Works</Badge>
            <h2 className="text-4xl font-black text-white mb-4">
              From notes to <span className="gradient-text">prize money</span> in 4 steps
            </h2>
          </motion.div>

          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-8 top-10 bottom-10 w-px bg-gradient-to-b from-allq-purple/50 to-allq-cyan/50 hidden lg:block" />

            <div className="space-y-6">
              {HOW_IT_WORKS.map((step, i) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-6 items-start"
                >
                  <div className="flex-shrink-0 relative z-10">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-allq-purple to-allq-cyan flex items-center justify-center shadow-neon-purple">
                      <span className="text-white font-black text-lg">{step.step}</span>
                    </div>
                  </div>
                  <div className="glass-hover rounded-2xl p-5 flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">{step.title}</h3>
                    <p className="text-slate-400">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Live Demo Preview ─── */}
      <section className="py-24 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="red" size="lg" className="mb-4 animate-pulse-slow">
              <div className="h-2 w-2 rounded-full bg-allq-red animate-pulse mr-1" />
              Live Quiz Room Preview
            </Badge>
            <h2 className="text-4xl font-black text-white mb-4">
              This is what winning <span className="gradient-text">feels like</span>
            </h2>
          </div>

          {/* Mock Quiz Room UI */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass rounded-2xl overflow-hidden border border-allq-purple/20 shadow-neon-purple"
          >
            {/* Room header */}
            <div className="bg-bg-surface p-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-allq-red" />
                  <div className="h-3 w-3 rounded-full bg-allq-amber" />
                  <div className="h-3 w-3 rounded-full bg-allq-green" />
                </div>
                <span className="text-sm font-semibold text-slate-300">JavaScript Masters Battle</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="red" size="sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-allq-red animate-pulse" /> LIVE
                </Badge>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> 8 players
                </span>
              </div>
            </div>

            {/* Timer bar */}
            <div className="h-2 bg-white/5 relative overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-allq-purple to-allq-cyan"
                initial={{ width: '100%' }}
                animate={{ width: '35%' }}
                transition={{ duration: 4, ease: 'linear', repeat: Infinity, repeatType: 'reverse' }}
              />
            </div>

            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="amber" size="sm">HARD</Badge>
                <Badge variant="default" size="sm">JavaScript</Badge>
                <span className="ml-auto text-sm font-bold text-allq-amber flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> 12s
                </span>
              </div>

              <p className="text-lg font-bold text-white mb-5">
                What is the output of: <code className="text-allq-cyan bg-white/5 px-2 py-0.5 rounded text-sm">console.log(typeof null)</code>?
              </p>

              <div className="grid sm:grid-cols-2 gap-3">
                {["'object'", "'null'", "'undefined'", "'string'"].map((opt, i) => (
                  <div
                    key={opt}
                    className={`glass rounded-xl px-4 py-3 flex items-center gap-3 border transition-all ${
                      i === 0 ? 'border-allq-purple/50 bg-allq-purple/10' : 'border-white/5'
                    }`}
                  >
                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      i === 0 ? 'bg-allq-purple text-white' : 'bg-white/5 text-slate-400'
                    }`}>
                      {['A', 'B', 'C', 'D'][i]}
                    </div>
                    <code className={`text-sm ${i === 0 ? 'text-white' : 'text-slate-400'}`}>{opt}</code>
                    {i === 0 && <CheckCircle className="h-4 w-4 text-allq-purple ml-auto" />}
                  </div>
                ))}
              </div>

              {/* Live scores */}
              <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1">
                {[
                  { name: 'You', score: 480, answered: true, color: 'from-allq-purple to-allq-cyan' },
                  { name: 'Alex', score: 410, answered: true, color: 'from-allq-red to-allq-pink' },
                  { name: 'Sam', score: 390, answered: false, color: 'from-allq-amber to-allq-green' },
                  { name: 'Lu', score: 350, answered: false, color: 'from-allq-cyan to-allq-green' },
                ].map((p) => (
                  <div key={p.name} className="flex-shrink-0 text-center glass rounded-xl p-2.5 min-w-[64px]">
                    <div className={`h-7 w-7 rounded-lg mx-auto mb-1 bg-gradient-to-br ${p.color} flex items-center justify-center text-white text-xs font-bold`}>
                      {p.answered ? '✓' : p.name[0]}
                    </div>
                    <p className="text-[10px] text-slate-400">{p.name}</p>
                    <p className="text-xs font-bold text-white">{p.score}</p>
                  </div>
                ))}
                <div className="flex-shrink-0 text-[10px] text-slate-500 pl-1">+ 4 more</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="py-24 px-4 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-white mb-4">
              Trusted by <span className="gradient-text">champions</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-hover rounded-2xl p-6"
              >
                <div className="flex gap-0.5 mb-4">
                  {[...Array(t.stars)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 text-allq-amber fill-allq-amber" />
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <p className="text-white font-semibold text-sm">{t.name}</p>
                  <p className="text-slate-500 text-xs">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass rounded-3xl p-12 border border-allq-purple/20"
            style={{ boxShadow: '0 0 60px rgba(139,92,246,0.15)' }}
          >
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-allq-purple to-allq-cyan flex items-center justify-center mx-auto mb-6 shadow-neon-purple">
              <Zap className="h-8 w-8 text-white fill-white" />
            </div>
            <h2 className="text-4xl font-black text-white mb-4">
              Ready to <span className="gradient-text">win</span>?
            </h2>
            <p className="text-slate-400 mb-8 text-lg">
              Join 50,000+ learners who have already discovered the smarter way to study.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="xl" className="group">
                  Create Free Account
                  <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="xl" variant="secondary">View Pricing</Button>
              </Link>
            </div>
            <p className="text-xs text-slate-600 mt-5">No credit card required · Cancel anytime</p>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
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
              <Link href="/about" className="hover:text-white transition-colors">About</Link>
            </div>
            <p className="text-sm text-slate-600">© 2025 AllQ · Learn It. Quiz It. Win It.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
