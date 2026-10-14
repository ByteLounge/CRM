import { Request, Response } from 'express';
import { flowAIService } from './ai.service';

export class FlowAIController {
  async getCustomerInsights(req: Request, res: Response): Promise<void> {
    const orgId = req.user!.orgId;
    const { customerId } = req.body;
    const insights = await flowAIService.generateCustomerInsights(orgId, customerId);
    res.json(insights);
  }

  async generateCommunication(req: Request, res: Response): Promise<void> {
    const orgId = req.user!.orgId;
    const result = await flowAIService.generatePersonalizedCommunication(orgId, req.body);
    res.json(result);
  }

  async runRetentionScan(req: Request, res: Response): Promise<void> {
    const orgId = req.user!.orgId;
    const result = await flowAIService.runRetentionAgentScan(orgId);
    res.json(result);
  }
}

export const flowAIController = new FlowAIController();
