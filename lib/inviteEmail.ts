import nodemailer from 'nodemailer';

/**
 * Helper function to send invite emails to new users
 * This function handles the email sending logic for user invitations
 */
export interface InviteEmailData {
  email: string;
  firstName: string;
  token: string;
}

/**
 * Sends an invitation email to a user with a secure link to set their password
 * 
 * @param data - Object containing email, first name, and invite token
 * @returns Promise that resolves when email is sent (or fails)
 */
export async function sendInviteEmail(data: InviteEmailData): Promise<void> {
  const { email, firstName, token } = data;
  
  // Build the invite link using the frontend URL from environment
  const frontendUrl = process.env.FRONTEND_URL || 'https://www.destinycreditai.com';
  const inviteLink = `${frontendUrl}/set-password?token=${token}`;
  
  // In a production environment, you would use an email service like:
  // - Resend
  // - SendGrid  
  // - AWS SES
  // - Mailgun
  // For now, we'll just log what would be sent
  
  console.log(`📧 Sending invite email to: ${email}`);
  console.log(`Subject: Welcome to DestinyCreditAI - Set Your Password`);
  console.log(`Body: Hello ${firstName},

Welcome to DestinyCreditAI! Click the link below to set your password and activate your account:

${inviteLink}

This link will expire in 24 hours.

Best regards,
The DestinyCreditAI Team`);
  
  // Use nodemailer to send email via Mailtrap for testing
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '2525'),
    auth: {
      user: process.env.SMTP_USER || '21a3741be42aed',
      pass: process.env.SMTP_PASS || 'a4d519e45136ad'
    }
  });
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'onboarding@destinycreditai.com',
    to: email,
    subject: 'Welcome to DestinyCreditAI - Set Your Password',
    html: `
      <h1>Welcome to DestinyCreditAI!</h1>
      <p>Hello ${firstName},</p>
      <p>Click the link below to set your password and activate your account:</p>
      <a href="${inviteLink}">Set Your Password</a>
      <p>This link will expire in 24 hours.</p>
      <p>Best regards,<br>The DestinyCreditAI Team</p>
    `
  };
  
  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('Invite email sent successfully:', result.messageId);
  } catch (error) {
    console.error('Failed to send invite email:', error);
    throw error;
  }
  
  return Promise.resolve();
}