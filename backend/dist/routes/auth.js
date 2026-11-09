"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
// Note: index.ts already registers these routes directly (with a rate limit),
// so this router is not used unless you mount it yourself. Do not do both.
const router = (0, express_1.Router)();
router.post("/register", authController_1.AuthController.register);
router.post("/login", authController_1.AuthController.login);
exports.default = router;
