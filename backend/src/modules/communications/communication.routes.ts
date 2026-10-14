import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { communicationController } from './communication.controller';
import { createCommunicationSchema, updateCommunicationStatusSchema } from './communication.schema';

const router = Router();

router.use(requireAuth);

router.get('/', (req, res, next) =>
  communicationController.list(req, res).catch(next)
);

router.get('/:id', (req, res, next) =>
  communicationController.getById(req, res).catch(next)
);

router.post('/', validate({ body: createCommunicationSchema }), (req, res, next) =>
  communicationController.create(req, res).catch(next)
);

router.patch('/:id/status', validate({ body: updateCommunicationStatusSchema }), (req, res, next) =>
  communicationController.updateStatus(req, res).catch(next)
);

export default router;
