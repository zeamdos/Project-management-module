import axios from 'axios';
import { config } from '../config';
import { Notification, NotificationChannel, NotificationStatus } from '../entities/Notification';
import { AppDataSource } from '../config/data-source';

class SMSService {
  async sendNotification(notification: Notification): Promise<boolean> {
    if (!notification.user.phone || !config.sms.apiKey) {
      return false;
    }

    try {
      const response = await axios.post(config.sms.apiUrl, {
        api_key: config.sms.apiKey,
        phone: notification.user.phone,
        message: notification.content,
      });

      return response.data.success === true;
    } catch (error) {
      console.error('SMS notification error:', error);
      return false;
    }
  }

  async sendReminder(userId: number, message: string): Promise<boolean> {
    const notificationRepo = AppDataSource.getRepository(Notification);

    const notification = notificationRepo.create({
      userId,
      type: 'reminder',
      channel: NotificationChannel.SMS,
      content: message,
      status: NotificationStatus.PENDING,
    });

    await notificationRepo.save(notification);

    const success = await this.sendNotification(notification);

    if (success) {
      notification.status = NotificationStatus.SENT;
      notification.sentAt = new Date();
      await notificationRepo.save(notification);
    } else {
      notification.status = NotificationStatus.FAILED;
      notification.errorMessage = 'Failed to send SMS';
      await notificationRepo.save(notification);
    }

    return success;
  }

  async sendEscalation(userId: number, message: string): Promise<boolean> {
    const notificationRepo = AppDataSource.getRepository(Notification);

    const notification = notificationRepo.create({
      userId,
      type: 'escalation',
      channel: NotificationChannel.SMS,
      content: message,
      status: NotificationStatus.PENDING,
    });

    await notificationRepo.save(notification);

    const success = await this.sendNotification(notification);

    if (success) {
      notification.status = NotificationStatus.SENT;
      notification.sentAt = new Date();
      await notificationRepo.save(notification);
    } else {
      notification.status = NotificationStatus.FAILED;
      notification.errorMessage = 'Failed to send SMS escalation';
      await notificationRepo.save(notification);
    }

    return success;
  }
}

export const smsService = new SMSService();
