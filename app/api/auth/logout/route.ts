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
    secure: true,
    sameSite: 'none',
  });

  return response;
}
