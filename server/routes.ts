import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authMiddleware, requireAdmin } from "./middleware/authMiddleware";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import userPortalRoutes from "./routes/userPortalRoutes";

const __dirname = path.resolve();

const authenticateToken = authMiddleware;
const adminOnly = [authenticateToken, requireAdmin] as const;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/user", userPortalRoutes);

  // PUBLIC ENDPOINTS
  app.get(api.public.getEmployee.path, async (req, res) => {
    const employee = await storage.getEmployee(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    if (!employee.isActive) {
      return res.status(404).json({ message: "Employee card is inactive" });
    }
    res.status(200).json(employee);
  });

  app.post(api.analytics.track.path, async (req, res) => {
    try {
      const input = api.analytics.track.input.parse(req.body);
      
      const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      
      await storage.trackView({
        employeeId: input.employeeId,
        source: input.source,
        ipAddress: typeof ipAddress === 'string' ? ipAddress : Array.isArray(ipAddress) ? ipAddress[0] : null,
        userAgent: typeof userAgent === 'string' ? userAgent : null
      });
      
      res.status(201).json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ADMIN AUTH - uses new auth system, returns { token } for backward compat
  const { adminLogin } = await import("./controllers/authController");
  const loginLimiter = (await import("express-rate-limit")).default({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { success: false, message: "Too many login attempts. Try again later." },
  });
  app.post(api.admin.login.path, loginLimiter, adminLogin);

  // PROTECTED ADMIN ENDPOINTS

  // file upload (avatar). Expects multipart/form-data with field 'avatar'
  const upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = path.resolve(__dirname, "../public/uploads");
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, name);
      }
    }),
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith("image/")) cb(null, true);
      else cb(new Error("Only images allowed"));
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  });

  // Admin users management
  const adminUsersController = await import("./controllers/adminUsersController");
  const activityLogController = await import("./controllers/activityLogController");
  app.get("/api/admin/users", ...adminOnly, adminUsersController.listUsers);
  app.patch("/api/admin/users/:id/promote", ...adminOnly, adminUsersController.promoteToAdmin);
  app.patch("/api/admin/users/:id/toggle-status", ...adminOnly, adminUsersController.toggleUserStatus);
  app.delete("/api/admin/users/:id", ...adminOnly, adminUsersController.deleteUser);
  app.get("/api/admin/activity-log", ...adminOnly, activityLogController.getActivityLogHandler);

  app.post("/api/admin/upload", ...adminOnly, upload.single("avatar"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    // send back accessible URL
    const url = `/uploads/${req.file.filename}`;
    res.status(200).json({ url });
  });

  app.get(api.employees.list.path, ...adminOnly, async (req, res) => {
    const employees = await storage.getEmployees();
    res.status(200).json(employees);
  });

  app.get(api.employees.get.path, ...adminOnly, async (req, res) => {
    const employee = await storage.getEmployee(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.status(200).json(employee);
  });

  app.post(api.employees.create.path, ...adminOnly, async (req, res) => {
    try {
      const input = api.employees.create.input.parse(req.body);
      
      // Check if employee ID already exists
      const existing = await storage.getEmployee(input.id);
      if (existing) {
        return res.status(400).json({ message: "Employee ID already exists", field: "id" });
      }
      
      const employee = await storage.createEmployee({
        ...input,
        createdBy: req.user!.id,
      });
      res.status(201).json(employee);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.')
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.employees.update.path, ...adminOnly, async (req, res) => {
    try {
      const input = api.employees.update.input.parse(req.body);
      const employee = await storage.getEmployee(req.params.id);
      
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      const updated = await storage.updateEmployee(req.params.id, input);
      res.status(200).json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.')
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.employees.delete.path, ...adminOnly, async (req, res) => {
    const employee = await storage.getEmployee(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    await storage.deleteEmployee(req.params.id);
    res.status(204).end();
  });

  app.patch(api.employees.toggleActive.path, ...adminOnly, async (req, res) => {
    try {
      const input = api.employees.toggleActive.input.parse(req.body);
      const employee = await storage.getEmployee(req.params.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      const updated = await storage.updateEmployee(req.params.id, { isActive: input.isActive });
      res.status(200).json(updated);
    } catch (err) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  app.get(api.analytics.summary.path, ...adminOnly, async (req, res) => {
    const summary = await storage.getAnalyticsSummary();
    res.status(200).json(summary);
  });

  // Seed DB Function
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  try {
    const { findUserByUsername, createUser } = await import("./services/userStorage");
    const { hashPassword } = await import("./utils/passwordUtils");
    const existingAdmin = await findUserByUsername("admin");
    if (!existingAdmin) {
      const hashed = await hashPassword("admin123");
      await createUser({
        username: "admin",
        email: "admin@hsc.com.vn",
        password: hashed,
        role: "admin",
        isEmailVerified: true,
      });
      console.log("[Seed] Created default admin user (admin / admin123)");
    }

    const existing = await storage.getEmployees();
    if (existing.length === 0) {
      const seedEmployees = [
        {
          id: "123",
          fullName: "Nguyễn Văn A",
          position: "Giám đốc Kinh doanh",
          position_en: "Business Director",
          department: "Phòng Kinh Doanh",
          department_en: "Business Department",
          email: "nguyenvana@hsc.com.vn",
          phone: "0901234567",
          fax: "",
          phoneExt: "101",
          avatarUrl: "",
          backgroundUrl: "",
          companyName: "HSC",
          companyName_en: "HSC",
          linkedinUrl: "https://linkedin.com/in/nguyenvana",
          mobilePhone: "0901234567",
          websiteUrl: "https://hsc.com.vn",
          address: "",
          address_en: "",
          mainOffice: "",
          mainOffice_en: "",
          isActive: true
        },
        {
          id: "456",
          fullName: "Trần Thị B",
          position: "Kế toán trưởng",
          position_en: "Chief Accountant",
          department: "Phòng Tài Chính",
          department_en: "Finance Department",
          email: "tranthib@hsc.com.vn",
          phone: "0912345678",
          fax: "",
          phoneExt: "102",
          avatarUrl: "",
          backgroundUrl: "",
          companyName: "HSC",
          companyName_en: "HSC",
          linkedinUrl: "https://linkedin.com/in/tranthib",
          mobilePhone: "0912345678",
          websiteUrl: "https://hsc.com.vn",
          address: "",
          address_en: "",
          isActive: true
        },
        {
          id: "001",
          fullName: "Lê Minh C",
          position: "Giám đốc điều hành",
          position_en: "Chief Executive Officer",
          department: "Ban Giám Đốc",
          department_en: "Executive Board",
          email: "leminhc@hsc.com.vn",
          phone: "0923456789",
          fax: "",
          phoneExt: "100",
          avatarUrl: "",
          backgroundUrl: "",
          companyName: "HSC",
          companyName_en: "HSC",
          linkedinUrl: "https://linkedin.com/in/leminhc",
          mobilePhone: "0923456789",
          websiteUrl: "https://hsc.com.vn",
          address: "",
          address_en: "",
          isActive: true
        }
      ];

      for (const emp of seedEmployees) {
        await storage.createEmployee(emp);
      }
    }
  } catch (error) {
    console.error("Failed to seed database:", error);
  }
}
