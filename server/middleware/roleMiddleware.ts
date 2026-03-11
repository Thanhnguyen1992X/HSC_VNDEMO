import type { Request, Response, NextFunction } from "express";
import { requireAdmin } from "./authMiddleware.js";

export type { AuthUser } from "./authMiddleware.js";

/**
 * Admin only - redirect to /admin/login if not admin
 * Used for route-level protection (client-side redirect handled by frontend)
 */
export { requireAdmin };

/**
 * User only - any authenticated user (admin or user role) can access
 * Use requireAdmin for admin-only routes
 */
export function requireUser(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  }
  next();
}

/**
 * Require admin role (alias for requireAdmin)
 */
export const adminOnly = requireAdmin;
