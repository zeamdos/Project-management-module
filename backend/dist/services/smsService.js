"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.smsService = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
const Notification_1 = require("../entities/Notification");
const data_source_1 = require("../config/data-source");
class SMSService {
    async sendNotification(notification) {
        if (!notification.user.phone || !config_1.config.sms.apiKey) {
            return false;
        }
        try {
            const response = await axios_1.default.post(config_1.config.sms.apiUrl, {
                api_key: config_1.config.sms.apiKey,
                phone: notification.user.phone,
                message: notification.content,
            });
            return response.data.success === true;
        }
        catch (error) {
            console.error('SMS notification error:', error);
            return false;
        }
    }
    async sendReminder(userId, message) {
        const notificationRepo = data_source_1.AppDataSource.getRepository(Notification_1.Notification);
        const notification = notificationRepo.create({
            userId,
            type: 'reminder',
            channel: Notification_1.NotificationChannel.SMS,
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
            notification.errorMessage = 'Failed to send SMS';
            await notificationRepo.save(notification);
        }
        return success;
    }
    async sendEscalation(userId, message) {
        const notificationRepo = data_source_1.AppDataSource.getRepository(Notification_1.Notification);
        const notification = notificationRepo.create({
            userId,
            type: 'escalation',
            channel: Notification_1.NotificationChannel.SMS,
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
            notification.errorMessage = 'Failed to send SMS escalation';
            await notificationRepo.save(notification);
        }
        return success;
    }
}
exports.smsService = new SMSService();
