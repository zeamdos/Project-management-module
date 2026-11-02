import { Response } from "express";
import { In, IsNull } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { AuthRequest } from "../middleware/auth";
import { User, UserRole } from "../entities/User";
import { Task, TaskStatus } from "../entities/Task";
import { GitActivity } from "../entities/GitActivity";
import { Notification, NotificationChannel } from "../entities/Notification";
import { NotificationService } from "../services/NotificationService";
import { AuditService } from "../services/AuditService";
import { createLinkCode } from "../services/telegramBot";

// Statuses a developer can set. DONE is not on the list: your task rules require an
// approved review before DONE, so a developer finishes work by choosing IN_REVIEW.
const DEV_STATUSES: TaskStatus[] = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW, TaskStatus.BLOCKED];

const pretty = (s: string) => s.replace(/_/g, " ").toLowerCase();

export class DeveloperController {
  // GET /api/me
  static async me(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = await AppDataSource.getRepository(User).findOne({ where: { id: req.user!.id } });
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        orgId: user.orgId,
        specialty: user.specialty,
        githubUsername: user.githubUsername,
        phoneNumber: user.phoneNumber,
        telegramLinked: !!user.telegramChatId,
        notifyInApp: user.notifyInApp !== false,
        notifyTelegram: user.notifyTelegram !== false,
        notifyEmail: user.notifyEmail !== false,
        quietHoursStart: user.quietHoursStart,
        quietHoursEnd: user.quietHoursEnd,
      });
    } catch (error: any) {
      console.error("me error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/me/tasks
  static async tasks(req: AuthRequest, res: Response): Promise<void> {
    try {
      const rows = await AppDataSource.getRepository(Task).find({
        where: { assigneeId: req.user!.id },
        relations: ["project", "project.repositories", "reviews", "reviews.reviewer"],
        order: { id: "DESC" },
      });

      // The whole team's work on the same projects, so every developer can see what is going on
      const projectIds = Array.from(new Set(rows.map((t) => t.projectId)));
      let board: any[] = [];
      if (projectIds.length > 0) {
        const everyTask = await AppDataSource.getRepository(Task).find({
          where: { projectId: In(projectIds) },
          relations: ["assignee", "team"],
          order: { id: "ASC" },
        });
        board = projectIds.map((pid) => {
          const mine = rows.find((r) => r.projectId === pid);
          return {
            projectId: pid,
            projectName: mine?.project?.name ?? null,
            deadline: mine?.project?.deadline ?? null,
            repoUrl: mine?.project?.repositories?.[0]?.url ?? null,
            tasks: everyTask
              .filter((t) => t.projectId === pid)
              .map((t) => ({
                id: t.id,
                title: t.title,
                team: t.team?.name ?? pretty(t.requiredRole),
                status: t.status,
                deadline: t.deadline,
                assigneeName: t.assignee?.name ?? null,
                isMine: t.assigneeId === req.user!.id,
              })),
          };
        });
      }

      res.json({
        statusOptions: DEV_STATUSES,
        board,
        tasks: rows.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description ?? "",
          status: t.status,
          deadline: t.deadline,
          role: t.requiredRole,
          projectId: t.projectId,
          projectName: t.project?.name ?? null,
          repoUrl: t.project?.repositories?.[0]?.url ?? null,
          lastReview: (() => {
            const r = (t.reviews || []).slice().sort((a, b) => b.id - a.id)[0];
            return r ? { decision: r.status, comments: r.comments, reviewer: r.reviewer?.name ?? null, at: r.createdAt } : null;
          })(),
        })),
      });
    } catch (error: any) {
      console.error("tasks error:", error);
      res.status(500).json({ error: `Could not load tasks: ${error.message}` });
    }
  }

  // GET /api/me/commits
  static async commits(req: AuthRequest, res: Response): Promise<void> {
    try {
      const rows = await AppDataSource.getRepository(GitActivity).find({
        where: { userId: req.user!.id },
        order: { createdAt: "DESC" },
        take: 30,
      });
      res.json({
        commits: rows.map((r) => ({
          id: r.id,
          type: r.activityType,
          hash: (r.externalId || "").slice(0, 7),
          message: r.message,
          url: r.url,
          taskId: r.taskId,
          createdAt: r.createdAt,
        })),
      });
    } catch (error: any) {
      console.error("commits error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  static async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.findOne({ where: { id: req.user!.id } });
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const { name, phoneNumber, githubUsername, notifyInApp, notifyTelegram, notifyEmail, quietHoursStart, quietHoursEnd } = req.body;

      if (name !== undefined) {
        const trimmed = String(name).trim();
        if (!trimmed) {
          res.status(400).json({ error: "Name cannot be empty." });
          return;
        }
        user.name = trimmed;
      }
      if (phoneNumber !== undefined) {
        const phone = String(phoneNumber).trim();
        if (phone && !/^\+[1-9]\d{7,14}$/.test(phone)) {
          res.status(400).json({ error: "Phone must be in E.164 format, for example +251911000000." });
          return;
        }
        user.phoneNumber = phone || null;
      }
      if (githubUsername !== undefined) {
        const raw = String(githubUsername).trim().replace(/^@/, "");
        const match = raw.match(/github\.com\/([^/?#\s]+)/i);
        user.githubUsername = (match ? match[1] : raw) || null;
      }
      if (notifyInApp !== undefined) user.notifyInApp = Boolean(notifyInApp);
      if (notifyTelegram !== undefined) user.notifyTelegram = Boolean(notifyTelegram);
      if (notifyEmail !== undefined) user.notifyEmail = Boolean(notifyEmail);

      const hhmm = (v: unknown) => {
        const s = String(v || "").trim();
        if (!s) return null;
        return /^\d{2}:\d{2}$/.test(s) ? s : "__invalid__";
      };
      if (quietHoursStart !== undefined) {
        const v = hhmm(quietHoursStart);
        if (v === "__invalid__") {
          res.status(400).json({ error: "Quiet hours must look like 20:00." });
          return;
        }
        user.quietHoursStart = v;
      }
      if (quietHoursEnd !== undefined) {
        const v = hhmm(quietHoursEnd);
        if (v === "__invalid__") {
          res.status(400).json({ error: "Quiet hours must look like 08:00." });
          return;
        }
        user.quietHoursEnd = v;
      }

      await userRepo.save(user);
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        orgId: user.orgId,
        specialty: user.specialty,
        githubUsername: user.githubUsername,
        phoneNumber: user.phoneNumber,
        telegramLinked: !!user.telegramChatId,
        notifyInApp: user.notifyInApp !== false,
        notifyTelegram: user.notifyTelegram !== false,
        notifyEmail: user.notifyEmail !== false,
        quietHoursStart: user.quietHoursStart,
        quietHoursEnd: user.quietHoursEnd,
      });
    } catch (error: any) {
      console.error("updateProfile error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  static async notifications(req: AuthRequest, res: Response): Promise<void> {
    try {
      const rows = await AppDataSource.getRepository(Notification).find({
        where: { userId: req.user!.id, channel: NotificationChannel.IN_APP },
        order: { id: "DESC" },
        take: 50,
      });
      res.json({
        unread: rows.filter((n) => !n.readAt).length,
        notifications: rows.map((n) => ({
          id: n.id,
          kind: n.kind,
          message: n.message,
          readAt: n.readAt,
          createdAt: n.createdAt,
        })),
      });
    } catch (error: any) {
      console.error("notifications error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  static async readNotification(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const repo = AppDataSource.getRepository(Notification);
      const row = await repo.findOne({ where: { id, userId: req.user!.id, channel: NotificationChannel.IN_APP } });
      if (!row) {
        res.status(404).json({ error: "Notification not found" });
        return;
      }
      row.readAt = new Date();
      await repo.save(row);
      res.json({ message: "Read" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async readAllNotifications(req: AuthRequest, res: Response): Promise<void> {
    try {
      await AppDataSource.getRepository(Notification).update(
        { userId: req.user!.id, channel: NotificationChannel.IN_APP, readAt: IsNull() },
        { readAt: new Date() }
      );
      res.json({ message: "All read" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // POST /api/me/telegram-link
  static async telegramLink(req: AuthRequest, res: Response): Promise<void> {
    const code = createLinkCode(req.user!.id);
    const username = process.env.TELEGRAM_BOT_USERNAME || "pro_managemnt_bot";
    res.json({ url: `https://t.me/${username}?start=${code}`, expiresInMinutes: 10 });
  }

  // POST /api/me/tasks/:id/update   body: { status, note }
  static async updateTask(req: AuthRequest, res: Response): Promise<void> {
    try {
      const taskId = Number(req.params.id);
      const { status, note } = req.body as { status?: string; note?: string };

      const taskRepo = AppDataSource.getRepository(Task);
      const task = await taskRepo.findOne({ where: { id: taskId }, relations: ["project"] });
      if (!task) {
        res.status(404).json({ error: "Task not found" });
        return;
      }
      if (task.assigneeId !== req.user!.id) {
        res.status(403).json({ error: "This task is not assigned to you" });
        return;
      }

      const oldStatus = task.status;
      const changing = !!status && status !== oldStatus;

      if (changing) {
        if (status === TaskStatus.DONE) {
          res.status(400).json({ error: "Choose \"In review\" when your work is finished. Your PM approves it to Done." });
          return;
        }
        if (!DEV_STATUSES.includes(status as TaskStatus)) {
          res.status(400).json({ error: `Status must be one of: ${DEV_STATUSES.join(", ")}` });
          return;
        }
        await taskRepo.update(taskId, { status: status as TaskStatus });
      }
      const newStatus = changing ? (status as TaskStatus) : oldStatus;

      const userRepo = AppDataSource.getRepository(User);
      const dev = await userRepo.findOne({ where: { id: req.user!.id } });
      if (!dev) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const text =
        `${dev.name}${dev.specialty ? ` (${dev.specialty})` : ""} updated "${task.title}" (TASK-${task.id})` +
        `${task.project?.name ? ` in ${task.project.name}` : ""}\n` +
        `Status: ${pretty(oldStatus)} -> ${pretty(newStatus)}` +
        (note && note.trim() ? `\nNote: ${note.trim()}` : "");

      const leadRoles = [UserRole.ADMIN, UserRole.MANAGER, UserRole.TEAM_LEAD];
      const people = await userRepo.find({ where: { orgId: dev.orgId } });
      const recipients = people.filter(
        (p) => p.id !== dev.id && (leadRoles.includes(p.role) || (!!dev.specialty && p.specialty === dev.specialty))
      );

      const kind = newStatus === TaskStatus.IN_REVIEW ? "REVIEW_PENDING" : newStatus === TaskStatus.BLOCKED ? "BLOCKER" : "PROGRESS";
      await Promise.allSettled(recipients.map((r) => NotificationService.notifyUser(r, text, kind, kind === "BLOCKER")));

      await AuditService.log(dev.orgId, dev.id, "TASK_UPDATE", "Task", taskId, text);

      res.json({ message: "Update sent", status: newStatus, notified: recipients.length });
    } catch (error: any) {
      console.error("updateTask error:", error);
      res.status(500).json({ error: error.message });
    }
  }
}