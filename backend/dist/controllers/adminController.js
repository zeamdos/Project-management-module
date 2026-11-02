"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const data_source_1 = require("../config/data-source");
const User_1 = require("../entities/User");
const Organization_1 = require("../entities/Organization");
const AuditService_1 = require("../services/AuditService");
const NotificationService_1 = require("../services/NotificationService");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const DEFAULT_ORG_NAME = "Enterprise HQ";
async function getOrg() {
    const repo = data_source_1.AppDataSource.getRepository(Organization_1.Organization);
    let org = await repo.findOne({ where: { name: DEFAULT_ORG_NAME } });
    if (!org) {
        org = repo.create({ name: DEFAULT_ORG_NAME });
        await repo.save(org);
    }
    return org;
}
function generateTempPassword() {
    const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lower = "abcdefghijkmnpqrstuvwxyz";
    const digits = "23456789";
    const symbols = "!@#$%";
    const all = upper + lower + digits + symbols;
    let pwd = upper[Math.floor(Math.random() * upper.length)] +
        lower[Math.floor(Math.random() * lower.length)] +
        digits[Math.floor(Math.random() * digits.length)] +
        symbols[Math.floor(Math.random() * symbols.length)];
    for (let i = 4; i < 12; i++)
        pwd += all[Math.floor(Math.random() * all.length)];
    return pwd.split("").sort(() => Math.random() - 0.5).join("");
}
function sanitizeUser(u) {
    return {
        id: u.id,
        orgId: u.orgId,
        name: u.name,
        email: u.email,
        role: u.role,
        specialty: u.specialty,
        status: u.status,
        githubUsername: u.githubUsername,
        phoneNumber: u.phoneNumber,
        notifyInApp: u.notifyInApp,
        notifyTelegram: u.notifyTelegram,
        notifyEmail: u.notifyEmail,
        failedLoginAttempts: u.failedLoginAttempts,
        lockedUntil: u.lockedUntil,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
    };
}
class AdminController {
    // GET /api/admin/users  — full org roster
    static async listUsers(req, res) {
        try {
            const users = await data_source_1.AppDataSource.getRepository(User_1.User).find({
                where: { orgId: req.user.orgId },
                order: { id: "ASC" },
            });
            res.json({ users: users.map(sanitizeUser) });
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
    // POST /api/admin/users  — provision a new account (Admin only)
    static async createUser(req, res) {
        try {
            const { name, email, role, specialty, githubUsername, phoneNumber, department } = req.body;
            if (!name || !email || !role) {
                res.status(400).json({ error: "name, email and role are required." });
                return;
            }
            const normalizedEmail = String(email).toLowerCase().trim();
            const existing = await data_source_1.AppDataSource.getRepository(User_1.User).findOne({
                where: { email: normalizedEmail },
            });
            if (existing) {
                res.status(409).json({ error: "An account with this email already exists." });
                return;
            }
            // Validate role
            const allowedRoles = [User_1.UserRole.DEVELOPER, User_1.UserRole.MANAGER, User_1.UserRole.TEAM_LEAD, User_1.UserRole.ADMIN];
            if (!allowedRoles.includes(role)) {
                res.status(400).json({ error: `Role must be one of: ${allowedRoles.join(", ")}` });
                return;
            }
            const org = await getOrg();
            const tempPassword = generateTempPassword();
            const passwordHash = await bcryptjs_1.default.hash(tempPassword, 12);
            const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
            const newUser = userRepo.create({
                orgId: org.id,
                name: String(name).trim(),
                email: normalizedEmail,
                passwordHash,
                role: role,
                status: User_1.UserStatus.ACTIVE,
                specialty: specialty || null,
                githubUsername: githubUsername || null,
                phoneNumber: phoneNumber || null,
            });
            await userRepo.save(newUser);
            await AuditService_1.AuditService.log(org.id, req.user.id, "USER_PROVISIONED", "User", newUser.id, `Admin provisioned account for ${newUser.name} (${newUser.email}) with role ${role}`);
            // Notify the new user if email is configured
            try {
                await NotificationService_1.NotificationService.notifyUser(newUser, `Welcome to NEXUS Enterprise, ${newUser.name}!\n\nYour account has been provisioned by the system administrator.\n\nLogin: ${normalizedEmail}\nTemporary Password: ${tempPassword}\n\nYou will be required to change your password on first sign-in.`, "GENERAL");
            }
            catch {
                // Notification failure is non-fatal
            }
            res.status(201).json({
                message: "Account provisioned successfully.",
                user: sanitizeUser(newUser),
                tempPassword, // Admin receives this to share with the new employee
            });
        }
        catch (err) {
            console.error("AdminController.createUser:", err);
            res.status(500).json({ error: err.message });
        }
    }
    // PATCH /api/admin/users/:id  — update name, role, status, specialty, etc.
    static async updateUser(req, res) {
        try {
            const targetId = Number(req.params.id);
            const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
            const target = await userRepo.findOne({
                where: { id: targetId, orgId: req.user.orgId },
            });
            if (!target) {
                res.status(404).json({ error: "User not found in your organization." });
                return;
            }
            const { name, role, status, specialty, githubUsername, phoneNumber, notifyInApp, notifyTelegram, notifyEmail } = req.body;
            if (name !== undefined)
                target.name = String(name).trim();
            if (role !== undefined) {
                const allowedRoles = [User_1.UserRole.DEVELOPER, User_1.UserRole.MANAGER, User_1.UserRole.TEAM_LEAD, User_1.UserRole.ADMIN];
                if (!allowedRoles.includes(role)) {
                    res.status(400).json({ error: "Invalid role." });
                    return;
                }
                target.role = role;
            }
            if (status !== undefined) {
                if (![User_1.UserStatus.ACTIVE, User_1.UserStatus.INACTIVE, User_1.UserStatus.SUSPENDED].includes(status)) {
                    res.status(400).json({ error: "Invalid status." });
                    return;
                }
                // Safety: can't deactivate last admin
                if (status !== User_1.UserStatus.ACTIVE && target.role === User_1.UserRole.ADMIN) {
                    const adminCount = await userRepo.count({
                        where: { orgId: req.user.orgId, role: User_1.UserRole.ADMIN, status: User_1.UserStatus.ACTIVE },
                    });
                    if (adminCount <= 1) {
                        res.status(400).json({ error: "Cannot deactivate the sole Administrator." });
                        return;
                    }
                }
                target.status = status;
            }
            if (specialty !== undefined)
                target.specialty = specialty || null;
            if (githubUsername !== undefined)
                target.githubUsername = githubUsername || null;
            if (phoneNumber !== undefined)
                target.phoneNumber = phoneNumber || null;
            if (notifyInApp !== undefined)
                target.notifyInApp = Boolean(notifyInApp);
            if (notifyTelegram !== undefined)
                target.notifyTelegram = Boolean(notifyTelegram);
            if (notifyEmail !== undefined)
                target.notifyEmail = Boolean(notifyEmail);
            await userRepo.save(target);
            await AuditService_1.AuditService.log(req.user.orgId, req.user.id, "USER_UPDATED", "User", target.id, `Admin updated profile for ${target.name}`);
            res.json({ message: "User updated.", user: sanitizeUser(target) });
        }
        catch (err) {
            console.error("AdminController.updateUser:", err);
            res.status(500).json({ error: err.message });
        }
    }
    // POST /api/admin/users/:id/reset-password  — Admin resets any user's password
    static async resetPassword(req, res) {
        try {
            const targetId = Number(req.params.id);
            const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
            const target = await userRepo.findOne({
                where: { id: targetId, orgId: req.user.orgId },
            });
            if (!target) {
                res.status(404).json({ error: "User not found." });
                return;
            }
            const tempPassword = generateTempPassword();
            target.passwordHash = await bcryptjs_1.default.hash(tempPassword, 12);
            target.failedLoginAttempts = 0;
            target.lockedUntil = null;
            await userRepo.save(target);
            await AuditService_1.AuditService.log(req.user.orgId, req.user.id, "PASSWORD_RESET_BY_ADMIN", "User", target.id, `Admin reset password for ${target.name} (${target.email})`);
            try {
                await NotificationService_1.NotificationService.notifyUser(target, `Your password for NEXUS Enterprise has been reset by an administrator.\n\nNew temporary password: ${tempPassword}\n\nPlease sign in and change your password immediately.`, "GENERAL");
            }
            catch {
                // non-fatal
            }
            res.json({
                message: `Password reset for ${target.name}.`,
                tempPassword, // Admin shares this securely with the employee
            });
        }
        catch (err) {
            console.error("AdminController.resetPassword:", err);
            res.status(500).json({ error: err.message });
        }
    }
    // DELETE /api/admin/users/:id  — Soft-delete (sets INACTIVE)
    static async deactivateUser(req, res) {
        try {
            const targetId = Number(req.params.id);
            const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
            const target = await userRepo.findOne({
                where: { id: targetId, orgId: req.user.orgId },
            });
            if (!target) {
                res.status(404).json({ error: "User not found." });
                return;
            }
            if (target.id === req.user.id) {
                res.status(400).json({ error: "You cannot deactivate your own account." });
                return;
            }
            if (target.role === User_1.UserRole.ADMIN) {
                const adminCount = await userRepo.count({
                    where: { orgId: req.user.orgId, role: User_1.UserRole.ADMIN, status: User_1.UserStatus.ACTIVE },
                });
                if (adminCount <= 1) {
                    res.status(400).json({ error: "Cannot deactivate the sole Administrator." });
                    return;
                }
            }
            target.status = User_1.UserStatus.INACTIVE;
            await userRepo.save(target);
            await AuditService_1.AuditService.log(req.user.orgId, req.user.id, "USER_DEACTIVATED", "User", target.id, `Admin deactivated account for ${target.name} (${target.email})`);
            res.json({ message: `Account for ${target.name} deactivated.` });
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
    // POST /api/me/change-password  — Any authenticated user changes their own password
    static async changePassword(req, res) {
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
            const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
            const user = await userRepo
                .createQueryBuilder("user")
                .addSelect("user.passwordHash")
                .where("user.id = :id", { id: req.user.id })
                .getOne();
            if (!user) {
                res.status(404).json({ error: "User not found." });
                return;
            }
            const isMatch = await bcryptjs_1.default.compare(currentPassword, user.passwordHash);
            if (!isMatch) {
                res.status(401).json({ error: "Current password is incorrect." });
                return;
            }
            user.passwordHash = await bcryptjs_1.default.hash(newPassword, 12);
            user.failedLoginAttempts = 0;
            user.lockedUntil = null;
            await userRepo.save(user);
            await AuditService_1.AuditService.log(user.orgId, user.id, "PASSWORD_CHANGED", "User", user.id, "User changed their own password");
            res.json({ message: "Password changed successfully." });
        }
        catch (err) {
            console.error("changePassword error:", err);
            res.status(500).json({ error: err.message });
        }
    }
}
exports.AdminController = AdminController;
