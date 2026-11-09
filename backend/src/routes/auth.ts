import { Router } from "express";
import { AuthController } from "../controllers/authController";

// Note: index.ts already registers these routes directly (with a rate limit),
// so this router is not used unless you mount it yourself. Do not do both.
const router = Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);

export default router;
