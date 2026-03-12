import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5000";
const FROM_EMAIL = process.env.FROM_EMAIL || "HSC Admin Portal <onboarding@resend.dev>";

/**
 * Send email (no-op if RESEND_API_KEY not configured - for dev)
 */
async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.log("[Email] Skipped (no RESEND_API_KEY config):", options.subject, "->", options.to);
    return;
  }
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    console.log("[Email] Sent successfully:", options.subject, "->", options.to);
  } catch (error) {
    console.error("[Email] Failed to send:", options.subject, "->", options.to, error);
    // Don't throw - email failures shouldn't block registration
  }
}

/**
 * Send welcome / email verification
 */
export async function sendVerificationEmail(
  email: string,
  username: string,
  verificationLink: string
): Promise<void> {
  await sendMail({
    to: email,
    subject: "Verify your email - HSC Admin Portal",
    html: `
      <h2>Welcome, ${username}!</h2>
      <p>Please verify your email by clicking the link below:</p>
      <p><a href="${verificationLink}">${verificationLink}</a></p>
      <p>This link expires in 24 hours.</p>
      <p>If you did not create an account, please ignore this email.</p>
    `,
    text: `Welcome ${username}! Verify your email: ${verificationLink}`,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetLink: string
): Promise<void> {
  await sendMail({
    to: email,
    subject: "Reset your password - HSC Admin Portal",
    html: `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset. Click the link below:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>This link expires in 1 hour.</p>
      <p>If you did not request this, please ignore this email and secure your account.</p>
    `,
    text: `Reset your password: ${resetLink}`,
  });
}

/**
 * Send 2FA enabled confirmation
 */
export async function send2FAEnabledEmail(email: string, username: string): Promise<void> {
  await sendMail({
    to: email,
    subject: "Two-Factor Authentication Enabled - HSC Admin Portal",
    html: `
      <h2>2FA Enabled</h2>
      <p>Hi ${username},</p>
      <p>Two-factor authentication has been successfully enabled on your account.</p>
      <p>You will now need to enter a code from your authenticator app when signing in.</p>
    `,
    text: `2FA enabled for ${username}.`,
  });
}

/**
 * Send password changed notification
 */
export async function sendPasswordChangedEmail(
  email: string,
  username: string
): Promise<void> {
  await sendMail({
    to: email,
    subject: "Password Changed - HSC Admin Portal",
    html: `
      <h2>Password Changed</h2>
      <p>Hi ${username},</p>
      <p>Your password was successfully changed. If you did not make this change, please contact support.</p>
    `,
    text: `Password changed for ${username}.`,
  });
}
