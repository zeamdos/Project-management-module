import TelegramBot from "node-telegram-bot-api";
import crypto from "crypto";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";

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

  // Any other message: reply so the bot never looks dead
  bot.on("message", async (msg) => {
    if ((msg.text || "").startsWith("/start")) return;
    try {
      await bot.sendMessage(
        String(msg.chat.id),
        'I only send reminders and updates. Open your dashboard and press "Connect Telegram" to link your account.'
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