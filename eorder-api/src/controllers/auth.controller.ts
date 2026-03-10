import { Request, Response } from 'express';

export const authController = {
    validateToken: async (req: Request, res: Response) => {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token is required',
            });
        }

        try {
            // Call external SSO API
            const response = await fetch('https://sso.ceresnl.com:50443/api/validate-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token }),
            });

            const result = await response.json() as any;

            if (!response.ok || !result.success) {
                return res.status(response.status || 401).json({
                    success: false,
                    message: result.message || 'Token validation failed',
                });
            }

            return res.json({
                success: true,
                data: result.data,
            });
        } catch (error: any) {
            console.error('External SSO validation error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error during token validation',
                error: error.message,
            });
        }
    },
};
