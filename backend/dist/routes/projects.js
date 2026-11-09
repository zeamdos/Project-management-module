"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const projectController_1 = require("../controllers/projectController");
const auth_1 = require("../middleware/auth");
const User_1 = require("../entities/User");
// Note: index.ts already registers these routes directly, so this router is not used unless
// you mount it yourself (app.use("/api/projects", router)). Do not do both.
const router = (0, express_1.Router)();
router.post("/", auth_1.authenticate, (0, auth_1.requireRole)(User_1.UserRole.ADMIN, User_1.UserRole.MANAGER), projectController_1.ProjectController.create);
router.get("/", auth_1.authenticate, projectController_1.ProjectController.list);
router.get("/:id", auth_1.authenticate, projectController_1.ProjectController.getById);
router.put("/:id", auth_1.authenticate, (0, auth_1.requireRole)(User_1.UserRole.ADMIN, User_1.UserRole.MANAGER), projectController_1.ProjectController.update);
router.delete("/:id", auth_1.authenticate, (0, auth_1.requireRole)(User_1.UserRole.ADMIN, User_1.UserRole.MANAGER), projectController_1.ProjectController.delete);
exports.default = router;
