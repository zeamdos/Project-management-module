import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { AppDataSource } from "../config/data-source";
import { Task, TaskStatus } from "../entities/Task";
import { Project } from "../entities/Project";
import { Team } from "../entities/Team";
import { User } from "../entities/User";
import { TaskDependency } from "../entities/TaskDependency";
import { Policy } from "../entities/Policy";
import { Review, ReviewStatus } from "../entities/Review";
import { AuditService } from "../services/AuditService";

export class TaskController {
  static async create(req: AuthRequest, res: Response): Promise<void> {
    const orgId = req.user!.orgId;
    const { projectId, teamId, assigneeId, milestoneId, title, description, requiredRole, deadline, parentTaskId, dependencyIds } = req.body;

    const projectRepo = AppDataSource.getRepository(Project);
    const project = await projectRepo.findOne({ where: { id: projectId, orgId } });
    if (!project) {
      res.status(404).json({ error: "Project not found or does not belong to your organization" });
      return;
    }

    if (teamId) {
      const teamRepo = AppDataSource.getRepository(Team);
      const team = await teamRepo.findOne({ where: { id: teamId, orgId } });
      if (!team) {
        res.status(400).json({ error: "Invalid team specified for this organization" });
        return;
      }
    }

    if (assigneeId) {
      const userRepo = AppDataSource.getRepository(User);
      const assignee = await userRepo.findOne({ where: { id: assigneeId, orgId } });
      if (!assignee) {
        res.status(400).json({ error: "Invalid assignee specified for this organization" });
        return;
      }
    }

    const taskRepo = AppDataSource.getRepository(Task);
    const task = taskRepo.create({
      projectId,
      teamId: teamId || null,
      assigneeId: assigneeId || null,
      milestoneId: milestoneId || null,
      title,
      description: description || null,
      requiredRole,
      deadline: deadline ? new Date(deadline) : null,
      parentTaskId: parentTaskId || null,
    });

    await taskRepo.save(task);

    if (dependencyIds && Array.isArray(dependencyIds)) {
      const depRepo = AppDataSource.getRepository(TaskDependency);
      for (const depId of dependencyIds) {
        // Simple cycle check could be added
        const dep = depRepo.create({ taskId: task.id, dependsOnTaskId: depId });
        await depRepo.save(dep);
      }
    }

    await AuditService.log(orgId, req.user!.id, "CREATE", "Task", task.id, `Created task ${title}`);
    res.status(201).json(task);
  }

  static async updateStatus(req: AuthRequest, res: Response): Promise<void> {
    const orgId = req.user!.orgId;
    const taskId = parseInt(req.params.id, 10);
    const { status } = req.body;

    const taskRepo = AppDataSource.getRepository(Task);
    const task = await taskRepo.findOne({
      where: { id: taskId },
      relations: ["project"],
    });

    if (!task || task.project.orgId !== orgId) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    // Check if moving to DONE requires approved review policy
    if (status === TaskStatus.DONE) {
      const policyRepo = AppDataSource.getRepository(Policy);
      const policy = await policyRepo.findOne({
        where: { projectId: task.projectId, key: "require_approved_review_for_done" },
      });

      if (!policy || policy.enabled) {
        const reviewRepo = AppDataSource.getRepository(Review);
        const approvedReview = await reviewRepo.findOne({
          where: { taskId: task.id, status: ReviewStatus.APPROVE },
        });
        if (!approvedReview) {
          res.status(400).json({ error: "Cannot move task to DONE without an approved review" });
          return;
        }
      }
    }

    task.status = status;
    await taskRepo.save(task);
    await AuditService.log(orgId, req.user!.id, "UPDATE", "Task", task.id, `Updated task status to ${status}`);

    res.json(task);
  }
}