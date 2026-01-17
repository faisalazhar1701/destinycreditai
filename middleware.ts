import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read cookie safely (EDGE SAFE)
  const token = request.cookies.get('auth_token')?.value;

  // Public routes
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/subscription-canceled')
  ) {
    return NextResponse.next();
  }

  // Protect admin & dashboard routes - basic auth check only
  if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Verify token only (no database access in edge runtime)
    const payload = verifyToken(token);
    if (!payload?.userId) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Additional checks (role, subscription) will be handled in server components
    // This ensures the middleware stays lightweight and Edge-compatible
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};