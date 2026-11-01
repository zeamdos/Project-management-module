import "dotenv/config"; // must be first so every other file sees the .env values
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
import { DeveloperController } from "./controllers/developercontroller";
import { authenticate, requireRole } from "./middleware/auth";
import { User, UserRole, UserStatus } from "./entities/User";
import { Organization } from "./entities/Organization";
import { startTelegramBot } from "./services/telegramBot";

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("FATAL: JWT_SECRET must be defined in production.");
}

const isProd = process.env.NODE_ENV === "production";

const app = express();
app.use(helmet());
app.use(cors());
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
app.get("/api/me/tasks", authenticate, DeveloperController.tasks);
app.get("/api/me/commits", authenticate, DeveloperController.commits);
app.post("/api/me/telegram-link", authenticate, DeveloperController.telegramLink);
app.post("/api/me/tasks/:id/update", authenticate, DeveloperController.updateTask);

// Project Routes (Org-scoped & RBAC)
app.post("/api/projects", authenticate, requireRole(UserRole.ADMIN, UserRole.MANAGER), ProjectController.create);
app.get("/api/projects", authenticate, ProjectController.list);
app.get("/api/projects/:id", authenticate, ProjectController.getById);
app.put("/api/projects/:id", authenticate, requireRole(UserRole.ADMIN, UserRole.MANAGER), ProjectController.update);
app.delete("/api/projects/:id", authenticate, requireRole(UserRole.ADMIN, UserRole.MANAGER), ProjectController.delete);

// Task Routes
app.post("/api/tasks", authenticate, requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.TEAM_LEAD), TaskController.create);
app.patch("/api/tasks/:id/status", authenticate, TaskController.updateStatus);

// Suggest Assignee Route
app.get("/api/tasks/:taskId/suggest-assignee", authenticate, requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.TEAM_LEAD), SuggestAssigneeController.suggest);

// Dashboard Routes
app.get("/api/projects/:projectId/health", authenticate, DashboardController.getProjectHealth);

const PORT = process.env.PORT || 3000;

// Database seeder: auto-create Admin & PM accounts from .env on boot
async function seedMasterUsers() {
  try {
    const userRepo = AppDataSource.getRepository(User);
    const orgRepo = AppDataSource.getRepository(Organization);

    let org = await orgRepo.findOne({ where: { name: "Enterprise HQ" } });
    if (!org) {
      org = orgRepo.create({ name: "Enterprise HQ" });
      await orgRepo.save(org);
    }

    const salt = await bcrypt.genSalt(10);

    // 1. Seed Admin
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@enterprise.com").toLowerCase().trim();
    const adminPass = process.env.ADMIN_PASSWORD || "supersecureadminpass";
    const existingAdmin = await userRepo.findOne({ where: { email: adminEmail } });

    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash(adminPass, salt);
      const admin = userRepo.create({
        orgId: org.id,
        email: adminEmail,
        passwordHash,
        name: "Master Admin",
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      });
      await userRepo.save(admin);
      console.log("Master Admin seeded successfully.");
    }

    // 2. Seed Project Manager
    const pmEmail = (process.env.PM_EMAIL || "pm@enterprise.com").toLowerCase().trim();
    const pmPass = process.env.PM_PASSWORD || "supersecurepmepass";
    const existingPm = await userRepo.findOne({ where: { email: pmEmail } });

    if (!existingPm) {
      const passwordHash = await bcrypt.hash(pmPass, salt);
      const pm = userRepo.create({
        orgId: org.id,
        email: pmEmail,
        passwordHash,
        name: "Project Manager",
        role: UserRole.MANAGER,
        status: UserStatus.ACTIVE,
      });
      await userRepo.save(pm);
      console.log("Project Manager seeded successfully.");
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

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error during Data Source initialization:", err);
  });