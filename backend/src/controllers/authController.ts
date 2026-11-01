import { Request, Response } from "express";
import { DeepPartial } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { User, UserRole, UserStatus } from "../entities/User";
import { Organization } from "../entities/Organization";
import { Skill } from "../entities/Skill";
import { UserSkill } from "../entities/UserSkill";
import { AuditService } from "../services/AuditService";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Must match the organization created by seedMasterUsers() in index.ts,
// otherwise developers and the PM end up in different organizations.
const DEFAULT_ORG_NAME = "Enterprise HQ";

const TEAMS = ["Frontend", "Backend", "UI/UX", "AI"];

const envAdminEmail = () => (process.env.ADMIN_EMAIL || "admin@enterprise.com").toLowerCase().trim();
const envPmEmail = () => (process.env.PM_EMAIL || "pm@enterprise.com").toLowerCase().trim();

async function getDefaultOrg(): Promise<Organization> {
  const orgRepo = AppDataSource.getRepository(Organization);
  let org = await orgRepo.findOne({ where: { name: DEFAULT_ORG_NAME } });
  if (!org) {
    org = orgRepo.create({ name: DEFAULT_ORG_NAME });
    await orgRepo.save(org);
  }
  return org;
}

// Some tables (like skills) carry an orgId column that cannot be empty.
function hasOrgColumn(entity: any): boolean {
  return !!AppDataSource.getMetadata(entity).findColumnWithPropertyName("orgId");
}

// Accepts "zeamdos", "@zeamdos" or "https://github.com/zeamdos" and returns "zeamdos".
function cleanGithubUsername(input: unknown): string | null {
  const raw = String(input ?? "").trim().replace(/^@/, "");
  if (!raw) return null;
  const match = raw.match(/github\.com\/([^/?#\s]+)/i);
  return (match ? match[1] : raw) || null;
}

function publicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    orgId: user.orgId,
    specialty: user.specialty,
    telegramLinked: !!user.telegramChatId,
  };
}

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name, specialty, skills, githubUsername, githubToken, phoneNumber } = req.body;

      if (!email || !password || !name || !specialty) {
        res.status(400).json({ error: "Name, email, password and team are required" });
        return;
      }
      if (!TEAMS.includes(specialty)) {
        res.status(400).json({ error: `Team must be one of: ${TEAMS.join(", ")}` });
        return;
      }
      if (String(password).length < 8) {
        res.status(400).json({ error: "Password must be at least 8 characters" });
        return;
      }

      const normalizedEmail = String(email).toLowerCase().trim();

      // Admin and PM accounts come from .env only. Nobody can register with those emails.
      if (normalizedEmail === envAdminEmail() || normalizedEmail === envPmEmail()) {
        res.status(403).json({ error: "This email is reserved. Please sign in instead." });
        return;
      }

      const existingUser = await AppDataSource.getRepository(User).findOne({ where: { email: normalizedEmail } });
      if (existingUser) {
        res.status(400).json({ error: "Email already registered" });
        return;
      }

      const organization = await getDefaultOrg();
      const passwordHash = await bcrypt.hash(String(password), 10);
      const skillNames = Array.from(
        new Set((Array.isArray(skills) ? skills : []).map((s: any) => String(s).trim()).filter(Boolean))
      ) as string[];

      // Everything below succeeds together or not at all, so a failed signup never leaves a half-made account.
      const user = await AppDataSource.transaction(async (manager) => {
        const userRepo = manager.getRepository(User);
        const skillRepo = manager.getRepository(Skill);
        const userSkillRepo = manager.getRepository(UserSkill);

        const created = await userRepo.save(
          userRepo.create({
            orgId: organization.id,
            email: normalizedEmail,
            passwordHash,
            name: String(name).trim(),
            role: UserRole.DEVELOPER,
            status: UserStatus.ACTIVE,
            specialty,
            githubUsername: cleanGithubUsername(githubUsername),
            githubToken: githubToken || null,
            phoneNumber: phoneNumber || null,
          })
        );

        const skillsHaveOrg = hasOrgColumn(Skill);
        const userSkillsHaveOrg = hasOrgColumn(UserSkill);

        for (const skillName of skillNames) {
          const skillWhere: any = skillsHaveOrg ? { name: skillName, orgId: organization.id } : { name: skillName };
          let skill = await skillRepo.findOne({ where: skillWhere });
          if (!skill) {
            const skillData = (skillsHaveOrg ? { name: skillName, orgId: organization.id } : { name: skillName }) as DeepPartial<Skill>;
            skill = await skillRepo.save(skillRepo.create(skillData));
          }

          const linkData = (
            userSkillsHaveOrg
              ? { userId: created.id, skillId: skill.id, orgId: organization.id }
              : { userId: created.id, skillId: skill.id }
          ) as DeepPartial<UserSkill>;
          await userSkillRepo.save(userSkillRepo.create(linkData));
        }

        return created;
      });

      await AuditService.log(
        organization.id,
        user.id,
        "REGISTER",
        "User",
        user.id,
        `Developer registered in the ${specialty} team`
      );

      res.status(201).json({
        message: "User registered successfully",
        userId: user.id,
        role: user.role,
        specialty: user.specialty,
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({ error: error.message || "Internal server error during registration" });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const email = String(req.body.email || "").toLowerCase().trim();
      const password = String(req.body.password || "");

      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
      }

      const userRepo = AppDataSource.getRepository(User);

      // passwordHash is select:false on the entity, so it must be requested explicitly.
      const existing = await userRepo
        .createQueryBuilder("user")
        .addSelect("user.passwordHash")
        .where("user.email = :email", { email })
        .getOne();

      // Does this login match the .env admin / PM credentials?
      let envRole: UserRole | null = null;
      let envName = "";
      if (email === envAdminEmail() && password === process.env.ADMIN_PASSWORD) {
        envRole = UserRole.ADMIN;
        envName = "Master Admin";
      } else if (email === envPmEmail() && password === process.env.PM_PASSWORD) {
        envRole = UserRole.MANAGER;
        envName = "Project Manager";
      }

      let account: User;

      if (envRole) {
        if (!existing) {
          const org = await getDefaultOrg();
          account = userRepo.create({
            orgId: org.id,
            email,
            passwordHash: await bcrypt.hash(password, 10),
            name: envName,
            role: envRole,
            status: UserStatus.ACTIVE,
          });
          await userRepo.save(account);
        } else {
          account = existing;
          const sameHash = account.passwordHash ? await bcrypt.compare(password, account.passwordHash) : false;
          if (!sameHash || account.role !== envRole) {
            account.passwordHash = await bcrypt.hash(password, 10);
            account.role = envRole;
            await userRepo.save(account);
          }
        }
      } else {
        if (!existing || !existing.passwordHash) {
          res.status(401).json({ error: "Invalid email or password" });
          return;
        }
        const isMatch = await bcrypt.compare(password, existing.passwordHash);
        if (!isMatch) {
          res.status(401).json({ error: "Invalid email or password" });
          return;
        }
        account = existing;
      }

      if (account.status !== UserStatus.ACTIVE) {
        res.status(403).json({ error: "This account is not active. Contact your admin." });
        return;
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        res.status(500).json({ error: "JWT_SECRET is not set in .env" });
        return;
      }

      const token = jwt.sign(
        { id: account.id, orgId: account.orgId, role: account.role, email: account.email },
        secret,
        { expiresIn: "1d" }
      );

      res.json({ token, user: publicUser(account) });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ error: error.message });
    }
  }
}