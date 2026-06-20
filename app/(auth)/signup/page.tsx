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
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, Mail, Lock, User, CheckCircle } from 'lucide-react'

const perks = [
  'AI-generated quizzes from your notes',
  'Compete globally for real prizes',
  'Adaptive difficulty learning engine',
  'Detailed performance analytics',
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
      toast.success('Account created!', 'Welcome to AllQ!')
      router.push('/dashboard')
    } catch (err: unknown) {
      toast.error('Signup failed', err instanceof Error ? err.message : 'Please try again')
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
      {/* Left: Perks */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="hidden lg:block"
      >
        <h2 className="text-4xl font-black text-white mb-3 leading-tight">
          Learn smarter.<br />
          <span className="gradient-text">Win bigger.</span>
        </h2>
        <p className="text-slate-400 mb-8">
          Join thousands of learners competing on AllQ's AI-powered platform.
        </p>
        <ul className="space-y-4">
          {perks.map((perk) => (
            <li key={perk} className="flex items-center gap-3 text-slate-300">
              <CheckCircle className="h-5 w-5 text-allq-green flex-shrink-0" />
              <span>{perk}</span>
            </li>
          ))}
        </ul>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-10">
          {[
            { value: '50K+', label: 'Learners' },
            { value: '2M+', label: 'Questions' },
            { value: '£200K+', label: 'Paid Out' },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-xl p-4 text-center">
              <div className="text-2xl font-black gradient-text">{stat.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Right: Form */}
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
        <div className="text-center lg:text-left mb-6">
          <h1 className="text-2xl font-black text-white mb-1">Create your account</h1>
          <p className="text-slate-400 text-sm">Free forever. No credit card required.</p>
        </div>

        <div className="glass rounded-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Full name"
              type="text"
              placeholder="John Doe"
              leftIcon={<User className="h-4 w-4" />}
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              leftIcon={<Lock className="h-4 w-4" />}
              rightElement={
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-white transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
            />

            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
              Create Free Account
            </Button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-4">
            By signing up you agree to our{' '}
            <Link href="/terms" className="text-allq-purple hover:underline">Terms</Link> &{' '}
            <Link href="/privacy" className="text-allq-purple hover:underline">Privacy Policy</Link>
          </p>
        </div>

        <p className="text-center text-sm text-slate-400 mt-5">
          Already have an account?{' '}
          <Link href="/login" className="text-allq-purple hover:underline font-medium">Sign in</Link>
        </p>
      </motion.div>
    </div>
  )
}
