"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = require("../config");
const Notification_1 = require("../entities/Notification");
const data_source_1 = require("../config/data-source");
class EmailService {
    constructor() {
        this.transporter = null;
        if (config_1.config.email.user && config_1.config.email.password) {
            this.transporter = nodemailer_1.default.createTransport({
                host: config_1.config.email.host,
                port: config_1.config.email.port,
                secure: false,
                auth: {
                    user: config_1.config.email.user,
                    pass: config_1.config.email.password,
                },
            });
        }
    }
    async sendNotification(notification) {
        if (!this.transporter || !notification.user.email) {
            return false;
        }
        try {
            await this.transporter.sendMail({
                from: config_1.config.email.from,
                to: notification.user.email,
                subject: notification.type.charAt(0).toUpperCase() + notification.type.slice(1),
                text: notification.content || '',
            });
            return true;
        }
        catch (error) {
            console.error('Email notification error:', error);
            return false;
        }
    }
    async sendReminder(userId, subject, message) {
        const notificationRepo = data_source_1.AppDataSource.getRepository(Notification_1.Notification);
        const notification = notificationRepo.create({
            userId,
            type: 'reminder',
            channel: Notification_1.NotificationChannel.EMAIL,
            content: message,
            status: Notification_1.NotificationStatus.PENDING,
        });
        await notificationRepo.save(notification);
        const success = await this.sendNotification(notification);
        if (success) {
            notification.status = Notification_1.NotificationStatus.SENT;
            notification.sentAt = new Date();
            await notificationRepo.save(notification);
        }
        else {
            notification.status = Notification_1.NotificationStatus.FAILED;
            notification.errorMessage = 'Failed to send email';
            await notificationRepo.save(notification);
        }
        return success;
    }
    async sendEscalation(userId, subject, message) {
        const notificationRepo = data_source_1.AppDataSource.getRepository(Notification_1.Notification);
        const notification = notificationRepo.create({
            userId,
            type: 'escalation',
            channel: Notification_1.NotificationChannel.EMAIL,
            content: message,
            status: Notification_1.NotificationStatus.PENDING,
        });
        await notificationRepo.save(notification);
        const success = await this.sendNotification(notification);
        if (success) {
            notification.status = Notification_1.NotificationStatus.SENT;
            notification.sentAt = new Date();
            await notificationRepo.save(notification);
        }
        else {
            notification.status = Notification_1.NotificationStatus.FAILED;
            notification.errorMessage = 'Failed to send email escalation';
            await notificationRepo.save(notification);
        }
        return success;
    }
}
exports.emailService = new EmailService();
