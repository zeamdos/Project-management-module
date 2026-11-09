import { Response } from "express";
import { AppDataSource } from "../config/data-source";
import { AuthRequest } from "../middleware/auth";

export class PlannerController {
  static async getEvents(req: AuthRequest, res: Response): Promise<void> {
    try {
      // For now, return empty array - you can implement with database table later
      res.json({ events: [] });
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
