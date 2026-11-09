"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuggestAssigneeController = void 0;
const data_source_1 = require("../config/data-source");
const Task_1 = require("../entities/Task");
const TeamMember_1 = require("../entities/TeamMember");
class SuggestAssigneeController {
    static async suggest(req, res) {
        const orgId = req.user.orgId;
        const taskId = parseInt(req.params.taskId, 10);
        const taskRepo = data_source_1.AppDataSource.getRepository(Task_1.Task);
        const task = await taskRepo.findOne({
            where: { id: taskId },
            relations: ["project", "requiredSkills"],
        });
        if (!task || task.project.orgId !== orgId || !task.teamId) {
            res.status(404).json({ error: "Task, team, or project not found" });
            return;
        }
        const teamMemberRepo = data_source_1.AppDataSource.getRepository(TeamMember_1.TeamMember);
        const members = await teamMemberRepo.find({
            where: { teamId: task.teamId },
            relations: ["user", "user.userSkills", "user.userSkills.skill"],
        });
        const requiredSkillIds = task.requiredSkills.map((rs) => rs.skillId);
        const scoredDevelopers = await Promise.all(members.map(async (tm) => {
            const user = tm.user;
            let skillScore = 0;
            if (requiredSkillIds.length > 0) {
                const matchedSkills = user.userSkills.filter((us) => requiredSkillIds.includes(us.skillId));
                skillScore = matchedSkills.reduce((acc, us) => acc + us.proficiency, 0);
            }
            else {
                skillScore = 5; // Default baseline if no specific skills required
            }
            // Count open tasks workload
            const openTasksCount = await taskRepo.count({
                where: { assigneeId: user.id, status: Task_1.TaskStatus.IN_PROGRESS },
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
        }));
        scoredDevelopers.sort((a, b) => b.finalScore - a.finalScore);
        res.json({ taskId: task.id, suggestions: scoredDevelopers });
    }
}
exports.SuggestAssigneeController = SuggestAssigneeController;
