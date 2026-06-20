import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { apiResponse, apiError } from '@/lib/utils'

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return apiError('Unauthorized', 401)

    const { searchParams } = new URL(req.url)
    const unreadOnly = searchParams.get('unread') === 'true'
    const take = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.sub,
        ...(unreadOnly ? { read: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take,
    })

    const unreadCount = await prisma.notification.count({
      where: { userId: session.sub, read: false },
    })

    return apiResponse({ notifications, unreadCount })
  } catch (error) {
    console.error('[notifications GET]', error)
    return apiError('Failed to fetch notifications', 500)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return apiError('Unauthorized', 401)

    const body = await req.json().catch(() => ({}))
    const { ids, markAll } = body as { ids?: string[]; markAll?: boolean }

    if (markAll) {
      await prisma.notification.updateMany({
        where: { userId: session.sub, read: false },
        data: { read: true },
      })
    } else if (ids && ids.length > 0) {
      await prisma.notification.updateMany({
        where: { userId: session.sub, id: { in: ids } },
        data: { read: true },
      })
    }

    return apiResponse({ success: true })
  } catch (error) {
    console.error('[notifications PATCH]', error)
    return apiError('Failed to update notifications', 500)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return apiError('Unauthorized', 401)

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (id) {
      await prisma.notification.deleteMany({
        where: { id, userId: session.sub },
      })
    } else {
      await prisma.notification.deleteMany({
        where: { userId: session.sub, read: true },
      })
    }

    return apiResponse({ success: true })
  } catch (error) {
    console.error('[notifications DELETE]', error)
    return apiError('Failed to delete notifications', 500)
  }
}
