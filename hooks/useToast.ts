'use client'

import { create } from 'zustand'

interface Toast {
  id: string
  title?: string
  description?: string
  type?: 'success' | 'error' | 'warning' | 'info'
}

interface ToastStore {
  toasts: Toast[]
  add: (toast: Omit<Toast, 'id'>) => void
  dismiss: (id: string) => void
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (toast) => {
    const id = Math.random().toString(36).slice(2)
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 4000)
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))

export function useToast() {
  const { toasts, add, dismiss } = useToastStore()

  return {
    toasts,
    dismiss,
    toast: {
      success: (title: string, description?: string) => add({ type: 'success', title, description }),
      error: (title: string, description?: string) => add({ type: 'error', title, description }),
      warning: (title: string, description?: string) => add({ type: 'warning', title, description }),
      info: (title: string, description?: string) => add({ type: 'info', title, description }),
    },
  }
}
