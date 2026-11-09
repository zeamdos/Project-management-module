"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowController = void 0;
const typeorm_1 = require("typeorm");
const data_source_1 = require("../config/data-source");
const Task_1 = require("../entities/Task");
const User_1 = require("../entities/User");
const Review_1 = require("../entities/Review");
const GitActivity_1 = require("../entities/GitActivity");
const NotificationService_1 = require("../services/NotificationService");
const AuditService_1 = require("../services/AuditService");
// PM, admin and team leads can review everything in their organization.
const LEAD_ROLES = [User_1.UserRole.ADMIN, User_1.UserRole.MANAGER, User_1.UserRole.TEAM_LEAD];
// Developers who hold the "Review and support" part of a team can review that team's tasks in that project.
// (aiTaskService gives that part a title like "Backend: Review and support: Database design and setup".)
const REVIEW_TITLE_MARK = ": Review and support";
const SPECIALTY_OF = {
    [Task_1.TaskRole.FRONTEND]: "frontend",
    [Task_1.TaskRole.BACKEND]: "backend",
    [Task_1.TaskRole.UI_UX]: "ui/ux",
    [Task_1.TaskRole.AI]: "ai",
};
async function reviewScope(user) {
    // Default reviewer is the PM / admin / team lead.
    if (LEAD_ROLES.includes(user.role))
        return { all: true, scopes: [] };
    const mine = await data_source_1.AppDataSource.getRepository(Task_1.Task).find({ where: { assigneeId: user.id } });
    const scopes = mine
        .filter((t) => t.title.includes(REVIEW_TITLE_MARK))
        .map((t) => ({ projectId: t.projectId, role: t.requiredRole }));
    // Extra developers who were not given implementation work can review that project's tasks.
    const open = mine.filter((t) => t.status !== Task_1.TaskStatus.DONE);
    const idle = open.length === 0 || open.every((t) => t.title.includes(REVIEW_TITLE_MARK));
    if (idle && user.orgId) {
        const orgTasks = await data_source_1.AppDataSource.getRepository(Task_1.Task).find({
            where: { project: { orgId: user.orgId } },
            relations: ["project"],
        });
        const projectIds = Array.from(new Set(orgTasks.map((t) => t.projectId)));
        for (const projectId of projectIds) {
            const assignedHere = mine.filter((t) => t.projectId === projectId && !t.title.includes(REVIEW_TITLE_MARK));
            if (assignedHere.length === 0) {
                for (const role of Object.values(Task_1.TaskRole)) {
                    if (!scopes.some((s) => s.projectId === projectId && s.role === role)) {
                        scopes.push({ projectId, role });
                    }
                }
            }
        }
    }
    return { all: false, scopes };
}
function inScope(scope, task) {
    return scope.all || scope.scopes.some((s) => s.projectId === task.projectId && s.role === task.requiredRole);
}
async function tellUser(user, text, kind = "GENERAL") {
    if (!user)
        return;
    try {
        await NotificationService_1.NotificationService.notifyUser(user, text, kind);
    }
    catch (err) {
        console.error("Could not send notification:", err?.message || err);
    }
}
class WorkflowController {
    // GET /api/reviews/pending: tasks in review that this person is allowed to review
    static async pendingReviews(req, res) {
        try {
            const me = req.user;
            const scope = await reviewScope({ id: me.id, orgId: me.orgId, role: me.role });
            const rows = await data_source_1.AppDataSource.getRepository(Task_1.Task).find({
                where: { status: Task_1.TaskStatus.IN_REVIEW },
                relations: ["project", "project.repositories", "assignee", "team", "reviews", "reviews.reviewer"],
                order: { id: "ASC" },
            });
            const tasks = rows.filter((t) => t.project && t.project.orgId === me.orgId && t.assigneeId !== me.id && inScope(scope, t));
            const ids = tasks.map((t) => t.id);
            const activity = ids.length
                ? await data_source_1.AppDataSource.getRepository(GitActivity_1.GitActivity).find({ where: { taskId: (0, typeorm_1.In)(ids) }, order: { createdAt: "DESC" } })
                : [];
            res.json({
                reviews: tasks.map((t) => ({
                    id: t.id,
                    title: t.title,
                    projectId: t.projectId,
                    projectName: t.project.name,
                    repoUrl: t.project.repositories?.[0]?.url ?? null,
                    team: t.team?.name ?? null,
                    deadline: t.deadline,
                    developer: t.assignee ? { id: t.assignee.id, name: t.assignee.name } : null,
                    activity: activity
                        .filter((a) => a.taskId === t.id)
                        .slice(0, 6)
                        .map((a) => ({ id: a.id, type: a.activityType, message: a.message, url: a.url, at: a.createdAt })),
                    reviews: (t.reviews || [])
                        .slice()
                        .sort((a, b) => b.id - a.id)
                        .slice(0, 3)
                        .map((r) => ({ decision: r.status, comments: r.comments, reviewer: r.reviewer?.name ?? null, at: r.createdAt })),
                })),
            });
        }
        catch (error) {
            console.error("pendingReviews error:", error);
            res.status(500).json({ error: error.message });
        }
    }
    // POST /api/tasks/:id/review   body: { decision: APPROVE | CHANGES_REQUESTED | REJECTED, comments }
    static async submitReview(req, res) {
        try {
            const me = req.user;
            const taskId = Number(req.params.id);
            const decision = String(req.body.decision || "");
            const comments = String(req.body.comments || "").trim();
            if (!Object.values(Review_1.ReviewStatus).includes(decision)) {
                res.status(400).json({ error: "Decision must be APPROVE, CHANGES_REQUESTED or REJECTED." });
                return;
            }
            if (decision !== Review_1.ReviewStatus.APPROVE && !comments) {
                res.status(400).json({ error: "Write a comment so the developer knows what to change." });
                return;
            }
            const taskRepo = data_source_1.AppDataSource.getRepository(Task_1.Task);
            const task = await taskRepo.findOne({ where: { id: taskId }, relations: ["project", "assignee"] });
            if (!task || task.project.orgId !== me.orgId) {
                res.status(404).json({ error: "Task not found" });
                return;
            }
            if (task.status !== Task_1.TaskStatus.IN_REVIEW) {
                res.status(400).json({ error: "This task is not waiting for review." });
                return;
            }
            if (task.assigneeId === me.id) {
                res.status(403).json({ error: "You cannot review your own task." });
                return;
            }
            if (!inScope(await reviewScope({ id: me.id, orgId: me.orgId, role: me.role }), task)) {
                res.status(403).json({ error: "You are not a reviewer for this task." });
                return;
            }
            // Both the id column and the relation are set, so the review shows up under the task.
            const reviewRepo = data_source_1.AppDataSource.getRepository(Review_1.Review);
            await reviewRepo.save(reviewRepo.create({
                taskId: task.id,
                task: { id: task.id },
                reviewerId: me.id,
                reviewer: { id: me.id },
                status: decision,
                comments: comments || null,
            }));
            const newStatus = decision === Review_1.ReviewStatus.APPROVE ? Task_1.TaskStatus.DONE : Task_1.TaskStatus.IN_PROGRESS;
            await taskRepo.update(task.id, { status: newStatus });
            const reviewer = await data_source_1.AppDataSource.getRepository(User_1.User).findOne({ where: { id: me.id } });
            const who = reviewer?.name ?? "A reviewer";
            const text = decision === Review_1.ReviewStatus.APPROVE
                ? `Approved: "${task.title}" (task #${task.id}) is now Done. Reviewed by ${who}.${comments ? ` Note: ${comments}` : ""}`
                : decision === Review_1.ReviewStatus.CHANGES_REQUESTED
                    ? `Changes requested on "${task.title}" (task #${task.id}) by ${who}: ${comments}\nThe task is back in progress.`
                    : `Rejected: "${task.title}" (task #${task.id}) by ${who}: ${comments}\nThe task is back in progress.`;
            await tellUser(task.assignee, text);
            await AuditService_1.AuditService.log(me.orgId, me.id, `REVIEW_${decision}`, "Task", task.id, `${who}: ${decision}${comments ? ` (${comments})` : ""}`);
            res.json({ message: "Review saved", status: newStatus });
        }
        catch (error) {
            console.error("submitReview error:", error);
            res.status(500).json({ error: error.message });
        }
    }
    // GET /api/developers: active developers with their open work (for reassigning)
    static async developers(req, res) {
        try {
            const orgId = req.user.orgId;
            const taskRepo = data_source_1.AppDataSource.getRepository(Task_1.Task);
            const people = await data_source_1.AppDataSource.getRepository(User_1.User).find({
                where: { orgId, role: User_1.UserRole.DEVELOPER, status: User_1.UserStatus.ACTIVE },
                order: { id: "ASC" },
            });
            const developers = [];
            for (const u of people) {
                const openTasks = await taskRepo.count({ where: { assigneeId: u.id, status: (0, typeorm_1.Not)(Task_1.TaskStatus.DONE) } });
                developers.push({ id: u.id, name: u.name, specialty: u.specialty, openTasks });
            }
            res.json({ developers });
        }
        catch (error) {
            console.error("developers error:", error);
            res.status(500).json({ error: error.message });
        }
    }
    // PATCH /api/tasks/:id/assign   body: { assigneeId }
    static async assign(req, res) {
        try {
            const me = req.user;
            const taskId = Number(req.params.id);
            const assigneeId = Number(req.body.assigneeId);
            if (!assigneeId) {
                res.status(400).json({ error: "Choose a developer." });
                return;
            }
            const taskRepo = data_source_1.AppDataSource.getRepository(Task_1.Task);
            const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
            const task = await taskRepo.findOne({ where: { id: taskId }, relations: ["project", "assignee"] });
            if (!task || task.project.orgId !== me.orgId) {
                res.status(404).json({ error: "Task not found" });
                return;
            }
            if (task.status === Task_1.TaskStatus.DONE) {
                res.status(400).json({ error: "A finished task cannot be reassigned." });
                return;
            }
            const dev = await userRepo.findOne({
                where: { id: assigneeId, orgId: me.orgId, role: User_1.UserRole.DEVELOPER, status: User_1.UserStatus.ACTIVE },
            });
            if (!dev) {
                res.status(400).json({ error: "Choose an active developer." });
                return;
            }
            if ((dev.specialty || "").trim().toLowerCase() !== SPECIALTY_OF[task.requiredRole]) {
                res.status(400).json({ error: `Only ${SPECIALTY_OF[task.requiredRole]} developers can take this task.` });
                return;
            }
            if (task.assigneeId === dev.id) {
                res.status(400).json({ error: "That developer already has this task." });
                return;
            }
            const previous = task.assignee;
            task.assigneeId = dev.id;
            task.assignee = dev; // fills assignee_id as well
            if (task.status === Task_1.TaskStatus.PENDING)
                task.status = Task_1.TaskStatus.TODO;
            await taskRepo.save(task);
            const by = await userRepo.findOne({ where: { id: me.id } });
            await tellUser(dev, `A task was assigned to you: "${task.title}" (TASK-${task.id}), by ${by?.name ?? "your PM"}. Open your dashboard for the plan.`, "TASK_ASSIGNED");
            await tellUser(previous, `Your task "${task.title}" (TASK-${task.id}) was moved to ${dev.name}.`);
            await AuditService_1.AuditService.log(me.orgId, me.id, "REASSIGN", "Task", task.id, `Reassigned from ${previous ? previous.name : "nobody"} to ${dev.name}`);
            res.json({ message: "Task reassigned", assigneeId: dev.id });
        }
        catch (error) {
            console.error("assign error:", error);
            res.status(500).json({ error: error.message });
        }
    }
}
exports.WorkflowController = WorkflowController;
