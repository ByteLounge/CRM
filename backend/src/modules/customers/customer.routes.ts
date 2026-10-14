import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { customerController } from './customer.controller';
import { addCustomerNoteSchema, listCustomersQuerySchema } from './customer.schema';

const router = Router();

router.use(requireAuth);

router.get('/', validate({ query: listCustomersQuerySchema }), (req, res, next) =>
  customerController.list(req, res).catch(next)
);

router.get('/:id', (req, res, next) =>
  customerController.getById(req, res).catch(next)
);

router.get('/:id/notes', (req, res, next) =>
  customerController.listNotes(req, res).catch(next)
);

router.post('/:id/notes', validate({ body: addCustomerNoteSchema }), (req, res, next) =>
  customerController.addNote(req, res).catch(next)
);

router.delete('/:id/notes/:noteId', (req, res, next) =>
  customerController.deleteNote(req, res).catch(next)
);

export default router;
