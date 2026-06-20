import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, hashResetToken } from '@/lib/auth'
import { apiResponse, apiError } from '@/lib/utils'
import { z } from 'zod'

const schema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, 400)
    }

    const { token, password } = parsed.data

    // The raw token from the URL maps to a stored SHA-256 hash.
    const tokenHash = hashResetToken(token)

    // Find the token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: tokenHash },
    })

    if (!resetToken) {
      return apiError('This reset link is invalid. Please request a new one.', 400)
    }

    if (resetToken.used) {
      return apiError('This reset link has already been used. Please request a new one.', 400)
    }

    if (resetToken.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { token: tokenHash } }).catch(() => {})
      return apiError('This reset link has expired. Please request a new one.', 400)
    }

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { email: resetToken.email },
      select: { id: true },
    })

    if (!user) {
      return apiError('Account not found.', 404)
    }

    // Hash new password and update user
    const passwordHash = await hashPassword(password)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { token: tokenHash },
        data: { used: true },
      }),
      // Invalidate all existing sessions so stolen sessions can't be used
      prisma.userSession.deleteMany({
        where: { userId: user.id },
      }),
    ])

    return apiResponse({ message: 'Password reset successfully.' })
  } catch (error) {
    console.error('[reset-password]', error)
    return apiError('Failed to reset password. Please try again.', 500)
  }
}
