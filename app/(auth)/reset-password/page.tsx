'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/useToast'
import { Lock, Eye, EyeOff, Zap, XCircle } from 'lucide-react'

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

function PasswordField({
  id, label, show, setShow, error, autoComplete, register, placeholder,
}: {
  id: string; label: string; show: boolean; setShow: (v: boolean) => void
  error?: string; autoComplete: string; register: object; placeholder: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink-secondary">{label}</label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden />
        <input
          id={id}
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          className="input-light w-full rounded-xl pl-9 pr-10 py-2.5 text-sm"
          {...register}
        />
        <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams?.get('token')
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  if (!token) {
    return (
      <div className="text-center py-2">
        <div className="h-16 w-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-5">
          <XCircle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">Invalid reset link</h2>
        <p className="text-slate-500 text-sm mb-6">This password reset link is missing or invalid. Please request a new one.</p>
        <Link href="/forgot-password"><Button className="w-full">Request New Link</Button></Link>
      </div>
    )
  }

  const onSubmit = async (data: FormData) => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: data.password }),
      })
      const json = await res.json()
      if (!res.ok) {
        if (json.error?.includes('expired') || json.error?.includes('invalid')) {
          setError('root', { message: json.error })
        } else {
          setError('password', { message: json.error || 'Failed to reset password' })
        }
        return
      }
      toast.success('Password reset!', 'You can now sign in with your new password.')
      router.push('/login')
    } catch {
      setError('password', { message: 'Network error. Please try again.' })
    }
  }

  return (
    <>
      {errors.root && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5">
          <XCircle className="h-4.5 w-4.5 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-600">{errors.root.message}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <PasswordField id="rp-password" label="New password" show={showPassword} setShow={setShowPassword}
          error={errors.password?.message} autoComplete="new-password" placeholder="Min 8 chars, 1 uppercase, 1 number"
          register={register('password')} />
        <PasswordField id="rp-confirm" label="Confirm new password" show={showConfirm} setShow={setShowConfirm}
          error={errors.confirmPassword?.message} autoComplete="new-password" placeholder="Repeat your new password"
          register={register('confirmPassword')} />

        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
          Reset Password
        </Button>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
      <div className="mb-7">
        <p className="label-eyebrow mb-3">Password reset</p>
        <h1 className="display text-2xl mb-1.5">Set new password</h1>
        <p className="text-sm text-ink-muted">Choose a strong password for your account</p>
      </div>

      <div className="surface-card p-7 sm:p-8">
        <Suspense
          fallback={
            <div className="space-y-4">
              <div className="skeleton-light h-16 w-full" />
              <div className="skeleton-light h-16 w-full" />
              <div className="skeleton-light h-11 w-full" />
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>

      <p className="text-center text-sm text-ink-muted mt-6">
        Remember your password?{' '}
        <Link href="/login" className="text-gold-700 hover:underline font-semibold">Sign in</Link>
      </p>
    </motion.div>
  )
}
