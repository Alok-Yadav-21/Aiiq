import { prisma } from '@/lib/prisma'

/**
 * Create an in-app notification (and optionally an email).
 * Best-effort — never throws so it can't break the main request flow.
 * Deduplicates: skips if an identical unread notification (same user/type/title)
 * was created in the last 60 seconds, to prevent duplicate/excessive notices.
 */
export async function notify(params: {
  userId: string
  type: string
  title: string
  body: string
  data?: Record<string, unknown>
  email?: boolean
}): Promise<void> {
  try {
    const since = new Date(Date.now() - 60_000)
    const dup = await prisma.notification.findFirst({
      where: { userId: params.userId, type: params.type, title: params.title, read: false, createdAt: { gte: since } },
      select: { id: true },
    })
    if (dup) return

    await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        data: (params.data as object) ?? undefined,
      },
    })

    if (params.email) {
      const user = await prisma.user.findUnique({ where: { id: params.userId }, select: { email: true, name: true } })
      if (user?.email) await sendEmail(user.email, params.title, params.body)
    }
  } catch (err) {
    console.error('[notify] failed:', err)
  }
}

/** Notify many users at once (capped to avoid huge fan-out). */
export async function notifyMany(userIds: string[], params: Omit<Parameters<typeof notify>[0], 'userId'>): Promise<void> {
  const unique = [...new Set(userIds)].slice(0, 500)
  await Promise.all(unique.map((userId) => notify({ ...params, userId })))
}

async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  const host = process.env.SMTP_HOST || process.env.EMAIL_SERVER_HOST
  const user = process.env.SMTP_USER || process.env.EMAIL_SERVER_USER
  const pass = process.env.SMTP_PASS || process.env.EMAIL_SERVER_PASSWORD
  if (!host || !user || !pass) return // SMTP not configured — in-app only
  try {
    const nodemailer = await import('nodemailer')
    const port = parseInt(process.env.SMTP_PORT || '587')
    const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } })
    await transporter.sendMail({
      from: `AllQ <${process.env.EMAIL_FROM || 'noreply@allq.app'}>`,
      to,
      subject: `AllQ · ${subject}`,
      text,
    })
  } catch (err) {
    console.error('[notify email] failed:', err)
  }
}
