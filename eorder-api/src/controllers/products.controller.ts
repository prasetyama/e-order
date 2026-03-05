import { Request, Response, NextFunction } from 'express';
import { productsRepository } from '../repositories/products.repository';

export const productsController = {
    getAll: async (_req: Request, res: Response, next: NextFunction) => {
        try {
            const products = await productsRepository.findAll();
            res.json({ success: true, data: products });
        } catch (err) {
            next(err);
        }
    },
};
