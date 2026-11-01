"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logGitActivity = exports.getGitActivities = exports.submitTaskReview = exports.submitProgressUpdate = exports.getMyTasks = exports.assignTask = exports.deleteTask = exports.updateTask = exports.getTask = exports.getTasks = exports.createTask = void 0;
const data_source_1 = require("../config/data-source");
const Task_1 = require("../entities/Task");
const User_1 = require("../entities/User");
const Team_1 = require("../entities/Team");
const ProgressUpdate_1 = require("../entities/ProgressUpdate");
const Review_1 = require("../entities/Review");
const GitActivity_1 = require("../entities/GitActivity");
const Repository_1 = require("../entities/Repository");
const telegramService_1 = require("../services/telegramService");
const taskRepository = data_source_1.AppDataSource.getRepository(Task_1.Task);
const userRepository = data_source_1.AppDataSource.getRepository(User_1.User);
const teamRepository = data_source_1.AppDataSource.getRepository(Team_1.Team);
const progressRepo = data_source_1.AppDataSource.getRepository(ProgressUpdate_1.ProgressUpdate);
const reviewRepo = data_source_1.AppDataSource.getRepository(Review_1.Review);
const gitActivityRepo = data_source_1.AppDataSource.getRepository(GitActivity_1.GitActivity);
const repoRepository = data_source_1.AppDataSource.getRepository(Repository_1.Repository);
const createTask = async (req, res) => {
    try {
        const { projectId, teamId, assigneeId, parentId, title, description, acceptanceCriteria, priority, estimateHours, deadline } = req.body;
        const task = new Task_1.Task();
        task.projectId = projectId;
        task.teamId = teamId || null;
        task.assigneeId = assigneeId || null;
        task.parentId = parentId || null;
        task.title = title;
        task.description = description;
        task.acceptanceCriteria = acceptanceCriteria;
        task.priority = priority || Task_1.TaskPriority.MEDIUM;
        task.estimateHours = estimateHours;
        task.deadline = deadline ? new Date(deadline) : null;
        task.status = Task_1.TaskStatus.TODO;
        await taskRepository.save(task);
        // If assigned, send Telegram notification
        if (task.assigneeId) {
            const assignee = await userRepository.findOne({ where: { id: task.assigneeId } });
            const team = task.teamId ? await teamRepository.findOne({ where: { id: task.teamId } }) : null;
            if (assignee && assignee.telegramId) {
                telegramService_1.telegramService.notifyTaskAssigned(assignee, task, { id: projectId }, team?.name).catch(console.error);
            }
        }
        res.status(201).json({
            message: 'Task created successfully',
            task,
        });
    }
    catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.createTask = createTask;
const getTasks = async (req, res) => {
    try {
        const { projectId, status, assigneeId, teamId } = req.query;
        const where = {};
        if (projectId)
            where.projectId = parseInt(projectId);
        if (status)
            where.status = status;
        if (assigneeId)
            where.assigneeId = parseInt(assigneeId);
        if (teamId)
            where.teamId = parseInt(teamId);
        const tasks = await taskRepository.find({
            where,
            relations: ['assignee', 'team', 'project', 'reviews', 'reviews.reviewer'],
            order: { createdAt: 'DESC' },
        });
        res.json({ tasks });
    }
    catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getTasks = getTasks;
const getTask = async (req, res) => {
    try {
        const { id } = req.params;
        const task = await taskRepository.findOne({
            where: { id: parseInt(id) },
            relations: ['assignee', 'team', 'project', 'reviews', 'reviews.reviewer', 'gitActivities'],
        });
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        // Also fetch progress updates for this project and task
        const updates = await progressRepo.find({
            where: { projectId: task.projectId },
            relations: ['user'],
            order: { createdAt: 'DESC' },
        });
        res.json({ task, progressUpdates: updates });
    }
    catch (error) {
        console.error('Get task error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getTask = getTask;
const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, acceptanceCriteria, priority, estimateHours, status, deadline, assigneeId } = req.body;
        const task = await taskRepository.findOne({
            where: { id: parseInt(id) },
            relations: ['project', 'team'],
        });
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        const previousAssigneeId = task.assigneeId;
        if (title)
            task.title = title;
        if (description !== undefined)
            task.description = description;
        if (acceptanceCriteria !== undefined)
            task.acceptanceCriteria = acceptanceCriteria;
        if (priority)
            task.priority = priority;
        if (estimateHours !== undefined)
            task.estimateHours = estimateHours;
        if (status)
            task.status = status;
        if (deadline !== undefined)
            task.deadline = deadline ? new Date(deadline) : null;
        if (assigneeId !== undefined)
            task.assigneeId = assigneeId;
        await taskRepository.save(task);
        // If new assignee was set, notify them
        if (assigneeId && assigneeId !== previousAssigneeId) {
            const dev = await userRepository.findOne({ where: { id: assigneeId } });
            if (dev && dev.telegramId) {
                telegramService_1.telegramService.notifyTaskAssigned(dev, task, task.project, task.team?.name).catch(console.error);
            }
        }
        res.json({
            message: 'Task updated successfully',
            task,
        });
    }
    catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updateTask = updateTask;
const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const task = await taskRepository.findOne({
            where: { id: parseInt(id) },
        });
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        await taskRepository.remove(task);
        res.json({ message: 'Task deleted successfully' });
    }
    catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.deleteTask = deleteTask;
const assignTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { assigneeId } = req.body;
        const task = await taskRepository.findOne({
            where: { id: parseInt(id) },
            relations: ['project', 'team'],
        });
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        const assignee = await userRepository.findOne({
            where: { id: assigneeId },
        });
        if (!assignee) {
            return res.status(404).json({ error: 'Assignee not found' });
        }
        task.assigneeId = assigneeId;
        await taskRepository.save(task);
        if (assignee.telegramId) {
            telegramService_1.telegramService.notifyTaskAssigned(assignee, task, task.project, task.team?.name).catch(console.error);
        }
        res.json({
            message: 'Task assigned successfully',
            task,
        });
    }
    catch (error) {
        console.error('Assign task error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.assignTask = assignTask;
const getMyTasks = async (req, res) => {
    try {
        const tasks = await taskRepository.find({
            where: { assigneeId: req.userId },
            relations: ['project', 'team', 'reviews'],
            order: { deadline: 'ASC' },
        });
        res.json({ tasks });
    }
    catch (error) {
        console.error('Get my tasks error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getMyTasks = getMyTasks;
// Developer submits progress update: "work is done", notes, blockers, etc.
const submitProgressUpdate = async (req, res) => {
    try {
        const { id } = req.params;
        const { workDone, status = Task_1.TaskStatus.IN_REVIEW, confidence = ProgressUpdate_1.Confidence.HIGH, blockers, nextSteps } = req.body;
        const task = await taskRepository.findOne({
            where: { id: parseInt(id) },
            relations: ['project', 'assignee'],
        });
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        const developer = await userRepository.findOne({ where: { id: req.userId } });
        // Update task status
        if (status) {
            task.status = status;
            await taskRepository.save(task);
        }
        // Create progress update
        const count = await progressRepo.count({ where: { projectId: task.projectId } });
        const update = new ProgressUpdate_1.ProgressUpdate();
        update.userId = req.userId || 1;
        update.projectId = task.projectId;
        update.cycle = count + 1;
        update.workDone = workDone || `Task update: ${task.title} set to ${status}`;
        update.confidence = confidence;
        update.blockers = blockers || null;
        update.nextSteps = nextSteps || null;
        update.updateDate = new Date();
        await progressRepo.save(update);
        // Notify Project Managers / Leads via Telegram
        const managers = await userRepository.find({
            where: { orgId: req.orgId || 1, role: User_1.UserRole.MANAGER },
        });
        for (const mgr of managers) {
            if (mgr.telegramId && developer) {
                telegramService_1.telegramService.notifyWorkProgress(mgr, developer, task, task.project, update.workDone || '', task.status).catch(console.error);
            }
        }
        res.json({
            message: 'Progress update recorded and manager notified!',
            task,
            update,
        });
    }
    catch (error) {
        console.error('Submit progress update error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.submitProgressUpdate = submitProgressUpdate;
// Project Manager reviews work: approve, request changes, or reject
const submitTaskReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { decision, comment } = req.body;
        const task = await taskRepository.findOne({
            where: { id: parseInt(id) },
            relations: ['assignee', 'project'],
        });
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        const reviewer = await userRepository.findOne({ where: { id: req.userId } });
        // Create review
        const review = new Review_1.Review();
        review.prOrTaskId = task.id;
        review.reviewerId = req.userId || 1;
        review.decision = decision || Review_1.ReviewDecision.APPROVED;
        review.comment = comment || 'Work reviewed';
        review.reviewDate = new Date();
        await reviewRepo.save(review);
        // Update task status based on review
        if (decision === Review_1.ReviewDecision.APPROVED) {
            task.status = Task_1.TaskStatus.DONE;
        }
        else if (decision === Review_1.ReviewDecision.CHANGES_REQUESTED) {
            task.status = Task_1.TaskStatus.IN_PROGRESS;
        }
        await taskRepository.save(task);
        // Send Telegram review alert to developer
        if (task.assignee && task.assignee.telegramId) {
            telegramService_1.telegramService.notifyReviewDecision(task.assignee, reviewer ? reviewer.name : 'Project Manager', task, decision, comment).catch(console.error);
        }
        res.json({
            message: `Review submitted: ${decision}`,
            review,
            task,
        });
    }
    catch (error) {
        console.error('Submit task review error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.submitTaskReview = submitTaskReview;
// GitHub Activity Feed for project/task (commits, pushes, pull requests)
const getGitActivities = async (req, res) => {
    try {
        const { taskId, projectId } = req.query;
        const queryBuilder = gitActivityRepo
            .createQueryBuilder('activity')
            .leftJoinAndSelect('activity.user', 'user')
            .leftJoinAndSelect('activity.task', 'task')
            .leftJoinAndSelect('activity.repository', 'repository')
            .orderBy('activity.timestamp', 'DESC')
            .take(50);
        if (taskId) {
            queryBuilder.andWhere('activity.taskId = :taskId', { taskId: parseInt(taskId) });
        }
        const activities = await queryBuilder.getMany();
        res.json({ activities });
    }
    catch (error) {
        console.error('Get git activities error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getGitActivities = getGitActivities;
// Log or simulate Git activity (commits, pushes, PRs)
const logGitActivity = async (req, res) => {
    try {
        const { taskId, repoUrl, type = GitActivity_1.GitActivityType.COMMIT, reference, status, metadata } = req.body;
        // Find or create repository
        let repo = await repoRepository.findOne({ where: { repoUrl } });
        if (!repo) {
            let task = taskId ? await taskRepository.findOne({ where: { id: taskId } }) : null;
            repo = repoRepository.create({
                projectId: task ? task.projectId : 1,
                provider: 'github',
                repoName: repoUrl ? repoUrl.split('/').pop() || 'company-repo' : 'company-repo',
                repoUrl: repoUrl || 'https://github.com/company/project',
                lastSyncedAt: new Date(),
            });
            await repoRepository.save(repo);
        }
        const activity = new GitActivity_1.GitActivity();
        activity.repoId = repo.id;
        activity.userId = req.userId || null;
        activity.taskId = taskId || null;
        activity.type = type;
        activity.reference = reference || `feat: commit by dev #${req.userId || 'system'}`;
        activity.status = status || 'merged';
        activity.metadata = metadata || { branch: 'main' };
        activity.timestamp = new Date();
        await gitActivityRepo.save(activity);
        res.status(201).json({
            message: 'Git activity logged successfully',
            activity,
        });
    }
    catch (error) {
        console.error('Log git activity error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.logGitActivity = logGitActivity;
