import { Router } from 'express';
import { orderDetailController } from '../controllers/orderDetail.controller';

const router = Router();

router.get('/', orderDetailController.getAll);
router.get('/:id', orderDetailController.getById);
router.post('/initialize', orderDetailController.initialize);
router.post('/submit', orderDetailController.submitBulk);
router.post('/', orderDetailController.create);
router.patch('/:id', orderDetailController.update);
router.patch('/:id/submit', orderDetailController.submit);
router.patch('/:id/cancel', orderDetailController.cancel);

export default router;
