import { Router } from "express";
import { authMiddleware, requireAdmin } from "../middleware/authMiddleware.js";
import * as userController from "../controllers/userController.js";

const router = Router();

router.get("/profile", authMiddleware, userController.getProfile);
router.put("/profile", authMiddleware, userController.updateProfile);

router.get("/", authMiddleware, requireAdmin, userController.listUsers);
router.get("/:id", authMiddleware, requireAdmin, userController.getUserById);
router.put("/:id", authMiddleware, requireAdmin, userController.updateUserById);
router.delete("/:id", authMiddleware, requireAdmin, userController.deleteUser);
router.post("/:id/toggle-status", authMiddleware, requireAdmin, userController.toggleUserStatus);

export default router;
