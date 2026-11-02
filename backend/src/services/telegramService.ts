import TelegramBot from 'node-telegram-bot-api';
import { config } from '../config';
import { Notification, NotificationChannel, NotificationStatus } from '../entities/Notification';
import { User } from '../entities/User';
import { AppDataSource } from '../config/data-source';

class TelegramService {
  private bot: TelegramBot | null = null;

  constructor() {
    if (config.telegram.botToken) {
      this.bot = new TelegramBot(config.telegram.botToken, { polling: false });
    }
  }

  async sendDirectMessage(telegramId: string, text: string): Promise<boolean> {
    if (!this.bot || !telegramId) {
      console.warn('Telegram bot not initialized or telegramId missing:', telegramId);
      return false;
    }

    try {
      await this.bot.sendMessage(telegramId, text, { parse_mode: 'HTML' });
      return true;
    } catch (error: any) {
      console.error('Telegram sendDirectMessage error for ID', telegramId, ':', error?.response?.body || error.message);
      return false;
    }
  }

  async logAndSend(userId: number, telegramId: string | null, type: string, content: string): Promise<boolean> {
    const notificationRepo = AppDataSource.getRepository(Notification);
    const notification = notificationRepo.create({
      userId,
      type,
      channel: NotificationChannel.TELEGRAM,
      content,
      status: NotificationStatus.PENDING,
    });
    await notificationRepo.save(notification);

    if (!telegramId) {
      notification.status = NotificationStatus.FAILED;
      notification.errorMessage = 'User has no linked Telegram ID';
      await notificationRepo.save(notification);
      return false;
    }

    const success = await this.sendDirectMessage(telegramId, content);
    if (success) {
      notification.status = NotificationStatus.SENT;
      notification.sentAt = new Date();
    } else {
      notification.status = NotificationStatus.FAILED;
      notification.errorMessage = 'Failed to send message via Telegram API';
    }
    await notificationRepo.save(notification);
    return success;
  }

  async notifyTaskAssigned(developer: User, task: any, project: any, teamName?: string): Promise<boolean> {
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

    return this.logAndSend(developer.id, developer.telegramChatId, 'task_assigned', msg);
  }

  async notifyDeadlineAlert(developer: User, task: any, project: any, hoursRemaining: number): Promise<boolean> {
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

    return this.logAndSend(developer.id, developer.telegramChatId, 'deadline_reminder', msg);
  }

  async notifyWorkProgress(recipient: User, developer: User, task: any, project: any, workDone: string, status: string): Promise<boolean> {
    const msg = `⚡ <b>DEVELOPER PROGRESS UPDATE</b>\n` +
      `--------------------------------\n` +
      `<b>Developer:</b> ${developer.name} (${developer.phoneNumber || 'Phone'})\n` +
      `<b>Task:</b> ${task.title}\n` +
      `<b>Project:</b> ${project?.title || 'Project'}\n` +
      `<b>New Status:</b> <b>${status.toUpperCase()}</b>\n` +
      `<b>Work Done:</b>\n${workDone}\n` +
      `--------------------------------\n` +
      `Ready for manager review!`;

    return this.logAndSend(recipient.id, recipient.telegramChatId, 'progress_update', msg);
  }

  async notifyReviewDecision(developer: User, reviewerName: string, task: any, decision: string, comment?: string): Promise<boolean> {
    const icon = decision === 'approved' ? '✅' : decision === 'changes_requested' ? '🔄' : '❌';
    const msg = `${icon} <b>TASK REVIEW: ${decision.toUpperCase().replace('_', ' ')}</b>\n` +
      `--------------------------------\n` +
      `<b>Task:</b> ${task.title}\n` +
      `<b>Reviewed By:</b> ${reviewerName}\n` +
      `<b>Decision:</b> ${decision.toUpperCase()}\n` +
      `<b>Feedback:</b> ${comment || 'No comments provided'}\n` +
      `--------------------------------\n` +
      `Check your dashboard for full review details.`;

    return this.logAndSend(developer.id, developer.telegramChatId, 'review_decision', msg);
  }

  async sendReminder(userId: number, message: string): Promise<boolean> {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: userId } });
    return this.logAndSend(userId, user?.telegramChatId || null, 'reminder', message);
  }

  async sendEscalation(userId: number, message: string): Promise<boolean> {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: userId } });
    return this.logAndSend(userId, user?.telegramChatId || null, 'escalation', message);
  }

  setupWebhook(webhookUrl: string): void {
    if (this.bot) {
      this.bot.setWebHook(webhookUrl);
    }
  }
}

export const telegramService = new TelegramService();

