export const runtime = "nodejs";

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    const { email, password } = body;

    console.log('✅✅ Login API Hit! Parameters:', { email });
    console.log('🔐 Login attempt for:', email);

    // Validate input - EMAIL and PASSWORD only
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Query user by EMAIL only - using select to avoid field mismatch issues
    const user = await prisma.user.findFirst({
      where: {
        email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        active: true,
        // Only select fields that exist in both schemas
      },
    });

    // Guard: User not found
    if (!user) {
      console.log('❌ User not found:', email);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // HARD ADMIN BYPASS: ADMIN users bypass all subscription checks
    if (user.role === 'ADMIN') {
      console.log('👑 Admin user login - HARD BYPASS enabled, skipping all subscription checks:', email);

      // Only validate password for admin
      if (!user.password || user.password.trim() === '') {
        console.log('❌ Admin user has no password:', email);
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      // Validate password for admin
      let isValid = false;
      try {
        isValid = await bcrypt.compare(password, user.password);
      } catch (bcryptError) {
        console.error('❌ bcrypt error for admin:', bcryptError);
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      if (!isValid) {
        console.log('❌ Invalid password for admin:', email);
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      // Update last login for admin
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });
      } catch (updateError) {
        console.error('⚠️ Failed to update lastLogin for admin:', updateError);
        // Continue with login even if update fails
      }

      // Generate token for admin
      let jwtSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
      if (!jwtSecret) {
        console.error('❌ CRITICAL: JWT_SECRET or NEXTAUTH_SECRET is not configured');
        
        // Use a fallback secret for development (not recommended for production)
        if (process.env.NODE_ENV !== 'production') {
          jwtSecret = 'fallback-jwt-secret-key-change-me-in-production';
          console.warn('⚠️ Using fallback JWT secret - this should only be used in development');
        } else {
          return NextResponse.json(
            { error: 'Server configuration error - JWT secret not configured' },
            { status: 500 }
          );
        }
      }

      let token: string;
      try {
        token = await signToken(
          {
            userId: user.id,
            email: user.email,
            role: user.role,
            hasValidSubscription: true, // Admins always have valid subscription
          }
        );
      } catch (jwtError) {
        console.error('❌ JWT signing error for admin:', jwtError);
        return NextResponse.json(
          { error: 'Failed to create session' },
          { status: 500 }
        );
      }

      // Return immediately for admin
      const response = NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          hasValidSubscription: true, // Admins always have valid subscription
        },
      });

      // Set auth cookie
      response.cookies.set({
        name: 'auth_token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Only secure in production
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for production, 'lax' for development
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });

      console.log('✅ Admin login successful for:', email);
      return response;
    }

    // For USER role, check subscription requirements
    // Query the full user object to access new fields (status, plan, etc.)
    let fullUser;
    try {
      // First, try to query with all fields including subscription_status
      try {
        fullUser = await prisma.user.findFirst({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            password: true,
            role: true,
            active: true,
            status: true,
            subscription_status: true,
            lastLogin: true
          }
        });
      } catch (selectError) {
        // If subscription_status field doesn't exist yet, query without it
        console.warn('⚠️ subscription_status field not found, falling back to legacy query:', selectError);
        fullUser = await prisma.user.findFirst({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            password: true,
            role: true,
            active: true,
            status: true,
            lastLogin: true
            // Omit subscription_status since it might not exist in DB yet
          }
        });
        
        // Add a default subscription_status for backward compatibility
        if (fullUser) {
          (fullUser as any).subscription_status = 'ACTIVE'; // Default to ACTIVE for existing users
        }
      }
      
      if (!fullUser) {
        console.log('❌ User not found when fetching full user object:', email);
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }
      
      console.log('✅ Found user for subscription check:', {
        email: fullUser.email,
        subscription_status: (fullUser as any).subscription_status,
        role: fullUser.role,
        status: fullUser.status
      });
    } catch (userQueryError) {
      console.error('❌ Error querying user for subscription check:', userQueryError);
      console.error('Error details:', {
        message: userQueryError instanceof Error ? userQueryError.message : String(userQueryError),
        stack: userQueryError instanceof Error ? userQueryError.stack : 'No stack'
      });
      return NextResponse.json(
        { error: 'Database error during authentication: ' + (userQueryError instanceof Error ? userQueryError.message : 'Unknown error') },
        { status: 500 }
      );
    }

    // Check if user has proper status to login
    // Using type assertion to safely access status field that might not exist in all databases
    const userWithStatus = fullUser as any;
    if (userWithStatus.status && userWithStatus.status !== 'ACTIVE') {
      console.log('❌ User has wrong status:', userWithStatus.status, 'for user:', email);
      if (userWithStatus.status === 'INVITED') {
        return NextResponse.json(
          { error: 'Please set your password using the invite link sent to your email' },
          { status: 403 }
        );
      } else {
        return NextResponse.json(
          { error: 'Account not activated' },
          { status: 403 }
        );
      }
    }

    // Check subscription status - BLOCK ONLY if subscription_status === 'UNSUBSCRIBED'
    // New users or users without this field must NOT be blocked
    if ((fullUser as any).subscription_status === 'UNSUBSCRIBED' as any) {
      console.log('❌ User has unsubscribed status and is blocked from logging in:', email);
      return NextResponse.json(
        { error: 'Your subscription has been cancelled. Please resubscribe to continue.' },
        { status: 403 }
      );
    }

    // Guard: User must be active
    if (!fullUser.active) {
      console.log('❌ User is not active:', email);
      return NextResponse.json(
        { error: 'Account not activated' },
        { status: 403 }
      );
    }

    // Guard: User has no password (null or undefined)
    if (!fullUser || !fullUser.password || fullUser.password.trim() === '') {
      console.log('❌ User has no password:', email);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Guard: bcrypt comparison with try/catch to prevent crash
    let isValid = false;
    try {
      isValid = await bcrypt.compare(password, fullUser.password);
    } catch (bcryptError) {
      console.error('❌ bcrypt error:', bcryptError);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (!isValid) {
      console.log('❌ Invalid password for:', email);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Update last login
    try {
      await prisma.user.update({
        where: { id: fullUser.id },
        data: { lastLogin: new Date() },
      });
    } catch (updateError) {
      console.error('⚠️ Failed to update lastLogin:', updateError);
      // Continue with login even if update fails
    }

    // Guard: JWT secret must exist
    let jwtSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
    if (!jwtSecret) {
      console.error('❌ CRITICAL: JWT_SECRET or NEXTAUTH_SECRET is not configured');
      
      // Use a fallback secret for development (not recommended for production)
      if (process.env.NODE_ENV !== 'production') {
        jwtSecret = 'fallback-jwt-secret-key-change-me-in-production';
        console.warn('⚠️ Using fallback JWT secret - this should only be used in development');
      } else {
        return NextResponse.json(
          { error: 'Server configuration error - JWT secret not configured' },
          { status: 500 }
        );
      }
    }

    // Create session token with try/catch
    let token: string;
    try {
      if (!fullUser) {
        console.error('❌ No user object available for token creation');
        return NextResponse.json(
          { error: 'Authentication error' },
          { status: 500 }
        );
      }
      token = await signToken(
        {
          userId: fullUser.id,
          email: fullUser.email,
          role: fullUser.role,
          hasValidSubscription: (fullUser as any).subscription_status !== 'UNSUBSCRIBED' as any,
        }
      );
    } catch (jwtError) {
      console.error('❌ JWT signing error:', jwtError);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    // Create response with user data
    if (!fullUser) {
      console.error('❌ No user object available for response');
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 500 }
      );
    }
    const response = NextResponse.json({
      user: {
        id: fullUser.id,
        email: fullUser.email,
        name: fullUser.name,
        role: fullUser.role,
        hasValidSubscription: (fullUser as any).subscription_status !== 'UNSUBSCRIBED' as any,
        subscription_status: (fullUser as any).subscription_status,
      },
    });

    // Set auth cookie using NextResponse (not Edge API)
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only secure in production
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for production, 'lax' for development
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });


    console.log('✅ Login successful for:', email);
    return response;
  } catch (error) {
    // NEVER swallow the real error - log it first
    console.error('❌ Login error (FULL):', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    
    // More detailed error logging for debugging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error cause:', error.cause);
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        debug: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : String(error) : undefined
      },
      { status: 500 }
    );
  }
}