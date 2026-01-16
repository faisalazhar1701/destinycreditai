import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';
import { prisma } from './lib/prisma';

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

  // Protect admin & dashboard routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Verify token and check subscription status
    const payload = verifyToken(token);
    if (!payload?.userId) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    try {
      // Fetch user to check subscription status
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { subscription_status: true, role: true }
      });
      
      if (!user) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      
      // Block access if user is unsubscribed (only applies to USER role)
      if (user.role === 'USER' && user.subscription_status === 'UNSUBSCRIBED') {
        return NextResponse.redirect(new URL('/subscription-canceled', request.url));
      }
    } catch (error) {
      console.error('Error checking user subscription status:', error);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};