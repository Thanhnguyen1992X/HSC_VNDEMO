import type { Request, Response } from "express";
import { getActivityLog } from "../services/activityLogService.js";

function success(res: Response, data: object, status = 200) {
  res.status(status).json({ success: true, ...data });
}

function error(res: Response, message: string, status = 400) {
  res.status(status).json({ success: false, message });
}

/**
 * GET /api/admin/activity-log
 */
export async function getActivityLogHandler(req: Request, res: Response): Promise<void> {
  try {
    const limit = Math.min(100, Math.max(10, parseInt(req.query.limit as string) || 50));
    const action = req.query.action as string | undefined;
    const userId = req.query.userId as string | undefined;

    const log = await getActivityLog({ limit, action, userId });
    success(res, { log });
  } catch (e) {
    console.error("getActivityLog error:", e);
    error(res, "Failed to fetch activity log", 500);
  }
}
