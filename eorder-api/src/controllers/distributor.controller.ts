import { Request, Response, NextFunction } from 'express';
import { distributorRepository } from '../repositories/distributor.repository';

export const distributorController = {
    getAll: async (_req: Request, res: Response, next: NextFunction) => {
        try {
            const distributors = await distributorRepository.findAll();
            res.json({ success: true, data: distributors });
        } catch (err) {
            next(err);
        }
    },
};
