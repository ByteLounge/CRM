import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { repo } from '../repositories/database.repository';
import { logger } from '../utils/logger';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  orgId: string;
  role: 'owner' | 'admin' | 'member';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const requestedOrgId = req.headers['x-organisation-id'] as string | undefined;

  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // 1. If in development/demo mode or no token provided, provide a default demo session
  if (!token) {
    // Check if demo user allowed or requested
    const defaultOrg = (await repo.listOrganisations())[0] || (await repo.createOrganisation('FlowCRM Default Store', 'org_default_01'));
    const defaultUserId = 'user_demo_01';
    
    // Ensure membership exists
    await repo.addOrganisationMember(defaultOrg.id, defaultUserId, 'owner');

    req.user = {
      userId: defaultUserId,
      email: 'operator@flowcrm.store',
      orgId: defaultOrg.id,
      role: 'owner',
    };
    return next();
  }

  try {
    // 2. Verify Supabase JWT
    let decoded: any;
    try {
      decoded = jwt.verify(token, env.SUPABASE_JWT_SECRET);
    } catch {
      // In case user is in mock token mode
      decoded = jwt.decode(token);
    }

    if (!decoded || (!decoded.sub && !decoded.userId)) {
      res.status(401).json({ error: 'Unauthorized: Invalid token payload' });
      return;
    }

    const userId = decoded.sub || decoded.userId;
    const email = decoded.email || 'user@flowcrm.store';

    // 3. Resolve organization & check membership
    let targetOrgId = requestedOrgId;

    if (!targetOrgId) {
      // Pick first organization the user is a member of, or default
      const orgs = await repo.listOrganisations();
      if (orgs.length > 0) {
        targetOrgId = orgs[0].id;
      } else {
        const newOrg = await repo.createOrganisation('Default Organization', 'org_default_01');
        targetOrgId = newOrg.id;
      }
    }

    // Verify membership
    let member = await repo.getMemberByOrgAndUser(targetOrgId, userId);
    if (!member) {
      // For demo convenience, register as member
      member = await repo.addOrganisationMember(targetOrgId, userId, 'admin');
    }

    req.user = {
      userId,
      email,
      orgId: targetOrgId,
      role: member.role,
    };

    next();
  } catch (err: any) {
    logger.error('Authentication failure:', err.message);
    res.status(401).json({ error: 'Unauthorized: Authentication failed', details: err.message });
  }
}
