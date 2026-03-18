import { Request, Response, NextFunction } from 'express';
import { configService } from '../services/config.service';

export const configController = {
    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const configs = await configService.getAll();
            res.json({ success: true, data: configs });
        } catch (error) {
            next(error);
        }
    },

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const { key } = req.params;
            const result = await configService.update(key, req.body);
            res.json({ success: true, message: result.message });
        } catch (error) {
            next(error);
        }
    }
};
