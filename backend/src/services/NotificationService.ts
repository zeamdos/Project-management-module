import nodemailer from "nodemailer";
import TelegramBot from "node-telegram-bot-api";
import { In } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Notification, NotificationChannel, NotificationStatus } from "../entities/Notification";
import { User, UserRole, UserStatus } from "../entities/User";
import { getTelegramBotInstance } from "./telegramBot";
import { emitToUser } from "./SocketService";

export type NotifyKind =
  | "TASK_ASSIGNED"
  | "DEADLINE"
  | "BLOCKER"
  | "REVIEW_PENDING"
  | "PROGRESS"
  | "GENERAL";

const LEAD_ROLES = [UserRole.ADMIN, UserRole.MANAGER, UserRole.TEAM_LEAD];

let fallbackBotInstance: TelegramBot | null = null;
function getBot(): TelegramBot | null {
  const activeBot = getTelegramBotInstance();
  if (activeBot) return activeBot;

  if (fallbackBotInstance) return fallbackBotInstance;
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) return null;
  fallbackBotInstance = new TelegramBot(token, { polling: false });
  return fallbackBotInstance;
}

let transporterInstance: nodemailer.Transporter | null = null;
function getTransporter(): nodemailer.Transporter | null {
  if (transporterInstance) return transporterInstance;
  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
  if (!host) return null;
  const port = parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || "587", 10);
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS || process.env.SMTP_PASS;

  transporterInstance = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });
  return transporterInstance;
}

function inQuietHours(user: User): boolean {
  const start = (user.quietHoursStart || "").trim();
  const end = (user.quietHoursEnd || "").trim();
  if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) return false;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const s = sh * 60 + sm;
  const e = eh * 60 + em;
  if (s === e) return false;
  return s < e ? cur >= s && cur < e : cur >= s || cur < e;
}

export class NotificationService {
  static async send(
    userId: number,
    channel: NotificationChannel,
    recipientContact: string,
    message: string,
    kind: NotifyKind = "GENERAL"
  ): Promise<Notification> {
    const notifRepo = AppDataSource.getRepository(Notification);
    const notification = notifRepo.create({
      userId,
      channel,
      kind,
      message,
      status: NotificationStatus.PENDING,
      attempts: 0,
      readAt: null,
    });
    await notifRepo.save(notification);
    await this.dispatchWithRetry(notification, recipientContact);
    return notification;
  }

  /** In-app always. Telegram/email if the user opted in. SMS is never sent. */
  static async notifyUser(user: User, message: string, kind: NotifyKind, critical = false): Promise<void> {
    const quiet = !critical && inQuietHours(user);

    // 1. In-app notification
    if (user.notifyInApp !== false) {
      try {
        const notification = await this.send(user.id, NotificationChannel.IN_APP, "", message, kind);
        emitToUser(user.id, "notification:new", {
          id: notification.id,
          userId: notification.userId,
          message: notification.message,
          kind: notification.kind,
          createdAt: notification.createdAt,
          read: !!notification.readAt,
        });
      } catch (err: any) {
        console.error("In-app notify failed:", err?.message || err);
      }
    }

    if (quiet) return;

    // 2. Telegram notification
    if (user.notifyTelegram !== false && user.telegramChatId) {
      try {
        await this.send(user.id, NotificationChannel.TELEGRAM, user.telegramChatId, message, kind);
        console.log(`Telegram notification dispatched to user ${user.name} (${user.telegramChatId})`);
      } catch (err: any) {
        console.error(`Telegram notify failed for user ${user.name}:`, err?.message || err);
      }
    }

    // 3. Email notification
    const transporter = getTransporter();
    if (user.notifyEmail !== false && user.email && transporter) {
      try {
        await this.send(user.id, NotificationChannel.EMAIL, user.email, message, kind);
      } catch (err: any) {
        console.error("Email notify failed:", err?.message || err);
      }
    }
  }

  static async notifyLeads(orgId: number, message: string, kind: NotifyKind, exceptUserId?: number, critical = false): Promise<void> {
    const people = await AppDataSource.getRepository(User).find({
      where: { orgId, role: In(LEAD_ROLES), status: UserStatus.ACTIVE },
    });
    for (const lead of people) {
      if (lead.id === exceptUserId) continue;
      await this.notifyUser(lead, message, kind, critical);
    }
  }

  private static async dispatchWithRetry(notification: Notification, contact: string): Promise<void> {
    const notifRepo = AppDataSource.getRepository(Notification);
    const maxAttempts = 3;

    while (notification.attempts < maxAttempts && notification.status !== NotificationStatus.SENT) {
      notification.attempts += 1;
      try {
        if (notification.channel === NotificationChannel.IN_APP) {
          notification.status = NotificationStatus.SENT;
          notification.errorMessage = null;
        } else if (notification.channel === NotificationChannel.TELEGRAM) {
          const bot = getBot();
          if (!bot) throw new Error("Telegram bot token not configured");
          if (!contact) throw new Error("No Telegram chatId found for user");
          await bot.sendMessage(contact, notification.message);
          notification.status = NotificationStatus.SENT;
          notification.errorMessage = null;
        } else if (notification.channel === NotificationChannel.EMAIL) {
          const transporter = getTransporter();
          if (!transporter) throw new Error("Email is not configured");
          const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_FROM || '"Project Management" <no-reply@enterprise.com>';
          await transporter.sendMail({
            from: fromEmail,
            to: contact,
            subject: `[NEXUS Alert] ${notification.kind}`,
            text: notification.message,
          });
          notification.status = NotificationStatus.SENT;
          notification.errorMessage = null;
        } else if (notification.channel === NotificationChannel.SMS) {
          throw new Error("SMS notifications are disabled");
        }

        if (notification.status !== NotificationStatus.SENT) {
          notification.status = NotificationStatus.FAILED;
          notification.errorMessage = "Unsupported channel";
        }
      } catch (err: any) {
        notification.status = NotificationStatus.FAILED;
        notification.errorMessage = err.message || "Unknown error";
        console.error(`Notification dispatch failed on attempt ${notification.attempts}:`, err.message);
      }
      await notifRepo.save(notification);
      if (notification.status === NotificationStatus.SENT) break;
    }
  }
}
