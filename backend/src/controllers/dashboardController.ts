import { Response } from "express";
import { In } from "typeorm";
import { AuthRequest } from "../middleware/auth";
import { AppDataSource } from "../config/data-source";
import { Task, TaskStatus } from "../entities/Task";
import { Project } from "../entities/Project";
import { GitActivity } from "../entities/GitActivity";
import { ProgressUpdate } from "../entities/ProgressUpdate";
import { User, UserRole } from "../entities/User";

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function lastDays(n: number): string[] {
  const out: string[] = [];
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(now.getUTCDate() - i);
    out.push(dayKey(d));
  }
  return out;
}

function counts(tasks: Task[]) {
  return {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === TaskStatus.TODO || t.status === TaskStatus.PENDING).length,
    inProgress: tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length,
    inReview: tasks.filter((t) => t.status === TaskStatus.IN_REVIEW).length,
    blocked: tasks.filter((t) => t.status === TaskStatus.BLOCKED).length,
    done: tasks.filter((t) => t.status === TaskStatus.DONE).length,
  };
}

export class DashboardController {
  static async getProjectHealth(req: AuthRequest, res: Response): Promise<void> {
    const orgId = req.user!.orgId;
    const projectId = parseInt(req.params.projectId, 10);
    const project = await AppDataSource.getRepository(Project).findOne({ where: { id: projectId, orgId } });
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    const tasks = await AppDataSource.getRepository(Task).find({ where: { projectId } });
    const c = counts(tasks);
    res.json({
      projectId,
      totalTasks: c.total,
      tasksByStatus: c,
      completionPercent: c.total ? Math.round((c.done / c.total) * 100) : 0,
    });
  }

  static async insights(req: AuthRequest, res: Response): Promise<void> {
    try {
      const me = req.user!;
      const user = await AppDataSource.getRepository(User).findOne({ where: { id: me.id } });
      const projects = await AppDataSource.getRepository(Project).find({ where: { orgId: me.orgId } });
      const projectIds = projects.map((p) => p.id);
      const tasks = projectIds.length
        ? await AppDataSource.getRepository(Task).find({ where: { projectId: In(projectIds) } })
        : [];

      const company = projects.map((p) => {
        const mine = tasks.filter((t) => t.projectId === p.id);
        const c = counts(mine);
        return {
          id: p.id,
          name: p.name,
          status: p.status,
          deadline: p.deadline,
          ...c,
          percent: c.total ? Math.round((c.done / c.total) * 100) : 0,
        };
      });
      const totals = counts(tasks);

      const days = lastDays(84);
      const git = await AppDataSource.getRepository(GitActivity).find({
        where: { userId: me.id },
        order: { createdAt: "DESC" },
        take: 500,
      });
      const updates = await AppDataSource.getRepository(ProgressUpdate).find({
        where: { userId: me.id },
        order: { createdAt: "DESC" },
        take: 200,
      });
      const heatMap = new Map<string, number>();
      for (const d of days) heatMap.set(d, 0);
      for (const g of git) {
        const k = dayKey(g.createdAt);
        if (heatMap.has(k)) heatMap.set(k, (heatMap.get(k) || 0) + 1);
      }
      for (const u of updates) {
        const k = dayKey(u.createdAt);
        if (heatMap.has(k)) heatMap.set(k, (heatMap.get(k) || 0) + 1);
      }

      const specialty = user?.specialty || null;
      const teamTasks = specialty
        ? tasks.filter((t) => {
            const role = String(t.requiredRole || "").replace("_", "/");
            return role.toLowerCase() === specialty.toLowerCase() || String(t.requiredRole).toLowerCase() === specialty.toLowerCase().replace("/", "_");
          })
        : [];
      const teamCounts = counts(teamTasks);
      const myTasks = tasks.filter((t) => t.assigneeId === me.id);
      const myCounts = counts(myTasks);

      const isLead = [UserRole.ADMIN, UserRole.MANAGER, UserRole.TEAM_LEAD].includes(me.role);

      res.json({
        role: me.role,
        specialty,
        company: {
          totals: { ...totals, percent: totals.total ? Math.round((totals.done / totals.total) * 100) : 0 },
          projects: company,
        },
        team: specialty
          ? { name: specialty, ...teamCounts, percent: teamCounts.total ? Math.round((teamCounts.done / teamCounts.total) * 100) : 0 }
          : null,
        me: { ...myCounts, commits: git.length, updates: updates.length },
        heatmap: days.map((date) => ({ date, count: heatMap.get(date) || 0 })),
        showCompany: isLead,
      });
    } catch (error: any) {
      console.error("insights error:", error);
      res.status(500).json({ error: error.message });
    }
  }
}
