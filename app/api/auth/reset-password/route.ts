import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    console.log('🔐 Password reset attempt received');
    
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
    console.log('🔍 Looking for user with password reset token:', decodedToken);
    
    // Find user by password reset token using raw query to avoid type issues
    const userResult = await prisma.$queryRaw<Array<{ id: string; email: string; name: string | null; passwordResetExpiresAt: Date | null }>>`
      SELECT id, email, name, "passwordResetExpiresAt"
      FROM "User"
      WHERE "passwordResetToken" = ${decodedToken}
    `;
    
    const user = userResult.length > 0 ? userResult[0] : null;
    
    if (user) {
      console.log('🔍 Found user:', user.email, 'with reset token');
    } else {
      console.log('🔍 No user found with reset token:', decodedToken);
    }
    
    if (!user) {
      console.log('❌ Invalid or expired password reset token');
      
      return NextResponse.json(
        { error: 'Invalid or expired password reset token' },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (user.passwordResetExpiresAt && new Date() > new Date(user.passwordResetExpiresAt)) {
      console.log('❌ Password reset token has expired');
      return NextResponse.json(
        { error: 'Password reset token has expired' },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await hashPassword(password);

    // Update user: set new password and clear the reset token data
    // Use raw query to avoid type issues since the schema may not be fully synced
    await prisma.$executeRaw`
      UPDATE "User" 
      SET "password" = ${hashedPassword}, 
          "passwordResetToken" = NULL, 
          "passwordResetExpiresAt" = NULL
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

  } catch (error) {
    console.error('❌ Password reset error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}