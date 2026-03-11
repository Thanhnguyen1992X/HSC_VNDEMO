import type { Request, Response } from "express";
import {
  getUsersPaginated,
  promoteUser,
  toggleUserDisabled,
  hardDeleteUser,
  findUserById,
} from "../services/userStorage.js";
import { logActivity } from "../services/activityLogService.js";

function success(res: Response, data: object, status = 200) {
  res.status(status).json({ success: true, ...data });
}

function error(res: Response, message: string, status = 400) {
  res.status(status).json({ success: false, message });
}

/**
 * GET /api/admin/users
 */
export async function listUsers(req: Request, res: Response): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(10, parseInt(req.query.limit as string) || 20));
    const search = (req.query.search as string) || "";
    const filter = (req.query.filter as "all" | "admin" | "user" | "disabled") || "all";
    const sort = (req.query.sort as "joined" | "username" | "role" | "employees") || "joined";

    const result = await getUsersPaginated(page, limit, { search, filter, sort });
    success(res, result);
  } catch (e) {
    console.error("listUsers error:", e);
    error(res, "Failed to fetch users", 500);
  }
}

/**
 * PATCH /api/admin/users/:id/promote
 */
export async function promoteToAdmin(req: Request, res: Response): Promise<void> {
  try {
    const targetId = String(req.params.id || "");
    const performerId = (req as any).user?.id;

    const target = await findUserById(targetId);
    if (!target) {
      error(res, "User not found", 404);
      return;
    }
    if (target.role === "admin") {
      error(res, "User is already an admin", 400);
      return;
    }

    await promoteUser(targetId, performerId);
    await logActivity({
      action: "PROMOTE_TO_ADMIN",
      performedBy: performerId,
      targetUserId: targetId,
      metadata: { targetUsername: target.username },
      ip: req.ip,
    });

    success(res, { message: "User promoted to Admin successfully" });
  } catch (e) {
    console.error("promoteToAdmin error:", e);
    error(res, "Failed to promote user", 500);
  }
}

/**
 * PATCH /api/admin/users/:id/toggle-status
 * Body: { disable: boolean }
 */
export async function toggleUserStatus(req: Request, res: Response): Promise<void> {
  try {
    const targetId = String(req.params.id || "");
    const performerId = (req as any).user?.id;
    const disable = req.body?.disable === true;

    const target = await findUserById(targetId);
    if (!target) {
      error(res, "User not found", 404);
      return;
    }
    if (target.id === performerId) {
      error(res, "Cannot disable your own account", 400);
      return;
    }

    await toggleUserDisabled(targetId, performerId, disable);
    await logActivity({
      action: disable ? "DISABLE_USER" : "ENABLE_USER",
      performedBy: performerId,
      targetUserId: targetId,
      metadata: { targetUsername: target.username },
      ip: req.ip,
    });

    success(res, { message: `User ${disable ? "disabled" : "enabled"} successfully` });
  } catch (e) {
    console.error("toggleUserStatus error:", e);
    error(res, "Failed to update user status", 500);
  }
}

/**
 * DELETE /api/admin/users/:id
 */
export async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    const targetId = String(req.params.id || "");
    const performerId = (req as any).user?.id;

    const target = await findUserById(targetId);
    if (!target) {
      error(res, "User not found", 404);
      return;
    }
    if (target.id === performerId) {
      error(res, "Cannot delete your own account", 400);
      return;
    }

    const { deletedEmployees } = await hardDeleteUser(targetId);
    await logActivity({
      action: "DELETE_USER",
      performedBy: performerId,
      targetUserId: targetId,
      metadata: { targetUsername: target.username, deletedEmployees },
      ip: req.ip,
    });

    success(res, { message: `User and ${deletedEmployees} employees deleted` });
  } catch (e) {
    console.error("deleteUser error:", e);
    error(res, "Failed to delete user", 500);
  }
}
