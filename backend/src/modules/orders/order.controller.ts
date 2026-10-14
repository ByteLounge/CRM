import { Request, Response } from 'express';
import { repo } from '../../repositories/database.repository';

export class OrderController {
  async list(req: Request, res: Response): Promise<void> {
    const orgId = req.user!.orgId;
    const query = req.query as any;

    const result = await repo.listOrders(orgId, {
      customerId: query.customerId as string | undefined,
      search: query.search as string | undefined,
      status: query.status,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      limit: query.limit ? parseInt(query.limit, 10) : 20,
      offset: query.offset ? parseInt(query.offset, 10) : 0,
    });

    res.json({
      orders: result.orders,
      total: result.total,
      limit: query.limit ? parseInt(query.limit, 10) : 20,
      offset: query.offset ? parseInt(query.offset, 10) : 0,
    });
  }

  async getById(req: Request, res: Response): Promise<void> {
    const orgId = req.user!.orgId;
    const id = req.params.id as string;

    const order = await repo.getOrderById(orgId, id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json({ order });
  }
}

export const orderController = new OrderController();
