import { Router } from 'express';
import { requireAuth } from '../../../middleware/auth';
import { wcController } from './woocommerce.controller';

const router = Router();

// Public webhook receiver (verifies HMAC signature, no user JWT required)
router.post('/webhook', (req, res, next) =>
  wcController.handleWebhook(req, res).catch(next)
);

// Protected integration endpoints
router.use(requireAuth);

router.get('/status', (req, res, next) =>
  wcController.getStatus(req, res).catch(next)
);

router.post('/test', (req, res, next) =>
  wcController.testConnection(req, res).catch(next)
);

router.post('/settings', (req, res, next) =>
  wcController.updateSettings(req, res).catch(next)
);

router.post('/sync', (req, res, next) =>
  wcController.triggerSync(req, res).catch(next)
);

export default router;
