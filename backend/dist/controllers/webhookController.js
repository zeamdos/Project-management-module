"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookController = void 0;
const crypto_1 = __importDefault(require("crypto"));
const typeorm_1 = require("typeorm");
const data_source_1 = require("../config/data-source");
const Repository_1 = require("../entities/Repository");
const GitActivity_1 = require("../entities/GitActivity");
const User_1 = require("../entities/User");
const Task_1 = require("../entities/Task");
let decrypt;
try {
    ({ decrypt } = require("../config/encryption"));
}
catch {
    try {
        ({ decrypt } = require("../config/Encryption"));
    }
    catch {
        decrypt = (value) => value;
    }
}
const PR_ACTIONS = ["opened", "reopened", "edited", "closed", "ready_for_review"];
class WebhookController {
    static async handleGitHub(req, res) {
        try {
            const signature = req.headers["x-hub-signature-256"];
            const event = req.headers["x-github-event"];
            const body = req.body;
            const repoUrl = body?.repository?.html_url;
            if (!repoUrl) {
                res.status(400).json({ error: "Invalid payload" });
                return;
            }
            // Accept the URL with or without a trailing slash or ".git"
            const baseUrl = String(repoUrl).replace(/\/+$/, "");
            const repository = await data_source_1.AppDataSource.getRepository(Repository_1.Repository).findOne({
                where: { url: (0, typeorm_1.In)([baseUrl, `${baseUrl}.git`, `${baseUrl}/`]) },
                select: ["id", "projectId", "webhookSecret"],
            });
            if (!repository) {
                res.status(404).json({ error: "Repository not registered" });
                return;
            }
            if (!repository.webhookSecret) {
                res.status(401).json({ error: "Webhook secret not set" });
                return;
            }
            // GitHub signs the RAW body, so we use the bytes saved in index.ts
            const raw = req.rawBody ?? Buffer.from(JSON.stringify(body));
            const secret = decrypt(repository.webhookSecret);
            const digest = "sha256=" + crypto_1.default.createHmac("sha256", secret).update(raw).digest("hex");
            const sigBuf = Buffer.from(signature || "");
            const digBuf = Buffer.from(digest);
            if (!signature || sigBuf.length !== digBuf.length || !crypto_1.default.timingSafeEqual(sigBuf, digBuf)) {
                res.status(401).json({ error: "Invalid webhook signature" });
                return;
            }
            if (event === "ping") {
                res.status(200).json({ status: "pong" });
                return;
            }
            const activityRepo = data_source_1.AppDataSource.getRepository(GitActivity_1.GitActivity);
            const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
            const taskRepo = data_source_1.AppDataSource.getRepository(Task_1.Task);
            const userCache = new Map();
            const findUserId = async (username) => {
                const name = (username || "").trim().replace(/^@/, "");
                if (!name)
                    return null;
                const key = name.toLowerCase();
                if (userCache.has(key))
                    return userCache.get(key);
                const user = await userRepo.findOne({ where: { githubUsername: name } });
                userCache.set(key, user ? user.id : null);
                return user ? user.id : null;
            };
            // "#12" or "#TASK-12", only tasks of the SAME project
            const findTaskId = async (message) => {
                const m = message.match(/#(?:TASK-)?(\d+)/i);
                if (!m)
                    return null;
                const task = await taskRepo.findOne({ where: { id: parseInt(m[1], 10), projectId: repository.projectId } });
                return task ? task.id : null;
            };
            if (event === "push") {
                const commits = body.commits?.length ? body.commits : body.head_commit ? [body.head_commit] : [];
                for (const c of commits) {
                    if (!c?.id)
                        continue;
                    const exists = await activityRepo.findOne({
                        where: { repositoryId: repository.id, externalId: c.id, activityType: GitActivity_1.GitActivityType.COMMIT },
                    });
                    if (exists)
                        continue; // GitHub resent this delivery
                    const message = String(c.message || "");
                    await activityRepo.save(activityRepo.create({
                        repositoryId: repository.id,
                        userId: await findUserId(c.author?.username || c.committer?.username),
                        taskId: await findTaskId(message),
                        activityType: GitActivity_1.GitActivityType.COMMIT,
                        externalId: c.id,
                        message,
                        url: c.url || null,
                    }));
                }
            }
            else if (event === "pull_request") {
                const pr = body.pull_request;
                if (pr && PR_ACTIONS.includes(body.action)) {
                    const state = pr.merged ? " (merged)" : pr.state === "closed" ? " (closed)" : "";
                    const message = `PR #${pr.number}${state}: ${pr.title} - ${pr.body || ""}`.trim();
                    const externalId = String(pr.id);
                    const existing = await activityRepo.findOne({
                        where: { repositoryId: repository.id, externalId, activityType: GitActivity_1.GitActivityType.PULL_REQUEST },
                    });
                    if (existing) {
                        existing.message = message; // same PR, newer state
                        await activityRepo.save(existing);
                    }
                    else {
                        await activityRepo.save(activityRepo.create({
                            repositoryId: repository.id,
                            userId: await findUserId(pr.user?.login),
                            taskId: await findTaskId(message),
                            activityType: GitActivity_1.GitActivityType.PULL_REQUEST,
                            externalId,
                            message,
                            url: pr.html_url || null,
                        }));
                    }
                }
            }
            res.status(200).json({ status: "received" });
        }
        catch (err) {
            console.error("GitHub webhook error:", err?.message || err);
            res.status(500).json({ error: "Webhook processing failed" });
        }
    }
}
exports.WebhookController = WebhookController;
