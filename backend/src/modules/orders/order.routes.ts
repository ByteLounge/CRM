import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { orderController } from './order.controller';
import { listOrdersQuerySchema } from './order.schema';

const router = Router();

router.use(requireAuth);

router.get('/', validate({ query: listOrdersQuerySchema }), (req, res, next) =>
  orderController.list(req, res).catch(next)
);

router.get('/:id', (req, res, next) =>
  orderController.getById(req, res).catch(next)
);

export default router;
