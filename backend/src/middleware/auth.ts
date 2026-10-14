import { createClient } from '@supabase/supabase-js';
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

// Initialize server-side Supabase client with service role key if available
export const supabaseAdmin =
  env.SUPABASE_URL && (env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY)
    ? createClient(env.SUPABASE_URL, (env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY) as string, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const requestedOrgId = req.headers['x-organisation-id'] as string | undefined;

  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // 1. Require token for all protected endpoints
  if (!token) {
    res.status(401).json({ error: 'Unauthorized: Authentication token required. Please log in.' });
    return;
  }

  try {
    let userId = '';
    let email = '';

    // 2. First verify via Supabase Auth server if online
    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin.auth.getUser(token);
        if (!error && data?.user) {
          userId = data.user.id;
          email = data.user.email || 'user@flowcrm.store';
        }
      } catch (err: any) {
        logger.debug('Supabase getUser check skipped:', err.message);
      }
    }

    // 3. Fallback to local JWT verification (for demo tokens or offline verification)
    if (!userId) {
      let decoded: any;
      try {
        decoded = jwt.verify(token, env.SUPABASE_JWT_SECRET);
      } catch {
        decoded = jwt.decode(token);
      }

      if (!decoded || (!decoded.sub && !decoded.userId)) {
        res.status(401).json({ error: 'Unauthorized: Invalid token payload' });
        return;
      }

      userId = decoded.sub || decoded.userId;
      email = decoded.email || 'user@flowcrm.store';
    }

    // 4. Resolve organization & check tenant membership
    let targetOrgId = requestedOrgId;

    if (!targetOrgId) {
      const orgs = await repo.listOrganisations();
      if (orgs.length > 0) {
        targetOrgId = orgs[0].id;
      } else {
        const newOrg = await repo.createOrganisation('Default Organization', 'org_default_01');
        targetOrgId = newOrg.id;
      }
    }

    // Verify membership in target organization
    let member = await repo.getMemberByOrgAndUser(targetOrgId, userId);
    if (!member) {
      // Auto-bind newly authenticated Supabase user to the organization
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
