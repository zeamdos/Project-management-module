import "reflect-metadata";
import dotenv from "dotenv";
import { AppDataSource } from "../config/data-source";
import { Organization } from "../entities/Organization";
import { User, UserRole, UserStatus } from "../entities/User";
import { Project } from "../entities/Project";
import { Team } from "../entities/Team";
import { TeamMember } from "../entities/TeamMember";
import bcrypt from "bcryptjs";

dotenv.config();

async function seed() {
  await AppDataSource.initialize();
  console.log("Database connected for seeding...");

  const orgRepo = AppDataSource.getRepository(Organization);
  const userRepo = AppDataSource.getRepository(User);
  const projectRepo = AppDataSource.getRepository(Project);
  const teamRepo = AppDataSource.getRepository(Team);
  const teamMemberRepo = AppDataSource.getRepository(TeamMember);

  // 1. Create Organization
  let org = await orgRepo.findOne({ where: { name: "Enterprise Corp" } });
  if (!org) {
    org = orgRepo.create({ name: "Enterprise Corp" });
    await orgRepo.save(org);
  }

  // 2. Create Admin User (from .env)
  const adminEmail = process.env.ADMIN_EMAIL || "admin@enterprise.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "supersecureadminpass";
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash(adminPassword, salt);

  let admin = await userRepo.findOne({ where: { email: adminEmail.toLowerCase().trim() } });
  if (!admin) {
    admin = userRepo.create({
      orgId: org.id,
      email: adminEmail.toLowerCase().trim(),
      passwordHash: adminPasswordHash,
      name: "Admin User",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      githubUsername: "admin-user",
    });
    await userRepo.save(admin);
  } else {
    // Update password if user already exists
    admin.passwordHash = adminPasswordHash;
    admin.role = UserRole.ADMIN;
    admin.status = UserStatus.ACTIVE;
    await userRepo.save(admin);
  }

  // 3. Create Project Manager User (from .env)
  const pmEmail = process.env.PM_EMAIL || "pm@enterprise.com";
  const pmPassword = process.env.PM_PASSWORD || "supersecurepmepassS";
  const pmPasswordHash = await bcrypt.hash(pmPassword, salt);

  let pm = await userRepo.findOne({ where: { email: pmEmail.toLowerCase().trim() } });
  if (!pm) {
    pm = userRepo.create({
      orgId: org.id,
      email: pmEmail.toLowerCase().trim(),
      passwordHash: pmPasswordHash,
      name: "Project Manager",
      role: UserRole.MANAGER,
      status: UserStatus.ACTIVE,
      githubUsername: "pm-user",
    });
    await userRepo.save(pm);
  } else {
    // Update password if user already exists
    pm.passwordHash = pmPasswordHash;
    pm.role = UserRole.MANAGER;
    pm.status = UserStatus.ACTIVE;
    await userRepo.save(pm);
  }



  // 5. Create Project
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
  const createdTeams: Team[] = [];
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

  console.log("Seeding completed successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});