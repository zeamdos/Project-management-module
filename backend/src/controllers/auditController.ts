import { Response } from "express";
import { AppDataSource } from "../config/data-source";
import { AuthRequest } from "../middleware/auth";
import { AuditLog } from "../entities/AuditLog";
import { requireRole } from "../middleware/auth";
import { UserRole } from "../entities/User";

export class AuditController {
  static async getAuditLogs(req: AuthRequest, res: Response): Promise<void> {
    try {
      const auditRepo = AppDataSource.getRepository(AuditLog);
      const page = Math.max(1, parseInt((req.query.page as string) || "1", 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || "20", 10) || 20));
      const skip = (page - 1) * limit;

      const [logs, total] = await auditRepo.findAndCount({
        where: { orgId: req.user!.orgId },
        order: { createdAt: "DESC" },
        skip,
        take: limit,
      });

      res.json({
        data: logs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
