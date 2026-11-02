'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Mail, ArrowLeft, Zap, CheckCircle } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
})
type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [success, setSuccess] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError('email', { message: json.error || 'Something went wrong. Please try again.' })
        return
      }
      setSubmittedEmail(data.email)
      setDevResetUrl(json.data?.devResetUrl || null)
      setSuccess(true)
    } catch {
      setError('email', { message: 'Network error. Please check your connection and try again.' })
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
      <div className="mb-7">
        <p className="label-eyebrow mb-3">Password reset</p>
        <h1 className="display text-2xl mb-1.5">Reset your password</h1>
        <p className="text-sm text-ink-muted">{success ? 'Check your inbox for the reset link' : "Enter your email and we'll send you a reset link"}</p>
      </div>

      <div className="surface-card p-7 sm:p-8">
        {success ? (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-2">
            <div className="h-16 w-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Check your inbox</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              We sent a password reset link to <span className="text-slate-900 font-semibold">{submittedEmail}</span>. The link expires in 1 hour.
            </p>
            <p className="text-slate-400 text-xs mt-4">
              Didn&apos;t get it? Check your spam folder or{' '}
              <button onClick={() => setSuccess(false)} className="text-gold-700 hover:underline font-medium">try again</button>.
            </p>

            {devResetUrl && (
              <div className="mt-5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-left">
                <p className="text-xs font-bold text-amber-600 mb-2">Dev Mode — No SMTP configured</p>
                <p className="text-xs text-slate-500 mb-3">Click the link below to reset your password:</p>
                <a href={devResetUrl} className="text-xs text-allq-purple break-all hover:underline leading-relaxed">{devResetUrl}</a>
              </div>
            )}
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fp-email" className="text-sm font-medium text-ink-secondary">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden />
                <input
                  id="fp-email"
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

            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
              Send Reset Link
            </Button>
          </form>
        )}
      </div>

      <div className="mt-6 text-center">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
        </Link>
      </div>
    </motion.div>
  )
}
