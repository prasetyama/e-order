import { z } from 'zod';

export const createOrderDetailSchema = z.object({
    dist_id: z.number().int(),
    po_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
    po_number: z.string().max(45).optional(),
    dlv_date: z.string().optional(),
    principle: z.string().max(255),
    sku: z.string().max(15).nullable().optional(),
    order_qty: z.number().int().nullable().optional(),
    uom: z.string().max(10).nullable().optional(),
    stock_on_hand: z.number().int().optional().default(0),
    filename: z.string().optional(),
    order_type: z.string().max(45).optional(),
    periode: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD').optional(),
    created_by: z.string().max(45).optional(),
});

export const updateOrderDetailSchema = z.object({
    po_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD').optional(),
    po_number: z.string().max(45).optional(),
    dlv_date: z.string().optional(),
    principle: z.string().max(255).optional(),
    sku: z.string().max(15).nullable().optional(),
    order_qty: z.number().int().nullable().optional(),
    uom: z.string().max(10).nullable().optional(),
    stock_on_hand: z.number().int().optional(),
    filename: z.string().optional(),
    order_type: z.string().max(45).optional(),
    periode: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD').optional(),
    modified_by: z.string().max(45).optional(),
});

export const cancelOrderDetailSchema = z.object({
    cancel_notes: z.string().optional(),
    modified_by: z.string().max(45).optional(),
});

export const submitOrderDetailSchema = z.object({
    release_notes: z.string().optional(),
    modified_by: z.string().max(45).optional(),
});

export type CreateOrderDetailInput = z.infer<typeof createOrderDetailSchema>;
export type UpdateOrderDetailInput = z.infer<typeof updateOrderDetailSchema>;
export type CancelOrderDetailInput = z.infer<typeof cancelOrderDetailSchema>;
export type SubmitOrderDetailInput = z.infer<typeof submitOrderDetailSchema>;

export interface OrderDetail {
    id: number;
    dist_id: number;
    po_date: string;
    po_number: string;
    dlv_date: string | null;
    principle: string;
    sku: string;
    order_qty: number;
    uom: string;
    stock_on_hand: number;
    filename: string | null;
    error_flag: string | null;
    error_notes: string | null;
    release_flag: string | null;
    release_notes: string | null;
    transfer_flag: string | null;
    order_type: string | null;
    periode: string | null;
    modified_by: string | null;
    modified_date: string | null;
    created_by: string | null;
    created_date: string | null;
    cancel_flag: string | null;
    cancel_notes: string | null;
    status: 'DRAFT' | 'SUBMITTED' | 'CANCELLED';
}
