import { Router } from 'express';
import { authController } from '../controllers/auth.controller';

const router = Router();

router.post('/validate-token', authController.validateToken);

export default router;
