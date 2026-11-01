"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.telegramService = void 0;
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const config_1 = require("../config");
const Notification_1 = require("../entities/Notification");
const User_1 = require("../entities/User");
const data_source_1 = require("../config/data-source");
class TelegramService {
    constructor() {
        this.bot = null;
        if (config_1.config.telegram.botToken) {
            this.bot = new node_telegram_bot_api_1.default(config_1.config.telegram.botToken, { polling: false });
        }
    }
    async sendDirectMessage(telegramId, text) {
        if (!this.bot || !telegramId) {
            console.warn('Telegram bot not initialized or telegramId missing:', telegramId);
            return false;
        }
        try {
            await this.bot.sendMessage(telegramId, text, { parse_mode: 'HTML' });
            return true;
        }
        catch (error) {
            console.error('Telegram sendDirectMessage error for ID', telegramId, ':', error?.response?.body || error.message);
            return false;
        }
    }
    async logAndSend(userId, telegramId, type, content) {
        const notificationRepo = data_source_1.AppDataSource.getRepository(Notification_1.Notification);
        const notification = notificationRepo.create({
            userId,
            type,
            channel: Notification_1.NotificationChannel.TELEGRAM,
            content,
            status: Notification_1.NotificationStatus.PENDING,
        });
        await notificationRepo.save(notification);
        if (!telegramId) {
            notification.status = Notification_1.NotificationStatus.FAILED;
            notification.errorMessage = 'User has no linked Telegram ID';
            await notificationRepo.save(notification);
            return false;
        }
        const success = await this.sendDirectMessage(telegramId, content);
        if (success) {
            notification.status = Notification_1.NotificationStatus.SENT;
            notification.sentAt = new Date();
        }
        else {
            notification.status = Notification_1.NotificationStatus.FAILED;
            notification.errorMessage = 'Failed to send message via Telegram API';
        }
        await notificationRepo.save(notification);
        return success;
    }
    async notifyTaskAssigned(developer, task, project, teamName) {
        const deadlineStr = task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No set deadline';
        const msg = `🚀 <b>NEW TASK ASSIGNED</b>\n` +
            `--------------------------------\n` +
            `<b>Task:</b> ${task.title}\n` +
            `<b>Project:</b> ${project?.title || 'Project'}\n` +
            `<b>Team:</b> ${teamName || developer.specialty?.toUpperCase() || 'Development'}\n` +
            `<b>Priority:</b> ${String(task.priority).toUpperCase()}\n` +
            `<b>Deadline:</b> 📅 ${deadlineStr}\n` +
            `<b>Description:</b> ${task.description || 'N/A'}\n` +
            `--------------------------------\n` +
            `Please check your developer dashboard to start working!`;
        return this.logAndSend(developer.id, developer.telegramId, 'task_assigned', msg);
    }
    async notifyDeadlineAlert(developer, task, project, hoursRemaining) {
        const deadlineStr = task.deadline ? new Date(task.deadline).toLocaleString() : 'Soon';
        const urgency = hoursRemaining <= 0 ? '🚨 <b>DEADLINE EXPIRED / OVERDUE</b>' : '⚠️ <b>DEADLINE APPROACHING</b>';
        const msg = `${urgency}\n` +
            `--------------------------------\n` +
            `<b>Task:</b> ${task.title}\n` +
            `<b>Project:</b> ${project?.title || 'Project'}\n` +
            `<b>Due Date:</b> 📅 ${deadlineStr}\n` +
            `<b>Status:</b> ${String(task.status).toUpperCase()}\n` +
            `--------------------------------\n` +
            `Please submit your progress update or mark your task as done in the system!`;
        return this.logAndSend(developer.id, developer.telegramId, 'deadline_reminder', msg);
    }
    async notifyWorkProgress(recipient, developer, task, project, workDone, status) {
        const msg = `⚡ <b>DEVELOPER PROGRESS UPDATE</b>\n` +
            `--------------------------------\n` +
            `<b>Developer:</b> ${developer.name} (${developer.phone || 'Phone'})\n` +
            `<b>Task:</b> ${task.title}\n` +
            `<b>Project:</b> ${project?.title || 'Project'}\n` +
            `<b>New Status:</b> <b>${status.toUpperCase()}</b>\n` +
            `<b>Work Done:</b>\n${workDone}\n` +
            `--------------------------------\n` +
            `Ready for manager review!`;
        return this.logAndSend(recipient.id, recipient.telegramId, 'progress_update', msg);
    }
    async notifyReviewDecision(developer, reviewerName, task, decision, comment) {
        const icon = decision === 'approved' ? '✅' : decision === 'changes_requested' ? '🔄' : '❌';
        const msg = `${icon} <b>TASK REVIEW: ${decision.toUpperCase().replace('_', ' ')}</b>\n` +
            `--------------------------------\n` +
            `<b>Task:</b> ${task.title}\n` +
            `<b>Reviewed By:</b> ${reviewerName}\n` +
            `<b>Decision:</b> ${decision.toUpperCase()}\n` +
            `<b>Feedback:</b> ${comment || 'No comments provided'}\n` +
            `--------------------------------\n` +
            `Check your dashboard for full review details.`;
        return this.logAndSend(developer.id, developer.telegramId, 'review_decision', msg);
    }
    async sendReminder(userId, message) {
        const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepo.findOne({ where: { id: userId } });
        return this.logAndSend(userId, user?.telegramId || null, 'reminder', message);
    }
    async sendEscalation(userId, message) {
        const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepo.findOne({ where: { id: userId } });
        return this.logAndSend(userId, user?.telegramId || null, 'escalation', message);
    }
    setupWebhook(webhookUrl) {
        if (this.bot) {
            this.bot.setWebHook(webhookUrl);
        }
    }
}
exports.telegramService = new TelegramService();
