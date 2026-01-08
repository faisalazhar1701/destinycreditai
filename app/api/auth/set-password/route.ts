export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

/**
 * POST /api/auth/set-password
 * 
 * Endpoint for invited users to set their password using a token
 * This endpoint handles the secure password setup flow for users created via Zapier
 * 
 * Expected payload:
 * {
 *   "token": "invite_token_from_email",
 *   "password": "SecurePassword123!"
 * }
 */
export async function POST(request: Request) {
  try {
    console.log('🔐 Password setup attempt received');
    
    const body = await request.json();
    const { token, password } = body;

    // Validate input
    if (!token || !password) {
      console.log('❌ Missing token or password');
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    // Validate password strength (at least 8 chars, 1 uppercase, 1 lowercase, 1 number)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      console.log('❌ Password does not meet requirements');
      return NextResponse.json(
        { error: 'Password must be at least 8 characters with uppercase, lowercase, and number' },
        { status: 400 }
      );
    }

    console.log('🔍 Looking for user with token:', token);
    
    // Find user by invite token
    const user = await prisma.user.findFirst({
      where: {
        inviteToken: token,
      },
    });
    
    if (user) {
      console.log('🔍 Found user:', user.email, 'with stored token:', user.inviteToken);
    } else {
      console.log('🔍 No user found with token:', token);
      
      // Debug: Check if any users have invite tokens
      const allUsersWithTokens = await prisma.user.findMany({
        where: {
          inviteToken: { not: null },
        },
        select: {
          email: true,
          inviteToken: true,
          inviteExpiresAt: true,
        },
      });
      
      console.log('🔍 Users with invite tokens in DB:', allUsersWithTokens.map((u: any) => ({
        email: u.email,
        tokenLength: u.inviteToken?.length,
        tokenPrefix: u.inviteToken?.substring(0, 10),
        expiresAt: u.inviteExpiresAt,
        isExpired: u.inviteExpiresAt && new Date(u.inviteExpiresAt) < new Date()
      })));
    }
    
    if (!user) {
      console.log('❌ Invalid or expired token');
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (user.inviteExpiresAt && new Date() > new Date(user.inviteExpiresAt)) {
      console.log('❌ Token has expired');
      return NextResponse.json(
        { error: 'Token has expired' },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await hashPassword(password);

    // Update user: set password, activate account, clear token
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        active: true, // User is now active
        status: 'ACTIVE', // Update status to active
        inviteToken: null, // Clear the invite token to prevent reuse
        inviteExpiresAt: null, // Clear expiry
      },
    });

    console.log('✅ Password set successfully for user:', user.email);

    return NextResponse.json({
      message: 'Password set successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
      }
    });

  } catch (error) {
    console.error('❌ Password setup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}