"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const dotenv_1 = __importDefault(require("dotenv"));
const data_source_1 = require("../config/data-source");
const Organization_1 = require("../entities/Organization");
const User_1 = require("../entities/User");
const Project_1 = require("../entities/Project");
const Team_1 = require("../entities/Team");
const TeamMember_1 = require("../entities/TeamMember");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
dotenv_1.default.config();
async function seed() {
    await data_source_1.AppDataSource.initialize();
    console.log("Database connected for seeding...");
    const orgRepo = data_source_1.AppDataSource.getRepository(Organization_1.Organization);
    const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
    const projectRepo = data_source_1.AppDataSource.getRepository(Project_1.Project);
    const teamRepo = data_source_1.AppDataSource.getRepository(Team_1.Team);
    const teamMemberRepo = data_source_1.AppDataSource.getRepository(TeamMember_1.TeamMember);
    // 1. Create Organization
    let org = await orgRepo.findOne({ where: { name: "Enterprise Corp" } });
    if (!org) {
        org = orgRepo.create({ name: "Enterprise Corp" });
        await orgRepo.save(org);
    }
    // 2. Create Admin User (from .env)
    const adminEmail = process.env.ADMIN_EMAIL || "admin@enterprise.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "supersecureadminpass";
    const salt = await bcryptjs_1.default.genSalt(10);
    const adminPasswordHash = await bcryptjs_1.default.hash(adminPassword, salt);
    let admin = await userRepo.findOne({ where: { email: adminEmail.toLowerCase().trim() } });
    if (!admin) {
        admin = userRepo.create({
            orgId: org.id,
            email: adminEmail.toLowerCase().trim(),
            passwordHash: adminPasswordHash,
            name: "Admin User",
            role: User_1.UserRole.ADMIN,
            status: User_1.UserStatus.ACTIVE,
            githubUsername: "admin-user",
        });
        await userRepo.save(admin);
    }
    else {
        // Update password if user already exists
        admin.passwordHash = adminPasswordHash;
        admin.role = User_1.UserRole.ADMIN;
        admin.status = User_1.UserStatus.ACTIVE;
        await userRepo.save(admin);
    }
    // 3. Create Project Manager User (from .env)
    const pmEmail = process.env.PM_EMAIL || "pm@enterprise.com";
    const pmPassword = process.env.PM_PASSWORD || "supersecurepmepassS";
    const pmPasswordHash = await bcryptjs_1.default.hash(pmPassword, salt);
    let pm = await userRepo.findOne({ where: { email: pmEmail.toLowerCase().trim() } });
    if (!pm) {
        pm = userRepo.create({
            orgId: org.id,
            email: pmEmail.toLowerCase().trim(),
            passwordHash: pmPasswordHash,
            name: "Project Manager",
            role: User_1.UserRole.MANAGER,
            status: User_1.UserStatus.ACTIVE,
            githubUsername: "pm-user",
        });
        await userRepo.save(pm);
    }
    else {
        // Update password if user already exists
        pm.passwordHash = pmPasswordHash;
        pm.role = User_1.UserRole.MANAGER;
        pm.status = User_1.UserStatus.ACTIVE;
        await userRepo.save(pm);
    }
    // 4. Create Dedicated Enterprise Developers
    const seedDevs = [
        {
            name: "Alex Mercer",
            email: "alex.mercer@enterprise.com",
            specialty: "Frontend",
            githubUsername: "alexmercer-dev",
            teamIndex: 0, // Frontend Team
        },
        {
            name: "David Kim",
            email: "david.kim@enterprise.com",
            specialty: "Backend",
            githubUsername: "dkim-backend",
            teamIndex: 1, // Backend Team
        },
        {
            name: "Elena Rostova",
            email: "elena.rostova@enterprise.com",
            specialty: "UI/UX",
            githubUsername: "elenar-design",
            teamIndex: 2, // UI/UX Team
        },
        {
            name: "Marcus Vance",
            email: "marcus.vance@enterprise.com",
            specialty: "AI",
            githubUsername: "marcusv-ai",
            teamIndex: 3, // AI Team
        },
    ];
    const defaultDevPass = process.env.DEFAULT_DEV_PASSWORD || "Developer123!";
    const devPassHash = await bcryptjs_1.default.hash(defaultDevPass, salt);
    const createdDevUsers = [];
    for (const devInfo of seedDevs) {
        let dev = await userRepo.findOne({ where: { email: devInfo.email.toLowerCase().trim() } });
        if (!dev) {
            dev = userRepo.create({
                orgId: org.id,
                email: devInfo.email.toLowerCase().trim(),
                passwordHash: devPassHash,
                name: devInfo.name,
                role: User_1.UserRole.DEVELOPER,
                status: User_1.UserStatus.ACTIVE,
                specialty: devInfo.specialty,
                githubUsername: devInfo.githubUsername,
            });
            await userRepo.save(dev);
        }
        createdDevUsers.push(dev);
    }
    let project = await projectRepo.findOne({ where: { name: "NextGen Platform" } });
    if (!project) {
        project = projectRepo.create({
            orgId: org.id,
            name: "NextGen Platform",
            description: "High-performance enterprise project management system.",
            updateIntervalDays: 7,
        });
        await projectRepo.save(project);
    }
    // 6. Create default teams
    const defaultTeams = ["Frontend Team", "Backend Team", "UI/UX Team", "AI Team"];
    const createdTeams = [];
    for (const teamName of defaultTeams) {
        let team = await teamRepo.findOne({ where: { name: teamName } });
        if (!team) {
            team = teamRepo.create({
                orgId: org.id,
                projectId: project.id,
                name: teamName,
                deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            });
            await teamRepo.save(team);
        }
        createdTeams.push(team);
    }
    // 7. Add Admin and PM to all teams as leads
    for (const team of createdTeams) {
        const adminMember = await teamMemberRepo.findOne({ where: { teamId: team.id, userId: admin.id } });
        if (!adminMember) {
            const tm = teamMemberRepo.create({ teamId: team.id, userId: admin.id, isLead: true });
            await teamMemberRepo.save(tm);
        }
        const pmMember = await teamMemberRepo.findOne({ where: { teamId: team.id, userId: pm.id } });
        if (!pmMember) {
            const tm = teamMemberRepo.create({ teamId: team.id, userId: pm.id, isLead: true });
            await teamMemberRepo.save(tm);
        }
    }
    // 8. Add Developers to their corresponding specialized teams
    for (let i = 0; i < createdDevUsers.length; i++) {
        const dev = createdDevUsers[i];
        const targetTeam = createdTeams[seedDevs[i].teamIndex];
        if (targetTeam) {
            const existingTm = await teamMemberRepo.findOne({ where: { teamId: targetTeam.id, userId: dev.id } });
            if (!existingTm) {
                const tm = teamMemberRepo.create({ teamId: targetTeam.id, userId: dev.id, isLead: false });
                await teamMemberRepo.save(tm);
            }
        }
    }
    console.log("Seeding completed successfully!");
    process.exit(0);
}
seed().catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
});
