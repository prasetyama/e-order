import pool from '../lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { CreateOrderDetailInput, UpdateOrderDetailInput, OrderDetail } from '../schemas/orderDetail.schema';

interface OrderDetailRow extends RowDataPacket, OrderDetail { }

interface Filters {
    dist_id?: number;
    principle?: string;
    periode?: string;
    po_number?: string;
    status?: 'DRAFT' | 'SUBMITTED' | 'CANCELLED';
}

const SELECT_QUERY = `
    SELECT *,
    CASE 
        WHEN cancel_flag = 'Y' THEN 'CANCELLED'
        WHEN release_flag = 'Y' THEN 'SUBMITTED'
        ELSE 'DRAFT'
    END as status
    FROM order_detail
`;

export const orderDetailRepository = {
    async findAll(filters: Filters = {}): Promise<OrderDetail[]> {
        let sql = `SELECT * FROM (${SELECT_QUERY}) as t WHERE 1=1`;
        const params: unknown[] = [];

        if (filters.dist_id) {
            sql += ' AND distid = ?';
            params.push(filters.dist_id);
        }
        if (filters.principle) {
            sql += ' AND principal = ?';
            params.push(filters.principle);
        }
        if (filters.periode) {
            sql += ' AND periode = ?';
            params.push(filters.periode);
        }
        if (filters.po_number) {
            sql += ' AND ponumber = ?';
            params.push(filters.po_number);
        }
        if (filters.status) {
            sql += ' AND status = ?';
            params.push(filters.status);
        }

        sql += ' ORDER BY id DESC';

        const [rows] = await pool.query<OrderDetailRow[]>(sql, params);
        return rows;
    },

    async findById(id: number): Promise<OrderDetail | null> {
        const [rows] = await pool.query<OrderDetailRow[]>(
            `SELECT * FROM (${SELECT_QUERY}) as t WHERE id = ?`,
            [id]
        );
        return rows[0] || null;
    },

    async create(data: CreateOrderDetailInput): Promise<OrderDetail> {
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO order_detail 
            (distid, ponumber, podate, dlvdate, principal, sku, orderqty, uom, stockonhand, filename, order_type, periode, CREATEBY, CREATEDATE) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.dist_id,
                data.po_number,
                data.po_date,
                data.dlv_date,
                data.principle,
                data.sku,
                data.order_qty,
                data.uom,
                data.stock_on_hand ?? 0,
                data.filename ?? null,
                data.order_type ?? null,
                data.periode ?? null,
                data.created_by ?? null,
                now,
            ]
        );

        const created = await this.findById(result.insertId);
        return created!;
    },

    async update(id: number, data: UpdateOrderDetailInput): Promise<OrderDetail | null> {
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

        const fields: string[] = [];
        const params: unknown[] = [];

        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined) {
                fields.push(`${key} = ?`);
                params.push(value);
            }
        }

        if (fields.length === 0) {
            return this.findById(id);
        }

        fields.push('MODIFIEDDATE = ?');
        params.push(now);

        if (data.modified_by) {
            fields.push('MODIFIEDBY = ?');
            params.push(data.modified_by);
        }

        params.push(id);

        await pool.query<ResultSetHeader>(
            `UPDATE order_detail SET ${fields.join(', ')} WHERE id = ?`,
            params
        );

        return this.findById(id);
    },

    async submit(id: number, notes?: string, modifiedBy?: string): Promise<OrderDetail | null> {
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

        await pool.query<ResultSetHeader>(
            `UPDATE order_detail SET release_flag = 'Y', release_notes = ?, MODIFIEDBY = ?, MODIFIEDDATE = ? WHERE id = ?`,
            [notes ?? null, modifiedBy ?? null, now, id]
        );

        return this.findById(id);
    },

    async cancel(id: number, notes?: string, modifiedBy?: string): Promise<OrderDetail | null> {
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

        await pool.query<ResultSetHeader>(
            `UPDATE order_detail SET cancel_flag = 'Y', notes = ?, MODIFIEDBY = ?, MODIFIEDDATE = ? WHERE id = ?`,
            [notes ?? null, modifiedBy ?? null, now, id]
        );

        return this.findById(id);
    },
};
