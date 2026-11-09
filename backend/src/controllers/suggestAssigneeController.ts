import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { AppDataSource } from "../config/data-source";
import { Task, TaskStatus } from "../entities/Task";
import { TeamMember } from "../entities/TeamMember";
import { UserSkill } from "../entities/UserSkill";
import { TaskRequiredSkill } from "../entities/TaskRequiredSkill";

export class SuggestAssigneeController {
  static async suggest(req: AuthRequest, res: Response): Promise<void> {
    const orgId = req.user!.orgId;
    const taskId = parseInt(req.params.taskId, 10);

    const taskRepo = AppDataSource.getRepository(Task);
    const task = await taskRepo.findOne({
      where: { id: taskId },
      relations: ["project", "requiredSkills"],
    });

    if (!task || task.project.orgId !== orgId || !task.teamId) {
      res.status(404).json({ error: "Task, team, or project not found" });
      return;
    }

    const teamMemberRepo = AppDataSource.getRepository(TeamMember);
    const members = await teamMemberRepo.find({
      where: { teamId: task.teamId },
      relations: ["user", "user.userSkills", "user.userSkills.skill"],
    });

    const requiredSkillIds = task.requiredSkills.map((rs: TaskRequiredSkill) => rs.skillId);

    const scoredDevelopers = await Promise.all(
      members.map(async (tm) => {
        const user = tm.user;
        let skillScore = 0;

        if (requiredSkillIds.length > 0) {
          const matchedSkills = user.userSkills.filter((us: UserSkill) => requiredSkillIds.includes(us.skillId));
          skillScore = matchedSkills.reduce((acc: number, us: UserSkill) => acc + us.proficiency, 0);
        } else {
          skillScore = 5; // Default baseline if no specific skills required
        }

        // Count open tasks workload
        const openTasksCount = await taskRepo.count({
          where: { assigneeId: user.id, status: TaskStatus.IN_PROGRESS },
        });

        // Ranking formula: higher skill score, lower open workload
        const finalScore = skillScore * 10 - openTasksCount * 5;

        return {
          userId: user.id,
          name: user.name,
          email: user.email,
          skillScore,
          openTasksCount,
          finalScore,
        };
      })
    );

    scoredDevelopers.sort((a, b) => b.finalScore - a.finalScore);

    res.json({ taskId: task.id, suggestions: scoredDevelopers });
  }
}