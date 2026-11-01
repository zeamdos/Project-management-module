"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkProjectDeadlines = exports.getProjectStats = exports.deleteProject = exports.updateProject = exports.getProject = exports.getProjects = exports.createProject = void 0;
const data_source_1 = require("../config/data-source");
const Project_1 = require("../entities/Project");
const Task_1 = require("../entities/Task");
const Team_1 = require("../entities/Team");
const TeamMember_1 = require("../entities/TeamMember");
const Milestone_1 = require("../entities/Milestone");
const User_1 = require("../entities/User");
const telegramService_1 = require("../services/telegramService");
const projectRepository = data_source_1.AppDataSource.getRepository(Project_1.Project);
const taskRepository = data_source_1.AppDataSource.getRepository(Task_1.Task);
const teamRepository = data_source_1.AppDataSource.getRepository(Team_1.Team);
const teamMemberRepository = data_source_1.AppDataSource.getRepository(TeamMember_1.TeamMember);
const milestoneRepository = data_source_1.AppDataSource.getRepository(Milestone_1.Milestone);
const userRepository = data_source_1.AppDataSource.getRepository(User_1.User);
const createProject = async (req, res) => {
    try {
        const { title, description, goals, techStack, startDate, deadline, updateIntervalDays, autoBreakdown = true } = req.body;
        const start = startDate ? new Date(startDate) : new Date();
        const end = deadline ? new Date(deadline) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        const project = new Project_1.Project();
        project.orgId = req.orgId || 1;
        project.title = title;
        project.description = description;
        project.goals = goals;
        project.techStack = techStack || {};
        project.startDate = start;
        project.deadline = end;
        project.updateIntervalDays = updateIntervalDays || 7;
        project.status = Project_1.ProjectStatus.ACTIVE;
        project.health = Project_1.ProjectHealth.ON_TRACK;
        await projectRepository.save(project);
        // 1. Create the 3 Standard Teams: UI/UX, Frontend, Backend
        const teamConfigs = [
            { name: 'UI/UX Design Team', type: Team_1.TeamType.UI_UX },
            { name: 'Frontend Engineering Team', type: Team_1.TeamType.FRONTEND },
            { name: 'Backend & Infrastructure Team', type: Team_1.TeamType.BACKEND },
        ];
        const createdTeams = {};
        for (const conf of teamConfigs) {
            const team = new Team_1.Team();
            team.projectId = project.id;
            team.name = conf.name;
            team.type = conf.type;
            team.deadline = end;
            await teamRepository.save(team);
            createdTeams[conf.type] = team;
        }
        // 2. Fetch all registered developers in this organization
        const orgDevelopers = await userRepository.find({
            where: { orgId: req.orgId, role: User_1.UserRole.DEVELOPER },
            relations: ['skills', 'skills.skill'],
        });
        // Group developers by team specialty
        const devsBySpecialty = {
            [Team_1.TeamType.UI_UX]: [],
            [Team_1.TeamType.FRONTEND]: [],
            [Team_1.TeamType.BACKEND]: [],
        };
        for (const dev of orgDevelopers) {
            const spec = (dev.specialty || '').toLowerCase();
            if (spec.includes('ui') || spec.includes('ux') || spec.includes('design')) {
                devsBySpecialty[Team_1.TeamType.UI_UX].push(dev);
            }
            else if (spec.includes('back') || spec.includes('api') || spec.includes('data')) {
                devsBySpecialty[Team_1.TeamType.BACKEND].push(dev);
            }
            else {
                // Default / Frontend
                devsBySpecialty[Team_1.TeamType.FRONTEND].push(dev);
            }
        }
        // Assign developers to TeamMemberships for this project
        for (const [tType, devList] of Object.entries(devsBySpecialty)) {
            const team = createdTeams[tType];
            if (team && devList.length > 0) {
                for (const dev of devList) {
                    const tm = teamMemberRepository.create({
                        teamId: team.id,
                        userId: dev.id,
                        role: 'Developer',
                    });
                    await teamMemberRepository.save(tm);
                }
            }
        }
        // 3. Intelligent Task Breakdown into UI/UX, Frontend, and Backend
        if (autoBreakdown) {
            const totalSpanMs = Math.max(end.getTime() - start.getTime(), 3 * 24 * 60 * 60 * 1000);
            const templateTasks = [
                {
                    teamType: Team_1.TeamType.UI_UX,
                    title: `UI/UX: Wireframing & Design System for ${title}`,
                    description: `Create user flow diagrams, low-fidelity wireframes, typography tokens, and color palette adhering to requirements: ${goals || description || title}`,
                    priority: Task_1.TaskPriority.HIGH,
                    estimateHours: 16,
                    fraction: 0.25,
                },
                {
                    teamType: Team_1.TeamType.UI_UX,
                    title: `UI/UX: High-Fidelity Interactive Prototypes`,
                    description: `Deliver responsive screen mockups, component states (hover, error, active), and export assets for frontend integration.`,
                    priority: Task_1.TaskPriority.MEDIUM,
                    estimateHours: 20,
                    fraction: 0.45,
                },
                {
                    teamType: Team_1.TeamType.FRONTEND,
                    title: `Frontend: Project Scaffolding & Component Library`,
                    description: `Initialize frontend architecture, routing, design token setup, and base reusable component library matching UI designs.`,
                    priority: Task_1.TaskPriority.HIGH,
                    estimateHours: 24,
                    fraction: 0.50,
                },
                {
                    teamType: Team_1.TeamType.FRONTEND,
                    title: `Frontend: State Management & Core User Flows`,
                    description: `Implement client-side views, input validation, authentication guards, and state persistence for ${title}.`,
                    priority: Task_1.TaskPriority.HIGH,
                    estimateHours: 30,
                    fraction: 0.75,
                },
                {
                    teamType: Team_1.TeamType.FRONTEND,
                    title: `Frontend: API Integration & Cross-Device Polish`,
                    description: `Wire up backend endpoints, handle loading/error states, and ensure full mobile responsiveness.`,
                    priority: Task_1.TaskPriority.HIGH,
                    estimateHours: 20,
                    fraction: 0.90,
                },
                {
                    teamType: Team_1.TeamType.BACKEND,
                    title: `Backend: Database Models & Architecture Setup`,
                    description: `Define relational schemas, foreign keys, migrations, and seed initial records for ${title}.`,
                    priority: Task_1.TaskPriority.HIGH,
                    estimateHours: 18,
                    fraction: 0.35,
                },
                {
                    teamType: Team_1.TeamType.BACKEND,
                    title: `Backend: REST API Endpoints & Business Logic`,
                    description: `Develop secure CRUD routes, controller validations, access controls, and core functionality for ${title}.`,
                    priority: Task_1.TaskPriority.CRITICAL,
                    estimateHours: 35,
                    fraction: 0.70,
                },
                {
                    teamType: Team_1.TeamType.BACKEND,
                    title: `Backend: Third-Party Integrations & Automated Testing`,
                    description: `Integrate Telegram/webhooks, unit & integration test suites, and deploy to staging.`,
                    priority: Task_1.TaskPriority.HIGH,
                    estimateHours: 20,
                    fraction: 0.88,
                },
            ];
            // Counters to distribute tasks evenly across team developers
            const devCounters = {
                [Team_1.TeamType.UI_UX]: 0,
                [Team_1.TeamType.FRONTEND]: 0,
                [Team_1.TeamType.BACKEND]: 0,
            };
            for (const tpl of templateTasks) {
                const team = createdTeams[tpl.teamType];
                const teamDevs = devsBySpecialty[tpl.teamType];
                let assignedDev = null;
                if (teamDevs && teamDevs.length > 0) {
                    const idx = devCounters[tpl.teamType] % teamDevs.length;
                    assignedDev = teamDevs[idx];
                    devCounters[tpl.teamType]++;
                }
                else if (orgDevelopers.length > 0) {
                    // Fallback to any developer if team specialty is empty
                    assignedDev = orgDevelopers[0];
                }
                const taskDeadline = new Date(start.getTime() + Math.floor(totalSpanMs * tpl.fraction));
                const task = new Task_1.Task();
                task.projectId = project.id;
                task.teamId = team.id;
                task.assigneeId = assignedDev ? assignedDev.id : null;
                task.title = tpl.title;
                task.description = tpl.description;
                task.priority = tpl.priority;
                task.estimateHours = tpl.estimateHours;
                task.status = Task_1.TaskStatus.TODO;
                task.deadline = taskDeadline;
                await taskRepository.save(task);
                // Send instant Telegram notification to the builder!
                if (assignedDev && assignedDev.telegramId) {
                    telegramService_1.telegramService.notifyTaskAssigned(assignedDev, task, project, team.name).catch(err => {
                        console.error('Telegram notification error for user', assignedDev?.id, err);
                    });
                }
            }
        }
        const fullProject = await projectRepository.findOne({
            where: { id: project.id },
            relations: ['teams', 'teams.members', 'tasks', 'tasks.assignee'],
        });
        res.status(201).json({
            message: 'Project created and automatically broken down into teams & tasks successfully!',
            project: fullProject,
        });
    }
    catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.createProject = createProject;
const getProjects = async (req, res) => {
    try {
        const projects = await projectRepository.find({
            where: { orgId: req.orgId },
            relations: ['teams', 'tasks', 'tasks.assignee'],
            order: { createdAt: 'DESC' },
        });
        res.json({ projects });
    }
    catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getProjects = getProjects;
const getProject = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await projectRepository.findOne({
            where: { id: parseInt(id), orgId: req.orgId },
            relations: ['teams', 'teams.members', 'milestones', 'tasks', 'tasks.assignee', 'repositories'],
        });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json({ project });
    }
    catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getProject = getProject;
const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, goals, techStack, startDate, deadline, status, health } = req.body;
        const project = await projectRepository.findOne({
            where: { id: parseInt(id), orgId: req.orgId },
        });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        if (title)
            project.title = title;
        if (description !== undefined)
            project.description = description;
        if (goals !== undefined)
            project.goals = goals;
        if (techStack !== undefined)
            project.techStack = techStack;
        if (startDate !== undefined)
            project.startDate = startDate ? new Date(startDate) : null;
        if (deadline !== undefined)
            project.deadline = deadline ? new Date(deadline) : null;
        if (status)
            project.status = status;
        if (health)
            project.health = health;
        await projectRepository.save(project);
        res.json({
            message: 'Project updated successfully',
            project,
        });
    }
    catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updateProject = updateProject;
const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await projectRepository.findOne({
            where: { id: parseInt(id), orgId: req.orgId },
        });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        await projectRepository.remove(project);
        res.json({ message: 'Project deleted successfully' });
    }
    catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.deleteProject = deleteProject;
const getProjectStats = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await projectRepository.findOne({
            where: { id: parseInt(id), orgId: req.orgId },
        });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        const tasks = await taskRepository.find({ where: { projectId: parseInt(id) } });
        const teams = await teamRepository.find({ where: { projectId: parseInt(id) } });
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === Task_1.TaskStatus.DONE).length;
        const inProgressTasks = tasks.filter(t => t.status === Task_1.TaskStatus.IN_PROGRESS).length;
        const inReviewTasks = tasks.filter(t => t.status === Task_1.TaskStatus.IN_REVIEW).length;
        const blockedTasks = tasks.filter(t => t.status === Task_1.TaskStatus.BLOCKED).length;
        res.json({
            stats: {
                totalTasks,
                completedTasks,
                inProgressTasks,
                inReviewTasks,
                blockedTasks,
                taskCompletionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
                totalTeams: teams.length,
            },
        });
    }
    catch (error) {
        console.error('Get project stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getProjectStats = getProjectStats;
// Check upcoming deadlines and send Telegram notifications to developers
const checkProjectDeadlines = async (req, res) => {
    try {
        const { id } = req.params;
        const where = { status: Task_1.TaskStatus.TODO };
        const tasks = await taskRepository.find({
            where: id ? { projectId: parseInt(id) } : {},
            relations: ['assignee', 'project'],
        });
        const now = Date.now();
        let notificationsSent = 0;
        const alertResults = [];
        for (const task of tasks) {
            if (task.status === Task_1.TaskStatus.DONE)
                continue;
            if (!task.deadline || !task.assignee)
                continue;
            const dueMs = new Date(task.deadline).getTime();
            const diffHours = (dueMs - now) / (1000 * 60 * 60);
            // Alert if due within 48 hours, or overdue
            if (diffHours <= 48) {
                if (task.assignee.telegramId) {
                    const sent = await telegramService_1.telegramService.notifyDeadlineAlert(task.assignee, task, task.project, diffHours);
                    if (sent)
                        notificationsSent++;
                }
                alertResults.push({
                    taskId: task.id,
                    taskTitle: task.title,
                    assignee: task.assignee.name,
                    phone: task.assignee.phone,
                    telegramId: task.assignee.telegramId,
                    hoursRemaining: Math.round(diffHours),
                });
            }
        }
        res.json({
            message: `Scanned tasks. Sent ${notificationsSent} Telegram deadline alerts.`,
            notificationsSent,
            alertResults,
        });
    }
    catch (error) {
        console.error('Check deadlines error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.checkProjectDeadlines = checkProjectDeadlines;
