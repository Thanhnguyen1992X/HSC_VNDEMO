import jwt from "jsonwebtoken";
import crypto from "crypto";
import { authConfig } from "../config/auth.js";

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || "super-secret-key-for-dev";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.SESSION_SECRET || "super-secret-refresh-for-dev";

export interface JWTPayload {
  userId: string;
  username: string;
  role: string;
  type?: "access" | "refresh" | "temp";
}

/**
 * Generate access JWT token (15 min expiry)
 */
export function generateAccessToken(payload: Omit<JWTPayload, "type">): string {
  return jwt.sign(
    { ...payload, type: "access" },
    JWT_SECRET,
    { expiresIn: authConfig.jwt.accessTokenExpiry }
  );
}

/**
 * Generate refresh JWT token (7 days expiry)
 */
export function generateRefreshToken(payload: Omit<JWTPayload, "type">): string {
  return jwt.sign(
    { ...payload, type: "refresh" },
    JWT_REFRESH_SECRET,
    { expiresIn: authConfig.jwt.refreshTokenExpiry }
  );
}

/**
 * Generate temporary token for 2FA flow (5 min expiry)
 */
export function generateTempToken(payload: Omit<JWTPayload, "type">): string {
  return jwt.sign(
    { ...payload, type: "temp" },
    JWT_SECRET,
    { expiresIn: authConfig.jwt.tempTokenExpiry }
  );
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded.type === "access" ? decoded : null;
  } catch {
    return null;
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
    return decoded.type === "refresh" ? decoded : null;
  } catch {
    return null;
  }
}

/**
 * Verify temp token (2FA flow)
 */
export function verifyTempToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded.type === "temp" ? decoded : null;
  } catch {
    return null;
  }
}

/**
 * Generate secure random token for password reset / email verification
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
