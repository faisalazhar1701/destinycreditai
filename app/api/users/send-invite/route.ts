import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { sendInviteEmail } from '@/lib/inviteEmail';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Use a database transaction to ensure idempotency
    // First, check for an existing valid unused token for this user
    const existingActiveToken = await prisma.user.findFirst({
      where: {
        email,
        inviteToken: { not: null },
        inviteExpiresAt: { gt: new Date() } // Greater than current time (not expired)
        // Note: We're not checking inviteUsed here due to potential type issues
        // The inviteUsed check happens in the set-password API
      },
      select: {
        id: true,
        email: true,
        name: true,
        inviteToken: true,
        inviteExpiresAt: true
        // Note: Not selecting inviteUsed to avoid type issues
      }
    });

    let tokenToUse: string;
    let wasTokenReused: boolean;

    if (existingActiveToken && existingActiveToken.inviteToken) {
      // Reuse existing token
      tokenToUse = existingActiveToken.inviteToken;
      wasTokenReused = true;
      
      console.log('🔄 Reusing existing invite token for user:', user.id, 'Token ID:', existingActiveToken.id, 'Timestamp:', new Date().toISOString());
    } else {
      // Generate and store a new token
      const inviteToken = crypto.randomBytes(32).toString('hex');
      const tokenExpiryHours = parseInt(process.env.INVITE_TOKEN_EXPIRY_HOURS || '48'); // 48 hours default
      const inviteExpiresAt = new Date(Date.now() + tokenExpiryHours * 60 * 60 * 1000);

      // Update user with invite token and expiry in a transaction to prevent race conditions
      const updatedUser = await prisma.$transaction(async (tx) => {
        // First, clear any existing tokens to ensure only one active token per user
        await tx.user.updateMany({
          where: {
            email,
          },
          data: {
            inviteToken: null,
            inviteExpiresAt: null,
          }
        });

        // Then create the new token
        return await tx.user.update({
          where: { email },
          data: {
            inviteToken,
            inviteExpiresAt
          }
        });
      });
      
      tokenToUse = updatedUser.inviteToken!;
      wasTokenReused = false;
      
      console.log('🆕 Created new invite token for user:', user.id, 'Token ID:', updatedUser.id, 'Timestamp:', new Date().toISOString());
    }

    // Send invite email (can be sent multiple times, token remains the same)
    try {
      await sendInviteEmail({
        email: user.email,
        firstName: user.name?.split(' ')[0] || '',
        token: tokenToUse
      });
      
      console.log('📧 Invite email sent for user:', user.id, 'Was token reused?', wasTokenReused, 'Token prefix:', tokenToUse.substring(0, 8));
    } catch (emailError) {
      console.error('Failed to send invite email:', emailError);
      // Don't fail the request if email fails - user can still use the token
    }

    // Generate invite link
    const frontendUrl = process.env.FRONTEND_URL || 'https://www.destinycreditai.com';
    const inviteLink = `${frontendUrl}/set-password?token=${tokenToUse}`;

    return NextResponse.json({
      success: true,
      inviteLink,
      wasTokenReused // Include this for debugging/logging purposes
    });
  } catch (error: any) {
    console.error('Error sending invite:', error);
    return NextResponse.json(
      { error: 'Failed to send invite' },
      { status: 500 }
    );
  }
}