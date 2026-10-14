import { Request, Response } from 'express';
import { repo } from '../../repositories/database.repository';

export class AnalyticsController {
  async getOverview(req: Request, res: Response): Promise<void> {
    const orgId = req.user!.orgId;
    const analytics = await repo.getDashboardAnalytics(orgId);
    res.json(analytics);
  }

  async getActivity(req: Request, res: Response): Promise<void> {
    const orgId = req.user!.orgId;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const activities = await repo.listActivityLogs(orgId, limit);
    res.json({ activities });
  }
}

export const analyticsController = new AnalyticsController();
