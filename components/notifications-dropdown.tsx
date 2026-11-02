'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Bell, CheckCheck, Trash2, Swords, Trophy, Zap, BookOpen, Info } from 'lucide-react'
import { cn, formatRelativeTime } from '@/lib/utils'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  read: boolean
  createdAt: string
}

const typeIcon: Record<string, { icon: React.ElementType; color: string }> = {
  CHALLENGE: { icon: Swords, color: '#8b5cf6' },
  ACHIEVEMENT: { icon: Trophy, color: '#f59e0b' },
  SUBSCRIPTION: { icon: Zap, color: '#06b6d4' },
  QUIZ_RESULT: { icon: BookOpen, color: '#10b981' },
  SYSTEM: { icon: Info, color: '#94a3b8' },
}

export function NotificationsDropdown() {
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications?limit=20')
      const json = await res.json()
      return json.data as { notifications: Notification[]; unreadCount: number }
    },
    refetchInterval: 60000,
  })

  const markReadMutation = useMutation({
    mutationFn: async (payload: { markAll?: boolean; ids?: string[] }) => {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await fetch('/api/notifications', { method: 'DELETE' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const unreadCount = data?.unreadCount || 0
  const notifications = data?.notifications || []

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && unreadCount > 0) {
      markReadMutation.mutate({ markAll: true })
    }
  }

  return (
    <DropdownMenu.Root onOpenChange={handleOpen}>
      <DropdownMenu.Trigger asChild>
        <button className="relative text-slate-500 hover:text-slate-900 transition-colors p-1.5 rounded-lg hover:bg-slate-100">
          <Bell className="h-5 w-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-allq-purple rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 w-80 bg-white rounded-2xl shadow-[0_12px_32px_rgba(15,23,42,0.12)] border border-slate-200 overflow-hidden animate-slide-down"
          align="end"
          sideOffset={10}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
            {notifications.length > 0 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); markReadMutation.mutate({ markAll: true }) }}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  title="Mark all read"
                >
                  <CheckCheck className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteMutation.mutate() }}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Clear read"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length > 0 ? (
              notifications.map((n) => {
                const meta = typeIcon[n.type] || typeIcon['SYSTEM']
                const Icon = meta.icon
                return (
                  <DropdownMenu.Item
                    key={n.id}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 outline-none cursor-default',
                      !n.read && 'bg-purple-50'
                    )}
                    onSelect={(e) => e.preventDefault()}
                  >
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: meta.color + '18' }}
                    >
                      <Icon className="h-4 w-4" style={{ color: meta.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-900 leading-snug">{n.title}</p>
                        {!n.read && (
                          <span className="h-1.5 w-1.5 rounded-full bg-allq-purple flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.body}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{formatRelativeTime(n.createdAt)}</p>
                    </div>
                  </DropdownMenu.Item>
                )
              })
            ) : (
              <div className="py-10 text-center">
                <Bell className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">You're all caught up</p>
              </div>
            )}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
