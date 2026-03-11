import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { storage } from "../storage.js";
import { api } from "@shared/routes";
import { z } from "zod";
import { logActivity } from "../services/activityLogService.js";

const router = Router();
const auth = authMiddleware;

router.get("/stats", auth, async (req, res) => {
  const u = (req as any).user;
  if (!u?.id) return res.status(401).json({ success: false, message: "Unauthorized" });
  try {
    const summary = await storage.getAnalyticsSummaryForUser(u.id);
    res.status(200).json(summary);
  } catch (err) {
    console.error("user stats error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
});

router.get("/employees", auth, async (req, res) => {
  const u = (req as any).user;
  if (!u?.id) return res.status(401).json({ success: false, message: "Unauthorized" });
  try {
    const employees = await storage.getEmployeesByUserId(u.id);
    res.status(200).json(employees);
  } catch (err) {
    console.error("user employees list error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch employees" });
  }
});

router.post("/employees", auth, async (req, res) => {
  const u = (req as any).user;
  if (!u?.id) return res.status(401).json({ success: false, message: "Unauthorized" });
  try {
    const input = api.employees.create.input.parse(req.body);
    const existing = await storage.getEmployee(input.id);
    if (existing) {
      return res.status(400).json({ message: "Employee ID already exists", field: "id" });
    }
    const employee = await storage.createEmployee({
      ...input,
      createdBy: u.id,
    });
    await logActivity({
      action: "CREATE_EMPLOYEE",
      performedBy: u.id,
      targetEmployeeId: employee.id,
      ip: req.ip,
    });
    res.status(201).json(employee);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0]?.message || "Validation error" });
    }
    res.status(500).json({ success: false, message: "Failed to create employee" });
  }
});

router.get("/employees/:id", auth, async (req, res) => {
  const u = (req as any).user;
  if (!u?.id) return res.status(401).json({ success: false, message: "Unauthorized" });
  const employee = await storage.getEmployee(String(req.params.id));
  if (!employee) return res.status(404).json({ message: "Employee not found" });
  if (employee.createdBy !== u.id) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  res.status(200).json(employee);
});

router.put("/employees/:id", auth, async (req, res) => {
  const u = (req as any).user;
  if (!u?.id) return res.status(401).json({ success: false, message: "Unauthorized" });
  const id = String(req.params.id);
  const employee = await storage.getEmployee(id);
  if (!employee) return res.status(404).json({ message: "Employee not found" });
  if (employee.createdBy !== u.id) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  try {
    const input = api.employees.update.input.parse(req.body);
    const updated = await storage.updateEmployee(id, input);
    res.status(200).json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0]?.message || "Validation error" });
    }
    res.status(500).json({ success: false, message: "Failed to update employee" });
  }
});

router.delete("/employees/:id", auth, async (req, res) => {
  const u = (req as any).user;
  if (!u?.id) return res.status(401).json({ success: false, message: "Unauthorized" });
  const id = String(req.params.id);
  const employee = await storage.getEmployee(id);
  if (!employee) return res.status(404).json({ message: "Employee not found" });
  if (employee.createdBy !== u.id) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  await storage.deleteEmployee(id);
  await logActivity({
    action: "DELETE_EMPLOYEE",
    performedBy: u.id,
    targetEmployeeId: id,
    ip: req.ip,
  });
  res.status(204).end();
});

router.patch("/employees/:id/toggle", auth, async (req, res) => {
  const u = (req as any).user;
  if (!u?.id) return res.status(401).json({ success: false, message: "Unauthorized" });
  const id = String(req.params.id);
  const employee = await storage.getEmployee(id);
  if (!employee) return res.status(404).json({ message: "Employee not found" });
  if (employee.createdBy !== u.id) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  const input = api.employees.toggleActive.input.parse(req.body);
  const updated = await storage.updateEmployee(id, { isActive: input.isActive });
  res.status(200).json(updated);
});

export default router;
