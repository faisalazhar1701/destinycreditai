export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.set({
    name: 'auth_token',
    value: '',
    maxAge: 0,
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Only secure in production
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for production, 'lax' for development
  });

  return response;
}
