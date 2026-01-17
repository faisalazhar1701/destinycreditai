import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/subscription-canceled')
  ) {
    return NextResponse.next()
  }

  // Only protect dashboard routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      console.log('No auth token found, redirecting to login');
      // Check if this is an API call (JSON response expected)
      const acceptHeader = request.headers.get('accept');
      if (acceptHeader && acceptHeader.includes('application/json')) {
        return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'content-type': 'application/json' },
        });
      }
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const payload = await verifyToken(token)

    if (!payload?.userId) {
      console.log('Invalid token, redirecting to login');
      // Check if this is an API call (JSON response expected)
      const acceptHeader = request.headers.get('accept');
      if (acceptHeader && acceptHeader.includes('application/json')) {
        return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'content-type': 'application/json' },
        });
      }
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
}
