import { Request, Response } from "express";
import crypto from "crypto";
import { In } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Repository } from "../entities/Repository";
import { GitActivity, GitActivityType } from "../entities/GitActivity";
import { User } from "../entities/User";
import { Task } from "../entities/Task";

let decrypt: (value: string) => string;

try {
  ({ decrypt } = require("../config/encryption"));
} catch {
  try {
    ({ decrypt } = require("../config/Encryption"));
  } catch {
    decrypt = (value: string) => value;
  }
}

const PR_ACTIONS = ["opened", "reopened", "edited", "closed", "ready_for_review"];

export class WebhookController {
  static async handleGitHub(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers["x-hub-signature-256"] as string | undefined;
      const event = req.headers["x-github-event"] as string | undefined;
      const body = req.body;

      const repoUrl = body?.repository?.html_url;
      if (!repoUrl) {
        res.status(400).json({ error: "Invalid payload" });
        return;
      }

      // Accept the URL with or without a trailing slash or ".git"
      const baseUrl = String(repoUrl).replace(/\/+$/, "");
      const repository = await AppDataSource.getRepository(Repository).findOne({
        where: { url: In([baseUrl, `${baseUrl}.git`, `${baseUrl}/`]) },
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
      const raw: Buffer = (req as any).rawBody ?? Buffer.from(JSON.stringify(body));
      const secret = decrypt(repository.webhookSecret);
      const digest = "sha256=" + crypto.createHmac("sha256", secret).update(raw).digest("hex");
      const sigBuf = Buffer.from(signature || "");
      const digBuf = Buffer.from(digest);

      if (!signature || sigBuf.length !== digBuf.length || !crypto.timingSafeEqual(sigBuf, digBuf)) {
        res.status(401).json({ error: "Invalid webhook signature" });
        return;
      }

      if (event === "ping") {
        res.status(200).json({ status: "pong" });
        return;
      }

      const activityRepo = AppDataSource.getRepository(GitActivity);
      const userRepo = AppDataSource.getRepository(User);
      const taskRepo = AppDataSource.getRepository(Task);

      const userCache = new Map<string, number | null>();
      const findUserId = async (username?: string | null): Promise<number | null> => {
        const name = (username || "").trim().replace(/^@/, "");
        if (!name) return null;
        const key = name.toLowerCase();
        if (userCache.has(key)) return userCache.get(key)!;
        const user = await userRepo.findOne({ where: { githubUsername: name } });
        userCache.set(key, user ? user.id : null);
        return user ? user.id : null;
      };

      // "#12" or "#TASK-12", only tasks of the SAME project
      const findTaskId = async (message: string): Promise<number | null> => {
        const m = message.match(/#(?:TASK-)?(\d+)/i);
        if (!m) return null;
        const task = await taskRepo.findOne({ where: { id: parseInt(m[1], 10), projectId: repository.projectId } });
        return task ? task.id : null;
      };

      if (event === "push") {
        const commits: any[] = body.commits?.length ? body.commits : body.head_commit ? [body.head_commit] : [];

        for (const c of commits) {
          if (!c?.id) continue;
          const exists = await activityRepo.findOne({
            where: { repositoryId: repository.id, externalId: c.id, activityType: GitActivityType.COMMIT },
          });
          if (exists) continue; // GitHub resent this delivery

          const message = String(c.message || "");
          await activityRepo.save(
            activityRepo.create({
              repositoryId: repository.id,
              userId: await findUserId(c.author?.username || c.committer?.username),
              taskId: await findTaskId(message),
              activityType: GitActivityType.COMMIT,
              externalId: c.id,
              message,
              url: c.url || null,
            })
          );
        }
      } else if (event === "pull_request") {
        const pr = body.pull_request;
        if (pr && PR_ACTIONS.includes(body.action)) {
          const state = pr.merged ? " (merged)" : pr.state === "closed" ? " (closed)" : "";
          const message = `PR #${pr.number}${state}: ${pr.title} - ${pr.body || ""}`.trim();
          const externalId = String(pr.id);

          const existing = await activityRepo.findOne({
            where: { repositoryId: repository.id, externalId, activityType: GitActivityType.PULL_REQUEST },
          });

          if (existing) {
            existing.message = message; // same PR, newer state
            await activityRepo.save(existing);
          } else {
            await activityRepo.save(
              activityRepo.create({
                repositoryId: repository.id,
                userId: await findUserId(pr.user?.login),
                taskId: await findTaskId(message),
                activityType: GitActivityType.PULL_REQUEST,
                externalId,
                message,
                url: pr.html_url || null,
              })
            );
          }
        }
      }

      res.status(200).json({ status: "received" });
    } catch (err: any) {
      console.error("GitHub webhook error:", err?.message || err);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  }
}