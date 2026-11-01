import nodemailer from 'nodemailer';
import { config } from '../config';
import { Notification, NotificationChannel, NotificationStatus } from '../entities/Notification';
import { AppDataSource } from '../config/data-source';

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (config.email.user && config.email.password) {
      this.transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: false,
        auth: {
          user: config.email.user,
          pass: config.email.password,
        },
      });
    }
  }

  async sendNotification(notification: Notification): Promise<boolean> {
    if (!this.transporter || !notification.user.email) {
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: config.email.from,
        to: notification.user.email,
        subject: notification.type.charAt(0).toUpperCase() + notification.type.slice(1),
        text: notification.content || '',
      });
      return true;
    } catch (error) {
      console.error('Email notification error:', error);
      return false;
    }
  }

  async sendReminder(userId: number, subject: string, message: string): Promise<boolean> {
    const notificationRepo = AppDataSource.getRepository(Notification);

    const notification = notificationRepo.create({
      userId,
      type: 'reminder',
      channel: NotificationChannel.EMAIL,
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
      notification.errorMessage = 'Failed to send email';
      await notificationRepo.save(notification);
    }

    return success;
  }

  async sendEscalation(userId: number, subject: string, message: string): Promise<boolean> {
    const notificationRepo = AppDataSource.getRepository(Notification);

    const notification = notificationRepo.create({
      userId,
      type: 'escalation',
      channel: NotificationChannel.EMAIL,
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
      notification.errorMessage = 'Failed to send email escalation';
      await notificationRepo.save(notification);
    }

    return success;
  }
}

export const emailService = new EmailService();
