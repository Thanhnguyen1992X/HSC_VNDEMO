import { pgTable, text, varchar, serial, boolean, timestamp, integer, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/** Password validation: min 8 chars, uppercase, number, special char */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character");

/** Users table for authentication */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }),
  role: varchar("role", { length: 20 }).default("user").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  isEmailVerified: boolean("is_email_verified").default(false).notNull(),
  googleId: varchar("google_id", { length: 255 }),
  twoFactorSecret: text("two_factor_secret"),
  isTwoFactorEnabled: boolean("is_two_factor_enabled").default(false).notNull(),
  resetPasswordToken: varchar("reset_password_token", { length: 255 }),
  resetPasswordExpires: timestamp("reset_password_expires"),
  backupCodes: text("backup_codes"),
  isDisabled: boolean("is_disabled").default(false).notNull(),
  disabledAt: timestamp("disabled_at"),
  disabledBy: uuid("disabled_by"),
  promotedToAdminAt: timestamp("promoted_to_admin_at"),
  promotedBy: uuid("promoted_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

/** Refresh tokens for JWT rotation */
export const refreshTokens = pgTable("refresh_tokens", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Email verification tokens */
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const employees = pgTable("employees", {
  id: varchar("id", { length: 50 }).primaryKey(), // Mã NV, ví dụ: "123", "NV001"
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "cascade" }), // nullable for legacy data
  fullName: varchar("full_name", { length: 255 }).notNull(),
  position: varchar("position", { length: 255 }).notNull(),
  position_en: varchar("position_en", { length: 255 }).default("").notNull(),
  department: varchar("department", { length: 255 }).notNull(),
  department_en: varchar("department_en", { length: 255 }).default("").notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  phoneExt: varchar("phone_ext", { length: 20 }),
  avatarUrl: text("avatar_url"),
  companyName: varchar("company_name", { length: 255 }).default("HSC").notNull(),
  companyName_en: varchar("company_name_en", { length: 255 }).default("HSC").notNull(),
  companyLogoUrl: text("company_logo_url"),
  backgroundUrl: text("background_url"),
  linkedinUrl: varchar("linkedin_url", { length: 255 }),
  facebookUrl: varchar("facebook_url", { length: 255 }),
  mobilePhone: varchar("mobile_phone", { length: 50 }),
  fax: varchar("fax", { length: 50 }),
  websiteUrl: varchar("website_url", { length: 255 }),
  address: text("address"),
  address_en: text("address_en"),
  mainOffice: text("main_office"),
  mainOffice_en: text("main_office_en"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/** Activity log for audit trail */
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  action: varchar("action", { length: 50 }).notNull(), // LOGIN, LOGOUT, CREATE_EMPLOYEE, DELETE_USER, etc.
  performedBy: uuid("performed_by").references(() => users.id),
  targetUserId: uuid("target_user_id").references(() => users.id),
  targetEmployeeId: varchar("target_employee_id", { length: 50 }),
  metadata: text("metadata"), // JSON string for extra info
  ip: varchar("ip", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cardViews = pgTable("card_views", {
  id: serial("id").primaryKey(),
  employeeId: varchar("employee_id", { length: 50 })
    .references(() => employees.id, { onDelete: "cascade" })
    .notNull(),
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
  source: varchar("source", { length: 20 }).notNull(), // 'qr', 'nfc', 'direct', 'unknown'
  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: text("user_agent"),
});

export const insertEmployeeSchema = createInsertSchema(employees)
  .omit({ createdAt: true, updatedAt: true })
  // ID must be non-empty and contain no whitespace characters
  .extend({
    id: z
      .string()
      .min(1, { message: "Employee ID is required" })
      .regex(/^\S+$/, { message: "Employee ID cannot contain spaces" }),
  });
export const insertCardViewSchema = createInsertSchema(cardViews).omit({ id: true, viewedAt: true });

export type ActivityLog = typeof activityLogs.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type UpdateEmployeeRequest = Partial<InsertEmployee>;

export type CardView = typeof cardViews.$inferSelect;
export type InsertCardView = z.infer<typeof insertCardViewSchema>;

// Auth schemas
export const adminLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required")
});

export const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(100),
  email: z.string().email("Invalid email"),
  password: passwordSchema,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
});

export const twoFactorValidateSchema = z.object({
  tempToken: z.string().min(1, "Temporary token is required"),
  totpCode: z.string().length(6, "TOTP code must be 6 digits"),
});

export const twoFactorVerifySetupSchema = z.object({
  totpCode: z.string().length(6, "TOTP code must be 6 digits"),
});

export const twoFactorDisableSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export type AdminLoginRequest = z.infer<typeof adminLoginSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
