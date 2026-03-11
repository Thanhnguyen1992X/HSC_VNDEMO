import { db } from "../db.js";
import { activityLogs } from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export type ActivityAction =
  | "LOGIN"
  | "LOGOUT"
  | "CREATE_EMPLOYEE"
  | "UPDATE_EMPLOYEE"
  | "DELETE_EMPLOYEE"
  | "DELETE_USER"
  | "PROMOTE_TO_ADMIN"
  | "DISABLE_USER"
  | "ENABLE_USER"
  | "RESET_PASSWORD"
  | "REGISTER";

export interface LogActivityParams {
  action: ActivityAction;
  performedBy?: string;
  targetUserId?: string;
  targetEmployeeId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  await db.insert(activityLogs).values({
    action: params.action,
    performedBy: params.performedBy ?? null,
    targetUserId: params.targetUserId ?? null,
    targetEmployeeId: params.targetEmployeeId ?? null,
    metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    ip: params.ip ?? null,
  });
}

export async function getActivityLog(options: {
  limit?: number;
  action?: string;
  userId?: string;
}): Promise<Array<{
  id: number;
  action: string;
  performedBy: string | null;
  targetUserId: string | null;
  targetEmployeeId: string | null;
  metadata: string | null;
  ip: string | null;
  createdAt: Date;
  performedByUsername?: string;
  targetUsername?: string;
}>> {
  const limit = options.limit ?? 100;
  const conditions = [];
  if (options.action) {
    conditions.push(eq(activityLogs.action, options.action));
  }
  if (options.userId) {
    conditions.push(eq(activityLogs.performedBy, options.userId));
  }

  const rows = await db
    .select()
    .from(activityLogs)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    action: r.action,
    performedBy: r.performedBy,
    targetUserId: r.targetUserId,
    targetEmployeeId: r.targetEmployeeId,
    metadata: r.metadata,
    ip: r.ip,
    createdAt: r.createdAt,
  }));
}
