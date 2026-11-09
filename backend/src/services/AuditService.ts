import { AppDataSource } from "../config/data-source";
import { AuditLog } from "../entities/AuditLog";

export class AuditService {
  static async log(
    orgId: number,
    userId: number | null,
    action: string,
    entityName: string,
    entityId: number,
    details?: string
  ): Promise<void> {
    try {
      const auditRepo = AppDataSource.getRepository(AuditLog);
      const audit = auditRepo.create({
        orgId,
        userId,
        action,
        entityName,
        entityId,
        details: details || null,
      });
      await auditRepo.save(audit);
    } catch (err) {
      console.error("Failed to write audit log:", err);
    }
  }
}