import { z } from 'zod';

export const configSchema = z.object({
    config_key: z.string().max(50),
    config_value: z.string().max(255),
    description: z.string().max(255).optional().nullable(),
    updated_at: z.string().optional().nullable(),
});

export const updateConfigSchema = z.object({
    config_value: z.string().max(255),
});

export type Config = z.infer<typeof configSchema>;
export type UpdateConfigInput = z.infer<typeof updateConfigSchema>;
