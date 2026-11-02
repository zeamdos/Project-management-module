import { Router } from "express";
import { ProjectController } from "../controllers/projectController";
import { authenticate, requireRole } from "../middleware/auth";
import { UserRole } from "../entities/User";

// Note: index.ts already registers these routes directly, so this router is not used unless
// you mount it yourself (app.use("/api/projects", router)). Do not do both.
const router = Router();

router.post("/", authenticate, requireRole(UserRole.ADMIN, UserRole.MANAGER), ProjectController.create);
router.get("/", authenticate, ProjectController.list);
router.get("/:id", authenticate, ProjectController.getById);
router.put("/:id", authenticate, requireRole(UserRole.ADMIN, UserRole.MANAGER), ProjectController.update);
router.delete("/:id", authenticate, requireRole(UserRole.ADMIN, UserRole.MANAGER), ProjectController.delete);

export default router;