export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { sendInviteEmail } from '@/lib/inviteEmail'; // Helper function for sending invite emails

// Zapier sends product name and product ID directly
// Both productName and productId are required fields


/**
 * POST /api/zapier/create-user
 * 
 * Secure webhook endpoint for Zapier to create users after purchase
 * 
 * SECURITY: Requires Authorization: Bearer ZAPIER_SECRET_KEY header
 * 
 * Expected payload from Zapier:
 * {
 *   "email": "user@email.com",
 *   "first_name": "John",
 *   "last_name": "Doe",
 *   "productName": "Product Name",
 *   "productId": "Product ID"
 * }
 */
export async function POST(request: Request) {
  try {
    console.log('📥 Zapier webhook received');
    
    // Log headers and body for debugging
    const headers = Object.fromEntries(request.headers.entries());
    console.log('Headers:', headers);

    // 1. Verify Zapier secret from Authorization header
    // This is CRITICAL - prevents unauthorized access to create users
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Missing or invalid Authorization header');
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const providedSecret = authHeader.substring(7); // Remove 'Bearer ' prefix
    const expectedSecret = process.env.ZAPIER_SECRET_KEY;

    if (!expectedSecret || providedSecret !== expectedSecret) {
      console.log('❌ Invalid Zapier secret key');
      return NextResponse.json(
        { error: 'Unauthorized: Invalid secret key' },
        { status: 401 }
      );
    }

    // 2. Parse payload based on content type
    let body;
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('application/x-www-form-urlencoded')) {
      console.log('Parsing as form URL-encoded data');
      const formData = await request.formData();
      body = Object.fromEntries(formData);
      console.log('Form data body:', body);
    } else {
      console.log('Parsing as JSON data');
      body = await request.json();
      console.log('JSON body:', body);
    }

    // Extract fields (handle both possible field names)
    let email = body.email || body.Email;
    const firstName = body.firstName || body.first_name || body.FirstName;
    const lastName = body.lastName || body.last_name || body.LastName;
    const productName = body.productName || body.ProductName;
    const productId = body.productId || body.ProductId;

    // Validate required fields
    if (!email || !firstName || !lastName || !productName || !productId) {
      console.log('❌ Missing required fields:', {
        email: !!email,
        firstName: !!firstName,
        lastName: !!lastName,
        productName: !!productName,
        productId: !!productId
      });
      
      const missingFields = [];
      if (!email) missingFields.push('email');
      if (!firstName) missingFields.push('firstName');
      if (!lastName) missingFields.push('lastName');
      if (!productName) missingFields.push('productName');
      if (!productId) missingFields.push('productId');
      
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Invalid email format:', email);
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Additional check: trim email to remove surrounding whitespace
    email = email.trim();

    // Final check: ensure email is properly formatted after trimming
    if (!emailRegex.test(email)) {
      console.log('❌ Trimmed email is still invalid:', email);
      return NextResponse.json(
        { error: 'Invalid email format after trimming' },
        { status: 400 }
      );
    }

    // 3. Validate product fields
    if (!productName || typeof productName !== 'string' || productName.trim() === '') {
      console.log('❌ Invalid productName:', productName);
      return NextResponse.json(
        { error: 'Invalid product name' },
        { status: 400 }
      );
    }
    
    if (!productId || typeof productId !== 'string' || productId.trim() === '') {
      console.log('❌ Invalid productId:', productId);
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }


    // 4. Check if user already exists
    let existingUser;
    try {
      existingUser = await prisma.user.findUnique({
        where: { email },
      });
    } catch (error: any) {
      console.error('❌ Error finding user:', error);
      
      // More detailed error reporting for debugging
      console.error('Prisma find error details:', {
        code: error.code,
        meta: error.meta,
        message: error.message
      });
      
      return NextResponse.json(
        { 
          error: 'Database error occurred while finding user',
          details: error.code ? `Error code: ${error.code}` : 'Unknown database error',
          message: error.message
        },
        { status: 400 }
      );
    }

    if (existingUser) {
      // If user is already active, return success (idempotent operation)
      if (existingUser.active && (existingUser as any).status === 'ACTIVE') {
        console.log('✅ User already exists and active:', email);
        return NextResponse.json({
          message: 'User already exists and active',
          user: { id: existingUser.id, email: existingUser.email }
        });
      }

      // If user is invited (has pending invite), regenerate invite token
      if (!existingUser.active || (existingUser as any).status !== 'ACTIVE') { // User is not active, so we'll update them
        console.log('🔄 Updating existing user:', email);
        
        // Generate new secure invite token
        const newInviteToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiryHours = parseInt(process.env.INVITE_TOKEN_EXPIRY_HOURS || '24');
        const inviteExpiresAt = new Date(Date.now() + tokenExpiryHours * 60 * 60 * 1000);
        
        // Generate and show the invite link in console
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const inviteLink = `${frontendUrl}/set-password?token=${newInviteToken}`;
        console.log('📋 Invite link for user:', inviteLink);

        let updatedUser;
        try {
          updatedUser = await prisma.user.update({
            where: { email },
            data: {
              productName: productName as string, // Store product name
              productId: productId as string, // Store product ID
              active: false, // User is not active until they set password
              status: 'INVITED', // Set status to invited
              inviteToken: newInviteToken, // Store the invite token
              inviteExpiresAt, // Store expiry time
            } as any,
          });
        } catch (error: any) {
          console.error('❌ Error updating user:', error);
          
          // Handle Prisma errors safely - if user already exists, return 200 (idempotent)
          if (error.code === 'P2002') { // Unique constraint violation
            console.log('✅ User already exists with email', email);
            return NextResponse.json({
              message: 'User already exists',
              user: { id: existingUser.id, email: existingUser.email }
            });
          }
          
          // More detailed error reporting for debugging
          console.error('Prisma update error details:', {
            code: error.code,
            meta: error.meta,
            message: error.message
          });
          
          return NextResponse.json(
            { 
              error: 'Database error occurred while updating user',
              details: error.code ? `Error code: ${error.code}` : 'Unknown database error',
              message: error.message
            },
            { status: 400 }
          );
        }

        // Send new invite email
        try {
          await sendInviteEmail({
            email: updatedUser.email,
            firstName: updatedUser.name?.split(' ')[0] || firstName,
            token: newInviteToken,
          });
        } catch (emailError) {
          console.error('❌ Failed to send invite email:', emailError);
          // Don't fail the request if email fails - user can still use the token
        }

        // Generate invite link to return in response
        const responseFrontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const responseInviteLink = `${responseFrontendUrl}/set-password?token=${newInviteToken}`;
        
        return NextResponse.json({
          message: 'User invite regenerated successfully',
          user: { id: updatedUser.id, email: updatedUser.email },
          inviteLink: responseInviteLink // Include the invite link in the response
        });
      }
    }

    // 5. Create new user with invited status
    // Generate secure invite token using crypto
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiryHours = parseInt(process.env.INVITE_TOKEN_EXPIRY_HOURS || '24');
    const inviteExpiresAt = new Date(Date.now() + tokenExpiryHours * 60 * 60 * 1000);
    
    // Generate and show the invite link in console
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const inviteLink = `${frontendUrl}/set-password?token=${inviteToken}`;
    console.log('📋 Invite link for user:', inviteLink);

    const fullName = `${firstName} ${lastName}`.trim();

    let newUser;
    try {
      newUser = await prisma.user.create({
        data: {
          email,
          name: fullName,
          productName: productName as string, // Store product name
          productId: productId as string, // Store product ID
          active: false, // User starts as inactive (no password yet)
          status: 'INVITED', // User starts as invited (no password yet)
          inviteToken, // Store the invite token
          inviteExpiresAt, // Store expiry time
          // password remains null until user sets it
        } as any,
      });
    } catch (error: any) {
      console.error('❌ Error creating user:', error);
      
      // Handle Prisma errors safely - if user already exists, return 200 (idempotent)
      if (error.code === 'P2002') { // Unique constraint violation
        console.log('✅ User already exists with email:', email);
        // Find the existing user to return
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });
        return NextResponse.json({
          message: 'User already exists',
          user: { id: existingUser?.id, email: existingUser?.email }
        });
      }
      
      // More detailed error reporting for debugging
      console.error('Prisma error details:', {
        code: error.code,
        meta: error.meta,
        message: error.message
      });
      
      return NextResponse.json(
        { 
          error: 'Database error occurred while creating user',
          details: error.code ? `Error code: ${error.code}` : 'Unknown database error',
          message: error.message
        },
        { status: 400 }
      );
    }

    // Send invite email with secure link
    try {
      await sendInviteEmail({
        email: newUser.email,
        firstName: firstName,
        token: inviteToken,
      });
    } catch (emailError) {
      console.error('❌ Failed to send invite email:', emailError);
      // Don't fail the request if email fails - user can still use the token
    }

    console.log('✅ Created new user via Zapier:', email);

    // 6. Send invite email with secure link
    try {
      await sendInviteEmail({
        email: newUser.email,
        firstName: firstName,
        token: inviteToken,
      });
    } catch (emailError) {
      console.error('❌ Failed to send invite email:', emailError);
      // Don't fail the request if email fails - user can still use the token
    }

    // 7. Return success response
    // Generate invite link to return in response
    const responseFrontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const responseInviteLink = `${responseFrontendUrl}/set-password?token=${inviteToken}`;
    
    return NextResponse.json({
      message: 'User created successfully',
      user: { id: newUser.id, email: newUser.email },
      inviteLink: responseInviteLink // Include the invite link in the response
    });

  } catch (error: any) {
    console.error('❌ Zapier webhook error:', error);
    // Temporarily return the caught error message in the response so we can see what is failing
    // Goal: No 500 errors — only 200 / 400 responses
    // For now, return error details to help debugging, but in production we might want to return a 400
    return NextResponse.json(
      { error: error.message || 'Internal server error', stack: error.stack },
      { status: 400 } // Changed from 500 to 400 as per requirement
    );
  }
}