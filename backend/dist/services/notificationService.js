"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const typeorm_1 = require("typeorm");
const data_source_1 = require("../config/data-source");
const Notification_1 = require("../entities/Notification");
const User_1 = require("../entities/User");
const telegramBot_1 = require("./telegramBot");
const LEAD_ROLES = [User_1.UserRole.ADMIN, User_1.UserRole.MANAGER, User_1.UserRole.TEAM_LEAD];
let fallbackBotInstance = null;
function getBot() {
    const activeBot = (0, telegramBot_1.getTelegramBotInstance)();
    if (activeBot)
        return activeBot;
    if (fallbackBotInstance)
        return fallbackBotInstance;
    const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
    if (!token)
        return null;
    fallbackBotInstance = new node_telegram_bot_api_1.default(token, { polling: false });
    return fallbackBotInstance;
}
let transporterInstance = null;
function getTransporter() {
    if (transporterInstance)
        return transporterInstance;
    const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
    if (!host)
        return null;
    const port = parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || "587", 10);
    const user = process.env.EMAIL_USER || process.env.SMTP_USER;
    const pass = process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS || process.env.SMTP_PASS;
    transporterInstance = nodemailer_1.default.createTransport({
        host,
        port,
        secure: port === 465,
        auth: user && pass ? { user, pass } : undefined,
    });
    return transporterInstance;
}
function inQuietHours(user) {
    const start = (user.quietHoursStart || "").trim();
    const end = (user.quietHoursEnd || "").trim();
    if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end))
        return false;
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const s = sh * 60 + sm;
    const e = eh * 60 + em;
    if (s === e)
        return false;
    return s < e ? cur >= s && cur < e : cur >= s || cur < e;
}
class NotificationService {
    static async send(userId, channel, recipientContact, message, kind = "GENERAL") {
        const notifRepo = data_source_1.AppDataSource.getRepository(Notification_1.Notification);
        const notification = notifRepo.create({
            userId,
            channel,
            kind,
            message,
            status: Notification_1.NotificationStatus.PENDING,
            attempts: 0,
            readAt: null,
        });
        await notifRepo.save(notification);
        await this.dispatchWithRetry(notification, recipientContact);
    }
    /** In-app always. Telegram/email if the user opted in. SMS is never sent. */
    static async notifyUser(user, message, kind, critical = false) {
        const quiet = !critical && inQuietHours(user);
        // 1. In-app notification
        if (user.notifyInApp !== false) {
            try {
                await this.send(user.id, Notification_1.NotificationChannel.IN_APP, "", message, kind);
            }
            catch (err) {
                console.error("In-app notify failed:", err?.message || err);
            }
        }
        if (quiet)
            return;
        // 2. Telegram notification
        if (user.notifyTelegram !== false && user.telegramChatId) {
            try {
                await this.send(user.id, Notification_1.NotificationChannel.TELEGRAM, user.telegramChatId, message, kind);
                console.log(`Telegram notification dispatched to user ${user.name} (${user.telegramChatId})`);
            }
            catch (err) {
                console.error(`Telegram notify failed for user ${user.name}:`, err?.message || err);
            }
        }
        // 3. Email notification
        const transporter = getTransporter();
        if (user.notifyEmail !== false && user.email && transporter) {
            try {
                await this.send(user.id, Notification_1.NotificationChannel.EMAIL, user.email, message, kind);
            }
            catch (err) {
                console.error("Email notify failed:", err?.message || err);
            }
        }
    }
    static async notifyLeads(orgId, message, kind, exceptUserId, critical = false) {
        const people = await data_source_1.AppDataSource.getRepository(User_1.User).find({
            where: { orgId, role: (0, typeorm_1.In)(LEAD_ROLES), status: User_1.UserStatus.ACTIVE },
        });
        for (const lead of people) {
            if (lead.id === exceptUserId)
                continue;
            await this.notifyUser(lead, message, kind, critical);
        }
    }
    static async dispatchWithRetry(notification, contact) {
        const notifRepo = data_source_1.AppDataSource.getRepository(Notification_1.Notification);
        const maxAttempts = 3;
        while (notification.attempts < maxAttempts && notification.status !== Notification_1.NotificationStatus.SENT) {
            notification.attempts += 1;
            try {
                if (notification.channel === Notification_1.NotificationChannel.IN_APP) {
                    notification.status = Notification_1.NotificationStatus.SENT;
                    notification.errorMessage = null;
                }
                else if (notification.channel === Notification_1.NotificationChannel.TELEGRAM) {
                    const bot = getBot();
                    if (!bot)
                        throw new Error("Telegram bot token not configured");
                    if (!contact)
                        throw new Error("No Telegram chatId found for user");
                    await bot.sendMessage(contact, notification.message);
                    notification.status = Notification_1.NotificationStatus.SENT;
                    notification.errorMessage = null;
                }
                else if (notification.channel === Notification_1.NotificationChannel.EMAIL) {
                    const transporter = getTransporter();
                    if (!transporter)
                        throw new Error("Email is not configured");
                    const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_FROM || '"Project Management" <no-reply@enterprise.com>';
                    await transporter.sendMail({
                        from: fromEmail,
                        to: contact,
                        subject: `[NEXUS Alert] ${notification.kind}`,
                        text: notification.message,
                    });
                    notification.status = Notification_1.NotificationStatus.SENT;
                    notification.errorMessage = null;
                }
                else if (notification.channel === Notification_1.NotificationChannel.SMS) {
                    throw new Error("SMS notifications are disabled");
                }
                if (notification.status !== Notification_1.NotificationStatus.SENT) {
                    notification.status = Notification_1.NotificationStatus.FAILED;
                    notification.errorMessage = "Unsupported channel";
                }
            }
            catch (err) {
                notification.status = Notification_1.NotificationStatus.FAILED;
                notification.errorMessage = err.message || "Unknown error";
                console.error(`Notification dispatch failed on attempt ${notification.attempts}:`, err.message);
            }
            await notifRepo.save(notification);
            if (notification.status === Notification_1.NotificationStatus.SENT)
                break;
        }
    }
}
exports.NotificationService = NotificationService;
