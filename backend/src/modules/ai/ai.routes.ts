import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { flowAIController } from './ai.controller';
import { customerInsightsRequestSchema, generateCommunicationRequestSchema } from './ai.schema';

const router = Router();

router.use(requireAuth);

router.post('/insights', validate({ body: customerInsightsRequestSchema }), (req, res, next) =>
  flowAIController.getCustomerInsights(req, res).catch(next)
);

router.post('/generate-communication', validate({ body: generateCommunicationRequestSchema }), (req, res, next) =>
  flowAIController.generateCommunication(req, res).catch(next)
);

router.post('/retention-scan', (req, res, next) =>
  flowAIController.runRetentionScan(req, res).catch(next)
);

export default router;
