"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressService = void 0;
exports.startProgressScheduler = startProgressScheduler;
const typeorm_1 = require("typeorm");
const data_source_1 = require("../config/data-source");
const Task_1 = require("../entities/Task");
const Project_1 = require("../entities/Project");
const User_1 = require("../entities/User");
const ProgressUpdate_1 = require("../entities/ProgressUpdate");
const Notification_1 = require("../entities/Notification");
const NotificationService_1 = require("./NotificationService");
const AuditService_1 = require("./AuditService");
const DAY = 86400000;
const LEAD_ROLES = [User_1.UserRole.ADMIN, User_1.UserRole.MANAGER, User_1.UserRole.TEAM_LEAD];
const day = (d) => d.toISOString().slice(0, 10);
class ProgressService {
    // How long after the due date an update counts as missed (default 24 hours).
    static graceMs() {
        const hours = Number(process.env.PROGRESS_GRACE_HOURS ?? 24);
        return (Number.isFinite(hours) ? hours : 24) * 3600000;
    }
    /**
     * One cycle per developer and project where the developer still has unfinished work.
     * The clock starts at the last update, or at the first task given to that developer in the project.
     */
    static async cycles(filter = {}) {
        const where = { status: (0, typeorm_1.Not)(Task_1.TaskStatus.DONE), assigneeId: filter.userId ?? (0, typeorm_1.Not)((0, typeorm_1.IsNull)()) };
        const tasks = await data_source_1.AppDataSource.getRepository(Task_1.Task).find({ where });
        if (tasks.length === 0)
            return [];
        const firstTask = new Map();
        for (const t of tasks) {
            const key = `${t.projectId}:${t.assigneeId}`;
            const prev = firstTask.get(key);
            if (!prev || t.createdAt < prev)
                firstTask.set(key, t.createdAt);
        }
        const projectIds = Array.from(new Set(tasks.map((t) => t.projectId)));
        const userIds = Array.from(new Set(tasks.map((t) => t.assigneeId)));
        const projects = await data_source_1.AppDataSource.getRepository(Project_1.Project).find({ where: { id: (0, typeorm_1.In)(projectIds) } });
        const users = await data_source_1.AppDataSource.getRepository(User_1.User).find({ where: { id: (0, typeorm_1.In)(userIds) } });
        const updates = await data_source_1.AppDataSource.getRepository(ProgressUpdate_1.ProgressUpdate).find({
            where: { projectId: (0, typeorm_1.In)(projectIds), userId: (0, typeorm_1.In)(userIds) },
            order: { id: "DESC" },
        });
        const lastUpdate = new Map();
        for (const u of updates) {
            const key = `${u.projectId}:${u.userId}`;
            if (!lastUpdate.has(key))
                lastUpdate.set(key, u.createdAt);
        }
        const now = Date.now();
        const grace = this.graceMs();
        const out = [];
        for (const [key, first] of firstTask) {
            const [projectId, userId] = key.split(":").map(Number);
            const project = projects.find((p) => p.id === projectId);
            const user = users.find((u) => u.id === userId);
            if (!project || !user || user.status !== User_1.UserStatus.ACTIVE)
                continue;
            if (filter.orgId !== undefined && project.orgId !== filter.orgId)
                continue;
            const last = lastUpdate.get(key) ?? null;
            const base = last ?? first;
            const dueAt = new Date(base.getTime() + project.updateIntervalDays * DAY);
            const state = now < dueAt.getTime() ? "ok" : now < dueAt.getTime() + grace ? "due" : "missed";
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
    static async leads(orgId) {
        return data_source_1.AppDataSource.getRepository(User_1.User).find({
            where: { orgId, role: (0, typeorm_1.In)(LEAD_ROLES), status: User_1.UserStatus.ACTIVE },
        });
    }
    static async tellLeads(orgId, text, exceptUserId, kind = "PROGRESS") {
        await NotificationService_1.NotificationService.notifyLeads(orgId, text, kind, exceptUserId, kind === "BLOCKER");
    }
    static async raiseBlocker(userId, taskId, description) {
        const text = description.trim();
        if (!text)
            return { error: "Say briefly what is blocking you.", status: 400 };
        const user = await data_source_1.AppDataSource.getRepository(User_1.User).findOne({ where: { id: userId } });
        if (!user)
            return { error: "User not found", status: 404 };
        const taskRepo = data_source_1.AppDataSource.getRepository(Task_1.Task);
        const task = await taskRepo.findOne({ where: { id: taskId }, relations: ["project"] });
        if (!task || !task.project || task.project.orgId !== user.orgId)
            return { error: "Task not found", status: 404 };
        if (task.assigneeId !== user.id)
            return { error: "This task is not assigned to you", status: 403 };
        if (task.status === Task_1.TaskStatus.DONE)
            return { error: "This task is already done.", status: 400 };
        await taskRepo.update(task.id, { status: Task_1.TaskStatus.BLOCKED });
        const repo = data_source_1.AppDataSource.getRepository(ProgressUpdate_1.ProgressUpdate);
        await repo.save(repo.create({
            projectId: task.projectId,
            project: { id: task.projectId },
            userId: user.id,
            user: { id: user.id },
            workDone: `Blocked on "${task.title}" (TASK-${task.id})`,
            nextSteps: "Waiting for help",
            blockers: text,
            confidence: 1,
        }));
        await AuditService_1.AuditService.log(user.orgId, user.id, "BLOCKER", "Task", task.id, `${user.name} is blocked: ${text}`);
        await NotificationService_1.NotificationService.notifyLeads(user.orgId, `Blocked: ${user.name} is stuck on "${task.title}" (TASK-${task.id}) in ${task.project.name}.\n${text}`, "BLOCKER", user.id, true);
        return { task };
    }
}
exports.ProgressService = ProgressService;
// The same text is never sent twice to the same person in the same cycle.
async function alreadySent(userId, text, since) {
    const found = await data_source_1.AppDataSource.getRepository(Notification_1.Notification).findOne({
        where: { userId, message: text, createdAt: (0, typeorm_1.MoreThanOrEqual)(since) },
    });
    return !!found;
}
async function checkProgress() {
    const cycles = await ProgressService.cycles();
    const leadsByOrg = new Map();
    for (const c of cycles) {
        if (c.state === "ok")
            continue;
        const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
        const developer = await userRepo.findOne({ where: { id: c.userId } });
        if (developer) {
            const text = `Time for your progress update on "${c.projectName}". Open your dashboard and post what you did, what is next, and any blockers.`;
            if (!(await alreadySent(c.userId, text, c.dueAt))) {
                try {
                    await NotificationService_1.NotificationService.notifyUser(developer, text, "PROGRESS");
                }
                catch (err) {
                    console.error("Could not send the update reminder:", err?.message || err);
                }
            }
        }
        if (c.state === "missed") {
            const text = `${c.userName} has not posted a progress update on "${c.projectName}". It was due ${day(c.dueAt)}.`;
            if (!leadsByOrg.has(c.orgId))
                leadsByOrg.set(c.orgId, await ProgressService.leads(c.orgId));
            for (const lead of leadsByOrg.get(c.orgId)) {
                if (lead.id === c.userId)
                    continue;
                if (await alreadySent(lead.id, text, c.dueAt))
                    continue;
                try {
                    await NotificationService_1.NotificationService.notifyUser(lead, text, "DEADLINE");
                }
                catch (err) {
                    console.error("Could not send the missed-update alert:", err?.message || err);
                }
            }
        }
    }
}
// Checks every hour (set PROGRESS_CHECK_MINUTES in .env to change it, for example 1 while testing).
function startProgressScheduler() {
    const minutes = Math.max(1, Number(process.env.PROGRESS_CHECK_MINUTES ?? 60) || 60);
    const run = async () => {
        try {
            await checkProgress();
        }
        catch (err) {
            console.error("Progress check failed:", err);
        }
    };
    setTimeout(run, 30 * 1000);
    setInterval(run, minutes * 60 * 1000);
    console.log(`Progress check runs every ${minutes} minute(s).`);
}
