import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { analyticsController } from './analytics.controller';

const router = Router();

router.use(requireAuth);

router.get('/overview', (req, res, next) =>
  analyticsController.getOverview(req, res).catch(next)
);

router.get('/activity', (req, res, next) =>
  analyticsController.getActivity(req, res).catch(next)
);

export default router;
