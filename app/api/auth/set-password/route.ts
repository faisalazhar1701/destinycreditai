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

    // No password validation - accept any string as password

    // URL decode the token in case it was encoded during transmission
    const decodedToken = decodeURIComponent(token);
    console.log('🔍 Looking for user with token:', decodedToken);
    
    // Find user by invite token
    const user = await prisma.user.findFirst({
      where: {
        inviteToken: decodedToken,
      },
    });
    
    if (user) {
      console.log('🔍 Found user:', user.email, 'with stored token:', user.inviteToken);
    } else {
      console.log('🔍 No user found with token:', decodedToken);
      
      // Also try with the original token in case there was an encoding issue
      if (decodedToken !== token) {
        const userWithOriginalToken = await prisma.user.findFirst({
          where: {
            inviteToken: token,
          },
        });
        
        if (userWithOriginalToken) {
          console.log('🔍 Found user with original token (before decoding):', userWithOriginalToken.email);
          return NextResponse.json(
            { error: 'Token validation issue - please try the link from your email again' },
            { status: 400 }
          );
        }
      }
      
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
      
      // Check if token exists in another format (e.g., trimmed, encoded, or different encoding)
      const allUsers = await prisma.user.findMany({
        where: {
          inviteToken: { not: null },
        },
        select: {
          email: true,
          inviteToken: true,
          inviteExpiresAt: true,
        },
      });
      
      const matchingToken = allUsers.find((u: any) => 
        u.inviteToken === token || 
        u.inviteToken === decodedToken ||
        u.inviteToken?.trim() === token.trim() ||
        u.inviteToken?.trim() === decodedToken.trim()
      );
      
      if (matchingToken) {
        console.log('⚠️ Token found but possibly mismatch due to format - stored for user:', matchingToken.email);
        return NextResponse.json(
          { error: 'Token validation issue - please try the link from your email again' },
          { status: 400 }
        );
      }
      
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

    // Update user: set password, activate account, clear token and mark as used
    // Mark the invite token as used and clear the token data
    const updateData: any = {
      password: hashedPassword,
      active: true, // User is now active
      status: 'ACTIVE', // Update status to active
      inviteToken: null, // Clear the invite token to prevent reuse
      inviteExpiresAt: null, // Clear expiry
      inviteUsed: true, // Mark token as used - this is the critical step that marks the token as consumed
    };
    
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    }).catch(async (error) => {
      // If the field doesn't exist yet, try without it
      if (error.message.includes('inviteUsed') || error.message.includes('Unknown arg')) {
        const fallbackUpdateData: any = {
          password: hashedPassword,
          active: true, // User is now active
          status: 'ACTIVE', // Update status to active
          inviteToken: null, // Clear the invite token to prevent reuse
          inviteExpiresAt: null, // Clear expiry
        };
        
        return await prisma.user.update({
          where: { id: user.id },
          data: fallbackUpdateData,
        });
      }
      throw error;
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