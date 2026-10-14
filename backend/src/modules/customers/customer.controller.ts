import { Request, Response } from 'express';
import { repo } from '../../repositories/database.repository';

export class CustomerController {
  async list(req: Request, res: Response): Promise<void> {
    const orgId = req.user!.orgId;
    const query = req.query as any;

    const result = await repo.listCustomers(orgId, {
      search: query.search,
      segment: query.segment,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      limit: query.limit ? parseInt(query.limit, 10) : 20,
      offset: query.offset ? parseInt(query.offset, 10) : 0,
    });

    res.json({
      customers: result.customers,
      total: result.total,
      limit: query.limit ? parseInt(query.limit, 10) : 20,
      offset: query.offset ? parseInt(query.offset, 10) : 0,
    });
  }

  async getById(req: Request, res: Response): Promise<void> {
    const orgId = req.user!.orgId;
    const { id } = req.params;

    const customer = await repo.getCustomerById(orgId, id);
    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    // Get order history, notes, and communications
    const ordersResult = await repo.listOrders(orgId, { customerId: id, limit: 50, sortBy: 'placed_at', sortOrder: 'desc' });
    const notes = await repo.listCustomerNotes(orgId, id);
    const communications = await repo.listCommunications(orgId, { customerId: id, limit: 50 });

    res.json({
      customer,
      orders: ordersResult.orders,
      notes,
      communications,
    });
  }

  async listNotes(req: Request, res: Response): Promise<void> {
    const orgId = req.user!.orgId;
    const { id } = req.params;
    const notes = await repo.listCustomerNotes(orgId, id);
    res.json({ notes });
  }

  async addNote(req: Request, res: Response): Promise<void> {
    const orgId = req.user!.orgId;
    const { id } = req.params;
    const { content } = req.body;

    const customer = await repo.getCustomerById(orgId, id);
    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    const note = await repo.addCustomerNote(orgId, id, req.user!.userId, content);
    await repo.logActivity(orgId, req.user!.userId, 'customer', id, 'note_added', { noteId: note.id });
    res.status(201).json({ note });
  }

  async deleteNote(req: Request, res: Response): Promise<void> {
    const orgId = req.user!.orgId;
    const { noteId } = req.params;
    await repo.deleteCustomerNote(orgId, noteId);
    res.json({ success: true, message: 'Note deleted' });
  }
}

export const customerController = new CustomerController();
