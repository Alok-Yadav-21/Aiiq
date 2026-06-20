import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, createTokens, setAuthCookies } from '@/lib/auth'
import { loginSchema } from '@/lib/validations'
import { apiError } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return apiError('Invalid JSON body', 400)
    }
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, 400)
    }

    const { email, password } = parsed.data

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true, subscription: true },
    })

    if (!user || !user.passwordHash) {
      return apiError('Invalid email or password', 401)
    }

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) {
      return apiError('Invalid email or password', 401)
    }

    const session = await prisma.userSession.create({
      data: {
        userId: user.id,
        token: crypto.randomUUID(),
        refreshToken: crypto.randomUUID(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: req.headers.get('x-forwarded-for') || null,
        userAgent: req.headers.get('user-agent') || null,
      },
    })

    const { accessToken, refreshToken } = await createTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
      platformRole: user.platformRole,
      sessionId: session.id,
    })

    const res = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          platformRole: user.platformRole,
          subscription: user.subscription,
          profile: user.profile,
        },
        accessToken,
      },
    })

    setAuthCookies(res, accessToken, refreshToken)
    return res
  } catch (error) {
    console.error('[login]', error)
    return apiError('Login failed. Please try again.', 500)
  }
}
