import { Router } from 'express';
import { configController } from '../controllers/config.controller';

const router = Router();

router.get('/', configController.getAll);
router.put('/:key', configController.update);

export default router;
