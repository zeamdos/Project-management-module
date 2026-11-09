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
      
      const logs = await auditRepo.find({
        where: { orgId: req.user!.orgId },
        order: { createdAt: "DESC" },
        take: 100,
      });

      res.json({ logs });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
