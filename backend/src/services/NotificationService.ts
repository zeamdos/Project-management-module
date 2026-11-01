import axios from "axios";
import TelegramBot from "node-telegram-bot-api";
import nodemailer from "nodemailer";
import { AppDataSource } from "../config/data-source";
import { Notification, NotificationChannel, NotificationStatus } from "../entities/Notification";

// Created on first use, so .env is already loaded by then.
let botInstance: TelegramBot | null = null;
function getBot(): TelegramBot | null {
  if (botInstance) return botInstance;
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) return null;
  botInstance = new TelegramBot(token, { polling: false });
  return botInstance;
}

let transporterInstance: nodemailer.Transporter | null = null;
function getTransporter(): nodemailer.Transporter {
  if (transporterInstance) return transporterInstance;
  transporterInstance = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.mailtrap.io",
    port: parseInt(process.env.SMTP_PORT || "2525", 10),
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    },
  });
  return transporterInstance;
}

export class NotificationService {
  static async send(
    userId: number,
    channel: NotificationChannel,
    recipientContact: string, // telegramChatId, phoneNumber, or email
    message: string
  ): Promise<void> {
    const notifRepo = AppDataSource.getRepository(Notification);
    const notification = notifRepo.create({
      userId,
      channel,
      message,
      status: NotificationStatus.PENDING,
      attempts: 0,
    });
    await notifRepo.save(notification);

    await this.dispatchWithRetry(notification, recipientContact);
  }

  private static async dispatchWithRetry(notification: Notification, contact: string): Promise<void> {
    const notifRepo = AppDataSource.getRepository(Notification);
    const maxAttempts = 3;

    while (notification.attempts < maxAttempts && notification.status !== NotificationStatus.SENT) {
      notification.attempts += 1;
      try {
        if (notification.channel === NotificationChannel.TELEGRAM) {
          const bot = getBot();
          if (!bot) throw new Error("Telegram bot token not configured");
          await bot.sendMessage(contact, notification.message);
        } else if (notification.channel === NotificationChannel.SMS) {
          const smsUrl = process.env.SMS_PROVIDER_URL;
          const apiKey = process.env.SMS_API_KEY;
          if (!smsUrl) throw new Error("SMS provider URL not configured");
          await axios.post(smsUrl, {
            to: contact,
            message: notification.message,
            apiKey,
          });
        } else if (notification.channel === NotificationChannel.EMAIL) {
          await getTransporter().sendMail({
            from: '"Project Management" <no-reply@pm.local>',
            to: contact,
            subject: "Project Management Notification",
            text: notification.message,
          });
        }

        notification.status = NotificationStatus.SENT;
        notification.errorMessage = null;
      } catch (err: any) {
        notification.status = NotificationStatus.FAILED;
        notification.errorMessage = err.message || "Unknown error";
      }
      await notifRepo.save(notification);
      if (notification.status === NotificationStatus.SENT) break;
    }
  }
}