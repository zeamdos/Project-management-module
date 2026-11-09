"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLinkCode = createLinkCode;
exports.getTelegramBotInstance = getTelegramBotInstance;
exports.startTelegramBot = startTelegramBot;
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const crypto_1 = __importDefault(require("crypto"));
const typeorm_1 = require("typeorm");
const data_source_1 = require("../config/data-source");
const User_1 = require("../entities/User");
const Task_1 = require("../entities/Task");
const progressService_1 = require("./progressService");
// One-time codes that tie a Telegram chat to a logged-in user via dashboard click.
const linkCodes = new Map();
function createLinkCode(userId) {
    const now = Date.now();
    for (const [code, entry] of linkCodes) {
        if (entry.userId === userId || entry.expires < now)
            linkCodes.delete(code);
    }
    const code = crypto_1.default.randomBytes(6).toString("hex");
    linkCodes.set(code, { userId, expires: now + 10 * 60 * 1000 });
    return code;
}
let botInstance = null;
let started = false;
function getTelegramBotInstance() {
    return botInstance;
}
function normalizePhoneDigits(raw) {
    if (!raw)
        return "";
    return raw.replace(/[^0-9]/g, "");
}
function phoneNumbersMatch(p1, p2) {
    const d1 = normalizePhoneDigits(p1);
    const d2 = normalizePhoneDigits(p2);
    if (!d1 || !d2)
        return false;
    if (d1 === d2)
        return true;
    // Match suffixes for localized formats vs international formats (e.g. 0911... vs 251911...)
    const minLen = Math.min(d1.length, d2.length);
    if (minLen >= 8) {
        return d1.slice(-8) === d2.slice(-8);
    }
    return false;
}
async function handlePhoneLinking(chatId, rawPhone, senderName) {
    if (!botInstance)
        return;
    const cleanDigits = normalizePhoneDigits(rawPhone);
    if (cleanDigits.length < 7) {
        await botInstance.sendMessage(chatId, "⚠️ The phone number provided is invalid. Please share a valid contact or type your full corporate phone number.");
        return;
    }
    const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
    const allUsers = await userRepo.find({ where: { status: User_1.UserStatus.ACTIVE } });
    // Locate matching corporate user
    const matchedUser = allUsers.find((u) => u.phoneNumber && phoneNumbersMatch(u.phoneNumber, rawPhone));
    if (!matchedUser) {
        await botInstance.sendMessage(chatId, `❌ *Account Not Found*\n\n` +
            `No active corporate profile matches the phone number *${rawPhone}*.\n\n` +
            `*How to resolve:*\n` +
            `1. Ask your Administrator to set your phone number in the Admin User Management panel.\n` +
            `2. Or open your dashboard Profile, enter your phone number, and click Save.\n\n` +
            `Once saved, tap below to retry:`, {
            parse_mode: "Markdown",
            reply_markup: {
                keyboard: [
                    [
                        {
                            text: "📱 Share My Contact to Link Account",
                            request_contact: true,
                        },
                    ],
                ],
                resize_keyboard: true,
                one_time_keyboard: true,
            },
        });
        return;
    }
    // Enforce 1-to-1 Telegram account linking:
    // Unlink any other user who previously owned this Telegram chatId
    await userRepo
        .createQueryBuilder()
        .update(User_1.User)
        .set({ telegramChatId: null })
        .where("telegramChatId = :chatId", { chatId })
        .execute();
    // Link the matched user
    matchedUser.telegramChatId = chatId;
    matchedUser.notifyTelegram = true;
    await userRepo.save(matchedUser);
    await botInstance.sendMessage(chatId, `🎉 *Corporate Account Linked Successfully!*\n\n` +
        `👤 *Employee:* ${matchedUser.name}\n` +
        `📧 *Email:* \`${matchedUser.email}\`\n` +
        `🛡️ *Role:* ${matchedUser.role}${matchedUser.specialty ? ` (${matchedUser.specialty})` : ""}\n` +
        `📱 *Phone:* ${matchedUser.phoneNumber}\n\n` +
        `You are now linked 1-on-1 with this Telegram chat. You will receive real-time notifications for:\n` +
        `• 📌 New Task Assignments\n` +
        `• ⏳ Deadline Reminders\n` +
        `• 🔍 Code Review Approvals & Feedback\n` +
        `• 🚨 Blocker Alerts\n\n` +
        `*Available Commands:*\n` +
        `/status - View your assigned open tasks\n` +
        `/blocker <reason> - Instantly report a blocker on your active task\n` +
        `/unlink - Disconnect this Telegram account`, {
        parse_mode: "Markdown",
        reply_markup: { remove_keyboard: true },
    });
}
async function startTelegramBot() {
    if (started)
        return;
    const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
    if (!token) {
        console.warn("Telegram: TELEGRAM_BOT_TOKEN is not set in .env. Bot is disabled.");
        return;
    }
    const bot = new node_telegram_bot_api_1.default(token, { polling: false });
    botInstance = bot;
    // Verify token and remove any lingering webhooks that block long-polling
    try {
        const me = await bot.getMe();
        console.log(`Telegram: token verified, bot is @${me.username}`);
        await bot.deleteWebHook();
    }
    catch (err) {
        console.error("Telegram: cannot connect with this token. Check TELEGRAM_BOT_TOKEN.", err?.message || err);
        return;
    }
    // Handle contact sharing via Telegram button
    bot.on("contact", async (msg) => {
        const chatId = String(msg.chat.id);
        const contact = msg.contact;
        if (!contact || !contact.phone_number)
            return;
        await handlePhoneLinking(chatId, contact.phone_number, msg.from?.first_name || "User");
    });
    // Handle /start (with code or without code)
    bot.onText(/^\/start(?:@\w+)?(?:\s+(\w+))?$/, async (msg, match) => {
        const chatId = String(msg.chat.id);
        const code = match?.[1];
        try {
            // 1. If dashboard code provided
            if (code) {
                const entry = linkCodes.get(code);
                if (!entry || entry.expires < Date.now()) {
                    await bot.sendMessage(chatId, "⚠️ This link code has expired. Please return to your dashboard and click 'Connect Telegram' again.");
                    return;
                }
                const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
                // Unlink previous holder of this chatId
                await userRepo
                    .createQueryBuilder()
                    .update(User_1.User)
                    .set({ telegramChatId: null })
                    .where("telegramChatId = :chatId", { chatId })
                    .execute();
                await userRepo.update(entry.userId, { telegramChatId: chatId, notifyTelegram: true });
                linkCodes.delete(code);
                const user = await userRepo.findOne({ where: { id: entry.userId } });
                await bot.sendMessage(chatId, `✅ *Account Connected!*\n\nWelcome ${user?.name || "there"}. Your Telegram is now linked to \`${user?.email}\`. You will receive instant task updates and deadline alerts here.`, { parse_mode: "Markdown", reply_markup: { remove_keyboard: true } });
                return;
            }
            // 2. No code provided: check if already linked
            const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
            const existingUser = await userRepo.findOne({ where: { telegramChatId: chatId } });
            if (existingUser) {
                await bot.sendMessage(chatId, `👋 Welcome back, *${existingUser.name}*!\n\n` +
                    `Your Telegram is linked to \`${existingUser.email}\` (${existingUser.role}).\n\n` +
                    `Use /status to see your tasks, /blocker to report an impediment, or /unlink to disconnect.`, { parse_mode: "Markdown" });
                return;
            }
            // 3. Not linked yet: present contact sharing button
            await bot.sendMessage(chatId, `👋 *Welcome to NEXUS Enterprise Project Management*\n\n` +
                `To link your Telegram account to your corporate profile and receive task notifications:\n\n` +
                `👉 Tap the *'📱 Share My Contact to Link Account'* button below, or reply with your corporate phone number (e.g. +251911445566).`, {
                parse_mode: "Markdown",
                reply_markup: {
                    keyboard: [
                        [
                            {
                                text: "📱 Share My Contact to Link Account",
                                request_contact: true,
                            },
                        ],
                    ],
                    resize_keyboard: true,
                    one_time_keyboard: true,
                },
            });
        }
        catch (err) {
            console.error("Telegram /start error:", err?.message || err);
        }
    });
    // Handle /status command
    bot.onText(/^\/status(?:@\w+)?$/, async (msg) => {
        const chatId = String(msg.chat.id);
        try {
            const user = await data_source_1.AppDataSource.getRepository(User_1.User).findOne({ where: { telegramChatId: chatId } });
            if (!user) {
                await bot.sendMessage(chatId, "⚠️ Your Telegram is not linked to any account. Please use the button below to link your profile:", {
                    reply_markup: {
                        keyboard: [[{ text: "📱 Share My Contact to Link Account", request_contact: true }]],
                        resize_keyboard: true,
                        one_time_keyboard: true,
                    },
                });
                return;
            }
            const tasks = await data_source_1.AppDataSource.getRepository(Task_1.Task).find({
                where: { assigneeId: user.id, status: (0, typeorm_1.Not)(Task_1.TaskStatus.DONE) },
                relations: ["project"],
                order: { id: "DESC" },
            });
            if (tasks.length === 0) {
                await bot.sendMessage(chatId, `✅ *${user.name}*, you currently have no pending tasks! Great job.`);
                return;
            }
            const taskList = tasks
                .map((t) => `• *TASK-${t.id}*: ${t.title}\n  📁 Project: ${t.project?.name || "General"}\n  ⚡ Status: ${t.status}\n  📅 Deadline: ${t.deadline ? new Date(t.deadline).toLocaleDateString() : "None"}`)
                .join("\n\n");
            await bot.sendMessage(chatId, `📋 *Your Active Tasks (${tasks.length})*\n\n${taskList}\n\n_To report a blocker, type:_\n\`/blocker <describe issue>\``, { parse_mode: "Markdown" });
        }
        catch (err) {
            console.error("Telegram status error:", err?.message || err);
        }
    });
    // Handle /unlink command
    bot.onText(/^\/unlink(?:@\w+)?$/, async (msg) => {
        const chatId = String(msg.chat.id);
        try {
            const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
            const user = await userRepo.findOne({ where: { telegramChatId: chatId } });
            if (!user) {
                await bot.sendMessage(chatId, "No account was linked to this Telegram chat.");
                return;
            }
            user.telegramChatId = null;
            user.notifyTelegram = false;
            await userRepo.save(user);
            await bot.sendMessage(chatId, `🔒 Account unlinked. You will no longer receive notifications for \`${user.email}\` in this chat.\n\nTo reconnect anytime, send /start.`, { parse_mode: "Markdown" });
        }
        catch (err) {
            console.error("Telegram unlink error:", err?.message || err);
        }
    });
    // Handle /blocker command
    bot.onText(/^\/blocker(?:@\w+)?(?:\s+(.+))?$/s, async (msg, match) => {
        const chatId = String(msg.chat.id);
        const description = (match?.[1] || "").trim();
        try {
            const user = await data_source_1.AppDataSource.getRepository(User_1.User).findOne({ where: { telegramChatId: chatId } });
            if (!user) {
                await bot.sendMessage(chatId, "⚠️ Please link your account first. Send /start to begin.");
                return;
            }
            if (!description) {
                await bot.sendMessage(chatId, "⚠️ Please specify what is blocking you:\n`/blocker <description>`", {
                    parse_mode: "Markdown",
                });
                return;
            }
            const task = await data_source_1.AppDataSource.getRepository(Task_1.Task).findOne({
                where: { assigneeId: user.id, status: (0, typeorm_1.Not)(Task_1.TaskStatus.DONE) },
                order: { id: "DESC" },
            });
            if (!task) {
                await bot.sendMessage(chatId, "You have no active in-progress task to mark as blocked.");
                return;
            }
            const result = await progressService_1.ProgressService.raiseBlocker(user.id, task.id, description);
            if (result.error) {
                await bot.sendMessage(chatId, `⚠️ ${result.error}`);
                return;
            }
            await bot.sendMessage(chatId, `🚨 *Blocker Submitted to PM*\n\nTASK-${task.id}: ${task.title}\nNote: "${description}"`, {
                parse_mode: "Markdown",
            });
        }
        catch (err) {
            console.error("Telegram blocker error:", err?.message || err);
        }
    });
    // Handle plain text messages (e.g. user manually typing their phone number)
    bot.on("message", async (msg) => {
        if (msg.contact)
            return; // already handled
        const text = (msg.text || "").trim();
        if (text.startsWith("/"))
            return; // command
        const chatId = String(msg.chat.id);
        // If text looks like a phone number (e.g. +251911445566, 0911445566, etc.)
        if (/^[\d\s+\-().]{7,25}$/.test(text) && text.replace(/\D/g, "").length >= 7) {
            await handlePhoneLinking(chatId, text, msg.from?.first_name || "User");
            return;
        }
        // Default conversational help
        try {
            const user = await data_source_1.AppDataSource.getRepository(User_1.User).findOne({ where: { telegramChatId: chatId } });
            if (user) {
                await bot.sendMessage(chatId, `Hi ${user.name}! I am your NEXUS Enterprise assistant.\n\nCommands:\n• /status - View your active tasks\n• /blocker <reason> - Report a blocker\n• /unlink - Disconnect account`);
            }
            else {
                await bot.sendMessage(chatId, "To link your corporate account, tap 'Share My Contact' below or type your phone number:", {
                    reply_markup: {
                        keyboard: [[{ text: "📱 Share My Contact to Link Account", request_contact: true }]],
                        resize_keyboard: true,
                        one_time_keyboard: true,
                    },
                });
            }
        }
        catch { }
    });
    bot.on("polling_error", (err) => {
        const text = err?.message || String(err);
        if (text.includes("409")) {
            console.error("Telegram 409 conflict: another bot instance is currently polling. Please ensure no other process is running the bot.");
        }
        else {
            console.error("Telegram polling error:", text);
        }
    });
    await bot.startPolling();
    started = true;
    console.log("Telegram bot is actively polling for updates.");
}
