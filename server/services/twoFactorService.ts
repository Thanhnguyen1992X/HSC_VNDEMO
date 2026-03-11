import speakeasy from "speakeasy";
import QRCode from "qrcode";
import crypto from "crypto";

const APP_NAME = process.env.APP_NAME || "HSC Admin Portal";

/**
 * Generate TOTP secret and QR code URL for 2FA setup
 */
export async function generate2FASetup(userEmail: string): Promise<{
  secret: string;
  qrCodeUrl: string;
}> {
  const secret = speakeasy.generateSecret({
    name: `${APP_NAME} (${userEmail})`,
    issuer: APP_NAME,
    length: 32,
  });
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);
  return { secret: secret.base32, qrCodeUrl };
}

/**
 * Verify TOTP code against secret
 */
export function verifyTOTP(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: 1,
  });
}

/**
 * Generate backup codes (10 codes)
 */
export function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    codes.push(crypto.randomBytes(4).toString("hex").toUpperCase());
  }
  return codes;
}
