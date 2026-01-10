import { Resend } from 'resend';

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
  
  // Use Resend to send email
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@destinycreditai.com',
      to: [email],
      subject: 'Welcome to Destiny Credit AI 🎉 - Create Your Password & Get Started',
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Destiny Credit AI</title>
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
    .logo {
      width: 150px;
      height: auto;
      margin-bottom: 15px;
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
    ul {
      padding-left: 20px;
    }
    li {
      margin: 8px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <img src="${process.env.FRONTEND_URL || 'https://destinycreditai.com'}/logo.png" alt="Destiny Credit AI Logo" class="logo">
    <h1>Welcome to Destiny Credit AI 🎉</h1>
  </div>
  
  <div class="section">
    <p>Dear ${firstName},</p>
    <p>We're excited to officially welcome you to the platform. You've taken a powerful step toward gaining control of your credit using compliance-driven strategies, automation, and precision.</p>
  </div>
  
  <div class="section">
    <h2>🔐 Create Your Password & Sign In</h2>
    <p>To get started, please use the link below to create your password and access your account:</p>
    <p>👉 <strong>Create Your Password & Sign In:</strong></p>
    <a href="${inviteLink}" class="button">Create Your Password & Sign In</a>
    <p>Once logged in, you'll be able to upload your credit report and generate the appropriate dispute letters in minutes.</p>
  </div>
  
  <hr class="divider">
  
  <div class="section">
    <h2>🚀 What You Can Do Inside Destiny Credit AI</h2>
    <ul>
      <li>Analyze credit reports for inaccuracies and Metro 2 violations</li>
      <li>Generate compliant dispute letters in under 60 seconds</li>
      <li>Address collections, charge-offs, late payments, repossessions, bankruptcies, inquiries, identity theft, and more</li>
      <li>Follow guided workflows designed to save time and reduce guesswork</li>
    </ul>
  </div>
  
  <hr class="divider">
  
  <div class="section">
    <h2>🤝 Join Our FREE Support Community</h2>
    <p>For additional support, training, and guidance, be sure to join our FREE Credit & Wealth Community on Skool:</p>
    <p>👉 <a href="https://www.skool.com/shakehandswithdestiny/about">https://www.skool.com/shakehandswithdestiny/about</a></p>
    <p>Inside the community you'll find:</p>
    <ul>
      <li>Step-by-step walkthroughs</li>
      <li>Bonus resources and templates</li>
      <li>Q&A support</li>
      <li>Real success stories from other members</li>
    </ul>
  </div>
  
  <hr class="divider">
  
  <div class="section">
    <p>If you have any questions while getting started, don't worry—you're not alone. The platform and the community are designed to support you every step of the way.</p>
    <p>Welcome aboard,</p>
    <p><strong>Destiny Credit AI Team</strong></p>
    <p>🚀 Your journey to smarter, faster credit results starts now.</p>
  </div>
</body>
</html>`
    });
    
    if (error) {
      console.error('Failed to send invite email:', error);
      throw error;
    }
    
    console.log('Invite email sent successfully:', data?.id);
  } catch (error) {
    console.error('Failed to send invite email:', error);
    throw error;
  }
  
  return Promise.resolve();
}