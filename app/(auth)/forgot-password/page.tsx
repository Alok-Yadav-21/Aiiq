'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-allq-purple to-allq-cyan shadow-neon-purple mb-4">
          <Zap className="h-8 w-8 text-white fill-white" />
        </div>
        <h1 className="text-3xl font-black text-white mb-2">Reset your password</h1>
        <p className="text-slate-400">
          {success
            ? 'Check your inbox for the reset link'
            : "Enter your email and we'll send you a reset link"}
        </p>
      </div>

      <div className="glass rounded-2xl p-8">
        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-4"
          >
            <div className="h-16 w-16 rounded-full bg-allq-green/10 border border-allq-green/30 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="h-8 w-8 text-allq-green" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Check your inbox</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              We sent a password reset link to{' '}
              <span className="text-white font-semibold">{submittedEmail}</span>.
              The link expires in 1 hour.
            </p>
            <p className="text-slate-500 text-xs mt-4">
              Didn't get it? Check your spam folder or{' '}
              <button
                onClick={() => setSuccess(false)}
                className="text-allq-purple hover:underline"
              >
                try again
              </button>
              .
            </p>

            {devResetUrl && (
              <div className="mt-5 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left">
                <p className="text-xs font-bold text-amber-400 mb-2">Dev Mode — No SMTP configured</p>
                <p className="text-xs text-slate-400 mb-3">Click the link below to reset your password:</p>
                <a
                  href={devResetUrl}
                  className="text-xs text-allq-purple break-all hover:underline leading-relaxed"
                >
                  {devResetUrl}
                </a>
              </div>
            )}
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              autoComplete="email"
              {...register('email')}
            />

            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
              Send Reset Link
            </Button>
          </form>
        )}
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Sign In
        </Link>
      </div>
    </motion.div>
  )
}
