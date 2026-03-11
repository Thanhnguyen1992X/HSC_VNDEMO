import { Router, Request, Response } from "express";
import passport from "passport";
import rateLimit from "express-rate-limit";
import { authMiddleware } from "../middleware/authMiddleware.js";
import * as authController from "../controllers/authController.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/tokenUtils.js";
import { saveRefreshToken } from "../services/userStorage.js";

const router = Router();
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5000";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many login attempts. Try again later." },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { success: false, message: "Too many reset requests. Try again later." },
});

router.post("/register", authController.register);
router.post("/login", loginLimiter, authController.login);
router.post("/logout", authController.logout);
router.post("/refresh-token", authController.refreshToken);
router.post("/forgot-password", forgotPasswordLimiter, authController.forgotPassword);
router.post("/reset-password/:token", authController.resetPassword);
router.post("/change-password", authMiddleware, authController.changePassword);
router.get("/verify-email/:token", authController.verifyEmail);
router.post("/resend-verification", authController.resendVerification);

router.post("/2fa/setup", authMiddleware, authController.twoFactorSetup);
router.post("/2fa/verify-setup", authMiddleware, authController.twoFactorVerifySetup);
router.post("/2fa/validate", authController.twoFactorValidate);
router.post("/2fa/disable", authMiddleware, authController.twoFactorDisable);

router.get("/google", (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(503).json({ success: false, message: "Google OAuth not configured" });
  }
  passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
});

router.get("/google/callback", (req: Request, res: Response, next) => {
  passport.authenticate("google", async (err: Error | null, user: any) => {
    if (err) {
      return res.redirect(`${FRONTEND_URL}/admin/login?error=google_auth_failed`);
    }
    if (!user) {
      return res.redirect(`${FRONTEND_URL}/admin/login?error=google_auth_denied`);
    }
    if (!user.isActive || user.deletedAt) {
      return res.redirect(`${FRONTEND_URL}/admin/login?error=account_inactive`);
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
    res.redirect(`${FRONTEND_URL}/admin/login?google=success`);
  })(req, res, next);
});

export default router;
