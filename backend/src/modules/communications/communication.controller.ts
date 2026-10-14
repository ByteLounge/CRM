import { Request, Response } from 'express';
import { repo } from '../../repositories/database.repository';

export class CommunicationController {
  async list(req: Request, res: Response): Promise<void> {
    const orgId = req.user!.orgId;
    const { customerId, status, limit } = req.query as any;

    const communications = await repo.listCommunications(orgId, {
      customerId: customerId as string | undefined,
      status: status as string | undefined,
      limit: limit ? parseInt(limit as string, 10) : 50,
    });

    res.json({ communications });
  }

  async getById(req: Request, res: Response): Promise<void> {
    const orgId = req.user!.orgId;
    const id = req.params.id as string;

    const communication = await repo.getCommunicationById(orgId, id);
    if (!communication) {
      res.status(404).json({ error: 'Communication record not found' });
      return;
    }

    res.json({ communication });
  }

  async create(req: Request, res: Response): Promise<void> {
    const orgId = req.user!.orgId;
    const { customerId, orderId, channel, purpose, subject, message, status, generatedByAi } = req.body;

    const customer = await repo.getCustomerById(orgId, customerId);
    if (!customer) {
      res.status(404).json({ error: 'Target customer does not exist' });
      return;
    }

    const communication = await repo.createCommunication(orgId, {
      customer_id: customerId,
      order_id: orderId,
      channel,
      purpose,
      subject,
      message,
      status: status || 'draft',
      generated_by_ai: Boolean(generatedByAi),
    });

    await repo.logActivity(orgId, req.user!.userId, 'communication', communication.id, 'created', {
      customerId,
      subject,
      status: communication.status,
    });

    res.status(201).json({ communication });
  }

  async updateStatus(req: Request, res: Response): Promise<void> {
    const orgId = req.user!.orgId;
    const id = req.params.id as string;
    const { status } = req.body;

    const existing = await repo.getCommunicationById(orgId, id);
    if (!existing) {
      res.status(404).json({ error: 'Communication not found' });
      return;
    }

    const updated = await repo.updateCommunicationStatus(
      orgId,
      id,
      status,
      req.user!.userId
    );

    await repo.logActivity(orgId, req.user!.userId, 'communication', id, 'status_updated', {
      previousStatus: existing.status,
      newStatus: status,
    });

    res.json({ communication: updated });
  }
}

export const communicationController = new CommunicationController();
