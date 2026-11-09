"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const data_source_1 = require("../config/data-source");
const AuditLog_1 = require("../entities/AuditLog");
class AuditService {
    static async log(orgId, userId, action, entityName, entityId, details) {
        try {
            const auditRepo = data_source_1.AppDataSource.getRepository(AuditLog_1.AuditLog);
            const audit = auditRepo.create({
                orgId,
                userId,
                action,
                entityName,
                entityId,
                details: details || null,
            });
            await auditRepo.save(audit);
        }
        catch (err) {
            console.error("Failed to write audit log:", err);
        }
    }
}
exports.AuditService = AuditService;
