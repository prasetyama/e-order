import { orderDetailRepository } from '../repositories/orderDetail.repository';
import {
    createOrderDetailSchema,
    updateOrderDetailSchema,
    cancelOrderDetailSchema,
    submitOrderDetailSchema,
    CreateOrderDetailInput,
    UpdateOrderDetailInput,
} from '../schemas/orderDetail.schema';
import { AppError } from '../middleware/errorHandler';

export const orderDetailService = {
    async getAll(filters: {
        dist_id?: string;
        principle?: string;
        periode?: string;
        po_number?: string;
        status?: string;
        grouped?: string;
    }) {
        const parsedFilters = {
            dist_id: filters.dist_id ? parseInt(filters.dist_id) : undefined,
            principle: filters.principle,
            periode: filters.periode,
            po_number: filters.po_number,
            status: filters.status as any,
            grouped: filters.grouped === 'true',
        };
        return orderDetailRepository.findAll(parsedFilters);
    },

    async getById(id: number) {
        const order = await orderDetailRepository.findById(id);
        if (!order) {
            throw new AppError('Order detail not found', 404);
        }
        return order;
    },

    async create(data: unknown) {
        const validated = createOrderDetailSchema.parse(data) as CreateOrderDetailInput;
        return orderDetailRepository.create(validated);
    },

    async update(id: number, data: unknown) {
        // Check existence and status
        const existing = await this.getById(id);
        if (existing.status !== 'DRAFT') {
            throw new AppError(`Cannot update order in ${existing.status} status`, 400);
        }

        const validated = updateOrderDetailSchema.parse(data) as UpdateOrderDetailInput;
        return orderDetailRepository.update(id, validated);
    },

    async submit(id: number, data: unknown) {
        const existing = await this.getById(id);
        if (existing.status !== 'DRAFT') {
            throw new AppError(`Cannot submit order in ${existing.status} status`, 400);
        }

        const validated = submitOrderDetailSchema.parse(data);
        return orderDetailRepository.submit(id, validated.release_notes, validated.modified_by);
    },

    async cancel(id: number, data: unknown) {
        // Check existence and status
        const existing = await this.getById(id);
        if (existing.status !== 'DRAFT') {
            throw new AppError(`Cannot cancel order in ${existing.status} status`, 400);
        }

        const validated = cancelOrderDetailSchema.parse(data);
        return orderDetailRepository.cancel(id, validated.cancel_notes, validated.modified_by);
    },
};
