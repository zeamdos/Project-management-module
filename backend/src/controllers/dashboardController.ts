import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { AppDataSource } from "../config/data-source";
import { Task, TaskStatus } from "../entities/Task";
import { Milestone } from "../entities/Milestone";
import { GitActivity } from "../entities/GitActivity";
import { ProgressUpdate } from "../entities/ProgressUpdate";
import { TeamMember } from "../entities/TeamMember";

export class DashboardController {
  static async getProjectHealth(req: AuthRequest, res: Response): Promise<void> {
    const orgId = req.user!.orgId;
    const projectId = parseInt(req.params.projectId, 10);

    const taskRepo = AppDataSource.getRepository(Task);
    const milestoneRepo = AppDataSource.getRepository(Milestone);
    const teamMemberRepo = AppDataSource.getRepository(TeamMember);
    const progressRepo = AppDataSource.getRepository(ProgressUpdate);

    const totalTasks = await taskRepo.count({ where: { projectId } });
    const tasksByStatus = {
      todo: await taskRepo.count({ where: { projectId, status: TaskStatus.TODO } }),
      inProgress: await taskRepo.count({ where: { projectId, status: TaskStatus.IN_PROGRESS } }),
      inReview: await taskRepo.count({ where: { projectId, status: TaskStatus.IN_REVIEW } }),
      done: await taskRepo.count({ where: { projectId, status: TaskStatus.DONE } }),
      blocked: await taskRepo.count({ where: { projectId, status: TaskStatus.BLOCKED } }),
    };

    const milestones = await milestoneRepo.find({ where: { projectId } });
    const teamMembers = await teamMemberRepo.find({
      where: { team: { projectId } },
      relations: ["user"],
    });

    res.json({
      projectId,
      totalTasks,
      tasksByStatus,
      milestonesCount: milestones.length,
      teamMembersCount: teamMembers.length,
    });
  }
}