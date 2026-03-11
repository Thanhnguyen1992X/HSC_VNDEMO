import type { Request, Response } from "express";
import { z } from "zod";
import {
  findUserById,
  getUsersPaginated,
  updateUser,
  softDeleteUser,
} from "../services/userStorage.js";

const updateProfileSchema = z.object({
  username: z.string().min(3).max(100).optional(),
  email: z.string().email().optional(),
});

const updateUserSchema = z.object({
  username: z.string().min(3).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(["admin", "user"]).optional(),
  isActive: z.boolean().optional(),
});

function success(res: Response, data: object, status = 200) {
  res.status(status).json({ success: true, ...data });
}

function error(res: Response, message: string, status = 400) {
  res.status(status).json({ success: false, message });
}

function sanitizeUser(u: any) {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
    isEmailVerified: u.isEmailVerified,
    isTwoFactorEnabled: u.isTwoFactorEnabled,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

/**
 * GET /api/users/profile
 */
export async function getProfile(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    error(res, "Unauthorized", 401);
    return;
  }
  const user = await findUserById(req.user.id);
  if (!user) {
    error(res, "User not found", 404);
    return;
  }
  success(res, { user: sanitizeUser(user) });
}

/**
 * PUT /api/users/profile
 */
export async function updateProfile(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    error(res, "Unauthorized", 401);
    return;
  }
  try {
    const input = updateProfileSchema.parse(req.body);
    const updated = await updateUser(req.user.id, input);
    if (!updated) {
      error(res, "User not found", 404);
      return;
    }
    success(res, { user: sanitizeUser(updated) });
  } catch (e) {
    if (e instanceof z.ZodError) {
      error(res, e.errors[0]?.message || "Validation error", 400);
      return;
    }
    throw e;
  }
}

/**
 * GET /api/users - List all users (paginated, admin only)
 */
export async function listUsers(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const { users: list, total } = await getUsersPaginated(page, limit);
  success(res, {
    users: list.map(sanitizeUser),
    pagination: { page, limit, total },
  });
}

/**
 * GET /api/users/:id
 */
export async function getUserById(req: Request, res: Response): Promise<void> {
  const user = await findUserById(req.params.id);
  if (!user || user.deletedAt) {
    error(res, "User not found", 404);
    return;
  }
  success(res, { user: sanitizeUser(user) });
}

/**
 * PUT /api/users/:id
 */
export async function updateUserById(req: Request, res: Response): Promise<void> {
  try {
    const input = updateUserSchema.parse(req.body);
    const updated = await updateUser(req.params.id, input);
    if (!updated) {
      error(res, "User not found", 404);
      return;
    }
    success(res, { user: sanitizeUser(updated) });
  } catch (e) {
    if (e instanceof z.ZodError) {
      error(res, e.errors[0]?.message || "Validation error", 400);
      return;
    }
    throw e;
  }
}

/**
 * DELETE /api/users/:id (soft delete)
 */
export async function deleteUser(req: Request, res: Response): Promise<void> {
  const targetId = req.params.id;
  if (req.user?.id === targetId) {
    error(res, "Cannot delete your own account", 400);
    return;
  }
  const user = await findUserById(targetId);
  if (!user || user.deletedAt) {
    error(res, "User not found", 404);
    return;
  }
  await softDeleteUser(targetId);
  success(res, { message: "User deleted" });
}

/**
 * POST /api/users/:id/toggle-status
 */
export async function toggleUserStatus(req: Request, res: Response): Promise<void> {
  const targetId = req.params.id;
  if (req.user?.id === targetId) {
    error(res, "Cannot deactivate your own account", 400);
    return;
  }
  const user = await findUserById(targetId);
  if (!user || user.deletedAt) {
    error(res, "User not found", 404);
    return;
  }
  const updated = await updateUser(targetId, { isActive: !user.isActive });
  if (!updated) {
    error(res, "Update failed", 500);
    return;
  }
  success(res, { user: sanitizeUser(updated) });
}
