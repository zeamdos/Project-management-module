import { In, IsNull, MoreThanOrEqual, Not } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Task, TaskStatus } from "../entities/Task";
import { Project } from "../entities/Project";
import { User, UserRole, UserStatus } from "../entities/User";
import { ProgressUpdate } from "../entities/ProgressUpdate";
import { Notification } from "../entities/Notification";
import { NotificationService } from "./NotificationService";
import { AuditService } from "./AuditService";

export type CycleState = "ok" | "due" | "missed";

// One developer's update cycle on one project
export type Cycle = {
  projectId: number;
  projectName: string;
  orgId: number;
  intervalDays: number;
  userId: number;
  userName: string;
  specialty: string | null;
  telegramChatId: string | null;
  lastUpdateAt: Date | null;
  dueAt: Date;
  state: CycleState;
};

const DAY = 86400000;
const LEAD_ROLES = [UserRole.ADMIN, UserRole.MANAGER, UserRole.TEAM_LEAD];
const day = (d: Date) => d.toISOString().slice(0, 10);

export class ProgressService {
  // How long after the due date an update counts as missed (default 24 hours).
  static graceMs(): number {
    const hours = Number(process.env.PROGRESS_GRACE_HOURS ?? 24);
    return (Number.isFinite(hours) ? hours : 24) * 3600000;
  }

  /**
   * One cycle per developer and project where the developer still has unfinished work.
   * The clock starts at the last update, or at the first task given to that developer in the project.
   */
  static async cycles(filter: { orgId?: number; userId?: number } = {}): Promise<Cycle[]> {
    const where: any = { status: Not(TaskStatus.DONE), assigneeId: filter.userId ?? Not(IsNull()) };
    const tasks = await AppDataSource.getRepository(Task).find({ where });
    if (tasks.length === 0) return [];

    const firstTask = new Map<string, Date>();
    for (const t of tasks) {
      const key = `${t.projectId}:${t.assigneeId}`;
      const prev = firstTask.get(key);
      if (!prev || t.createdAt < prev) firstTask.set(key, t.createdAt);
    }

    const projectIds = Array.from(new Set(tasks.map((t) => t.projectId)));
    const userIds = Array.from(new Set(tasks.map((t) => t.assigneeId as number)));

    const projects = await AppDataSource.getRepository(Project).find({ where: { id: In(projectIds) } });
    const users = await AppDataSource.getRepository(User).find({ where: { id: In(userIds) } });
    const updates = await AppDataSource.getRepository(ProgressUpdate).find({
      where: { projectId: In(projectIds), userId: In(userIds) },
      order: { id: "DESC" },
    });

    const lastUpdate = new Map<string, Date>();
    for (const u of updates) {
      const key = `${u.projectId}:${u.userId}`;
      if (!lastUpdate.has(key)) lastUpdate.set(key, u.createdAt);
    }

    const now = Date.now();
    const grace = this.graceMs();
    const out: Cycle[] = [];

    for (const [key, first] of firstTask) {
      const [projectId, userId] = key.split(":").map(Number);
      const project = projects.find((p) => p.id === projectId);
      const user = users.find((u) => u.id === userId);
      if (!project || !user || user.status !== UserStatus.ACTIVE) continue;
      if (filter.orgId !== undefined && project.orgId !== filter.orgId) continue;

      const last = lastUpdate.get(key) ?? null;
      const base = last ?? first;
      const dueAt = new Date(base.getTime() + project.updateIntervalDays * DAY);
      const state: CycleState = now < dueAt.getTime() ? "ok" : now < dueAt.getTime() + grace ? "due" : "missed";

      out.push({
        projectId,
        projectName: project.name,
        orgId: project.orgId,
        intervalDays: project.updateIntervalDays,
        userId,
        userName: user.name,
        specialty: user.specialty,
        telegramChatId: user.telegramChatId,
        lastUpdateAt: last,
        dueAt,
        state,
      });
    }
    return out;
  }

  static async leads(orgId: number): Promise<User[]> {
    return AppDataSource.getRepository(User).find({
      where: { orgId, role: In(LEAD_ROLES), status: UserStatus.ACTIVE },
    });
  }

  static async tellLeads(orgId: number, text: string, exceptUserId?: number, kind: "BLOCKER" | "PROGRESS" | "DEADLINE" = "PROGRESS"): Promise<void> {
    await NotificationService.notifyLeads(orgId, text, kind, exceptUserId, kind === "BLOCKER");
  }

  static async raiseBlocker(userId: number, taskId: number, description: string): Promise<{ error?: string; status?: number; task?: Task }> {
    const text = description.trim();
    if (!text) return { error: "Say briefly what is blocking you.", status: 400 };

    const user = await AppDataSource.getRepository(User).findOne({ where: { id: userId } });
    if (!user) return { error: "User not found", status: 404 };

    const taskRepo = AppDataSource.getRepository(Task);
    const task = await taskRepo.findOne({ where: { id: taskId }, relations: ["project"] });
    if (!task || !task.project || task.project.orgId !== user.orgId) return { error: "Task not found", status: 404 };
    if (task.assigneeId !== user.id) return { error: "This task is not assigned to you", status: 403 };
    if (task.status === TaskStatus.DONE) return { error: "This task is already done.", status: 400 };

    await taskRepo.update(task.id, { status: TaskStatus.BLOCKED });

    const repo = AppDataSource.getRepository(ProgressUpdate);
    await repo.save(
      repo.create({
        projectId: task.projectId,
        project: { id: task.projectId } as Project,
        userId: user.id,
        user: { id: user.id } as User,
        workDone: `Blocked on "${task.title}" (TASK-${task.id})`,
        nextSteps: "Waiting for help",
        blockers: text,
        confidence: 1,
      })
    );

    await AuditService.log(user.orgId, user.id, "BLOCKER", "Task", task.id, `${user.name} is blocked: ${text}`);
    await NotificationService.notifyLeads(
      user.orgId,
      `Blocked: ${user.name} is stuck on "${task.title}" (TASK-${task.id}) in ${task.project.name}.\n${text}`,
      "BLOCKER",
      user.id,
      true
    );

    return { task };
  }
}

// The same text is never sent twice to the same person in the same cycle.
async function alreadySent(userId: number, text: string, since: Date): Promise<boolean> {
  const found = await AppDataSource.getRepository(Notification).findOne({
    where: { userId, message: text, createdAt: MoreThanOrEqual(since) },
  });
  return !!found;
}

async function checkProgress(): Promise<void> {
  const cycles = await ProgressService.cycles();
  const leadsByOrg = new Map<number, User[]>();

  for (const c of cycles) {
    if (c.state === "ok") continue;

    const userRepo = AppDataSource.getRepository(User);
    const developer = await userRepo.findOne({ where: { id: c.userId } });
    if (developer) {
      const text = `Time for your progress update on "${c.projectName}". Open your dashboard and post what you did, what is next, and any blockers.`;
      if (!(await alreadySent(c.userId, text, c.dueAt))) {
        try {
          await NotificationService.notifyUser(developer, text, "PROGRESS");
        } catch (err: any) {
          console.error("Could not send the update reminder:", err?.message || err);
        }
      }
    }

    if (c.state === "missed") {
      const text = `${c.userName} has not posted a progress update on "${c.projectName}". It was due ${day(c.dueAt)}.`;
      if (!leadsByOrg.has(c.orgId)) leadsByOrg.set(c.orgId, await ProgressService.leads(c.orgId));
      for (const lead of leadsByOrg.get(c.orgId)!) {
        if (lead.id === c.userId) continue;
        if (await alreadySent(lead.id, text, c.dueAt)) continue;
        try {
          await NotificationService.notifyUser(lead, text, "DEADLINE");
        } catch (err: any) {
          console.error("Could not send the missed-update alert:", err?.message || err);
        }
      }
    }
  }
}

// Checks every hour (set PROGRESS_CHECK_MINUTES in .env to change it, for example 1 while testing).
export function startProgressScheduler(): void {
  const minutes = Math.max(1, Number(process.env.PROGRESS_CHECK_MINUTES ?? 60) || 60);
  const run = async () => {
    try {
      await checkProgress();
    } catch (err) {
      console.error("Progress check failed:", err);
    }
  };
  setTimeout(run, 30 * 1000);
  setInterval(run, minutes * 60 * 1000);
  console.log(`Progress check runs every ${minutes} minute(s).`);
}