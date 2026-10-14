import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { authController } from './auth.controller';

const router = Router();

router.post('/signup', (req, res, next) =>
  authController.signup(req, res).catch(next)
);

router.post('/login', (req, res, next) =>
  authController.login(req, res).catch(next)
);

router.get('/me', requireAuth, (req, res, next) =>
  authController.getMe(req, res).catch(next)
);

router.post('/switch-org', requireAuth, (req, res, next) =>
  authController.switchOrganisation(req, res).catch(next)
);

export default router;
