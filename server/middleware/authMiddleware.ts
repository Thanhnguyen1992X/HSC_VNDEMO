import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/tokenUtils.js";
import { findUserById } from "../services/userStorage.js";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Require valid access token; attach user to req.user
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
    return;
  }

  const user = await findUserById(payload.userId);
  if (!user || !user.isActive || user.deletedAt) {
    res.status(401).json({ success: false, message: "User not found or inactive" });
    return;
  }
  if (user.isDisabled) {
    res.status(403).json({ success: false, message: "Account has been disabled. Contact administrator." });
    return;
  }

  req.user = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  };
  next();
}

/**
 * Require admin role (must be used after authMiddleware)
 */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  }
  if (req.user.role !== "admin") {
    res.status(403).json({ success: false, message: "Admin access required" });
    return;
  }
  next();
}
