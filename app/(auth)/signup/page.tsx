'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, type RegisterInput } from '@/lib/validations'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Mail, Lock, User, Check } from 'lucide-react'

const perks = [
  'Quizzes generated strictly from your own material',
  'Flashcards and study notes from the same upload',
  'Ask questions about your documents, get grounded answers',
  'Track mastery topic by topic as you revise',
]

export default function SignupPage() {
  const router = useRouter()
  const { register: registerUser } = useAuth()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) })

  const onSubmit = async (data: RegisterInput) => {
    try {
      await registerUser(data.name, data.email, data.password)
      toast.success('Account created', 'Welcome to AIIQ.')
      router.push('/dashboard')
    } catch (err: unknown) {
      toast.error('Signup failed', err instanceof Error ? err.message : 'Please try again')
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
      {/* Left: proposition */}
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        className="hidden lg:block"
      >
        <p className="label-eyebrow mb-4">Get started</p>
        <h2 className="display text-4xl mb-4">
          Learn it.<br />Quiz it.<br />
          <span className="gradient-text">Win it.</span>
        </h2>
        <p className="text-sm leading-relaxed text-ink-secondary mb-8 max-w-sm">
          Upload a lecture, a textbook chapter or your own notes. AIIQ turns it into
          questions, flashcards and summaries — grounded only in what you gave it.
        </p>
        <ul className="space-y-3.5">
          {perks.map((perk) => (
            <li key={perk} className="flex items-start gap-3 text-[13px] text-ink-secondary leading-relaxed">
              <span className="mt-0.5 h-4 w-4 rounded-full bg-gold-50 border border-gold-200 flex items-center justify-center flex-shrink-0">
                <Check className="h-2.5 w-2.5 text-gold-700" />
              </span>
              <span>{perk}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Right: form */}
      <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}>
        <div className="mb-6">
          <h1 className="display text-2xl mb-1.5">Create your account</h1>
          <p className="text-sm text-ink-muted">Free to start. No card required.</p>
        </div>

        <div className="surface-card p-7 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="su-name" className="text-sm font-medium text-ink-secondary">Full name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" aria-hidden />
                <input
                  id="su-name" type="text" placeholder="Jane Doe" autoComplete="name"
                  aria-invalid={!!errors.name}
                  className="input-light w-full pl-9 pr-4 py-2.5 text-sm"
                  {...register('name')}
                />
              </div>
              {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="su-email" className="text-sm font-medium text-ink-secondary">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" aria-hidden />
                <input
                  id="su-email" type="email" placeholder="you@example.com" autoComplete="email"
                  aria-invalid={!!errors.email}
                  className="input-light w-full pl-9 pr-4 py-2.5 text-sm"
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="su-password" className="text-sm font-medium text-ink-secondary">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" aria-hidden />
                <input
                  id="su-password" type={showPassword ? 'text' : 'password'}
                  placeholder="Min 8 characters, 1 uppercase, 1 number"
                  autoComplete="new-password"
                  aria-invalid={!!errors.password}
                  className="input-light w-full pl-9 pr-10 py-2.5 text-sm"
                  {...register('password')}
                />
                <button
                  type="button" onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
              Create free account
            </Button>
          </form>

          <p className="text-center text-xs text-ink-muted mt-5 leading-relaxed">
            By signing up you agree to our{' '}
            <Link href="/terms" className="text-gold-700 hover:underline">Terms</Link> and{' '}
            <Link href="/privacy" className="text-gold-700 hover:underline">Privacy Policy</Link>
          </p>
        </div>

        <p className="text-center text-sm text-ink-muted mt-5">
          Already have an account?{' '}
          <Link href="/login" className="text-gold-700 hover:underline font-semibold">Sign in</Link>
        </p>
      </motion.div>
    </div>
  )
}
