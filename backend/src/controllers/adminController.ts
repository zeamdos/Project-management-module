import { Response } from "express";
import { AppDataSource } from "../config/data-source";
import { AuthRequest } from "../middleware/auth";
import { User, UserRole, UserStatus } from "../entities/User";
import { Organization } from "../entities/Organization";
import { Skill } from "../entities/Skill";
import { UserSkill } from "../entities/UserSkill";
import { AuditService } from "../services/AuditService";
import { NotificationService } from "../services/NotificationService";
import bcrypt from "bcryptjs";

const DEFAULT_ORG_NAME = "Enterprise HQ";

async function getOrg(): Promise<Organization> {
  const repo = AppDataSource.getRepository(Organization);
  let org = await repo.findOne({ where: { name: DEFAULT_ORG_NAME } });
  if (!org) {
    org = repo.create({ name: DEFAULT_ORG_NAME });
    await repo.save(org);
  }
  return org;
}

function generateTempPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%";
  const all = upper + lower + digits + symbols;
  let pwd =
    upper[Math.floor(Math.random() * upper.length)] +
    lower[Math.floor(Math.random() * lower.length)] +
    digits[Math.floor(Math.random() * digits.length)] +
    symbols[Math.floor(Math.random() * symbols.length)];
  for (let i = 4; i < 12; i++) pwd += all[Math.floor(Math.random() * all.length)];
  return pwd.split("").sort(() => Math.random() - 0.5).join("");
}

function sanitizeUser(u: User) {
  return {
    id: u.id,
    orgId: u.orgId,
    name: u.name,
    email: u.email,
    role: u.role,
    department: u.department,
    team: u.team,
    specialty: u.specialty,
    assignedPmId: u.assignedPmId,
    status: u.status,
    githubUsername: u.githubUsername,
    phoneNumber: u.phoneNumber,
    telegramChatId: u.telegramChatId,
    telegramLinked: !!u.telegramChatId,
    notifyInApp: u.notifyInApp,
    notifyTelegram: u.notifyTelegram,
    notifyEmail: u.notifyEmail,
    failedLoginAttempts: u.failedLoginAttempts,
    lockedUntil: u.lockedUntil,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

export class AdminController {
  // GET /api/admin/users  — full org roster
  static async listUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const users = await AppDataSource.getRepository(User).find({
        where: { orgId: req.user!.orgId },
        order: { id: "ASC" },
      });
      res.json({ users: users.map(sanitizeUser) });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // POST /api/admin/users  — provision a new account (Admin only)
  static async createUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, email, role, specialty, githubUsername, phoneNumber, department, team, assignedPmId, skills } = req.body;

      if (!name || !email || !role) {
        res.status(400).json({ error: "name, email and role are required." });
        return;
      }

      const normalizedEmail = String(email).toLowerCase().trim();

      const existing = await AppDataSource.getRepository(User).findOne({
        where: { email: normalizedEmail },
      });
      if (existing) {
        res.status(409).json({ error: "An account with this email already exists." });
        return;
      }

      // Validate role
      const allowedRoles = [UserRole.DEVELOPER, UserRole.MANAGER, UserRole.TEAM_LEAD, UserRole.ADMIN];
      if (!allowedRoles.includes(role as UserRole)) {
        res.status(400).json({ error: `Role must be one of: ${allowedRoles.join(", ")}` });
        return;
      }

      const org = await getOrg();
      const tempPassword = generateTempPassword();
      const passwordHash = await bcrypt.hash(tempPassword, 12);

      // Handle skills in a transaction
      const newUser = await AppDataSource.transaction(async (manager) => {
        const userRepo = manager.getRepository(User);
        const skillRepo = manager.getRepository(Skill);
        const userSkillRepo = manager.getRepository(UserSkill);

        const created = userRepo.create({
          orgId: org.id,
          name: String(name).trim(),
          email: normalizedEmail,
          passwordHash,
          role: role as UserRole,
          status: UserStatus.ACTIVE,
          specialty: specialty || null,
          assignedPmId: assignedPmId ? Number(assignedPmId) : null,
          department: department || null,
          team: team || null,
          githubUsername: githubUsername || null,
          phoneNumber: phoneNumber || null,
        });

        await userRepo.save(created);

        // Add skills if provided
        if (Array.isArray(skills) && skills.length > 0) {
          const skillNames = Array.from(new Set(skills.map((s: any) => String(s).trim()).filter(Boolean)));

          for (const skillName of skillNames) {
            let skill = await skillRepo.findOne({ where: { name: skillName, orgId: org.id } });
            if (!skill) {
              skill = skillRepo.create({ name: skillName, orgId: org.id });
              await skillRepo.save(skill);
            }

            const existingLink = await userSkillRepo.findOne({
              where: { userId: created.id, skillId: skill.id }
            });
            if (!existingLink) {
              await userSkillRepo.save({
                userId: created.id,
                skillId: skill.id,
                orgId: org.id
              });
            }
          }
        }

        return created;
      });

      await AuditService.log(
        org.id,
        req.user!.id,
        "USER_PROVISIONED",
        "User",
        newUser.id,
        `Admin provisioned account for ${newUser.name} (${newUser.email}) with role ${role}`
      );

      // Notify the new user if email is configured
      try {
        await NotificationService.notifyUser(
          newUser,
          `Welcome to NEXUS Enterprise, ${newUser.name}!\n\nYour account has been provisioned by the system administrator.\n\nLogin: ${normalizedEmail}\nTemporary Password: ${tempPassword}\n\nYou will be required to change your password on first sign-in.`,
          "GENERAL"
        );
      } catch {
        // Notification failure is non-fatal
      }

      res.status(201).json({
        message: "Account provisioned successfully.",
        user: sanitizeUser(newUser),
        tempPassword, // Admin receives this to share with the new employee
      });
    } catch (err: any) {
      console.error("AdminController.createUser:", err);
      res.status(500).json({ error: err.message });
    }
  }

  // PATCH /api/admin/users/:id  — update name, role, status, specialty, assigned PM, etc.
  static async updateUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const targetId = Number(req.params.id);
      const userRepo = AppDataSource.getRepository(User);

      const target = await userRepo.findOne({
        where: { id: targetId, orgId: req.user!.orgId },
      });
      if (!target) {
        res.status(404).json({ error: "User not found in your organization." });
        return;
      }

      const {
        name,
        role,
        status,
        specialty,
        assignedPmId,
        department,
        team,
        githubUsername,
        phoneNumber,
        notifyInApp,
        notifyTelegram,
        notifyEmail,
      } = req.body;

      if (name !== undefined) target.name = String(name).trim();
      if (role !== undefined) {
        const allowedRoles = [UserRole.DEVELOPER, UserRole.MANAGER, UserRole.TEAM_LEAD, UserRole.ADMIN];
        if (!allowedRoles.includes(role as UserRole)) {
          res.status(400).json({ error: "Invalid role." });
          return;
        }
        target.role = role as UserRole;
      }
      if (status !== undefined) {
        if (![UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.SUSPENDED].includes(status)) {
          res.status(400).json({ error: "Invalid status." });
          return;
        }
        // Safety: can't deactivate last admin
        if (status !== UserStatus.ACTIVE && target.role === UserRole.ADMIN) {
          const adminCount = await userRepo.count({
            where: { orgId: req.user!.orgId, role: UserRole.ADMIN, status: UserStatus.ACTIVE },
          });
          if (adminCount <= 1) {
            res.status(400).json({ error: "Cannot deactivate the sole Administrator." });
            return;
          }
        }
        target.status = status;
      }
      if (specialty !== undefined) target.specialty = specialty || null;
      if (assignedPmId !== undefined) {
        target.assignedPmId = assignedPmId ? Number(assignedPmId) : null;
      }
      if (department !== undefined) target.department = department || null;
      if (team !== undefined) target.team = team || null;
      if (githubUsername !== undefined) target.githubUsername = githubUsername || null;
      if (phoneNumber !== undefined) target.phoneNumber = phoneNumber || null;
      if (notifyInApp !== undefined) target.notifyInApp = Boolean(notifyInApp);
      if (notifyTelegram !== undefined) target.notifyTelegram = Boolean(notifyTelegram);
      if (notifyEmail !== undefined) target.notifyEmail = Boolean(notifyEmail);

      await userRepo.save(target);

      await AuditService.log(
        req.user!.orgId,
        req.user!.id,
        "USER_UPDATED",
        "User",
        target.id,
        `Admin updated profile for ${target.name}`
      );

      res.json({ message: "User updated.", user: sanitizeUser(target) });
    } catch (err: any) {
      console.error("AdminController.updateUser:", err);
      res.status(500).json({ error: err.message });
    }
  }

  // POST /api/admin/users/:id/reset-password  — Admin resets any user's password
  static async resetPassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const targetId = Number(req.params.id);
      const userRepo = AppDataSource.getRepository(User);

      const target = await userRepo.findOne({
        where: { id: targetId, orgId: req.user!.orgId },
      });
      if (!target) {
        res.status(404).json({ error: "User not found." });
        return;
      }

      const tempPassword = generateTempPassword();
      target.passwordHash = await bcrypt.hash(tempPassword, 12);
      target.failedLoginAttempts = 0;
      target.lockedUntil = null;
      await userRepo.save(target);

      await AuditService.log(
        req.user!.orgId,
        req.user!.id,
        "PASSWORD_RESET_BY_ADMIN",
        "User",
        target.id,
        `Admin reset password for ${target.name} (${target.email})`
      );

      try {
        await NotificationService.notifyUser(
          target,
          `Your password for NEXUS Enterprise has been reset by an administrator.\n\nNew temporary password: ${tempPassword}\n\nPlease sign in and change your password immediately.`,
          "GENERAL"
        );
      } catch {
        // non-fatal
      }

      res.json({
        message: `Password reset for ${target.name}.`,
        tempPassword, // Admin shares this securely with the employee
      });
    } catch (err: any) {
      console.error("AdminController.resetPassword:", err);
      res.status(500).json({ error: err.message });
    }
  }

  // DELETE /api/admin/users/:id  — Soft-delete (sets INACTIVE)
  static async deactivateUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const targetId = Number(req.params.id);
      const userRepo = AppDataSource.getRepository(User);

      const target = await userRepo.findOne({
        where: { id: targetId, orgId: req.user!.orgId },
      });
      if (!target) {
        res.status(404).json({ error: "User not found." });
        return;
      }
      if (target.id === req.user!.id) {
        res.status(400).json({ error: "You cannot deactivate your own account." });
        return;
      }
      if (target.role === UserRole.ADMIN) {
        const adminCount = await userRepo.count({
          where: { orgId: req.user!.orgId, role: UserRole.ADMIN, status: UserStatus.ACTIVE },
        });
        if (adminCount <= 1) {
          res.status(400).json({ error: "Cannot deactivate the sole Administrator." });
          return;
        }
      }

      target.status = UserStatus.INACTIVE;
      await userRepo.save(target);

      await AuditService.log(
        req.user!.orgId,
        req.user!.id,
        "USER_DEACTIVATED",
        "User",
        target.id,
        `Admin deactivated account for ${target.name} (${target.email})`
      );

      res.json({ message: `Account for ${target.name} deactivated.` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // POST /api/me/change-password  — Any authenticated user changes their own password
  static async changePassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(400).json({ error: "currentPassword and newPassword are required." });
        return;
      }

      if (newPassword.length < 10) {
        res.status(400).json({ error: "New password must be at least 10 characters." });
        return;
      }
      if (!/[A-Z]/.test(newPassword)) {
        res.status(400).json({ error: "New password must include an uppercase letter." });
        return;
      }
      if (!/[a-z]/.test(newPassword)) {
        res.status(400).json({ error: "New password must include a lowercase letter." });
        return;
      }
      if (!/[0-9]/.test(newPassword)) {
        res.status(400).json({ error: "New password must include a number." });
        return;
      }
      if (!/[^A-Za-z0-9]/.test(newPassword)) {
        res.status(400).json({ error: "New password must include a special character." });
        return;
      }

      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo
        .createQueryBuilder("user")
        .addSelect("user.passwordHash")
        .where("user.id = :id", { id: req.user!.id })
        .getOne();

      if (!user) {
        res.status(404).json({ error: "User not found." });
        return;
      }

      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({ error: "Current password is incorrect." });
        return;
      }

      user.passwordHash = await bcrypt.hash(newPassword, 12);
      user.failedLoginAttempts = 0;
      user.lockedUntil = null;
      await userRepo.save(user);

      await AuditService.log(
        user.orgId,
        user.id,
        "PASSWORD_CHANGED",
        "User",
        user.id,
        "User changed their own password"
      );

      res.json({ message: "Password changed successfully." });
    } catch (err: any) {
      console.error("changePassword error:", err);
      res.status(500).json({ error: err.message });
    }
  }
}
