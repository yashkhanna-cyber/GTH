import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'gth-techverse-2026-super-secret-key-change-in-production'
)

const COOKIE_NAME = 'gth-session'

interface JWTPayload {
  userId: string
  email: string
  role: string
  name: string
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Skip static files, api routes, icons, images
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const token = req.cookies.get(COOKIE_NAME)?.value

  let user: JWTPayload | null = null

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      user = payload as unknown as JWTPayload
    } catch {
      // Invalid token, delete cookie and redirect if accessing protected route
    }
  }

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register')
  const isDashboardPage = pathname.startsWith('/dashboard')
  const isAdminPage = pathname.startsWith('/admin')

  if (!user) {
    if (isDashboardPage || isAdminPage) {
      const url = new URL('/login', req.url)
      url.searchParams.set('from', pathname)
      const response = NextResponse.redirect(url)
      response.cookies.delete(COOKIE_NAME)
      return response
    }
    return NextResponse.next()
  }

  // User is authenticated
  if (isAuthPage) {
    if (user.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', req.url))
    }
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  if (isAdminPage && user.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  if (isDashboardPage && user.role === 'ADMIN') {
    return NextResponse.redirect(new URL('/admin', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
