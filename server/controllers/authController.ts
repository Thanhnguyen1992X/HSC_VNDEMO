import type { Request, Response } from "express";
import { z } from "zod";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  twoFactorValidateSchema,
  twoFactorVerifySetupSchema,
  twoFactorDisableSchema,
} from "@shared/schema";
import { hashPassword, comparePassword, hashToken } from "../utils/passwordUtils.js";
import {
  generateAccessToken,
  generateRefreshToken,
  generateTempToken,
  verifyRefreshToken,
  verifyTempToken,
  generateSecureToken,
} from "../utils/tokenUtils.js";
import {
  findUserByUsernameOrEmail,
  findUserByEmail,
  findUserById,
  createUser,
  updateUser,
  findUserByResetToken,
  findUserByResetTokenIgnoreExpiry,
  saveRefreshToken,
  deleteRefreshToken,
  findRefreshToken,
  deleteUserRefreshTokens,
  saveEmailVerificationToken,
  findEmailVerificationToken,
  deleteEmailVerificationToken,
} from "../services/userStorage.js";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  send2FAEnabledEmail,
  sendPasswordChangedEmail,
} from "../services/emailService.js";
import { generate2FASetup, verifyTOTP, generateBackupCodes } from "../services/twoFactorService.js";
import {
  setTwoFactorSetupSecret,
  getTwoFactorSetupSecret,
} from "../services/twoFactorSetupStore.js";
import { authConfig } from "../config/auth.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5000";

function success(res: Response, data: object, status = 200) {
  res.status(status).json({ success: true, ...data });
}

function error(res: Response, message: string, status = 400) {
  res.status(status).json({ success: false, message });
}

/**
 * POST /api/auth/register
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const input = registerSchema.parse(req.body);

    const existing = await findUserByUsernameOrEmail(input.username) || await findUserByEmail(input.email);
    if (existing) {
      error(res, "Username or email already exists", 400);
      return;
    }

    const hashed = await hashPassword(input.password);
    const user = await createUser({
      username: input.username,
      email: input.email,
      password: hashed,
      role: "user",
    });

    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await saveEmailVerificationToken(user.id, token, expiresAt);

    await sendVerificationEmail(
      user.email,
      user.username,
      `${FRONTEND_URL}/auth/verify-email?token=${token}`
    );

    const accessToken = generateAccessToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });
    const refreshToken = generateRefreshToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });
    const expiresAtRefresh = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await saveRefreshToken(user.id, refreshToken, expiresAtRefresh);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    success(res, {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
      message: "Registration successful. Please verify your email.",
    }, 201);
  } catch (e) {
    if (e instanceof z.ZodError) {
      error(res, e.errors[0]?.message || "Validation error", 400);
      return;
    }
    throw e;
  }
}

/**
 * POST /api/auth/login
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const input = loginSchema.parse(req.body);
    const user = await findUserByUsernameOrEmail(input.username);
    if (!user || !user.password) {
      error(res, "Invalid credentials", 401);
      return;
    }
    const valid = await comparePassword(input.password, user.password);
    if (!valid) {
      error(res, "Invalid credentials", 401);
      return;
    }
    if (!user.isActive || user.deletedAt) {
      error(res, "Account is inactive", 401);
      return;
    }
    if (user.isDisabled) {
      error(res, "Account has been disabled. Contact administrator.", 403);
      return;
    }
    if (!user.isEmailVerified && !user.googleId) {
      error(res, "Please verify your email first", 403);
      return;
    }

    if (user.isTwoFactorEnabled && user.twoFactorSecret) {
      const tempToken = generateTempToken({
        userId: user.id,
        username: user.username,
        role: user.role,
      });
      success(res, {
        requiresTwoFactor: true,
        tempToken,
        message: "2FA verification required",
      });
      return;
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });
    const refreshToken = generateRefreshToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await saveRefreshToken(user.id, refreshToken, expiresAt);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    success(res, {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      error(res, e.errors[0]?.message || "Validation error", 400);
      return;
    }
    throw e;
  }
}

/**
 * POST /api/admin/login - Same as login but restricts to admin role, returns { token } for backward compat
 */
export async function adminLogin(req: Request, res: Response): Promise<void> {
  try {
    const input = loginSchema.parse(req.body);
    const user = await findUserByUsernameOrEmail(input.username);
    if (!user || !user.password) {
      error(res, "Invalid credentials", 401);
      return;
    }
    const valid = await comparePassword(input.password, user.password);
    if (!valid) {
      error(res, "Invalid credentials", 401);
      return;
    }
    if (user.isDisabled) {
      error(res, "Account has been disabled. Contact administrator.", 403);
      return;
    }
    if (user.role !== "admin") {
      error(res, "Admin access required", 403);
      return;
    }
    if (!user.isActive || user.deletedAt) {
      error(res, "Account is inactive", 401);
      return;
    }
    if (!user.isEmailVerified && !user.googleId) {
      error(res, "Please verify your email first", 403);
      return;
    }

    if (user.isTwoFactorEnabled && user.twoFactorSecret) {
      const tempToken = generateTempToken({
        userId: user.id,
        username: user.username,
        role: user.role,
      });
      res.status(200).json({
        success: true,
        requiresTwoFactor: true,
        tempToken,
        message: "2FA verification required",
      });
      return;
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });
    const refreshToken = generateRefreshToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await saveRefreshToken(user.id, refreshToken, expiresAt);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      token: accessToken,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
      message: "Login successful",
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      error(res, e.errors[0]?.message || "Validation error", 400);
      return;
    }
    throw e;
  }
}

/**
 * POST /api/auth/logout
 */
export async function logout(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.refreshToken;
  if (token && req.user) {
    const payload = verifyRefreshToken(token);
    if (payload) {
      const row = await findRefreshToken(token, payload.userId);
      if (row) await deleteRefreshToken(row.id);
    }
  }
  res.clearCookie("refreshToken");
  success(res, { message: "Logged out" });
}

/**
 * POST /api/auth/refresh-token
 */
export async function refreshToken(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!token) {
    error(res, "Refresh token required", 401);
    return;
  }
  const payload = verifyRefreshToken(token);
  if (!payload) {
    res.clearCookie("refreshToken");
    error(res, "Invalid or expired refresh token", 401);
    return;
  }
  const row = await findRefreshToken(token, payload.userId);
  if (!row) {
    res.clearCookie("refreshToken");
    error(res, "Refresh token revoked", 401);
    return;
  }

  const user = await findUserById(payload.userId);
  if (!user || !user.isActive || user.deletedAt) {
    await deleteRefreshToken(row.id);
    res.clearCookie("refreshToken");
    error(res, "User not found or inactive", 401);
    return;
  }

  const accessToken = generateAccessToken({
    userId: user.id,
    username: user.username,
    role: user.role,
  });
  success(res, {
    accessToken,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    },
  });
}

/**
 * POST /api/auth/forgot-password
 */
export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    const user = await findUserByEmail(email);
    if (!user) {
      success(res, { message: "If the email exists, a reset link will be sent" });
      return;
    }
    const token = generateSecureToken();
    const hashed = hashToken(token);
    const expiresAt = new Date(Date.now() + authConfig.resetTokenExpiry);
    await updateUser(user.id, {
      resetPasswordToken: hashed,
      resetPasswordExpires: expiresAt,
    });
    const resetLink = `${FRONTEND_URL}/auth/reset-password?token=${token}`;
    await sendPasswordResetEmail(user.email, resetLink);
    // Dev: log reset link when email may be skipped (helps debugging)
    if (process.env.NODE_ENV === "development" && (!process.env.EMAIL_USER || !process.env.EMAIL_PASS)) {
      console.log("[ForgotPassword] Reset link (email skipped):", resetLink);
    }
    success(res, { message: "If the email exists, a reset link will be sent" });
  } catch (e) {
    if (e instanceof z.ZodError) {
      error(res, e.errors[0]?.message || "Validation error", 400);
      return;
    }
    throw e;
  }
}

/**
 * POST /api/auth/reset-password/:token
 */
export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const token = req.params.token;
    const input = resetPasswordSchema.parse({ token, password: req.body.password });
    const hashed = hashToken(token);
    const user = await findUserByResetToken(hashed);
    if (!user) {
      // Distinguish expired vs invalid for debugging
      const userExpired = await findUserByResetTokenIgnoreExpiry(hashed);
      const msg = userExpired
        ? "Reset token has expired. Please request a new reset link."
        : "Invalid or expired reset token. Please request a new reset link.";
      error(res, msg, 400);
      return;
    }
    const newHashed = await hashPassword(input.password);
    await updateUser(user.id, {
      password: newHashed,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });
    await sendPasswordChangedEmail(user.email, user.username);
    success(res, { message: "Password reset successful" });
  } catch (e) {
    if (e instanceof z.ZodError) {
      error(res, e.errors[0]?.message || "Validation error", 400);
      return;
    }
    throw e;
  }
}

/**
 * POST /api/auth/change-password (authenticated)
 */
export async function changePassword(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    error(res, "Unauthorized", 401);
    return;
  }
  try {
    const input = changePasswordSchema.parse(req.body);
    const user = await findUserById(req.user.id);
    if (!user || !user.password) {
      error(res, "User not found", 404);
      return;
    }
    const valid = await comparePassword(input.currentPassword, user.password);
    if (!valid) {
      error(res, "Current password is incorrect", 400);
      return;
    }
    const newHashed = await hashPassword(input.newPassword);
    await updateUser(user.id, { password: newHashed });
    await sendPasswordChangedEmail(user.email, user.username);
    success(res, { message: "Password changed successfully" });
  } catch (e) {
    if (e instanceof z.ZodError) {
      error(res, e.errors[0]?.message || "Validation error", 400);
      return;
    }
    throw e;
  }
}

/**
 * GET /api/auth/verify-email/:token
 */
export async function verifyEmail(req: Request, res: Response): Promise<void> {
  const token = req.params.token;
  const row = await findEmailVerificationToken(token);
  if (!row) {
    error(res, "Invalid or expired verification token", 400);
    return;
  }
  await updateUser(row.userId, { isEmailVerified: true });
  await deleteEmailVerificationToken(token);
  success(res, { message: "Email verified successfully" });
}

/**
 * POST /api/auth/resend-verification
 */
export async function resendVerification(req: Request, res: Response): Promise<void> {
  const email = req.body?.email;
  if (!email || typeof email !== "string") {
    error(res, "Email is required", 400);
    return;
  }
  const user = await findUserByEmail(email);
  if (!user || user.isEmailVerified) {
    success(res, { message: "If the email exists and is unverified, a new link will be sent" });
    return;
  }
  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await saveEmailVerificationToken(user.id, token, expiresAt);
  await sendVerificationEmail(
    user.email,
    user.username,
    `${FRONTEND_URL}/auth/verify-email?token=${token}`
  );
  success(res, { message: "Verification email sent" });
}

// ---- 2FA ----

/**
 * POST /api/auth/2fa/setup
 */
export async function twoFactorSetup(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    error(res, "Unauthorized", 401);
    return;
  }
  const user = await findUserById(req.user.id);
  if (!user) {
    error(res, "User not found", 404);
    return;
  }
  const { secret, qrCodeUrl } = await generate2FASetup(user.email);
  setTwoFactorSetupSecret(user.id, secret);
  success(res, { secret, qrCodeUrl });
}

/**
 * POST /api/auth/2fa/verify-setup
 */
export async function twoFactorVerifySetup(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    error(res, "Unauthorized", 401);
    return;
  }
  try {
    const input = twoFactorVerifySetupSchema.parse(req.body);
    const secret = getTwoFactorSetupSecret(req.user!.id);
    if (!secret) {
      error(res, "2FA setup not started or expired. Call /2fa/setup first.", 400);
      return;
    }
    if (!verifyTOTP(secret, input.totpCode)) {
      error(res, "Invalid TOTP code", 400);
      return;
    }
    const backupCodes = generateBackupCodes();
    await updateUser(req.user.id, {
      twoFactorSecret: secret,
      isTwoFactorEnabled: true,
      backupCodes: JSON.stringify(backupCodes),
    });
    await send2FAEnabledEmail(req.user.email, req.user.username);
    success(res, { backupCodes, message: "2FA enabled successfully" });
  } catch (e) {
    if (e instanceof z.ZodError) {
      error(res, e.errors[0]?.message || "Validation error", 400);
      return;
    }
    throw e;
  }
}

/**
 * POST /api/auth/2fa/validate
 */
export async function twoFactorValidate(req: Request, res: Response): Promise<void> {
  try {
    const input = twoFactorValidateSchema.parse(req.body);
    const payload = verifyTempToken(input.tempToken);
    if (!payload) {
      error(res, "Invalid or expired temporary token", 401);
      return;
    }
    const user = await findUserById(payload.userId);
    if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret) {
      error(res, "2FA not enabled for this user", 400);
      return;
    }
    if (!verifyTOTP(user.twoFactorSecret, input.totpCode)) {
      error(res, "Invalid TOTP code", 400);
      return;
    }
    const accessToken = generateAccessToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });
    const refreshToken = generateRefreshToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await saveRefreshToken(user.id, refreshToken, expiresAt);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    success(res, {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      error(res, e.errors[0]?.message || "Validation error", 400);
      return;
    }
    throw e;
  }
}

/**
 * POST /api/auth/2fa/disable
 */
export async function twoFactorDisable(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    error(res, "Unauthorized", 401);
    return;
  }
  try {
    const input = twoFactorDisableSchema.parse(req.body);
    const user = await findUserById(req.user.id);
    if (!user || !user.password) {
      error(res, "User not found", 404);
      return;
    }
    const valid = await comparePassword(input.password, user.password);
    if (!valid) {
      error(res, "Invalid password", 400);
      return;
    }
    await updateUser(user.id, {
      twoFactorSecret: null,
      isTwoFactorEnabled: false,
      backupCodes: null,
    });
    success(res, { message: "2FA disabled successfully" });
  } catch (e) {
    if (e instanceof z.ZodError) {
      error(res, e.errors[0]?.message || "Validation error", 400);
      return;
    }
    throw e;
  }
}
