'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import { Building2, Plus } from 'lucide-react'

const TABS = [
  { v: 'departments', label: 'Departments', endpoint: '/api/admin/departments' },
  { v: 'programmes', label: 'Programmes', endpoint: '/api/admin/programmes' },
  { v: 'modules', label: 'Modules', endpoint: '/api/admin/modules' },
  { v: 'academic-years', label: 'Academic Years', endpoint: '/api/admin/academic-years' },
] as const

export default function AcademicAdminPage() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [tab, setTab] = useState<typeof TABS[number]['v']>('departments')
  const active = TABS.find((t) => t.v === tab)!

  // Universities (platform admin may have many; uni admin gets exactly one).
  const { data: unis } = useQuery({ queryKey: ['admin-universities'], queryFn: async () => (await fetch('/api/admin/universities')).json().then((j) => j.data?.items || []) })
  const [universityId, setUniversityId] = useState('')
  const uniId = universityId || unis?.[0]?.id || ''

  const { data: deptData } = useQuery({ queryKey: ['admin-departments', uniId], enabled: !!uniId, queryFn: async () => (await fetch('/api/admin/departments')).json().then((j) => j.data?.items || []) })
  const { data: list, isLoading } = useQuery({
    queryKey: ['admin-academic', tab, uniId],
    enabled: !!uniId,
    queryFn: async () => (await fetch(active.endpoint)).json().then((j) => j.data?.items || []),
  })

  const [form, setForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    setSaving(true)
    try {
      const payload: Record<string, unknown> = { universityId: uniId, name: form.name, code: form.code || undefined }
      if (tab === 'programmes') { payload.departmentId = form.departmentId; payload.degreeLevel = form.degreeLevel || undefined }
      if (tab === 'modules') { payload.departmentId = form.departmentId }
      if (tab === 'academic-years') { payload.isCurrent = form.isCurrent === 'true' }
      const res = await fetch(active.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('Created', `${active.label.slice(0, -1)} added.`)
      setForm({})
      qc.invalidateQueries({ queryKey: ['admin-academic'] })
      qc.invalidateQueries({ queryKey: ['admin-departments'] })
    } catch (err) { toast.error('Failed', err instanceof Error ? err.message : 'Try again') } finally { setSaving(false) }
  }

  const needsDept = tab === 'programmes' || tab === 'modules'

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-allq-purple to-allq-cyan flex items-center justify-center"><Building2 className="h-6 w-6 text-white" /></div>
        <div>
          <h1 className="text-2xl font-black text-white">Academic Structure</h1>
          <p className="text-slate-400 text-sm">Manage departments, programmes, modules, and academic years.</p>
        </div>
      </div>

      {unis && unis.length > 1 && (
        <select value={uniId} onChange={(e) => setUniversityId(e.target.value)} className="input-glass rounded-xl px-3 py-2 text-sm mb-4">
          {unis.map((u: { id: string; name: string }) => <option key={u.id} value={u.id} className="bg-bg-surface">{u.name}</option>)}
        </select>
      )}

      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map((t) => (
          <button key={t.v} onClick={() => { setTab(t.v); setForm({}) }} className={cn('px-4 py-2 rounded-xl text-sm font-semibold border transition-all', tab === t.v ? 'bg-allq-purple/10 text-allq-purple border-allq-purple/30' : 'text-slate-400 border-transparent hover:bg-white/5')}>{t.label}</button>
        ))}
      </div>

      {/* Create form */}
      <div className="glass rounded-2xl p-5 mb-6 space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label={`${active.label.slice(0, -1)} name`} value={form.name || ''} onChange={(e) => set('name', e.target.value)} placeholder={tab === 'academic-years' ? '2025/2026' : 'Name'} />
          {tab !== 'academic-years' && <Input label="Code (optional)" value={form.code || ''} onChange={(e) => set('code', e.target.value)} placeholder="e.g. DS101" />}
          {needsDept && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Department</label>
              <select value={form.departmentId || ''} onChange={(e) => set('departmentId', e.target.value)} className="input-glass w-full rounded-xl px-3 py-2.5 text-sm">
                <option value="" className="bg-bg-surface">Select…</option>
                {(deptData || []).map((d: { id: string; name: string }) => <option key={d.id} value={d.id} className="bg-bg-surface">{d.name}</option>)}
              </select>
            </div>
          )}
          {tab === 'programmes' && <Input label="Degree level (optional)" value={form.degreeLevel || ''} onChange={(e) => set('degreeLevel', e.target.value)} placeholder="BSc" />}
          {tab === 'academic-years' && (
            <label className="flex items-center gap-2 text-sm text-slate-300 mt-7"><input type="checkbox" checked={form.isCurrent === 'true'} onChange={(e) => set('isCurrent', e.target.checked ? 'true' : 'false')} className="accent-allq-purple" /> Current year</label>
          )}
        </div>
        <div className="flex justify-end">
          <Button size="sm" onClick={submit} loading={saving} disabled={!form.name || (needsDept && !form.departmentId)}><Plus className="h-4 w-4" /> Add {active.label.slice(0, -1).toLowerCase()}</Button>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-14 w-full rounded-xl" />)}</div>
      ) : (list || []).length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-slate-400 text-sm">No {active.label.toLowerCase()} yet.</div>
      ) : (
        <div className="space-y-2">
          {(list || []).map((it: { id: string; name: string; code?: string; department?: { name: string }; isCurrent?: boolean; _count?: Record<string, number> }) => (
            <div key={it.id} className="glass rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-white font-medium">{it.name}</span>
                {it.code && <span className="text-xs text-slate-500 ml-2">{it.code}</span>}
                {it.department?.name && <span className="text-xs text-slate-500 ml-2">· {it.department.name}</span>}
                {it.isCurrent && <span className="text-[10px] bg-allq-green/15 text-allq-green border border-allq-green/30 px-2 py-0.5 rounded-full ml-2">CURRENT</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
