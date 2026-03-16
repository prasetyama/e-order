import { Request, Response, NextFunction } from 'express';
import { orderDetailService } from '../services/orderDetail.service';

export const orderDetailController = {
    getAll: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const filters = {
                dist_id: req.query.dist_id as string | undefined,
                principle: req.query.principle as string | undefined,
                periode: req.query.periode as string | undefined,
                filename: req.query.filename as string | undefined,
                status: req.query.status as string | undefined,
                grouped: req.query.grouped as string | undefined,
            };
            const orders = await orderDetailService.getAll(filters);
            res.json({ success: true, data: orders });
        } catch (err) {
            next(err);
        }
    },

    getById: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({ success: false, error: { message: 'Invalid ID' } });
                return;
            }
            const order = await orderDetailService.getById(id);
            res.json({ success: true, data: order });
        } catch (err) {
            next(err);
        }
    },

    create: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const order = await orderDetailService.create(req.body);
            res.status(201).json({ success: true, data: order });
        } catch (err) {
            next(err);
        }
    },

    initialize: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await orderDetailService.initialize(req.body);
            res.status(201).json({ success: true, data: result });
        } catch (err) {
            next(err);
        }
    },

    update: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({ success: false, error: { message: 'Invalid ID' } });
                return;
            }
            const order = await orderDetailService.update(id, req.body);
            res.json({ success: true, data: order });
        } catch (err) {
            next(err);
        }
    },

    submit: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({ success: false, error: { message: 'Invalid ID' } });
                return;
            }
            const order = await orderDetailService.submit(id, req.body);
            res.json({ success: true, data: order });
        } catch (err) {
            next(err);
        }
    },

    submitBulk: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { filename } = req.body;
            if (!filename) {
                res.status(400).json({ success: false, error: { message: 'Filename is required' } });
                return;
            }
            await orderDetailService.submitBulk(filename);
            res.json({ success: true, message: 'Order submitted successfully' });
        } catch (err) {
            next(err);
        }
    },

    cancel: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({ success: false, error: { message: 'Invalid ID' } });
                return;
            }
            const order = await orderDetailService.cancel(id, req.body);
            res.json({ success: true, data: order });
        } catch (err) {
            next(err);
        }
    },

    getWeeks: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const weeks = await orderDetailService.getWeeks();
            res.json({ success: true, data: weeks });
        } catch (err) {
            next(err);
        }
    },

    getInvoices: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { filename } = req.params;
            if (!filename) {
                res.status(400).json({ success: false, error: { message: 'Filename is required' } });
                return;
            }
            const invoices = await orderDetailService.getInvoicesByFilename(filename);
            res.json({ success: true, data: invoices });
        } catch (err) {
            next(err);
        }
    },
};
