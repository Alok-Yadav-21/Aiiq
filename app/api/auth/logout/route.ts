import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest, clearAuthCookies } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const payload = await getSessionFromRequest(req)

  if (payload) {
    await prisma.userSession.updateMany({
      where: { userId: payload.sub, revoked: false },
      data: { revoked: true },
    }).catch(() => {})
  }

  const res = NextResponse.json({ success: true })
  clearAuthCookies(res)
  return res
}
