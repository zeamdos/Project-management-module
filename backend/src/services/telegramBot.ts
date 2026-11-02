import TelegramBot from "node-telegram-bot-api";
import crypto from "crypto";
import { Not } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { Task, TaskStatus } from "../entities/Task";
import { ProgressService } from "./progressService";

// One-time codes that tie a Telegram chat to a logged-in user.
// Kept in memory for 10 minutes. If the server restarts, press "Connect Telegram" again.
const linkCodes = new Map<string, { userId: number; expires: number }>();

export function createLinkCode(userId: number): string {
  const now = Date.now();
  for (const [code, entry] of linkCodes) {
    if (entry.userId === userId || entry.expires < now) linkCodes.delete(code);
  }
  const code = crypto.randomBytes(6).toString("hex");
  linkCodes.set(code, { userId, expires: now + 10 * 60 * 1000 });
  return code;
}

let started = false;

export async function startTelegramBot(): Promise<void> {
  if (started) return;

  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) {
    console.warn("Telegram: TELEGRAM_BOT_TOKEN is not set in .env. Bot is disabled.");
    return;
  }

  const bot = new TelegramBot(token, { polling: false });

  // Step 1: check the token works, and remove any old webhook (a webhook blocks polling).
  try {
    const me = await bot.getMe();
    console.log(`Telegram: token OK, bot is @${me.username}`);
    await bot.deleteWebHook();
  } catch (err: any) {
    console.error("Telegram: cannot use this token. Check TELEGRAM_BOT_TOKEN in .env.", err?.message || err);
    return;
  }

  // Step 2: handle /start (with or without a code)
  bot.onText(/^\/start(?:@\w+)?(?:\s+(\w+))?$/, async (msg, match) => {
    const chatId = String(msg.chat.id);
    const code = match?.[1];

    try {
      if (!code) {
        await bot.sendMessage(
          chatId,
          'Hi! To get task and deadline reminders here, open your dashboard and press "Connect Telegram".'
        );
        return;
      }

      const entry = linkCodes.get(code);
      if (!entry || entry.expires < Date.now()) {
        await bot.sendMessage(chatId, 'This link has expired. Go back to your dashboard and press "Connect Telegram" again.');
        return;
      }

      const userRepo = AppDataSource.getRepository(User);
      await userRepo.update(entry.userId, { telegramChatId: chatId });
      linkCodes.delete(code);
      const user = await userRepo.findOne({ where: { id: entry.userId } });
      await bot.sendMessage(
        chatId,
        `Connected. Hi ${user?.name ?? "there"}, you will now get deadline reminders and team updates here.`
      );
    } catch (err: any) {
      console.error("Telegram link error:", err?.message || err);
      try {
        await bot.sendMessage(chatId, "Something went wrong while connecting your account. Please try again.");
      } catch {}
    }
  });

  bot.onText(/^\/blocker(?:@\w+)?(?:\s+(.+))?$/s, async (msg, match) => {
    const chatId = String(msg.chat.id);
    const description = (match?.[1] || "").trim();
    try {
      const user = await AppDataSource.getRepository(User).findOne({ where: { telegramChatId: chatId } });
      if (!user) {
        await bot.sendMessage(chatId, 'Link your account first: open the dashboard and press "Connect Telegram".');
        return;
      }
      if (!description) {
        await bot.sendMessage(chatId, "Usage: /blocker what is blocking you");
        return;
      }
      const task = await AppDataSource.getRepository(Task).findOne({
        where: { assigneeId: user.id, status: Not(TaskStatus.DONE) },
        order: { id: "DESC" },
      });
      if (!task) {
        await bot.sendMessage(chatId, "You have no open task to mark as blocked.");
        return;
      }
      const result = await ProgressService.raiseBlocker(user.id, task.id, description);
      if (result.error) {
        await bot.sendMessage(chatId, result.error);
        return;
      }
      await bot.sendMessage(chatId, `Blocker sent to your PM for TASK-${task.id}: ${task.title}`);
    } catch (err: any) {
      console.error("Telegram blocker error:", err?.message || err);
    }
  });

  bot.on("message", async (msg) => {
    const text = msg.text || "";
    if (text.startsWith("/start") || text.startsWith("/blocker")) return;
    try {
      await bot.sendMessage(
        String(msg.chat.id),
        'I send reminders and take blockers. Raise a blocker with /blocker followed by a short description, or use the dashboard.'
      );
    } catch {}
  });

  bot.on("polling_error", (err: any) => {
    const text = err?.message || String(err);
    if (text.includes("409")) {
      console.error("Telegram 409: another process is polling this bot token. Stop the other server (old project or another terminal), then restart.");
    } else {
      console.error("Telegram polling error:", text);
    }
  });

  // Step 3: start listening
  await bot.startPolling();
  started = true;
  console.log("Telegram bot is listening.");
}