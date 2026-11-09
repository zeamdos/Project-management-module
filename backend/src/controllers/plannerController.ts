import { Response } from "express";
import { AppDataSource } from "../config/data-source";
import { AuthRequest } from "../middleware/auth";

export class PlannerController {
  static async getEvents(req: AuthRequest, res: Response): Promise<void> {
    try {
      const page = Math.max(1, parseInt((req.query.page as string) || "1", 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || "20", 10) || 20));
      const skip = (page - 1) * limit;

      // For now, return empty array - you can implement with database table later
      const events: any[] = [];
      const total = events.length;

      res.json({
        data: events.slice(skip, skip + limit),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async addEvent(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { title, date, type, isOrganizationWide, projectId, projectName } = req.body;
      
      // For now, just return success - implement with database table later
      res.json({
        message: "Event added successfully",
        event: {
          id: Date.now(),
          title,
          date,
          type,
          isOrganizationWide,
          projectId,
          projectName,
          createdAt: new Date().toISOString()
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
