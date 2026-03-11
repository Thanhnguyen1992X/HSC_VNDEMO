import { db } from "./db";
import {
  employees,
  cardViews,
  type Employee,
  type InsertEmployee,
  type UpdateEmployeeRequest,
  type CardView,
  type InsertCardView
} from "@shared/schema";
import { eq, desc, sql, inArray, and } from "drizzle-orm";

export interface IStorage {
  getEmployees(): Promise<Employee[]>;
  getEmployeesByUserId(userId: string): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, updates: UpdateEmployeeRequest): Promise<Employee>;
  deleteEmployee(id: string): Promise<void>;
  
  trackView(view: InsertCardView): Promise<CardView>;
  getAnalyticsSummary(): Promise<{
    totalViews: number;
    totalProfiles: number;
    totalActiveProfiles: number;
    viewsBySource: { source: string; count: number }[];
    topEmployees: { employeeId: string; fullName: string; viewCount: number }[];
    recentViews: { date: string; count: number }[];
  }>;
  getAnalyticsSummaryForUser(userId: string): Promise<{
    totalViews: number;
    totalProfiles: number;
    totalActiveProfiles: number;
    viewsBySource: { source: string; count: number }[];
    topEmployees: { employeeId: string; fullName: string; viewCount: number }[];
    recentViews: { date: string; count: number }[];
  }>;
}

export class DatabaseStorage implements IStorage {
  async getEmployees(): Promise<Employee[]> {
    return await db.select().from(employees).orderBy(desc(employees.createdAt));
  }

  async getEmployeesByUserId(userId: string): Promise<Employee[]> {
    return await db
      .select()
      .from(employees)
      .where(eq(employees.createdBy, userId))
      .orderBy(desc(employees.createdAt));
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [created] = await db.insert(employees).values(employee).returning();
    return created;
  }

  async updateEmployee(id: string, updates: UpdateEmployeeRequest): Promise<Employee> {
    const [updated] = await db.update(employees)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();
    return updated;
  }

  async deleteEmployee(id: string): Promise<void> {
    // remove any analytics entries first (FK constraint)
    await db.delete(cardViews).where(eq(cardViews.employeeId, id));
    await db.delete(employees).where(eq(employees.id, id));
  }

  async trackView(view: InsertCardView): Promise<CardView> {
    const [created] = await db.insert(cardViews).values(view).returning();
    return created;
  }

  async getAnalyticsSummary() {
    // Total views
    const [{ count }] = await db.select({ count: sql<number>`cast(count(*) as integer)` }).from(cardViews);
    
    // Total profiles and active profiles
    const [{ total: totalProfiles }] = await db.select({ total: sql<number>`cast(count(*) as integer)` }).from(employees);
    const [{ active: totalActiveProfiles }] = await db
      .select({ active: sql<number>`cast(count(*) as integer)` })
      .from(employees)
      .where(eq(employees.isActive, true));

    // Views by source
    const sourceStats = await db.select({
      source: cardViews.source,
      count: sql<number>`cast(count(*) as integer)`
    }).from(cardViews).groupBy(cardViews.source);

    // Top employees
    const topEmpStats = await db.execute(sql`
      SELECT e.id as "employeeId", e.full_name as "fullName", count(v.id) as "viewCount"
      FROM employees e
      LEFT JOIN card_views v ON e.id = v.employee_id
      GROUP BY e.id, e.full_name
      ORDER BY "viewCount" DESC
      LIMIT 10
    `);

    // Recent views (last 7 days by date)
    const recent = await db.execute(sql`
      SELECT date_trunc('day', viewed_at) as date, count(*) as count
      FROM card_views
      WHERE viewed_at >= NOW() - INTERVAL '7 days'
      GROUP BY date
      ORDER BY date ASC
    `);

    return {
      totalViews: count,
      totalProfiles,
      totalActiveProfiles,
      viewsBySource: sourceStats,
      topEmployees: topEmpStats.rows.map(r => ({
        employeeId: String(r.employeeId),
        fullName: String(r.fullName),
        viewCount: Number(r.viewCount)
      })),
      recentViews: recent.rows.map(r => ({
        date: String(r.date),
        count: Number(r.count)
      }))
    };
  }

  async getAnalyticsSummaryForUser(userId: string) {
    const userEmps = await db
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.createdBy, userId));
    const empIds = userEmps.map((e) => e.id);
    if (empIds.length === 0) {
      return {
        totalViews: 0,
        totalProfiles: 0,
        totalActiveProfiles: 0,
        viewsBySource: [],
        topEmployees: [],
        recentViews: [],
      };
    }

    const [{ totalViews: totalViewsCount }] = await db
      .select({ totalViews: sql<number>`cast(count(*) as integer)` })
      .from(cardViews)
      .where(inArray(cardViews.employeeId, empIds));

    const [{ count: activeCountVal }] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(employees)
      .where(and(eq(employees.createdBy, userId), eq(employees.isActive, true)));

    const sourceStats = await db
      .select({
        source: cardViews.source,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(cardViews)
      .where(inArray(cardViews.employeeId, empIds))
      .groupBy(cardViews.source);

    const topEmpStats = await db
      .select({
        employeeId: employees.id,
        fullName: employees.fullName,
        viewCount: sql<number>`cast(count(${cardViews.id}) as integer)`,
      })
      .from(employees)
      .leftJoin(cardViews, eq(employees.id, cardViews.employeeId))
      .where(eq(employees.createdBy, userId))
      .groupBy(employees.id, employees.fullName)
      .orderBy(desc(sql`count(${cardViews.id})`))
      .limit(5);

    const recent = await db
      .select({
        date: sql<string>`date_trunc('day', ${cardViews.viewedAt})::text`,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(cardViews)
      .where(
        and(
          inArray(cardViews.employeeId, empIds),
          sql`${cardViews.viewedAt} >= NOW() - INTERVAL '7 days'`
        )
      )
      .groupBy(sql`date_trunc('day', ${cardViews.viewedAt})`)
      .orderBy(sql`date_trunc('day', ${cardViews.viewedAt})`);

    return {
      totalViews: totalViewsCount ?? 0,
      totalProfiles: empIds.length,
      totalActiveProfiles: activeCountVal ?? 0,
      viewsBySource: sourceStats,
      topEmployees: topEmpStats.map((r) => ({
        employeeId: r.employeeId,
        fullName: r.fullName ?? "",
        viewCount: r.viewCount ?? 0,
      })),
      recentViews: recent.map((r) => ({ date: r.date ?? "", count: r.count ?? 0 })),
    };
  }
}

export const storage = new DatabaseStorage();
