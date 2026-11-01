"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = void 0;
const Notification_1 = require("../entities/Notification");
const telegramService_1 = require("./telegramService");
const emailService_1 = require("./emailService");
const smsService_1 = require("./smsService");
class NotificationService {
    async sendReminder(userId, message, channels = [Notification_1.NotificationChannel.IN_APP]) {
        const promises = [];
        if (channels.includes(Notification_1.NotificationChannel.TELEGRAM)) {
            promises.push(telegramService_1.telegramService.sendReminder(userId, message));
        }
        if (channels.includes(Notification_1.NotificationChannel.EMAIL)) {
            promises.push(emailService_1.emailService.sendReminder(userId, 'Reminder', message));
        }
        if (channels.includes(Notification_1.NotificationChannel.SMS)) {
            promises.push(smsService_1.smsService.sendReminder(userId, message));
        }
        await Promise.all(promises);
    }
    async sendEscalation(userId, message, channels = [Notification_1.NotificationChannel.EMAIL]) {
        const promises = [];
        if (channels.includes(Notification_1.NotificationChannel.TELEGRAM)) {
            promises.push(telegramService_1.telegramService.sendEscalation(userId, message));
        }
        if (channels.includes(Notification_1.NotificationChannel.EMAIL)) {
            promises.push(emailService_1.emailService.sendEscalation(userId, 'Escalation', message));
        }
        if (channels.includes(Notification_1.NotificationChannel.SMS)) {
            promises.push(smsService_1.smsService.sendEscalation(userId, message));
        }
        await Promise.all(promises);
    }
    async sendTaskReminder(userId, taskTitle, deadline) {
        const message = `Reminder: Task "${taskTitle}" is due on ${deadline.toDateString()}. Please ensure it's completed on time.`;
        await this.sendReminder(userId, message);
    }
    async sendProgressUpdateReminder(userId, projectName) {
        const message = `Reminder: Please submit your progress update for project "${projectName}".`;
        await this.sendReminder(userId, message);
    }
    async sendBlockerAlert(userId, blocker, taskTitle) {
        const message = `⚠️ Blocker reported for task "${taskTitle}": ${blocker}`;
        await this.sendEscalation(userId, message);
    }
    async sendOverdueAlert(userId, taskTitle, overdueDays) {
        const message = `🚨 OVERDUE: Task "${taskTitle}" is ${overdueDays} days overdue! Immediate action required.`;
        await this.sendEscalation(userId, message);
    }
}
exports.notificationService = new NotificationService();
