import dotenv from "dotenv";
import path from "path";

// Load .env from the project root (one level above backend/)
// Try backend/.env first; if it doesn't exist, load from ../  (the project root)
import fs from "fs";
const localEnv = path.resolve(process.cwd(), ".env");
const rootEnv = path.resolve(__dirname, "../../..", ".env"); // src -> backend -> project root
const parentEnv = path.resolve(process.cwd(), "..", ".env");

if (fs.existsSync(localEnv)) {
  dotenv.config({ path: localEnv });
} else if (fs.existsSync(parentEnv)) {
  dotenv.config({ path: parentEnv });
} else if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv });
} else {
  dotenv.config(); // fallback
}
console.log("[ENV] Loaded from:", fs.existsSync(localEnv) ? localEnv : fs.existsSync(parentEnv) ? parentEnv : fs.existsSync(rootEnv) ? rootEnv : "default");
import "reflect-metadata";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import { AppDataSource } from "./config/data-source";
import { AuthController } from "./controllers/authController";
import { ProjectController } from "./controllers/projectController";
import { TaskController } from "./controllers/taskController";
import { SuggestAssigneeController } from "./controllers/suggestAssigneeController";
import { WebhookController } from "./controllers/webhookController";
import { DashboardController } from "./controllers/dashboardController";
import { DeveloperController } from "./controllers/developerController";
import { WorkflowController } from "./controllers/workflowController";
import { ProgressController } from "./controllers/progressController";
import { AdminController } from "./controllers/adminController";
import { PlannerController } from "./controllers/plannerController";
import { AuditController } from "./controllers/auditController";
import { authenticate, requireRole } from "./middleware/auth";
import { User, UserRole, UserStatus } from "./entities/User";
import { Organization } from "./entities/Organization";
import { startTelegramBot } from "./services/telegramBot";
import { startProgressScheduler } from "./services/progressService";

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("FATAL: JWT_SECRET must be defined in production.");
}

const isProd = process.env.NODE_ENV === "production";

const app = express();
app.use(helmet());
app.use(
  cors({
    origin: "*", // Allow all origins for development
    credentials: true,
  })
);
// Keep the raw body too: GitHub signs the raw bytes, and webhookController checks that signature.
app.use(express.json({ verify: (req, _res, buf) => { (req as any).rawBody = buf; } }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 100 : 1000,
  message: { error: "Too many requests, please try again later." },
});
app.use(limiter);

// Only failed sign-in attempts count, so normal use never trips this.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 10 : 100,
  skipSuccessfulRequests: true,
  message: { error: "Too many failed attempts, please try again in a few minutes." },
});

// Auth Routes
app.post("/api/auth/register", authLimiter, AuthController.register);
app.post("/api/auth/login", authLimiter, AuthController.login);

// Webhook Route (No JWT auth, signature verified)
app.post("/api/webhooks/github", WebhookController.handleGitHub);

// Developer dashboard routes (any signed-in user)
app.get("/api/me", authenticate, DeveloperController.me);
app.patch("/api/me", authenticate, DeveloperController.updateProfile);
app.post("/api/me/change-password", authenticate, AdminController.changePassword);
app.get("/api/me/notifications", authenticate, DeveloperController.notifications);
app.post("/api/me/notifications/read-all", authenticate, DeveloperController.readAllNotifications);
app.post("/api/me/notifications/:id/read", authenticate, DeveloperController.readNotification);
app.get("/api/me/tasks", authenticate, DeveloperController.tasks);
app.get("/api/me/commits", authenticate, DeveloperController.commits);
app.post("/api/me/commits", authenticate, DeveloperController.logCommit);
app.post("/api/me/telegram-link", authenticate, DeveloperController.telegramLink);
app.post("/api/me/tasks/:id/update", authenticate, DeveloperController.updateTask);
app.get("/api/insights", authenticate, DashboardController.insights);

// Admin-only User Management (Closed Provisioning — no public signup)
app.get("/api/admin/users", authenticate, requireRole(UserRole.ADMIN), AdminController.listUsers);
app.post("/api/admin/users", authenticate, requireRole(UserRole.ADMIN), AdminController.createUser);
app.patch("/api/admin/users/:id", authenticate, requireRole(UserRole.ADMIN), AdminController.updateUser);
app.post("/api/admin/users/:id/reset-password", authenticate, requireRole(UserRole.ADMIN), AdminController.resetPassword);
app.delete("/api/admin/users/:id", authenticate, requireRole(UserRole.ADMIN), AdminController.deactivateUser);

// Project Routes (Org-scoped & RBAC)
app.post("/api/projects", authenticate, requireRole(UserRole.ADMIN, UserRole.MANAGER), ProjectController.create);
app.get("/api/projects", authenticate, ProjectController.list);
app.get("/api/projects/:id", authenticate, ProjectController.getById);
app.put("/api/projects/:id", authenticate, requireRole(UserRole.ADMIN, UserRole.MANAGER), ProjectController.update);
app.delete("/api/projects/:id", authenticate, requireRole(UserRole.ADMIN, UserRole.MANAGER), ProjectController.delete);

// Task Routes
app.post("/api/tasks", authenticate, requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.TEAM_LEAD), TaskController.create);
app.get("/api/tasks", authenticate, TaskController.list);
app.patch("/api/tasks/:id", authenticate, TaskController.update);
app.patch("/api/tasks/:id/status", authenticate, TaskController.updateStatus);

// Review and reassignment (the controller checks who may review which task)
app.get("/api/reviews/pending", authenticate, WorkflowController.pendingReviews);
app.post("/api/tasks/:id/review", authenticate, WorkflowController.submitReview);
app.get("/api/developers", authenticate, requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.TEAM_LEAD), WorkflowController.developers);
app.patch("/api/tasks/:id/assign", authenticate, requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.TEAM_LEAD), WorkflowController.assign);

// Progress updates, blockers and the manager overview
app.get("/api/me/progress", authenticate, ProgressController.mine);
app.post("/api/me/progress", authenticate, ProgressController.submit);
app.post("/api/me/tasks/:id/blocker", authenticate, ProgressController.blocker);
app.get("/api/progress/overview", authenticate, requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.TEAM_LEAD), ProgressController.overview);

// Suggest Assignee Route
app.get("/api/tasks/:taskId/suggest-assignee", authenticate, requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.TEAM_LEAD), SuggestAssigneeController.suggest);

// Dashboard Routes
app.get("/api/projects/:projectId/health", authenticate, DashboardController.getProjectHealth);

// Planner Routes
app.get("/api/planner", authenticate, PlannerController.getEvents);
app.post("/api/planner", authenticate, PlannerController.addEvent);

// Audit Routes
app.get("/api/admin/audit", authenticate, requireRole(UserRole.ADMIN), AuditController.getAuditLogs);

const PORT = process.env.PORT || 3000;

// Database seeder: auto-create Admin, PM, and Developers on boot with complete details
async function seedMasterUsers() {
  try {
    const userRepo = AppDataSource.getRepository(User);
    const orgRepo = AppDataSource.getRepository(Organization);

    let org = await orgRepo.findOne({ where: { name: "Enterprise HQ" } });
    if (!org) {
      org = orgRepo.create({ name: "Enterprise HQ" });
      await orgRepo.save(org);
    }

    const salt = await bcrypt.genSalt(12);

    // 1. Seed Admin
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@enterprise.com").toLowerCase().trim();
    const adminPass = process.env.ADMIN_PASSWORD || "supersecureadminpass";
    let admin = await userRepo.findOne({ where: { email: adminEmail } });

    if (!admin) {
      const passwordHash = await bcrypt.hash(adminPass, salt);
      admin = userRepo.create({
        orgId: org.id,
        email: adminEmail,
        passwordHash,
        name: "Master Admin",
        role: UserRole.ADMIN,
        department: "Executive Leadership",
        team: "Executive",
        phoneNumber: "+251911000000",
        status: UserStatus.ACTIVE,
      });
      await userRepo.save(admin);
      console.log("Master Admin seeded successfully.");
    } else {
      if (!admin.phoneNumber) admin.phoneNumber = "+251911000000";
      if (!admin.department) admin.department = "Executive Leadership";
      if (!admin.team) admin.team = "Executive";
      await userRepo.save(admin);
    }

    // 2. Seed Project Manager
    const pmEmail = (process.env.PM_EMAIL || "pm@enterprise.com").toLowerCase().trim();
    const pmPass = process.env.PM_PASSWORD || "supersecurepmepass";
    let pm = await userRepo.findOne({ where: { email: pmEmail } });

    if (!pm) {
      const passwordHash = await bcrypt.hash(pmPass, salt);
      pm = userRepo.create({
        orgId: org.id,
        email: pmEmail,
        passwordHash,
        name: "Project Manager",
        role: UserRole.MANAGER,
        department: "Engineering Management",
        team: "Core Delivery",
        phoneNumber: "+251911223344",
        status: UserStatus.ACTIVE,
      });
      await userRepo.save(pm);
      console.log("Project Manager seeded successfully.");
    } else {
      if (!pm.phoneNumber) pm.phoneNumber = "+251911223344";
      if (!pm.department) pm.department = "Engineering Management";
      if (!pm.team) pm.team = "Core Delivery";
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
    const devPassHash = await bcrypt.hash(defaultDevPass, salt);

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
          role: UserRole.DEVELOPER,
          status: UserStatus.ACTIVE,
        });
        await userRepo.save(dev);
        console.log(`Developer ${devData.name} (${devData.email}) seeded.`);
      } else {
        let changed = false;
        if (!dev.phoneNumber) { dev.phoneNumber = devData.phoneNumber; changed = true; }
        if (!dev.assignedPmId) { dev.assignedPmId = pm.id; changed = true; }
        if (!dev.department) { dev.department = devData.department; changed = true; }
        if (!dev.team) { dev.team = devData.team; changed = true; }
        if (changed) await userRepo.save(dev);
      }
    }
  } catch (err) {
    console.error("Error during master seeding:", err);
  }
}

AppDataSource.initialize()
  .then(async () => {
    console.log("Database connected successfully.");

    await seedMasterUsers();
    startTelegramBot().catch((err) => console.error("Telegram bot failed to start:", err));
    startProgressScheduler();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error during Data Source initialization:", err);
  });
