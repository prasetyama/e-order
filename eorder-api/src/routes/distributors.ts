import { Router } from 'express';
import { distributorController } from '../controllers/distributor.controller';

const router = Router();

router.get('/', distributorController.getAll);

export default router;
