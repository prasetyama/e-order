import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
    public statusCode: number;
    public details?: unknown;

    constructor(message: string, statusCode: number, details?: unknown) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'AppError';
    }
}

export function errorHandler(
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    // Zod validation errors
    if (err instanceof ZodError) {
        res.status(400).json({
            success: false,
            error: {
                message: 'Validation failed',
                details: err.issues,
            },
        });
        return;
    }

    // Custom application errors
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            error: {
                message: err.message,
                details: err.details,
            },
        });
        return;
    }

    // MySQL duplicate entry errors
    if ((err as any).code === 'ER_DUP_ENTRY') {
        res.status(409).json({
            success: false,
            error: {
                message: 'Duplicate entry',
                details: err.message,
            },
        });
        return;
    }

    // Unknown errors
    console.error('Unhandled Error:', err);
    res.status(500).json({
        success: false,
        error: {
            message: 'Internal server error',
        },
    });
}
