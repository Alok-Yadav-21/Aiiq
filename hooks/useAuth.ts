'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@/types'

interface AuthStore {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  setUser: (user: AuthUser | null) => void
  setToken: (token: string | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'allq-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
)

export function useAuth() {
  const store = useAuthStore()

  const register = async (name: string, email: string, password: string) => {
    store.setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')
      store.setUser(data.data.user)
      store.setToken(data.data.accessToken)
      return data.data
    } finally {
      store.setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    store.setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
      store.setUser(data.data.user)
      store.setToken(data.data.accessToken)
      return data.data
    } finally {
      store.setLoading(false)
    }
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    store.logout()
    window.location.href = '/'
  }

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: store.token ? { Authorization: `Bearer ${store.token}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        store.setUser(data.data)
      } else {
        store.logout()
      }
    } catch {
      store.logout()
    }
  }

  const platformRole = store.user?.platformRole || 'STUDENT'

  return {
    user: store.user,
    token: store.token,
    isLoading: store.isLoading,
    isAuthenticated: !!store.user,
    isPro: store.user?.subscription?.plan === 'PRO',
    isStarter: store.user?.subscription?.plan === 'STARTER' || store.user?.subscription?.plan === 'PRO',
    // Platform roles (teacher-support system)
    platformRole,
    isTeacher: platformRole === 'TEACHER' || platformRole === 'PLATFORM_ADMIN',
    isUniversityAdmin: platformRole === 'UNIVERSITY_ADMIN' || platformRole === 'PLATFORM_ADMIN',
    isPlatformAdmin: platformRole === 'PLATFORM_ADMIN',
    register,
    login,
    logout,
    refreshUser,
  }
}
