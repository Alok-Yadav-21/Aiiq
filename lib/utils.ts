import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const target = new Date(date)
  const diff = now.getTime() - target.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'just now'
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function calculateScore(
  isCorrect: boolean,
  timeRemainingMs: number,
  totalTimeMs: number,
  difficultyMultiplier: number
): number {
  if (!isCorrect) return 0
  const timeRatio = timeRemainingMs / totalTimeMs
  const basePoints = 100
  return Math.round(basePoints * (0.5 + 0.5 * timeRatio) * difficultyMultiplier)
}

export function getDifficultyMultiplier(difficulty: string): number {
  const map: Record<string, number> = {
    EASY: 1.0,
    MEDIUM: 1.5,
    HARD: 2.0,
    EXPERT: 3.0,
  }
  return map[difficulty] ?? 1.0
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length).trimEnd() + '...'
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function generateAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4`
}

export function eloChange(winnerElo: number, loserElo: number, k = 32): { winner: number; loser: number } {
  const expected = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400))
  const change = Math.round(k * (1 - expected))
  return { winner: change, loser: -change }
}

export function getRankBadge(eloRating: number): { label: string; color: string } {
  if (eloRating >= 2200) return { label: 'Grandmaster', color: '#f59e0b' }
  if (eloRating >= 2000) return { label: 'Master', color: '#8b5cf6' }
  if (eloRating >= 1800) return { label: 'Diamond', color: '#06b6d4' }
  if (eloRating >= 1600) return { label: 'Platinum', color: '#10b981' }
  if (eloRating >= 1400) return { label: 'Gold', color: '#f59e0b' }
  if (eloRating >= 1200) return { label: 'Silver', color: '#94a3b8' }
  return { label: 'Bronze', color: '#a16207' }
}

export function apiResponse<T>(data: T, status = 200) {
  return Response.json({ success: true, data }, { status })
}

export function apiError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status })
}
