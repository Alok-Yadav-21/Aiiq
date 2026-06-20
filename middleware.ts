import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from './lib/auth'

const publicRoutes = ['/', '/login', '/signup', '/pricing', '/about', '/terms', '/privacy', '/forgot-password', '/reset-password', '/compete/preview', '/teacher/apply']
const authRoutes = ['/login', '/signup']
const protectedRoutes = ['/dashboard', '/subjects', '/compete', '/settings', '/profile', '/challenges', '/analytics', '/teacher', '/admin']
// Paths that start with a protected prefix but are actually public
const publicExceptions = ['/compete/preview']

// Role-gated route prefixes. PLATFORM_ADMIN passes everything.
const teacherRoutes = ['/teacher']
const adminRoutes = ['/admin']
// Teacher onboarding is open to any logged-in user (students applying to become teachers).
const teacherRouteExceptions = ['/teacher/apply', '/teacher/status']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('allq_token')?.value

  const isPublicException = publicExceptions.some((r) => pathname.startsWith(r))
  const isProtected = !isPublicException && protectedRoutes.some((r) => pathname.startsWith(r))
  const isAuthRoute = authRoutes.some((r) => pathname.startsWith(r))

  if (isProtected) {
    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    const payload = await verifyAccessToken(token)
    if (!payload) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // ── Role-based gating ──
    const role = payload.platformRole
    const isSuper = role === 'PLATFORM_ADMIN'

    const needsTeacher = teacherRoutes.some((r) => pathname.startsWith(r)) &&
      !teacherRouteExceptions.some((r) => pathname.startsWith(r))
    if (needsTeacher && role !== 'TEACHER' && !isSuper) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    const needsAdmin = adminRoutes.some((r) => pathname.startsWith(r))
    if (needsAdmin && role !== 'UNIVERSITY_ADMIN' && !isSuper) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  if (isAuthRoute && token) {
    const payload = await verifyAccessToken(token)
    if (payload) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
