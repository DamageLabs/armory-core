import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verificationLink = `${frontendUrl}/verify-email?token=${token}`;
  const fromEmail = process.env.EMAIL_FROM || 'noreply@example.com';

  if (!resend) {
    console.warn('RESEND_API_KEY not configured. Email not sent.');
    console.log(`Verification link for ${to}: ${verificationLink}`);
    return;
  }

  await resend.emails.send({
    from: fromEmail,
    to,
    subject: 'Verify your email address - Armory Core',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify your email</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Armory Core</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Firearms Inventory Management System</p>
        </div>

        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Verify your email address</h2>

          <p>Thanks for signing up for Armory Core! Please click the button below to verify your email address and activate your account.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="background: #0d6efd; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Verify Email Address</a>
          </div>

          <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="color: #0d6efd; font-size: 14px; word-break: break-all;">${verificationLink}</p>

          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

          <p style="color: #999; font-size: 12px; margin-bottom: 0;">
            This link will expire in 24 hours. If you didn't create an account with Armory Core, you can safely ignore this email.
          </p>
        </div>
      </body>
      </html>
    `,
    text: `
Verify your email address for Armory Core

Thanks for signing up for Armory Core! Please click the link below to verify your email address and activate your account:

${verificationLink}

This link will expire in 24 hours. If you didn't create an account with Armory Core, you can safely ignore this email.
    `.trim(),
  });
}
