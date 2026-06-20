import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, createTokens, setAuthCookies } from '@/lib/auth'
import { registerSchema } from '@/lib/validations'
import { apiResponse, apiError } from '@/lib/utils'
import { NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return apiError('Invalid JSON body', 400)
    }
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, 400)
    }

    const { name, email, password } = parsed.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return apiError('An account with this email already exists', 409)
    }

    const passwordHash = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'FREE',
        profile: { create: { eloRating: 1200 } },
        subscription: { create: { plan: 'FREE' } },
      },
      include: { profile: true, subscription: true },
    })

    const session = await prisma.userSession.create({
      data: {
        userId: user.id,
        token: crypto.randomUUID(),
        refreshToken: crypto.randomUUID(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null,
        userAgent: req.headers.get('user-agent') || null,
      },
    })

    const { accessToken, refreshToken } = await createTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id,
    })

    const res = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          subscription: user.subscription,
          profile: user.profile,
        },
        accessToken,
      },
    })

    setAuthCookies(res, accessToken, refreshToken)
    return res
  } catch (error) {
    console.error('[register]', error)
    return apiError('Registration failed. Please try again.', 500)
  }
}
