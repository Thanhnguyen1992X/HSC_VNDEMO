import { db } from "../db.js";
import { users, refreshTokens, emailVerificationTokens, employees } from "@shared/schema";
import { eq, or, and, sql, desc, asc, gt, inArray } from "drizzle-orm";
import type { User, InsertUser } from "@shared/schema";

export async function createUser(data: InsertUser): Promise<User> {
  const [created] = await db.insert(users).values(data).returning();
  return created;
}

export async function findUserById(id: string): Promise<User | undefined> {
  const [u] = await db.select().from(users).where(eq(users.id, id));
  return u;
}

// helpers used by multiple lookup functions so we don't forget the deletedAt filter
function baseActiveUserQuery() {
  // only return rows that haven't been soft-deleted
  return db.select().from(users).where(eq(users.deletedAt, null));
}

export async function findUserByUsername(username: string): Promise<User | undefined> {
  const [u] = await baseActiveUserQuery().where(eq(users.username, username));
  return u;
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const [u] = await baseActiveUserQuery().where(eq(users.email, email));
  return u;
}

export async function findUserByUsernameOrEmail(
  usernameOrEmail: string
): Promise<User | undefined> {
  const [u] = await baseActiveUserQuery().where(
    or(eq(users.username, usernameOrEmail), eq(users.email, usernameOrEmail))
  );
  return u;
}

export async function findUserByGoogleId(googleId: string): Promise<User | undefined> {
  const [u] = await db.select().from(users).where(eq(users.googleId, googleId));
  return u;
}

export async function findUserByResetToken(
  hashedToken: string
): Promise<User | undefined> {
  // Use Node's Date instead of PostgreSQL NOW() to avoid DB/server clock drift
  const now = new Date();
  const [u] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.resetPasswordToken, hashedToken),
        gt(users.resetPasswordExpires, now)
      )
    );
  return u;
}

/** Check if any user has this hashed token (ignoring expiry) - for debugging */
export async function findUserByResetTokenIgnoreExpiry(
  hashedToken: string
): Promise<User | undefined> {
  const [u] = await db
    .select()
    .from(users)
    .where(eq(users.resetPasswordToken, hashedToken));
  return u;
}

export async function updateUser(
  id: string,
  data: Partial<InsertUser>
): Promise<User | undefined> {
  const [updated] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return updated;
}

export type UserFilter = "all" | "admin" | "user" | "disabled";
export type UserSort = "joined" | "username" | "role" | "employees";

export async function getUsersPaginated(
  page = 1,
  limit = 20,
  options?: { search?: string; filter?: UserFilter; sort?: UserSort }
): Promise<{ users: (User & { employeeCount: number })[]; total: number }> {
  const offset = (page - 1) * limit;
  const search = options?.search?.trim();
  const filter = options?.filter ?? "all";
  const sort = options?.sort ?? "joined";

  const conditions = [sql`${users.deletedAt} IS NULL`];
  if (search) {
    conditions.push(
      sql`(${users.username} ILIKE ${"%" + search + "%"} OR ${users.email} ILIKE ${"%" + search + "%"})`
    );
  }
  if (filter === "admin") conditions.push(eq(users.role, "admin"));
  if (filter === "user") conditions.push(eq(users.role, "user"));
  if (filter === "disabled") conditions.push(eq(users.isDisabled, true));

  const whereClause = and(...conditions);
  const orderCol =
    sort === "username" ? asc(users.username) :
    sort === "role" ? asc(users.role) :
    desc(users.createdAt);

  const usersList = await db
    .select()
    .from(users)
    .where(whereClause)
    .orderBy(orderCol)
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(users)
    .where(whereClause);

  const userIds = usersList.map((u) => u.id);
  const empCountRows =
    userIds.length > 0
      ? await db
          .select({
            createdBy: employees.createdBy,
            count: sql<number>`cast(count(*) as integer)`,
          })
          .from(employees)
          .where(inArray(employees.createdBy, userIds))
          .groupBy(employees.createdBy)
      : [];
  const countMap = new Map<string, number>(
    empCountRows.map((r) => [r.createdBy!, Number(r.count)])
  );

  return {
    users: usersList.map((u) => ({
      ...u,
      employeeCount: countMap.get(u.id) ?? 0,
    })),
    total: count,
  };
}

export async function getEmployeeCountByUserId(userId: string): Promise<number> {
  const [r] = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(employees)
    .where(eq(employees.createdBy, userId));
  return r?.count ?? 0;
}

export async function promoteUser(userId: string, promotedBy: string): Promise<User | undefined> {
  return updateUser(userId, {
    role: "admin",
    promotedToAdminAt: new Date(),
    promotedBy,
  });
}

export async function toggleUserDisabled(userId: string, disabledBy: string, disable: boolean): Promise<User | undefined> {
  return updateUser(userId, {
    isDisabled: disable,
    disabledAt: disable ? new Date() : null,
    disabledBy: disable ? disabledBy : null,
  });
}

export async function hardDeleteUser(userId: string): Promise<{ deletedEmployees: number }> {
  const empCount = await getEmployeeCountByUserId(userId);
  await db.delete(employees).where(eq(employees.createdBy, userId));
  await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
  await db.delete(users).where(eq(users.id, userId));
  return { deletedEmployees: empCount };
}

export async function softDeleteUser(id: string): Promise<void> {
  await db
    .update(users)
    .set({ deletedAt: new Date(), isActive: false })
    .where(eq(users.id, id));
}

export async function saveRefreshToken(
  userId: string,
  token: string,
  expiresAt: Date
): Promise<void> {
  await db.insert(refreshTokens).values({ userId, token, expiresAt });
}

export async function findRefreshToken(
  token: string,
  userId: string
): Promise<{ id: number } | undefined> {
  const [row] = await db
    .select({ id: refreshTokens.id })
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.token, token),
        eq(refreshTokens.userId, userId),
        sql`${refreshTokens.expiresAt} > NOW()`
      )
    );
  return row;
}

export async function deleteRefreshToken(id: number): Promise<void> {
  await db.delete(refreshTokens).where(eq(refreshTokens.id, id));
}

export async function deleteUserRefreshTokens(userId: string): Promise<void> {
  await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
}

export async function saveEmailVerificationToken(
  userId: string,
  token: string,
  expiresAt: Date
): Promise<void> {
  await db.insert(emailVerificationTokens).values({ userId, token, expiresAt });
}

export async function findEmailVerificationToken(
  token: string
): Promise<{ userId: string } | undefined> {
  const [row] = await db
    .select({ userId: emailVerificationTokens.userId })
    .from(emailVerificationTokens)
    .where(
      and(
        eq(emailVerificationTokens.token, token),
        sql`${emailVerificationTokens.expiresAt} > NOW()`
      )
    );
  return row;
}

export async function deleteEmailVerificationToken(
  token: string
): Promise<void> {
  await db
    .delete(emailVerificationTokens)
    .where(eq(emailVerificationTokens.token, token));
}
