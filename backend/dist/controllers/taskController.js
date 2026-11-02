"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskController = void 0;
const data_source_1 = require("../config/data-source");
const Task_1 = require("../entities/Task");
const Project_1 = require("../entities/Project");
const Team_1 = require("../entities/Team");
const User_1 = require("../entities/User");
const TaskDependency_1 = require("../entities/TaskDependency");
const Policy_1 = require("../entities/Policy");
const Review_1 = require("../entities/Review");
const AuditService_1 = require("../services/AuditService");
class TaskController {
    static async create(req, res) {
        const orgId = req.user.orgId;
        const { projectId, teamId, assigneeId, milestoneId, title, description, requiredRole, deadline, parentTaskId, dependencyIds } = req.body;
        const projectRepo = data_source_1.AppDataSource.getRepository(Project_1.Project);
        const project = await projectRepo.findOne({ where: { id: projectId, orgId } });
        if (!project) {
            res.status(404).json({ error: "Project not found or does not belong to your organization" });
            return;
        }
        if (teamId) {
            const teamRepo = data_source_1.AppDataSource.getRepository(Team_1.Team);
            const team = await teamRepo.findOne({ where: { id: teamId, orgId } });
            if (!team) {
                res.status(400).json({ error: "Invalid team specified for this organization" });
                return;
            }
        }
        if (assigneeId) {
            const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
            const assignee = await userRepo.findOne({ where: { id: assigneeId, orgId } });
            if (!assignee) {
                res.status(400).json({ error: "Invalid assignee specified for this organization" });
                return;
            }
        }
        const taskRepo = data_source_1.AppDataSource.getRepository(Task_1.Task);
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
            const depRepo = data_source_1.AppDataSource.getRepository(TaskDependency_1.TaskDependency);
            for (const depId of dependencyIds) {
                // Simple cycle check could be added
                const dep = depRepo.create({ taskId: task.id, dependsOnTaskId: depId });
                await depRepo.save(dep);
            }
        }
        await AuditService_1.AuditService.log(orgId, req.user.id, "CREATE", "Task", task.id, `Created task ${title}`);
        res.status(201).json(task);
    }
    static async updateStatus(req, res) {
        const orgId = req.user.orgId;
        const taskId = parseInt(req.params.id, 10);
        const { status } = req.body;
        const taskRepo = data_source_1.AppDataSource.getRepository(Task_1.Task);
        const task = await taskRepo.findOne({
            where: { id: taskId },
            relations: ["project"],
        });
        if (!task || task.project.orgId !== orgId) {
            res.status(404).json({ error: "Task not found" });
            return;
        }
        // Check if moving to DONE requires approved review policy
        if (status === Task_1.TaskStatus.DONE) {
            const policyRepo = data_source_1.AppDataSource.getRepository(Policy_1.Policy);
            const policy = await policyRepo.findOne({
                where: { projectId: task.projectId, key: "require_approved_review_for_done" },
            });
            if (!policy || policy.enabled) {
                const reviewRepo = data_source_1.AppDataSource.getRepository(Review_1.Review);
                const approvedReview = await reviewRepo.findOne({
                    where: { taskId: task.id, status: Review_1.ReviewStatus.APPROVE },
                });
                if (!approvedReview) {
                    res.status(400).json({ error: "Cannot move task to DONE without an approved review" });
                    return;
                }
            }
        }
        task.status = status;
        await taskRepo.save(task);
        await AuditService_1.AuditService.log(orgId, req.user.id, "UPDATE", "Task", task.id, `Updated task status to ${status}`);
        res.json(task);
    }
}
exports.TaskController = TaskController;
