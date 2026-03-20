import { configRepository } from '../repositories/config.repository';
import { updateConfigSchema } from '../schemas/config.schema';
import { AppError } from '../middleware/errorHandler';

export const configService = {
    async getAll() {
        return configRepository.findAll();
    },

    async update(config_key: string, data: unknown) {
        const validated = updateConfigSchema.parse(data);
        const success = await configRepository.update(config_key, validated);
        if (!success) {
            throw new AppError('Configuration not found', 404);
        }
        return { message: 'Configuration updated successfully' };
    }
};
