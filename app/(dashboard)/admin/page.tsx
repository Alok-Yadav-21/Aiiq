'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { LayoutGrid, Users, GraduationCap, ShieldCheck, Inbox, Clock, Star, Building2, BookOpen, AlertTriangle, MessageSquare } from 'lucide-react'

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-analytics'], queryFn: async () => (await fetch('/api/admin/analytics')).json().then((j) => j.data) })

  if (isLoading || !data) return <div className="p-8"><div className="skeleton h-40 w-full rounded-2xl" /></div>

  const { teachers, studentCount, deptCount, programmeCount, moduleCount, support, workloads } = data
  const cards = [
    { icon: Users, label: 'Students', value: studentCount },
    { icon: GraduationCap, label: 'Approved teachers', value: teachers.APPROVED || 0 },
    { icon: ShieldCheck, label: 'Pending approvals', value: teachers.PENDING || 0, href: '/admin/teachers', accent: (teachers.PENDING || 0) > 0 },
    { icon: Inbox, label: 'Open questions', value: support.open },
    { icon: AlertTriangle, label: 'Unassigned', value: support.unassigned, href: '/support', accent: support.unassigned > 0 },
    { icon: Clock, label: 'Avg resolution (h)', value: support.avgResolutionHours ?? '—' },
    { icon: Star, label: 'Avg rating', value: support.avgRating ?? '—' },
    { icon: MessageSquare, label: 'Resolution rate', value: `${support.resolutionRate}%` },
  ]

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-allq-purple to-allq-cyan flex items-center justify-center"><LayoutGrid className="h-6 w-6 text-white" /></div>
        <div>
          <h1 className="text-2xl font-black text-white">University Admin</h1>
          <p className="text-slate-400 text-sm">Manage your university&apos;s departments, teachers, and student support.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((c) => {
          const inner = (
            <div className={`glass rounded-2xl p-4 h-full ${c.accent ? 'border border-allq-amber/30' : ''}`}>
              <c.icon className={`h-5 w-5 mb-2 ${c.accent ? 'text-allq-amber' : 'text-allq-cyan'}`} />
              <p className="text-2xl font-black text-white">{c.value}</p>
              <p className="text-xs text-slate-400">{c.label}</p>
            </div>
          )
          return c.href ? <Link key={c.label} href={c.href}>{inner}</Link> : <div key={c.label}>{inner}</div>
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass rounded-2xl p-6">
          <h2 className="font-bold text-white mb-4 flex items-center gap-2"><GraduationCap className="h-5 w-5 text-allq-cyan" /> Teacher workloads</h2>
          {workloads.length === 0 ? (
            <p className="text-slate-400 text-sm">No teachers handling questions yet.</p>
          ) : (
            <div className="space-y-2">
              {workloads.map((w: { teacherProfileId: string; name: string; open: number; total: number }) => (
                <div key={w.teacherProfileId} className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
                  <span className="text-sm text-white">{w.name}</span>
                  <span className="text-xs text-slate-400"><span className="text-allq-amber font-semibold">{w.open}</span> open · {w.total} total</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-6">
          <h2 className="font-bold text-white mb-4 flex items-center gap-2"><Building2 className="h-5 w-5 text-allq-cyan" /> Structure</h2>
          <div className="space-y-2 text-sm">
            <Row icon={Building2} label="Departments" value={deptCount} />
            <Row icon={BookOpen} label="Programmes" value={programmeCount} />
            <Row icon={BookOpen} label="Modules" value={moduleCount} />
          </div>
          <Link href="/admin/academic"><div className="mt-4 text-xs text-allq-purple hover:underline">Manage academic structure →</div></Link>
          <Link href="/admin/teachers"><div className="mt-2 text-xs text-allq-purple hover:underline">Teacher approvals →</div></Link>
        </div>
      </div>
    </div>
  )
}

function Row({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-slate-400"><Icon className="h-4 w-4" /> {label}</span>
      <span className="text-white font-semibold">{value}</span>
    </div>
  )
}
