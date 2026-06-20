import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiResponse, apiError } from '@/lib/utils'
import { generateResetToken } from '@/lib/auth'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

async function sendResetEmail(email: string, token: string, name: string | null) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`

  // Try nodemailer if SMTP credentials are configured
  const smtpHost = process.env.SMTP_HOST || process.env.EMAIL_SERVER_HOST
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_SERVER_USER
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_SERVER_PASSWORD
  const smtpPort = parseInt(process.env.SMTP_PORT || process.env.EMAIL_SERVER_PORT || '587')
  const emailFrom = process.env.EMAIL_FROM || 'noreply@allq.app'

  if (smtpHost && smtpUser && smtpPass) {
    const nodemailer = await import('nodemailer')
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    })

    await transporter.sendMail({
      from: `AllQ <${emailFrom}>`,
      to: email,
      subject: 'Reset your AllQ password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <title>Reset your AllQ password</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0f; color: #e2e8f0; margin: 0; padding: 40px 16px;">
          <div style="max-width: 480px; margin: 0 auto; background: #12121a; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; overflow: hidden;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #8b5cf6, #06b6d4); padding: 32px; text-align: center;">
              <div style="display: inline-flex; align-items: center; gap: 8px;">
                <div style="width: 36px; height: 36px; background: rgba(255,255,255,0.2); border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 18px;">⚡</div>
                <span style="font-size: 22px; font-weight: 900; color: white; letter-spacing: -0.5px;">AllQ</span>
              </div>
            </div>
            <!-- Body -->
            <div style="padding: 32px;">
              <h1 style="color: white; font-size: 22px; font-weight: 800; margin: 0 0 8px;">Reset your password</h1>
              <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                Hi ${name || 'there'},<br /><br />
                We received a request to reset the password for your AllQ account. Click the button below to choose a new password.
              </p>
              <a href="${resetUrl}" style="display: block; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; text-decoration: none; text-align: center; padding: 14px 24px; border-radius: 10px; font-weight: 700; font-size: 15px; margin-bottom: 24px;">
                Reset Password
              </a>
              <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0 0 16px;">
                This link expires in <strong style="color: #94a3b8;">1 hour</strong>. If you didn't request a password reset, you can safely ignore this email — your password won't be changed.
              </p>
              <p style="color: #475569; font-size: 12px; margin: 0;">
                Or copy this URL into your browser:<br />
                <a href="${resetUrl}" style="color: #8b5cf6; word-break: break-all;">${resetUrl}</a>
              </p>
            </div>
            <!-- Footer -->
            <div style="padding: 16px 32px; border-top: 1px solid rgba(255,255,255,0.05); text-align: center;">
              <p style="color: #475569; font-size: 12px; margin: 0;">
                © 2025 AllQ · Learn It. Quiz It. Win It.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    })
    return
  }

  // Dev fallback: log to console
  console.info('\n📧 [FORGOT PASSWORD — Dev Mode]\n')
  console.info(`To: ${email}`)
  console.info(`Reset URL: ${resetUrl}`)
  console.info('(Configure SMTP_HOST, SMTP_USER, SMTP_PASS to send real emails)\n')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const email = typeof body?.email === 'string' ? body.email.toLowerCase().trim() : ''

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return apiError('Please provide a valid email address.', 400)
    }

    // Rate limit to stop abuse / email bombing — per IP and per target email.
    const ip = getClientIp(req)
    const ipLimit = rateLimit(`forgot:ip:${ip}`, 5, 15 * 60 * 1000) // 5 per 15 min per IP
    const emailLimit = rateLimit(`forgot:email:${email}`, 3, 60 * 60 * 1000) // 3 per hour per email
    if (!ipLimit.allowed || !emailLimit.allowed) {
      const retry = Math.max(ipLimit.retryAfterSec, emailLimit.retryAfterSec)
      return apiError(
        `Too many reset requests. Please wait ${Math.ceil(retry / 60)} minute(s) and try again.`,
        429,
      )
    }

    // Always respond with success to prevent email enumeration
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, passwordHash: true },
    })

    // If user doesn't exist or uses OAuth-only (no password hash), still return 200
    if (user && user.passwordHash) {
      // Invalidate any existing tokens for this email
      await prisma.passwordResetToken.deleteMany({ where: { email } })

      // Generate a secure token. Only the hash is stored; the raw token is
      // emailed to the user and never persisted.
      const { raw, hash } = generateResetToken()
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      await prisma.passwordResetToken.create({
        data: { email, token: hash, expiresAt },
      })

      // Send email (non-blocking — don't let email failure break the response)
      sendResetEmail(email, raw, user.name).catch((err) => {
        console.error('[forgot-password] Email send failed:', err)
      })

      // In dev mode without SMTP, return the link directly so the page can display it
      const isDevMode = process.env.NODE_ENV !== 'production'
      const hasSmtp = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
      if (isDevMode && !hasSmtp) {
        const devUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${raw}`
        return apiResponse({
          message: 'If an account with that email exists, a reset link has been sent.',
          devResetUrl: devUrl,
        })
      }
    }

    return apiResponse({
      message: 'If an account with that email exists, a reset link has been sent.',
    })
  } catch (error) {
    console.error('[forgot-password]', error)
    return apiError('Something went wrong. Please try again.', 500)
  }
}
