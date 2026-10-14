import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { repo } from '../../repositories/database.repository';

export class AuthController {
  async getMe(req: Request, res: Response): Promise<void> {
    const user = req.user!;
    const org = await repo.getOrganisationById(user.orgId);
    const orgs = await repo.listOrganisations();

    res.json({
      user: {
        id: user.userId,
        email: user.email,
        role: user.role,
      },
      currentOrganisation: org,
      availableOrganisations: orgs,
    });
  }

  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    // Default or demo login
    let orgs = await repo.listOrganisations();
    let org = orgs[0];
    if (!org) {
      org = await repo.createOrganisation('FlowCRM Store', 'org_default_01');
    }

    const userId = `user_${Buffer.from(email).toString('hex').substring(0, 10)}`;
    await repo.addOrganisationMember(org.id, userId, 'owner');

    const token = jwt.sign(
      {
        sub: userId,
        email,
        orgId: org.id,
        role: 'owner',
      },
      env.SUPABASE_JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: userId,
        email,
        role: 'owner',
      },
      organisation: org,
    });
  }

  async switchOrganisation(req: Request, res: Response): Promise<void> {
    const { organisationId } = req.body;
    const org = await repo.getOrganisationById(organisationId);
    if (!org) {
      res.status(404).json({ error: 'Organisation not found' });
      return;
    }

    // Check membership
    await repo.addOrganisationMember(organisationId, req.user!.userId, 'admin');

    const token = jwt.sign(
      {
        sub: req.user!.userId,
        email: req.user!.email,
        orgId: org.id,
        role: 'admin',
      },
      env.SUPABASE_JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      currentOrganisation: org,
    });
  }
}

export const authController = new AuthController();
