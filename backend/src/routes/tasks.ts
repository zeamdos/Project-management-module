import { Router } from "express";
import { TaskController } from "../controllers/taskController";
import { WorkflowController } from "../controllers/workflowController";
import { authenticate, requireRole } from "../middleware/auth";
import { UserRole } from "../entities/User";

const router = Router();

router.post("/", authenticate, requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.TEAM_LEAD), TaskController.create);
router.patch("/:id/status", authenticate, TaskController.updateStatus);
router.post("/:id/review", authenticate, WorkflowController.submitReview);
router.patch("/:id/assign", authenticate, requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.TEAM_LEAD), WorkflowController.assign);

export default router;

