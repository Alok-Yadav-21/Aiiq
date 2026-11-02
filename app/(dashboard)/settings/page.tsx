'use client'

import { useQuery } from '@tanstack/react-query'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PLANS } from '@/lib/stripe'
import { motion } from 'framer-motion'
import {
  User, CreditCard, Shield, Bell, Palette,
  Crown, LogOut, AlertTriangle, CheckCircle, Zap
} from 'lucide-react'

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'subscription', label: 'Subscription', icon: CreditCard },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
]

export default function SettingsPage() {
  // Real study statistics — same derived source the dashboard uses.
  const { data: statsData } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const res = await fetch('/api/stats')
      if (!res.ok) return null
      return res.json().then((j) => j.data)
    },
    staleTime: 60_000,
  })
  const stats = statsData?.stats

  const { user, logout, isPro, isStarter } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState(user?.name || '')

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      await new Promise((r) => setTimeout(r, 500))
      toast.success('Profile updated!')
    } finally {
      setSaving(false)
    }
  }

  const handleUpgrade = async (plan: 'STARTER' | 'PRO') => {
    try {
      const res = await fetch('/api/payments/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const json = await res.json()
      if (json.data?.url) window.location.href = json.data.url
    } catch {
      toast.error('Failed to open payment portal')
    }
  }

  const handleManageSubscription = async () => {
    try {
      const res = await fetch('/api/payments/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'portal' }),
      })
      const json = await res.json()
      if (json.data?.url) window.location.href = json.data.url
    } catch {
      toast.error('Failed to open billing portal')
    }
  }

  const plan = user?.subscription?.plan || 'FREE'

  return (
    <div className="px-5 py-7 lg:px-9 lg:py-9 max-w-4xl mx-auto">
      <h1 className="text-3xl font-black text-slate-900 mb-6">Settings</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar tabs */}
        <div className="lg:w-48 flex-shrink-0">
          <nav className="space-y-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-purple-50 text-allq-purple border border-purple-200'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-5">
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your name and public profile details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-allq-purple to-allq-cyan flex items-center justify-center text-3xl font-black text-white">
                      {(user?.name || user?.email || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Profile Picture</p>
                      <p className="text-xs text-slate-500 mb-2">Auto-generated from your name</p>
                      <Button variant="secondary" size="sm">Change Avatar</Button>
                    </div>
                  </div>

                  <Input
                    label="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                  <Input label="Email Address" value={user?.email || ''} disabled hint="Email cannot be changed" />

                  <Button onClick={handleSaveProfile} loading={saving}>
                    Save Changes
                  </Button>
                </CardContent>
              </Card>

              {/* Stats Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {/* Derived study stats. ELO and win/loss only move through
                        live battles, so showing them here read as broken for
                        anyone who has only done solo quizzes. */}
                    {[
                      { label: 'Questions', value: stats?.questionsAnswered ?? 0 },
                      { label: 'Accuracy', value: `${stats?.accuracy ?? 0}%` },
                      { label: 'Quizzes', value: stats?.quizzesCompleted ?? 0 },
                      { label: 'Streak', value: stats?.currentStreak ?? 0 },
                    ].map((s) => (
                      <div key={s.label} className="surface-sunken p-4 text-center">
                        <div className="text-2xl font-black text-ink">{s.value}</div>
                        <div className="label-eyebrow mt-1">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'subscription' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              {/* Current Plan */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${plan === 'PRO' ? 'bg-allq-purple/15' : plan === 'STARTER' ? 'bg-allq-green/15' : 'bg-slate-100'}`}>
                        {plan === 'PRO' ? <Crown className="h-5 w-5 text-allq-purple" /> : <Zap className="h-5 w-5 text-slate-500" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{plan} Plan</p>
                        {user?.subscription?.currentPeriodEnd && (
                          <p className="text-xs text-slate-500">
                            Renews {new Date(user.subscription.currentPeriodEnd).toLocaleDateString('en-GB')}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant={plan === 'PRO' ? 'pro' : plan === 'STARTER' ? 'starter' : 'default'}>
                      {plan}
                    </Badge>
                  </div>

                  {plan !== 'FREE' && (
                    <Button variant="secondary" size="sm" className="mt-4" onClick={handleManageSubscription}>
                      Manage Billing
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Upgrade options */}
              {plan !== 'PRO' && (
                <div className="grid sm:grid-cols-2 gap-4">
                  {(Object.entries(PLANS) as [keyof typeof PLANS, typeof PLANS[keyof typeof PLANS]][]).map(([key, planData]) => (
                    <div key={key} className={`surface-card-hover rounded-2xl p-5 border ${key === 'PRO' ? 'border-allq-purple/30' : 'border-slate-200'}`}>
                      {key === 'PRO' && (
                        <div className="text-xs font-bold text-allq-purple bg-allq-purple/10 px-2.5 py-1 rounded-full w-fit mb-3">Most Popular</div>
                      )}
                      <h3 className="text-lg font-black text-slate-900 mb-0.5">{planData.name}</h3>
                      <p className="text-xs text-slate-500 mb-3">{planData.tagline}</p>
                      <div className="flex items-baseline gap-1 mb-4">
                        <span className="text-3xl font-black text-slate-900">£{(planData.price / 100).toFixed(2)}</span>
                        <span className="text-sm text-slate-500">/month</span>
                      </div>
                      <ul className="space-y-1.5 mb-4">
                        {planData.features.slice(0, 4).map((f) => (
                          <li key={f} className="flex items-start gap-2 text-xs text-slate-600">
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="w-full"
                        variant={key === 'PRO' ? 'primary' : 'secondary'}
                        size="sm"
                        disabled={plan === key as string}
                        onClick={() => handleUpgrade(key as 'STARTER' | 'PRO')}
                      >
                        {plan === key ? 'Current Plan' : `Upgrade to ${planData.name}`}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage your password and security options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input label="Current Password" type="password" placeholder="Enter current password" />
                  <Input label="New Password" type="password" placeholder="New password (min 8 chars)" />
                  <Input label="Confirm New Password" type="password" placeholder="Confirm new password" />
                  <Button>Update Password</Button>
                </CardContent>
              </Card>

              <Card className="border border-allq-red/20">
                <CardHeader>
                  <CardTitle className="text-allq-red flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" /> Danger Zone
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Sign out everywhere</p>
                      <p className="text-xs text-slate-500">Revoke all active sessions</p>
                    </div>
                    <Button variant="danger" size="sm" onClick={logout}>
                      <LogOut className="h-4 w-4" /> Sign Out
                    </Button>
                  </div>
                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Delete Account</p>
                      <p className="text-xs text-slate-500">Permanently delete all data (irreversible)</p>
                    </div>
                    <Button variant="danger" size="sm">Delete Account</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Choose what you'd like to be notified about</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { label: 'Quiz Room Invitations', desc: 'When someone challenges you' },
                      { label: 'Weekly Performance Report', desc: 'Your stats summary each week' },
                      { label: 'New Subject Recommendations', desc: 'Personalized learning suggestions' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between py-2">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{item.label}</p>
                          <p className="text-xs text-slate-500">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-allq-purple after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-all" />
                        </label>
                      </div>
                    ))}
                  </div>
                  <Button className="mt-4">Save Preferences</Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
