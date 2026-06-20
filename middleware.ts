import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from './lib/auth'

const publicRoutes = ['/', '/login', '/signup', '/pricing', '/about', '/terms', '/privacy', '/forgot-password', '/reset-password', '/compete/preview']
const authRoutes = ['/login', '/signup']
const protectedRoutes = ['/dashboard', '/subjects', '/compete', '/settings', '/profile', '/challenges', '/analytics']
// Paths that start with a protected prefix but are actually public
const publicExceptions = ['/compete/preview']

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
