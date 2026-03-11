import bcrypt from "bcryptjs";
import crypto from "crypto";
import { authConfig } from "../config/auth.js";

/**
 * Hash password with bcrypt (12 salt rounds)
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, authConfig.bcrypt.saltRounds);
}

/**
 * Compare plain password with hashed password
 */
export async function comparePassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Hash reset/verification token before storing in DB
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
