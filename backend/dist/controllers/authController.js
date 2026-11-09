"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const data_source_1 = require("../config/data-source");
const User_1 = require("../entities/User");
const Organization_1 = require("../entities/Organization");
const Skill_1 = require("../entities/Skill");
const UserSkill_1 = require("../entities/UserSkill");
const AuditService_1 = require("../services/AuditService");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Must match the organization created by seedMasterUsers() in index.ts,
// otherwise developers and the PM end up in different organizations.
const DEFAULT_ORG_NAME = "Enterprise HQ";
const TEAMS = ["Frontend", "Backend", "UI/UX", "AI"];
function passwordError(password) {
    if (password.length < 10)
        return "Password must be at least 10 characters.";
    if (!/[A-Z]/.test(password))
        return "Password must include an uppercase letter.";
    if (!/[a-z]/.test(password))
        return "Password must include a lowercase letter.";
    if (!/[0-9]/.test(password))
        return "Password must include a number.";
    if (!/[^A-Za-z0-9]/.test(password))
        return "Password must include a symbol.";
    return null;
}
const envAdminEmail = () => (process.env.ADMIN_EMAIL || "admin@enterprise.com").toLowerCase().trim();
const envPmEmail = () => (process.env.PM_EMAIL || "pm@enterprise.com").toLowerCase().trim();
async function getDefaultOrg() {
    const orgRepo = data_source_1.AppDataSource.getRepository(Organization_1.Organization);
    let org = await orgRepo.findOne({ where: { name: DEFAULT_ORG_NAME } });
    if (!org) {
        org = orgRepo.create({ name: DEFAULT_ORG_NAME });
        await orgRepo.save(org);
    }
    return org;
}
// Some tables (like skills) carry an orgId column that cannot be empty.
function hasOrgColumn(entity) {
    return !!data_source_1.AppDataSource.getMetadata(entity).findColumnWithPropertyName("orgId");
}
// Accepts "zeamdos", "@zeamdos" or "https://github.com/zeamdos" and returns "zeamdos".
function cleanGithubUsername(input) {
    const raw = String(input ?? "").trim().replace(/^@/, "");
    if (!raw)
        return null;
    const match = raw.match(/github\.com\/([^/?#\s]+)/i);
    return (match ? match[1] : raw) || null;
}
function publicUser(user) {
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
class AuthController {
    static async register(req, res) {
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
            const pwdProblem = passwordError(String(password));
            if (pwdProblem) {
                res.status(400).json({ error: pwdProblem });
                return;
            }
            const normalizedEmail = String(email).toLowerCase().trim();
            // Admin and PM accounts come from .env only. Nobody can register with those emails.
            if (normalizedEmail === envAdminEmail() || normalizedEmail === envPmEmail()) {
                res.status(403).json({ error: "This email is reserved. Please sign in instead." });
                return;
            }
            const existingUser = await data_source_1.AppDataSource.getRepository(User_1.User).findOne({ where: { email: normalizedEmail } });
            if (existingUser) {
                res.status(400).json({ error: "Email already registered" });
                return;
            }
            const organization = await getDefaultOrg();
            const passwordHash = await bcryptjs_1.default.hash(String(password), 12);
            const skillNames = Array.from(new Set((Array.isArray(skills) ? skills : []).map((s) => String(s).trim()).filter(Boolean)));
            // Everything below succeeds together or not at all, so a failed signup never leaves a half-made account.
            const user = await data_source_1.AppDataSource.transaction(async (manager) => {
                const userRepo = manager.getRepository(User_1.User);
                const skillRepo = manager.getRepository(Skill_1.Skill);
                const userSkillRepo = manager.getRepository(UserSkill_1.UserSkill);
                const created = await userRepo.save(userRepo.create({
                    orgId: organization.id,
                    email: normalizedEmail,
                    passwordHash,
                    name: String(name).trim(),
                    role: User_1.UserRole.DEVELOPER,
                    status: User_1.UserStatus.ACTIVE,
                    specialty,
                    githubUsername: cleanGithubUsername(githubUsername),
                    githubToken: githubToken || null,
                    phoneNumber: phoneNumber || null,
                }));
                const skillsHaveOrg = hasOrgColumn(Skill_1.Skill);
                const userSkillsHaveOrg = hasOrgColumn(UserSkill_1.UserSkill);
                for (const skillName of skillNames) {
                    const skillWhere = skillsHaveOrg ? { name: skillName, orgId: organization.id } : { name: skillName };
                    let skill = await skillRepo.findOne({ where: skillWhere });
                    if (!skill) {
                        const skillData = (skillsHaveOrg ? { name: skillName, orgId: organization.id } : { name: skillName });
                        skill = await skillRepo.save(skillRepo.create(skillData));
                    }
                    const linkData = (userSkillsHaveOrg
                        ? { userId: created.id, skillId: skill.id, orgId: organization.id }
                        : { userId: created.id, skillId: skill.id });
                    await userSkillRepo.save(userSkillRepo.create(linkData));
                }
                return created;
            });
            await AuditService_1.AuditService.log(organization.id, user.id, "REGISTER", "User", user.id, `Developer registered in the ${specialty} team`);
            res.status(201).json({
                message: "User registered successfully",
                userId: user.id,
                role: user.role,
                specialty: user.specialty,
            });
        }
        catch (error) {
            console.error("Registration error:", error);
            res.status(500).json({ error: error.message || "Internal server error during registration" });
        }
    }
    static async login(req, res) {
        try {
            const email = String(req.body.email || "").toLowerCase().trim();
            const password = String(req.body.password || "");
            if (!email || !password) {
                res.status(400).json({ error: "Email and password are required" });
                return;
            }
            const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
            // passwordHash is select:false on the entity, so it must be requested explicitly.
            const existing = await userRepo
                .createQueryBuilder("user")
                .addSelect("user.passwordHash")
                .where("user.email = :email", { email })
                .getOne();
            // Does this login match the .env admin / PM credentials?
            let envRole = null;
            let envName = "";
            if (email === envAdminEmail() && password === process.env.ADMIN_PASSWORD) {
                envRole = User_1.UserRole.ADMIN;
                envName = "Master Admin";
            }
            else if (email === envPmEmail() && password === process.env.PM_PASSWORD) {
                envRole = User_1.UserRole.MANAGER;
                envName = "Project Manager";
            }
            let account;
            if (envRole) {
                if (!existing) {
                    const org = await getDefaultOrg();
                    account = userRepo.create({
                        orgId: org.id,
                        email,
                        passwordHash: await bcryptjs_1.default.hash(password, 10),
                        name: envName,
                        role: envRole,
                        status: User_1.UserStatus.ACTIVE,
                    });
                    await userRepo.save(account);
                }
                else {
                    account = existing;
                    const sameHash = account.passwordHash ? await bcryptjs_1.default.compare(password, account.passwordHash) : false;
                    if (!sameHash || account.role !== envRole) {
                        account.passwordHash = await bcryptjs_1.default.hash(password, 10);
                        account.role = envRole;
                        await userRepo.save(account);
                    }
                }
            }
            else {
                if (!existing || !existing.passwordHash) {
                    res.status(401).json({ error: "Invalid email or password" });
                    return;
                }
                if (existing.lockedUntil && existing.lockedUntil.getTime() > Date.now()) {
                    res.status(423).json({ error: "Account locked after too many failed sign-ins. Try again in 30 minutes." });
                    return;
                }
                const isMatch = await bcryptjs_1.default.compare(password, existing.passwordHash);
                if (!isMatch) {
                    existing.failedLoginAttempts = (existing.failedLoginAttempts || 0) + 1;
                    if (existing.failedLoginAttempts >= 5) {
                        existing.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
                        existing.failedLoginAttempts = 0;
                    }
                    await userRepo.save(existing);
                    res.status(401).json({ error: "Invalid email or password" });
                    return;
                }
                existing.failedLoginAttempts = 0;
                existing.lockedUntil = null;
                await userRepo.save(existing);
                account = existing;
            }
            if (account.status !== User_1.UserStatus.ACTIVE) {
                res.status(403).json({ error: "This account is not active. Contact your admin." });
                return;
            }
            const secret = process.env.JWT_SECRET;
            if (!secret) {
                res.status(500).json({ error: "JWT_SECRET is not set in .env" });
                return;
            }
            const token = jsonwebtoken_1.default.sign({ id: account.id, orgId: account.orgId, role: account.role, email: account.email }, secret, { expiresIn: "1d" });
            res.json({ token, user: publicUser(account) });
        }
        catch (error) {
            console.error("Login error:", error);
            res.status(500).json({ error: error.message });
        }
    }
}
exports.AuthController = AuthController;
