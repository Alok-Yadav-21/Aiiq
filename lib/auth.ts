import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from './prisma'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'allq-dev-secret-please-change-in-production'
)
const JWT_REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || 'allq-refresh-secret-please-change-in-production'
)

export interface JWTPayload {
  sub: string
  email: string
  role: string
  sessionId: string
  iat?: number
  exp?: number
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Password-reset tokens.
 * Only a SHA-256 hash of the token is stored in the DB; the raw token lives
 * solely in the email link. This way a database leak cannot be used to hijack
 * a reset, because the raw token can't be derived from its hash.
 */
export function generateResetToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(32).toString('hex')
  return { raw, hash: hashResetToken(raw) }
}

export function hashResetToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex')
}

export async function createTokens(payload: Omit<JWTPayload, 'iat' | 'exp'>) {
  const accessToken = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(JWT_SECRET)

  const refreshToken = await new SignJWT({ sub: payload.sub, sessionId: payload.sessionId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_REFRESH_SECRET)

  return { accessToken, refreshToken }
}

export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

export async function verifyRefreshToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_REFRESH_SECRET)
    return payload as { sub: string; sessionId: string }
  } catch {
    return null
  }
}

export async function getSessionFromRequest(req: NextRequest): Promise<JWTPayload | null> {
  const authHeader = req.headers.get('authorization')
  const cookieToken = req.cookies.get('allq_token')?.value

  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : cookieToken

  if (!token) return null
  return verifyAccessToken(token)
}

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('allq_token')?.value
  if (!token) return null

  const payload = await verifyAccessToken(token)
  if (!payload) return null

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: {
      profile: true,
      subscription: true,
    },
  })

  return user
}

export function setAuthCookies(
  res: { cookies: { set: (name: string, value: string, opts: object) => void } },
  accessToken: string,
  refreshToken: string
) {
  // Mark cookies Secure only when the app is actually served over HTTPS.
  // A local production build runs over http://localhost, where Secure cookies
  // are silently dropped by the browser — which would break login. Basing this
  // on the app URL's protocol (rather than NODE_ENV) keeps local HTTP working
  // while still enforcing Secure on a real HTTPS deployment.
  const secure = (process.env.NEXT_PUBLIC_APP_URL || '').startsWith('https')

  res.cookies.set('allq_token', accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: 60 * 15,
    path: '/',
  })

  res.cookies.set('allq_refresh', refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
}

export function clearAuthCookies(res: { cookies: { set: (name: string, value: string, opts: object) => void } }) {
  res.cookies.set('allq_token', '', { maxAge: 0, path: '/' })
  res.cookies.set('allq_refresh', '', { maxAge: 0, path: '/' })
}

export function getPlanLimits(plan: string) {
  const limits = {
    FREE: {
      maxSubjects: 1,
      maxUploadsPerSubject: 10,
      maxUploadsPerDay: 10,
      maxQuestions: 10,
      maxAttempts: 3,
      canCompete: false,
      aiExplanations: false,
      analytics: false,
      ads: true,
    },
    STARTER: {
      maxSubjects: 5,
      maxUploadsPerSubject: 50,
      maxUploadsPerDay: 50,
      maxQuestions: 50,
      maxAttempts: Infinity,
      canCompete: true,
      aiExplanations: true,
      analytics: true,
      ads: false,
    },
    PRO: {
      maxSubjects: Infinity,
      maxUploadsPerSubject: Infinity,
      maxUploadsPerDay: Infinity,
      maxQuestions: 100,
      maxAttempts: Infinity,
      canCompete: true,
      aiExplanations: true,
      analytics: true,
      ads: false,
    },
  }

  return limits[plan as keyof typeof limits] || limits.FREE
}
