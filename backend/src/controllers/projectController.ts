import crypto from "crypto";
import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { AppDataSource } from "../config/data-source";
import { Project } from "../entities/Project";
import { Repository } from "../entities/Repository";
import { AITaskService } from "../services/aiTaskService";
import { AuditService } from "../services/AuditService";

// Use the project's encrypt() if one exists, otherwise store the secret as it is
// (webhookController does the same with decrypt()).
let encrypt: (value: string) => string = (value) => value;
for (const file of ["../config/encryption", "../config/Encryption"]) {
  try {
    const mod = require(file);
    if (typeof mod.encrypt === "function") {
      encrypt = mod.encrypt;
      break;
    }
  } catch {
    /* that file is not there, try the next name */
  }
}

const COMPANY_GITHUB = (process.env.COMPANY_GITHUB_URL || "https://github.com/zeamdos").replace(/\/+$/, "");

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "project";

// "2026-11-20" means the end of that day
function parseDeadline(value: unknown): { error?: string; date: Date | null } {
  if (value === undefined || value === null || value === "") return { date: null };
  const text = String(value).trim();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(text) ? new Date(`${text}T23:59:59`) : new Date(text);
  if (isNaN(date.getTime())) return { error: "The deadline is not a valid date.", date: null };
  if (date.getTime() <= Date.now()) return { error: "The deadline must be in the future.", date: null };
  return { date };
}

function normalizeRepoUrl(value: string): string | null {
  const cleaned = value.trim().replace(/\/+$/, "").replace(/\.git$/i, "");
  return /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/i.test(cleaned) ? cleaned : null;
}

// Only send what the dashboard needs about an assignee (no email, phone or Telegram ID).
function withSafeAssignees(project: Project) {
  return {
    ...project,
    tasks: (project.tasks || []).map((t) => ({
      ...t,
      assignee: t.assignee ? { id: t.assignee.id, name: t.assignee.name, specialty: t.assignee.specialty } : null,
    })),
  };
}

export class ProjectController {
  private static canManageProjects(role?: string): boolean {
    return ["ADMIN", "MANAGER", "PROJECT_MANAGER"].includes(String(role ?? ""));
  }

  static async create(req: AuthRequest, res: Response): Promise<void> {
    let createdProjectId: number | null = null;
    try {
      const user = req.user;
      if (!user || !ProjectController.canManageProjects(user.role as string)) {
        res.status(403).json({ error: "Access denied. Only Admins and Project Managers can create projects." });
        return;
      }

      const orgId = user.orgId;
      const { name, description, updateIntervalDays, deadline, requirements, repoUrl } = req.body;

      if (!name || !description) {
        res.status(400).json({ error: "Project name and description are required." });
        return;
      }

      const parsed = parseDeadline(deadline);
      if (parsed.error) {
        res.status(400).json({ error: parsed.error });
        return;
      }

      const projectRepo = AppDataSource.getRepository(Project);
      const repoRepo = AppDataSource.getRepository(Repository);

      // Repository link given by the PM: check it before saving anything
      let chosenRepo: string | null = null;
      if (repoUrl && String(repoUrl).trim()) {
        chosenRepo = normalizeRepoUrl(String(repoUrl));
        if (!chosenRepo) {
          res.status(400).json({ error: "The repository link must look like https://github.com/owner/repository." });
          return;
        }
        if (await repoRepo.findOne({ where: { url: chosenRepo } })) {
          res.status(400).json({ error: "That repository is already used by another project." });
          return;
        }
      }

      const project = projectRepo.create({
        orgId,
        name,
        description,
        updateIntervalDays: Number(updateIntervalDays) === 3 ? 3 : 7,
        deadline: parsed.date,
        requirements: requirements && String(requirements).trim() ? String(requirements).trim() : null,
      });
      await projectRepo.save(project);
      createdProjectId = project.id;

      // No link from the PM: suggest one under the company GitHub
      let suggested = false;
      if (!chosenRepo) {
        suggested = true;
        let candidate = `${COMPANY_GITHUB}/${slugify(name)}`;
        if (await repoRepo.findOne({ where: { url: candidate } })) candidate = `${candidate}-${project.id}`;
        chosenRepo = candidate;
      }

      const secret = crypto.randomBytes(20).toString("hex");
      await repoRepo.save(repoRepo.create({ projectId: project.id, url: chosenRepo, webhookSecret: encrypt(secret) }));

      // Split into tasks, create teams with deadlines, assign and notify
      const assignedTasks = await AITaskService.processAndAssignProject(project.id, description, orgId, {
        name,
        deadline: parsed.date,
        requirements: project.requirements,
        repoUrl: chosenRepo,
      });

      await AuditService.log(
        orgId,
        user.id,
        "CREATE_WITH_AI",
        "Project",
        project.id,
        `Created project ${name} and auto-generated ${assignedTasks.length} AI tasks`
      );

      const publicBase = (process.env.BACKEND_PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/+$/, "");

      res.status(201).json({
        message: "Project created and successfully processed by AI engine!",
        project,
        tasks: assignedTasks.map((t) => ({
          id: t.id,
          title: t.title,
          requiredRole: t.requiredRole,
          status: t.status,
          deadline: t.deadline,
          assigneeId: t.assigneeId,
        })),
        repo: { url: chosenRepo, suggested },
        // The secret is shown only now. It cannot be read again later.
        webhook: {
          url: `${publicBase}/api/webhooks/github`,
          contentType: "application/json",
          secret,
          events: ["push", "pull_request"],
        },
      });
    } catch (error: any) {
      console.error("Project create error:", error);
      // Do not leave a half-made project behind
      if (createdProjectId !== null) {
        await AppDataSource.getRepository(Project)
          .delete(createdProjectId)
          .catch(() => undefined);
      }
      res.status(500).json({ error: error.message });
    }
  }

  static async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const orgId = req.user!.orgId;
      const page = parseInt((req.query.page as string) || "1", 10);
      const limit = parseInt((req.query.limit as string) || "10", 10);
      const skip = (page - 1) * limit;

      const projectRepo = AppDataSource.getRepository(Project);
      const [projects, total] = await projectRepo.findAndCount({
        where: { orgId },
        skip,
        take: limit,
        order: { createdAt: "DESC" },
        relations: ["tasks", "tasks.assignee", "repositories"],
      });

      res.json({
        data: projects.map(withSafeAssignees),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } catch (error: any) {
      console.error("Project list error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const orgId = req.user!.orgId;
      const projectId = parseInt(req.params.id, 10);

      const projectRepo = AppDataSource.getRepository(Project);
      const project = await projectRepo.findOne({
        where: { id: projectId, orgId },
        relations: ["teams", "milestones", "repositories", "policies", "tasks", "tasks.assignee"],
      });

      if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
      }

      res.json(withSafeAssignees(project));
    } catch (error: any) {
      console.error("Project getById error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user || !ProjectController.canManageProjects(user.role as string)) {
        res.status(403).json({ error: "Access denied." });
        return;
      }

      const orgId = user.orgId;
      const projectId = parseInt(req.params.id, 10);
      const { name, description, updateIntervalDays } = req.body;

      const projectRepo = AppDataSource.getRepository(Project);
      const project = await projectRepo.findOne({ where: { id: projectId, orgId } });

      if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
      }

      if (name) project.name = name;
      if (description) project.description = description;
      if (updateIntervalDays) project.updateIntervalDays = updateIntervalDays;

      await projectRepo.save(project);
      await AuditService.log(orgId, user.id, "UPDATE", "Project", project.id, `Updated project ${project.id}`);

      res.json(project);
    } catch (error: any) {
      console.error("Project update error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  static async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user || String(user.role) !== "ADMIN") {
        res.status(403).json({ error: "Access denied. Only Admins can delete projects." });
        return;
      }

      const orgId = user.orgId;
      const projectId = parseInt(req.params.id, 10);

      const projectRepo = AppDataSource.getRepository(Project);
      const project = await projectRepo.findOne({ where: { id: projectId, orgId } });

      if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
      }

      await projectRepo.remove(project);
      await AuditService.log(orgId, user.id, "DELETE", "Project", projectId, `Deleted project ${projectId}`);

      res.json({ message: "Project deleted successfully" });
    } catch (error: any) {
      console.error("Project delete error:", error);
      res.status(500).json({ error: error.message });
    }
  }
}