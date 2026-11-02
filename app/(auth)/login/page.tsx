'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from '@/lib/validations'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard'
  const { login } = useAuth()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginInput) => {
    try {
      await login(data.email, data.password)
      toast.success('Welcome back!', 'Redirecting to your dashboard...')
      router.push(callbackUrl)
    } catch (err: unknown) {
      toast.error('Login failed', err instanceof Error ? err.message : 'Invalid credentials')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="login-email" className="text-sm font-medium text-ink-secondary">Email address</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" aria-hidden />
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            className="input-light w-full rounded-xl pl-9 pr-4 py-2.5 text-sm"
            {...register('email')}
          />
        </div>
        {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="login-password" className="text-sm font-medium text-ink-secondary">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" aria-hidden />
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Your password"
            aria-invalid={!!errors.password}
            className="input-light w-full rounded-xl pl-9 pr-10 py-2.5 text-sm"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
      </div>

      <div className="flex items-center justify-end">
        <Link href="/forgot-password" className="text-xs font-medium text-gold-700 hover:underline">
          Forgot password?
        </Link>
      </div>

      <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
        Sign In
      </Button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      {/* Header */}
      <div className="mb-7">
        <p className="label-eyebrow mb-3">Sign in</p>
        <h1 className="display text-2xl mb-1.5">Welcome back</h1>
        <p className="text-sm text-ink-muted">Pick up where you left off.</p>
      </div>

      {/* Card */}
      <div className="surface-card p-7 sm:p-8">
        <Suspense
          fallback={
            <div className="space-y-4">
              <div className="skeleton-light h-16 w-full" />
              <div className="skeleton-light h-16 w-full" />
              <div className="skeleton-light h-11 w-full mt-1" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>

      </div>

      <p className="text-center text-sm text-ink-muted mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-gold-700 hover:underline font-semibold">Sign up free</Link>
      </p>
    </motion.div>
  )
}
