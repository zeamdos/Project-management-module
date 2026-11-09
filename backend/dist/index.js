"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load .env from the project root (one level above backend/)
// Try backend/.env first; if it doesn't exist, load from ../  (the project root)
const fs_1 = __importDefault(require("fs"));
const localEnv = path_1.default.resolve(process.cwd(), ".env");
const rootEnv = path_1.default.resolve(__dirname, "../../..", ".env"); // src -> backend -> project root
const parentEnv = path_1.default.resolve(process.cwd(), "..", ".env");
if (fs_1.default.existsSync(localEnv)) {
    dotenv_1.default.config({ path: localEnv });
}
else if (fs_1.default.existsSync(parentEnv)) {
    dotenv_1.default.config({ path: parentEnv });
}
else if (fs_1.default.existsSync(rootEnv)) {
    dotenv_1.default.config({ path: rootEnv });
}
else {
    dotenv_1.default.config(); // fallback
}
console.log("[ENV] Loaded from:", fs_1.default.existsSync(localEnv) ? localEnv : fs_1.default.existsSync(parentEnv) ? parentEnv : fs_1.default.existsSync(rootEnv) ? rootEnv : "default");
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const data_source_1 = require("./config/data-source");
const authController_1 = require("./controllers/authController");
const projectController_1 = require("./controllers/projectController");
const taskController_1 = require("./controllers/taskController");
const suggestAssigneeController_1 = require("./controllers/suggestAssigneeController");
const webhookController_1 = require("./controllers/webhookController");
const dashboardController_1 = require("./controllers/dashboardController");
const developerController_1 = require("./controllers/developerController");
const workflowController_1 = require("./controllers/workflowController");
const progressController_1 = require("./controllers/progressController");
const adminController_1 = require("./controllers/adminController");
const auth_1 = require("./middleware/auth");
const User_1 = require("./entities/User");
const Organization_1 = require("./entities/Organization");
const telegramBot_1 = require("./services/telegramBot");
const progressService_1 = require("./services/progressService");
if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
    throw new Error("FATAL: JWT_SECRET must be defined in production.");
}
const isProd = process.env.NODE_ENV === "production";
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: [
        process.env.FRONTEND_URL || "http://localhost:5173",
        "http://localhost:5173",
        "http://localhost:3001",
        "http://localhost:3000",
    ],
    credentials: true,
}));
// Keep the raw body too: GitHub signs the raw bytes, and webhookController checks that signature.
app.use(express_1.default.json({ verify: (req, _res, buf) => { req.rawBody = buf; } }));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: isProd ? 100 : 1000,
    message: { error: "Too many requests, please try again later." },
});
app.use(limiter);
// Only failed sign-in attempts count, so normal use never trips this.
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: isProd ? 10 : 100,
    skipSuccessfulRequests: true,
    message: { error: "Too many failed attempts, please try again in a few minutes." },
});
// Auth Routes
app.post("/api/auth/register", authLimiter, authController_1.AuthController.register);
app.post("/api/auth/login", authLimiter, authController_1.AuthController.login);
// Webhook Route (No JWT auth, signature verified)
app.post("/api/webhooks/github", webhookController_1.WebhookController.handleGitHub);
// Developer dashboard routes (any signed-in user)
app.get("/api/me", auth_1.authenticate, developerController_1.DeveloperController.me);
app.patch("/api/me", auth_1.authenticate, developerController_1.DeveloperController.updateProfile);
app.post("/api/me/change-password", auth_1.authenticate, adminController_1.AdminController.changePassword);
app.get("/api/me/notifications", auth_1.authenticate, developerController_1.DeveloperController.notifications);
app.post("/api/me/notifications/read-all", auth_1.authenticate, developerController_1.DeveloperController.readAllNotifications);
app.post("/api/me/notifications/:id/read", auth_1.authenticate, developerController_1.DeveloperController.readNotification);
app.get("/api/me/tasks", auth_1.authenticate, developerController_1.DeveloperController.tasks);
app.get("/api/me/commits", auth_1.authenticate, developerController_1.DeveloperController.commits);
app.post("/api/me/commits", auth_1.authenticate, developerController_1.DeveloperController.logCommit);
app.post("/api/me/telegram-link", auth_1.authenticate, developerController_1.DeveloperController.telegramLink);
app.post("/api/me/tasks/:id/update", auth_1.authenticate, developerController_1.DeveloperController.updateTask);
app.get("/api/insights", auth_1.authenticate, dashboardController_1.DashboardController.insights);
// Admin-only User Management (Closed Provisioning — no public signup)
app.get("/api/admin/users", auth_1.authenticate, (0, auth_1.requireRole)(User_1.UserRole.ADMIN), adminController_1.AdminController.listUsers);
app.post("/api/admin/users", auth_1.authenticate, (0, auth_1.requireRole)(User_1.UserRole.ADMIN), adminController_1.AdminController.createUser);
app.patch("/api/admin/users/:id", auth_1.authenticate, (0, auth_1.requireRole)(User_1.UserRole.ADMIN), adminController_1.AdminController.updateUser);
app.post("/api/admin/users/:id/reset-password", auth_1.authenticate, (0, auth_1.requireRole)(User_1.UserRole.ADMIN), adminController_1.AdminController.resetPassword);
app.delete("/api/admin/users/:id", auth_1.authenticate, (0, auth_1.requireRole)(User_1.UserRole.ADMIN), adminController_1.AdminController.deactivateUser);
// Project Routes (Org-scoped & RBAC)
app.post("/api/projects", auth_1.authenticate, (0, auth_1.requireRole)(User_1.UserRole.ADMIN, User_1.UserRole.MANAGER), projectController_1.ProjectController.create);
app.get("/api/projects", auth_1.authenticate, projectController_1.ProjectController.list);
app.get("/api/projects/:id", auth_1.authenticate, projectController_1.ProjectController.getById);
app.put("/api/projects/:id", auth_1.authenticate, (0, auth_1.requireRole)(User_1.UserRole.ADMIN, User_1.UserRole.MANAGER), projectController_1.ProjectController.update);
app.delete("/api/projects/:id", auth_1.authenticate, (0, auth_1.requireRole)(User_1.UserRole.ADMIN, User_1.UserRole.MANAGER), projectController_1.ProjectController.delete);
// Task Routes
app.post("/api/tasks", auth_1.authenticate, (0, auth_1.requireRole)(User_1.UserRole.ADMIN, User_1.UserRole.MANAGER, User_1.UserRole.TEAM_LEAD), taskController_1.TaskController.create);
app.patch("/api/tasks/:id/status", auth_1.authenticate, taskController_1.TaskController.updateStatus);
// Review and reassignment (the controller checks who may review which task)
app.get("/api/reviews/pending", auth_1.authenticate, workflowController_1.WorkflowController.pendingReviews);
app.post("/api/tasks/:id/review", auth_1.authenticate, workflowController_1.WorkflowController.submitReview);
app.get("/api/developers", auth_1.authenticate, (0, auth_1.requireRole)(User_1.UserRole.ADMIN, User_1.UserRole.MANAGER, User_1.UserRole.TEAM_LEAD), workflowController_1.WorkflowController.developers);
app.patch("/api/tasks/:id/assign", auth_1.authenticate, (0, auth_1.requireRole)(User_1.UserRole.ADMIN, User_1.UserRole.MANAGER, User_1.UserRole.TEAM_LEAD), workflowController_1.WorkflowController.assign);
// Progress updates, blockers and the manager overview
app.get("/api/me/progress", auth_1.authenticate, progressController_1.ProgressController.mine);
app.post("/api/me/progress", auth_1.authenticate, progressController_1.ProgressController.submit);
app.post("/api/me/tasks/:id/blocker", auth_1.authenticate, progressController_1.ProgressController.blocker);
app.get("/api/progress/overview", auth_1.authenticate, (0, auth_1.requireRole)(User_1.UserRole.ADMIN, User_1.UserRole.MANAGER, User_1.UserRole.TEAM_LEAD), progressController_1.ProgressController.overview);
// Suggest Assignee Route
app.get("/api/tasks/:taskId/suggest-assignee", auth_1.authenticate, (0, auth_1.requireRole)(User_1.UserRole.ADMIN, User_1.UserRole.MANAGER, User_1.UserRole.TEAM_LEAD), suggestAssigneeController_1.SuggestAssigneeController.suggest);
// Dashboard Routes
app.get("/api/projects/:projectId/health", auth_1.authenticate, dashboardController_1.DashboardController.getProjectHealth);
const PORT = process.env.PORT || 3000;
// Database seeder: auto-create Admin, PM, and Developers on boot with complete details
async function seedMasterUsers() {
    try {
        const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
        const orgRepo = data_source_1.AppDataSource.getRepository(Organization_1.Organization);
        let org = await orgRepo.findOne({ where: { name: "Enterprise HQ" } });
        if (!org) {
            org = orgRepo.create({ name: "Enterprise HQ" });
            await orgRepo.save(org);
        }
        const salt = await bcryptjs_1.default.genSalt(12);
        // 1. Seed Admin
        const adminEmail = (process.env.ADMIN_EMAIL || "admin@enterprise.com").toLowerCase().trim();
        const adminPass = process.env.ADMIN_PASSWORD || "supersecureadminpass";
        let admin = await userRepo.findOne({ where: { email: adminEmail } });
        if (!admin) {
            const passwordHash = await bcryptjs_1.default.hash(adminPass, salt);
            admin = userRepo.create({
                orgId: org.id,
                email: adminEmail,
                passwordHash,
                name: "Master Admin",
                role: User_1.UserRole.ADMIN,
                department: "Executive Leadership",
                team: "Executive",
                phoneNumber: "+251911000000",
                status: User_1.UserStatus.ACTIVE,
            });
            await userRepo.save(admin);
            console.log("Master Admin seeded successfully.");
        }
        else {
            if (!admin.phoneNumber)
                admin.phoneNumber = "+251911000000";
            if (!admin.department)
                admin.department = "Executive Leadership";
            if (!admin.team)
                admin.team = "Executive";
            await userRepo.save(admin);
        }
        // 2. Seed Project Manager
        const pmEmail = (process.env.PM_EMAIL || "pm@enterprise.com").toLowerCase().trim();
        const pmPass = process.env.PM_PASSWORD || "supersecurepmepass";
        let pm = await userRepo.findOne({ where: { email: pmEmail } });
        if (!pm) {
            const passwordHash = await bcryptjs_1.default.hash(pmPass, salt);
            pm = userRepo.create({
                orgId: org.id,
                email: pmEmail,
                passwordHash,
                name: "Project Manager",
                role: User_1.UserRole.MANAGER,
                department: "Engineering Management",
                team: "Core Delivery",
                phoneNumber: "+251911223344",
                status: User_1.UserStatus.ACTIVE,
            });
            await userRepo.save(pm);
            console.log("Project Manager seeded successfully.");
        }
        else {
            if (!pm.phoneNumber)
                pm.phoneNumber = "+251911223344";
            if (!pm.department)
                pm.department = "Engineering Management";
            if (!pm.team)
                pm.team = "Core Delivery";
            await userRepo.save(pm);
        }
        // 3. Seed Enterprise Dedicated Developers
        const seedDevelopers = [
            {
                name: "Alex Mercer",
                email: "alex.mercer@enterprise.com",
                specialty: "Frontend",
                department: "Engineering",
                team: "Frontend Engineering",
                phoneNumber: "+251911445566",
                githubUsername: "alexmercer-dev",
            },
            {
                name: "David Kim",
                email: "david.kim@enterprise.com",
                specialty: "Backend",
                department: "Engineering",
                team: "Backend Infrastructure",
                phoneNumber: "+251911556677",
                githubUsername: "dkim-backend",
            },
            {
                name: "Elena Rostova",
                email: "elena.rostova@enterprise.com",
                specialty: "UI/UX",
                department: "Product Design",
                team: "UI/UX Design Systems",
                phoneNumber: "+251911667788",
                githubUsername: "elenar-design",
            },
            {
                name: "Marcus Vance",
                email: "marcus.vance@enterprise.com",
                specialty: "AI",
                department: "Applied AI",
                team: "Machine Learning Solutions",
                phoneNumber: "+251911778899",
                githubUsername: "marcusv-ai",
            },
        ];
        const defaultDevPass = process.env.DEFAULT_DEV_PASSWORD || "Developer123!";
        const devPassHash = await bcryptjs_1.default.hash(defaultDevPass, salt);
        for (const devData of seedDevelopers) {
            let dev = await userRepo.findOne({ where: { email: devData.email } });
            if (!dev) {
                dev = userRepo.create({
                    orgId: org.id,
                    email: devData.email,
                    name: devData.name,
                    specialty: devData.specialty,
                    department: devData.department,
                    team: devData.team,
                    assignedPmId: pm.id,
                    phoneNumber: devData.phoneNumber,
                    githubUsername: devData.githubUsername,
                    passwordHash: devPassHash,
                    role: User_1.UserRole.DEVELOPER,
                    status: User_1.UserStatus.ACTIVE,
                });
                await userRepo.save(dev);
                console.log(`Developer ${devData.name} (${devData.email}) seeded.`);
            }
            else {
                let changed = false;
                if (!dev.phoneNumber) {
                    dev.phoneNumber = devData.phoneNumber;
                    changed = true;
                }
                if (!dev.assignedPmId) {
                    dev.assignedPmId = pm.id;
                    changed = true;
                }
                if (!dev.department) {
                    dev.department = devData.department;
                    changed = true;
                }
                if (!dev.team) {
                    dev.team = devData.team;
                    changed = true;
                }
                if (changed)
                    await userRepo.save(dev);
            }
        }
    }
    catch (err) {
        console.error("Error during master seeding:", err);
    }
}
data_source_1.AppDataSource.initialize()
    .then(async () => {
    console.log("Database connected successfully.");
    await seedMasterUsers();
    (0, telegramBot_1.startTelegramBot)().catch((err) => console.error("Telegram bot failed to start:", err));
    (0, progressService_1.startProgressScheduler)();
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
})
    .catch((err) => {
    console.error("Error during Data Source initialization:", err);
});
