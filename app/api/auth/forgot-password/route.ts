import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Verify user exists
        const user = await prisma.user.findUnique({ 
            where: { email },
            select: {
                id: true,
                email: true,
                name: true
            }
        });

        if (user) {
            // Generate a secure password reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

            // Update user with reset token and expiry using raw query to avoid type issues
            await prisma.$executeRaw`
                UPDATE "User" 
                SET "passwordResetToken" = ${resetToken}, "passwordResetExpiresAt" = ${resetTokenExpiry}
                WHERE "id" = ${user.id}
            `;

            // Send password reset email
            try {
                // Extract first name from full name
                const firstName = user.name?.split(' ')[0] || 'there';
                
                // Import and use the existing email utility
                const { sendInviteEmail } = await import('@/lib/inviteEmail');
                
                // We'll use a similar email template but for password reset
                const frontendUrl = process.env.FRONTEND_URL || 'https://www.destinycreditai.com';
                const resetLink = `${frontendUrl}/set-password?token=${resetToken}`;
                
                // Use Resend to send password reset email
                const { Resend } = await import('resend');
                const resend = new Resend(process.env.RESEND_API_KEY);
                
                const { data, error } = await resend.emails.send({
                    from: process.env.EMAIL_FROM || 'info@shakehandswithdestiny.com',
                    to: [user.email],
                    subject: 'Password Reset Request - Destiny Credit AI',
                    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Request</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .section {
      margin: 25px 0;
    }
    .divider {
      border-top: 1px solid #ddd;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #4CAF50;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin: 15px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Password Reset Request</h1>
  </div>
  
  <div class="section">
    <p>Hello ${firstName},</p>
    <p>You have requested to reset your password for your Destiny Credit AI account.</p>
  </div>
  
  <div class="section">
    <p>Please click the link below to reset your password:</p>
    <p><a href="${resetLink}" class="button">Reset Your Password</a></p>
    <p><strong>Note: This link will expire in 15 minutes for security purposes.</strong></p>
  </div>
  
  <div class="section">
    <p>If you did not request this password reset, please ignore this email or contact our support team if you have concerns.</p>
  </div>
  
  <div class="section">
    <p>Best regards,<br />
    <strong>The Destiny Credit AI Team</strong></p>
  </div>
</body>
</html>`
                });
                
                if (error) {
                    console.error('Failed to send password reset email:', error);
                    throw new Error(error.message);
                }
                
                console.log('Password reset email sent successfully:', data?.id);
            } catch (emailError) {
                console.error('Error sending password reset email:', emailError);
                // Don't throw error here as we don't want to expose that the email failed to send
                // We'll still return success to prevent email enumeration
            }
        }

        // Always return success to prevent email enumeration
        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
