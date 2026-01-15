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
    
    // First, try to find user by invite token
    let user = await prisma.user.findFirst({
      where: {
        inviteToken: decodedToken,
      },
    });
    
    let isInviteToken = false;
    
    if (user) {
      console.log('🔍 Found user with invite token:', user.email);
      isInviteToken = true;
      
      // Check if invite token is expired
      if (user.inviteExpiresAt && new Date() > new Date(user.inviteExpiresAt)) {
        console.log('❌ Invite token has expired');
        return NextResponse.json(
          { error: 'Invite token has expired' },
          { status: 400 }
        );
      }
    } else {
      // If not found with invite token, try password reset token
      console.log('🔍 No user found with invite token, trying password reset token:', decodedToken);
      
      // Use raw query to avoid type issues
      const userResult = await prisma.$queryRaw<Array<{ id: string; email: string; name: string | null; passwordResetExpiresAt: Date | null }>>`
        SELECT id, email, name, "passwordResetExpiresAt"
        FROM "User"
        WHERE "passwordResetToken" = ${decodedToken}
      `;
      
      const resetUser = userResult.length > 0 ? userResult[0] : null;
      
      if (resetUser) {
        console.log('🔍 Found user with password reset token:', resetUser.email);
        
        // Check if password reset token is expired
        if (resetUser.passwordResetExpiresAt && new Date() > new Date(resetUser.passwordResetExpiresAt)) {
          console.log('❌ Password reset token has expired');
          return NextResponse.json(
            { error: 'Password reset token has expired' },
            { status: 400 }
          );
        }
        
        // Fetch the full user object for password reset
        user = await prisma.user.findFirst({
          where: { id: resetUser.id },
        });
        
        if (!user) {
          console.log('❌ User not found for password reset');
          return NextResponse.json(
            { error: 'User not found' },
            { status: 400 }
          );
        }
      } else {
        console.log('🔍 No user found with either invite or password reset token:', decodedToken);
        
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 400 }
        );
      }
    }

    // Hash the new password
    const hashedPassword = await hashPassword(password);

    // Update user based on token type
    if (isInviteToken) {
      // This is an invite token, activate the user
      const updateData: any = {
        password: hashedPassword,
        active: true, // User is now active
        status: 'ACTIVE', // Update status to active
        subscription_status: 'active', // Set subscription status to active
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
          
          // Try to update subscription status as well, but ignore if field doesn't exist
          try {
            await prisma.$executeRaw`
              UPDATE "User" SET "subscription_status" = 'active' WHERE "id" = ${user.id}
            `;
            fallbackUpdateData.subscription_status = 'active';
          } catch (subError) {
            // If subscription_status field doesn't exist yet, just continue
            console.log('Subscription status field not available, continuing...');
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
    } else {
      // This is a password reset token, just update the password and clear the reset token
      await prisma.$executeRaw`
        UPDATE "User" 
        SET "password" = ${hashedPassword}, 
            "passwordResetToken" = NULL, 
            "passwordResetExpiresAt" = NULL,
            "subscription_status" = 'active'
        WHERE "id" = ${user.id}
      `;
      
      console.log('✅ Password reset successfully for user:', user.email);

      return NextResponse.json({
        message: 'Password reset successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      });
    }
  } catch (error) {
    console.error('❌ Password setup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}