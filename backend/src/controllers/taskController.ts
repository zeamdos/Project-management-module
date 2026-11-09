import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { AppDataSource } from "../config/data-source";
import { Task, TaskStatus, TaskRole } from "../entities/Task";
import { Project } from "../entities/Project";
import { Team } from "../entities/Team";
import { User } from "../entities/User";
import { TaskDependency } from "../entities/TaskDependency";
import { Policy } from "../entities/Policy";
import { Review, ReviewStatus } from "../entities/Review";
import { AuditService } from "../services/AuditService";
import { NotificationService } from "../services/NotificationService";
import { emitToUser } from "../services/SocketService";

// Maps a Task entity row into the shape the frontend Task type expects,
// including the related project name and assignee summary.
export function shapeTask(t: Task) {
  return {
    id: t.id,
    projectId: t.projectId,
    projectName: t.project?.name ?? null,
    teamId: t.teamId,
    teamName: t.team?.name ?? null,
    title: t.title,
    description: t.description ?? "",
    status: t.status,
    priority: "MEDIUM",
    requiredRole: t.requiredRole,
    assigneeId: t.assigneeId,
    assignee: t.assignee
      ? {
          id: t.assignee.id,
          name: t.assignee.name,
          email: t.assignee.email,
          specialty: t.assignee.specialty,
          avatar: t.assignee.name.slice(0, 2).toUpperCase(),
        }
      : null,
    dueDate: t.deadline ? new Date(t.deadline).toISOString().slice(0, 10) : undefined,
    startDate: t.createdAt ? new Date(t.createdAt).toISOString().slice(0, 10) : undefined,
    createdById: undefined,
    createdByName: undefined,
    labels: [],
    comments: [],
    activity: [],
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

// Derives the TaskRole enum value from a free-form specialty / label string.
function specialtyToRole(value?: string | null): TaskRole | null {
  if (!value) return null;
  const s = value.toLowerCase();
  if (s.includes("front")) return TaskRole.FRONTEND;
  if (s.includes("back")) return TaskRole.BACKEND;
  if (s.includes("ui") || s.includes("ux") || s.includes("design")) return TaskRole.UI_UX;
  if (s.includes("ai") || s.includes("ml")) return TaskRole.AI;
  return null;
}

export class TaskController {
  static async create(req: AuthRequest, res: Response): Promise<void> {
    const orgId = req.user!.orgId;
    const {
      projectId,
      teamId,
      assigneeId,
      milestoneId,
      title,
      description,
      requiredRole,
      deadline,
      dueDate,
      status,
      labels,
      parentTaskId,
      dependencyIds,
    } = req.body;

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

    // Validate the assignee and keep the row so we can derive a required role below.
    let assignee: User | null = null;
    if (assigneeId) {
      const userRepo = AppDataSource.getRepository(User);
      assignee = await userRepo.findOne({ where: { id: assigneeId, orgId } });
      if (!assignee) {
        res.status(400).json({ error: "Invalid assignee specified for this organization" });
        return;
      }
    }

    // requiredRole is a non-nullable enum on the Task entity, so it must be
    // resolved before insert. Derive it from the explicit value, the assignee's
    // specialty, the supplied labels, or default to frontend.
    let finalRequiredRole: TaskRole | null = null;
    if (requiredRole) {
      finalRequiredRole = specialtyToRole(String(requiredRole));
      if (!finalRequiredRole && Object.values(TaskRole).includes(requiredRole as TaskRole)) {
        finalRequiredRole = requiredRole as TaskRole;
      }
    }
    if (!finalRequiredRole && assignee) {
      finalRequiredRole = specialtyToRole(assignee.specialty);
    }
    if (!finalRequiredRole && Array.isArray(labels)) {
      for (const lbl of labels) {
        const r = specialtyToRole(String(lbl));
        if (r) {
          finalRequiredRole = r;
          break;
        }
      }
    }
    if (!finalRequiredRole) {
      finalRequiredRole = TaskRole.FRONTEND;
    }

    // The frontend sends "dueDate"; the entity column is "deadline".
    const resolvedDeadline = deadline || dueDate;

    // Map the requested status onto the backend enum. The frontend type includes
    // BACKLOG which is not in the backend enum, so unmapped values fall back to TODO.
    let finalStatus: TaskStatus = TaskStatus.TODO;
    if (status && Object.values(TaskStatus).includes(status as TaskStatus)) {
      finalStatus = status as TaskStatus;
    }

    const taskRepo = AppDataSource.getRepository(Task);
    const task = taskRepo.create({
      projectId,
      teamId: teamId || null,
      assigneeId: assigneeId || null,
      milestoneId: milestoneId || null,
      title,
      description: description || null,
      requiredRole: finalRequiredRole,
      status: finalStatus,
      deadline: resolvedDeadline ? new Date(resolvedDeadline) : null,
      parentTaskId: parentTaskId || null,
    });

    await taskRepo.save(task);

    if (assignee) {
      try {
        await NotificationService.notifyUser(
          assignee,
          `You have been assigned to "${title}"${project ? ` in ${project.name}` : ""}.`,
          "TASK_ASSIGNED"
        );
      } catch (err: any) {
        console.error("Task assignment notification failed:", err?.message || err);
      }
    }

    if (dependencyIds && Array.isArray(dependencyIds)) {
      const depRepo = AppDataSource.getRepository(TaskDependency);
      for (const depId of dependencyIds) {
        const dep = depRepo.create({ taskId: task.id, dependsOnTaskId: depId });
        await depRepo.save(dep);
      }
    }

    await AuditService.log(orgId, req.user!.id, "CREATE", "Task", task.id, `Created task ${title}`);

    // Reload with relations so the response carries projectName / assignee data
    // the frontend needs to render the card immediately.
    const saved = await taskRepo.findOne({
      where: { id: task.id },
      relations: ["project", "assignee", "team"],
    });

    if (saved && saved.assigneeId) {
      emitToUser(saved.assigneeId, "task:created", shapeTask(saved));
    }

    res.status(201).json(saved ? shapeTask(saved) : { id: task.id });
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

  // GET /api/tasks — every task in the caller's organization, enriched for the
  // frontend board / kanban / workload views.
  static async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const orgId = req.user!.orgId;
      const taskRepo = AppDataSource.getRepository(Task);
      const rows = await taskRepo
        .createQueryBuilder("task")
        .leftJoinAndSelect("task.project", "project")
        .leftJoinAndSelect("task.assignee", "assignee")
        .leftJoinAndSelect("task.team", "team")
        .where("project.orgId = :orgId", { orgId })
        .orderBy("task.id", "DESC")
        .getMany();

      res.json({ tasks: rows.map(shapeTask) });
    } catch (err: any) {
      console.error("TaskController.list:", err);
      res.status(500).json({ error: err.message });
    }
  }

  // PATCH /api/tasks/:id — update arbitrary fields (title, description, deadline,
  // dueDate, status, assigneeId, requiredRole) on a single task.
  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const orgId = req.user!.orgId;
      const taskId = Number(req.params.id);
      const taskRepo = AppDataSource.getRepository(Task);

      const task = await taskRepo.findOne({
        where: { id: taskId },
        relations: ["project", "assignee", "team"],
      });
      if (!task || task.project.orgId !== orgId) {
        res.status(404).json({ error: "Task not found" });
        return;
      }

      const {
        title,
        description,
        deadline,
        dueDate,
        status,
        assigneeId,
        requiredRole,
      } = req.body;

      if (title !== undefined) task.title = String(title).trim();
      if (description !== undefined) task.description = String(description).trim() || null;
      if (deadline !== undefined) task.deadline = deadline ? new Date(deadline) : null;
      if (dueDate !== undefined) task.deadline = dueDate ? new Date(dueDate) : null;
      if (status !== undefined) {
        if (Object.values(TaskStatus).includes(status as TaskStatus)) {
          task.status = status as TaskStatus;
        }
      }
      if (assigneeId !== undefined) task.assigneeId = assigneeId ? Number(assigneeId) : null;
      if (requiredRole !== undefined) {
        const mapped = specialtyToRole(String(requiredRole));
        if (mapped || Object.values(TaskRole).includes(requiredRole as TaskRole)) {
          task.requiredRole = mapped || (requiredRole as TaskRole);
        }
      }

      await taskRepo.save(task);
      await AuditService.log(orgId, req.user!.id, "UPDATE", "Task", task.id, `Updated task ${task.title}`);

      if (task.assigneeId) {
        emitToUser(task.assigneeId, "task:updated", shapeTask(task));
      }

      res.json(shapeTask(task));
    } catch (err: any) {
      console.error("TaskController.update:", err);
      res.status(500).json({ error: err.message });
    }
  }
}