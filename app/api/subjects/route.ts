import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest, getPlanLimits } from '@/lib/auth'
import { createSubjectSchema } from '@/lib/validations'
import { apiResponse, apiError } from '@/lib/utils'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('perPage') || '12')
    const category = searchParams.get('category') || undefined
    const difficulty = searchParams.get('difficulty') || undefined
    const search = searchParams.get('search') || undefined
    const sort = searchParams.get('sort') || 'upvoteCount'
    const mine = searchParams.get('mine') === 'true'

    const payload = await getSessionFromRequest(req)

    const where = {
      ...(mine && payload ? { creatorId: payload.sub } : { isPublic: true }),
      ...(category && { category: category as any }),
      ...(difficulty && { difficulty: difficulty as any }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
          { tags: { has: search } },
        ],
      }),
    }

    const [subjects, total] = await Promise.all([
      prisma.subject.findMany({
        where,
        include: {
          creator: { select: { name: true, image: true } },
          _count: { select: { materials: true, questionBank: true, enrollments: true } },
        },
        orderBy: sort === 'recent' ? { createdAt: 'desc' } :
                 sort === 'enrolled' ? { enrolledCount: 'desc' } :
                 { upvoteCount: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.subject.count({ where }),
    ])

    return apiResponse({
      items: subjects,
      total,
      page,
      perPage,
      hasMore: page * perPage < total,
    })
  } catch (error) {
    console.error('[subjects GET]', error)
    return apiError('Failed to fetch subjects', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await getSessionFromRequest(req)
    if (!payload) return apiError('Unauthorized', 401)

    const body = await req.json()
    const parsed = createSubjectSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 400)

    const subscription = await prisma.userSubscription.findUnique({
      where: { userId: payload.sub },
    })

    const limits = getPlanLimits(subscription?.plan || 'FREE')
    const existingCount = await prisma.subject.count({ where: { creatorId: payload.sub } })

    if (existingCount >= limits.maxSubjects) {
      return apiError(
        `Your ${subscription?.plan || 'FREE'} plan allows ${limits.maxSubjects} subject(s). Upgrade to create more.`,
        403
      )
    }

    const subject = await prisma.subject.create({
      data: {
        ...parsed.data,
        creatorId: payload.sub,
      },
      include: {
        creator: { select: { name: true, image: true } },
        _count: { select: { materials: true, questionBank: true } },
      },
    })

    return apiResponse(subject, 201)
  } catch (error) {
    console.error('[subjects POST]', error)
    return apiError('Failed to create subject', 500)
  }
}
