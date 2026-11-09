import { Response } from "express";
import { In } from "typeorm";
import { AuthRequest } from "../middleware/auth";
import { AppDataSource } from "../config/data-source";
import { Task, TaskStatus } from "../entities/Task";
import { Project } from "../entities/Project";
import { User } from "../entities/User";
import { ProgressUpdate } from "../entities/ProgressUpdate";
import { AuditService } from "../services/AuditService";
import { ProgressService } from "../services/progressService";

export class ProgressController {
  // GET /api/me/progress: my update status on each project, and my latest updates
  static async mine(req: AuthRequest, res: Response): Promise<void> {
    try {
      const me = req.user!;
      const cycles = await ProgressService.cycles({ orgId: me.orgId, userId: me.id });

      const updates = await AppDataSource.getRepository(ProgressUpdate).find({
        where: { userId: me.id },
        order: { id: "DESC" },
        take: 5,
      });
      const ids = Array.from(new Set(updates.map((u) => u.projectId)));
      const names = ids.length ? await AppDataSource.getRepository(Project).find({ where: { id: In(ids) } }) : [];

      res.json({
        projects: cycles.map((c) => ({
          projectId: c.projectId,
          projectName: c.projectName,
          intervalDays: c.intervalDays,
          lastUpdateAt: c.lastUpdateAt,
          dueAt: c.dueAt,
          state: c.state,
        })),
        recent: updates.map((u) => ({
          id: u.id,
          projectName: names.find((p) => p.id === u.projectId)?.name ?? null,
          workDone: u.workDone,
          nextSteps: u.nextSteps,
          blockers: u.blockers,
          confidence: u.confidence,
          createdAt: u.createdAt,
        })),
      });
    } catch (error: any) {
      console.error("progress mine error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // POST /api/me/progress   body: { projectId, workDone, nextSteps, blockers, confidence }
  static async submit(req: AuthRequest, res: Response): Promise<void> {
    try {
      const me = req.user!;
      const projectId = Number(req.body.projectId);
      const workDone = String(req.body.workDone || "").trim();
      const nextSteps = String(req.body.nextSteps || "").trim();
      const blockers = String(req.body.blockers || "").trim();
      const confidence = Number(req.body.confidence);

      if (!projectId || !workDone || !nextSteps) {
        res.status(400).json({ error: "Say what you did and what comes next." });
        return;
      }
      if (!Number.isInteger(confidence) || confidence < 1 || confidence > 5) {
        res.status(400).json({ error: "Confidence must be a number from 1 to 5." });
        return;
      }

      const project = await AppDataSource.getRepository(Project).findOne({ where: { id: projectId, orgId: me.orgId } });
      if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
      }
      const myTasks = await AppDataSource.getRepository(Task).count({ where: { projectId, assigneeId: me.id } });
      if (myTasks === 0) {
        res.status(403).json({ error: "You have no task in this project." });
        return;
      }

      // Both the id columns and the relations are set, so the update shows up under the project and the person.
      const repo = AppDataSource.getRepository(ProgressUpdate);
      await repo.save(
        repo.create({
          projectId,
          project: { id: projectId } as Project,
          userId: me.id,
          user: { id: me.id } as User,
          workDone,
          nextSteps,
          blockers: blockers || null,
          confidence,
        })
      );

      const dev = await AppDataSource.getRepository(User).findOne({ where: { id: me.id } });
      await AuditService.log(me.orgId, me.id, "PROGRESS_UPDATE", "Project", projectId, `${dev?.name ?? "A developer"} posted a progress update`);

      // Tell the PM and team leads right away only when something needs attention
      if (blockers || confidence <= 2) {
        await ProgressService.tellLeads(
          me.orgId,
          `${dev?.name ?? "A developer"} posted an update on "${project.name}" that needs attention (confidence ${confidence} of 5).` +
            `${blockers ? `\nBlockers: ${blockers}` : ""}\nNext steps: ${nextSteps}`,
          me.id,
          blockers ? "BLOCKER" : "PROGRESS"
        );
      }

      res.json({ message: "Update saved" });
    } catch (error: any) {
      console.error("progress submit error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // POST /api/me/tasks/:id/blocker   body: { description }
  static async blocker(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await ProgressService.raiseBlocker(req.user!.id, Number(req.params.id), String(req.body.description || ""));
      if (result.error) {
        res.status(result.status || 400).json({ error: result.error });
        return;
      }
      res.json({ message: "Blocker sent", status: TaskStatus.BLOCKED });
    } catch (error: any) {
      console.error("blocker error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/progress/overview (PM, admin, team lead): who is on track, who is late, and the latest updates
  static async overview(req: AuthRequest, res: Response): Promise<void> {
    try {
      const orgId = req.user!.orgId;
      const cycles = await ProgressService.cycles({ orgId });
      const projectIds = Array.from(new Set(cycles.map((c) => c.projectId)));
      if (projectIds.length === 0) {
        res.json({ projects: [] });
        return;
      }

      const updates = await AppDataSource.getRepository(ProgressUpdate).find({
        where: { projectId: In(projectIds) },
        order: { id: "DESC" },
        take: 100,
      });
      const people = await AppDataSource.getRepository(User).find({
        where: { id: In(Array.from(new Set(updates.map((u) => u.userId)))) },
      });

      res.json({
        projects: projectIds.map((pid) => {
          const mine = cycles.filter((c) => c.projectId === pid);
          return {
            projectId: pid,
            projectName: mine[0].projectName,
            intervalDays: mine[0].intervalDays,
            members: mine.map((c) => ({
              userId: c.userId,
              name: c.userName,
              specialty: c.specialty,
              lastUpdateAt: c.lastUpdateAt,
              dueAt: c.dueAt,
              state: c.state,
            })),
            recent: updates
              .filter((u) => u.projectId === pid)
              .slice(0, 8)
              .map((u) => ({
                id: u.id,
                name: people.find((p) => p.id === u.userId)?.name ?? "Unknown",
                workDone: u.workDone,
                nextSteps: u.nextSteps,
                blockers: u.blockers,
                confidence: u.confidence,
                createdAt: u.createdAt,
              })),
          };
        }),
      });
    } catch (error: any) {
      console.error("progress overview error:", error);
      res.status(500).json({ error: error.message });
    }
  }
}