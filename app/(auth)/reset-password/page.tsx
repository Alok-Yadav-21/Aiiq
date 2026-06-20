'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
      <div className="glass rounded-2xl p-10 text-center">
        <div className="h-16 w-16 rounded-full bg-allq-red/10 border border-allq-red/30 flex items-center justify-center mx-auto mb-5">
          <XCircle className="h-8 w-8 text-allq-red" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Invalid reset link</h2>
        <p className="text-slate-400 text-sm mb-6">
          This password reset link is missing or invalid. Please request a new one.
        </p>
        <Link href="/forgot-password">
          <Button className="w-full">Request New Link</Button>
        </Link>
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
        <div className="mb-5 p-3.5 rounded-xl bg-allq-red/10 border border-allq-red/20 flex items-start gap-2.5">
          <XCircle className="h-4.5 w-4.5 text-allq-red mt-0.5 flex-shrink-0" />
          <p className="text-sm text-allq-red">{errors.root.message}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="New password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Min 8 chars, 1 uppercase, 1 number"
          leftIcon={<Lock className="h-4 w-4" />}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
          error={errors.password?.message}
          autoComplete="new-password"
          {...register('password')}
        />

        <Input
          label="Confirm new password"
          type={showConfirm ? 'text' : 'password'}
          placeholder="Repeat your new password"
          leftIcon={<Lock className="h-4 w-4" />}
          rightElement={
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
          error={errors.confirmPassword?.message}
          autoComplete="new-password"
          {...register('confirmPassword')}
        />

        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
          Reset Password
        </Button>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-allq-purple to-allq-cyan shadow-neon-purple mb-4">
          <Zap className="h-8 w-8 text-white fill-white" />
        </div>
        <h1 className="text-3xl font-black text-white mb-2">Set new password</h1>
        <p className="text-slate-400">Choose a strong password for your account</p>
      </div>

      <div className="glass rounded-2xl p-8">
        <Suspense
          fallback={
            <div className="space-y-5">
              <div className="skeleton h-16 w-full rounded-xl" />
              <div className="skeleton h-16 w-full rounded-xl" />
              <div className="skeleton h-12 w-full rounded-xl" />
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>

      <p className="text-center text-sm text-slate-500 mt-6">
        Remember your password?{' '}
        <Link href="/login" className="text-allq-purple hover:underline">
          Sign in
        </Link>
      </p>
    </motion.div>
  )
}
