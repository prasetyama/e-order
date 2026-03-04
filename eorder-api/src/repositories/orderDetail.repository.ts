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
    grouped?: boolean;
}

const SELECT_QUERY = `
    SELECT 
        id,
        distid as dist_id,
        ponumber as po_number,
        podate as po_date,
        dlvdate as dlv_date,
        principal as principle,
        sku,
        orderqty as order_qty,
        uom,
        stockonhand as stock_on_hand,
        filename,
        error_flag,
        error_notes,
        release_flag,
        release_notes,
        transfer_flag,
        order_type,
        periode,
        MODIFIEDBY as modified_by,
        MODIFIEDDATE as modified_date,
        CREATEBY as created_by,
        CREATEDATE as created_date,
        cancel_flag,
        notes as cancel_notes,
        CASE 
            WHEN cancel_flag = 'Y' THEN 'CANCELLED'
            WHEN release_flag = 'Y' THEN 'SUBMITTED'
            ELSE 'DRAFT'
        END as status
    FROM eorder_eorderdatadtl
`;

export const orderDetailRepository = {
    async findAll(filters: Filters = {}): Promise<OrderDetail[]> {
        const isGrouped = !!filters.grouped;
        const selectFields = isGrouped
            ? 'ANY_VALUE(id) as id, ANY_VALUE(dist_id) as dist_id, po_number, ANY_VALUE(po_date) as po_date, ANY_VALUE(dlv_date) as dlv_date, ANY_VALUE(principle) as principle, ANY_VALUE(status) as status, ANY_VALUE(order_type) as order_type, ANY_VALUE(periode) as periode, ANY_VALUE(created_by) as created_by, ANY_VALUE(created_date) as created_date, ANY_VALUE(modified_by) as modified_by, ANY_VALUE(modified_date) as modified_date'
            : '*';

        let sql = `SELECT ${selectFields} FROM (${SELECT_QUERY}) as t WHERE 1=1`;
        const params: unknown[] = [];

        if (filters.dist_id) {
            sql += ' AND dist_id = ?';
            params.push(filters.dist_id);
        }
        if (filters.principle) {
            sql += ' AND principle = ?';
            params.push(filters.principle);
        }
        if (filters.periode) {
            sql += ' AND periode = ?';
            params.push(filters.periode);
        }
        if (filters.po_number) {
            sql += ' AND po_number = ?';
            params.push(filters.po_number);
        }
        if (filters.status) {
            sql += ' AND status = ?';
            params.push(filters.status);
        }

        if (filters.grouped) {
            sql += ' GROUP BY po_number';
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

        // Sync CREATEDATE with other items in the same PO
        const [existing] = await pool.query<RowDataPacket[]>(
            'SELECT CREATEDATE FROM eorder_eorderdatadtl WHERE ponumber = ? LIMIT 1',
            [data.po_number]
        );
        const syncedCreatedDate = existing[0]?.CREATEDATE || now;

        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO eorder_eorderdatadtl 
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
                syncedCreatedDate,
            ]
        );

        const created = await this.findById(result.insertId);
        return created!;
    },

    async update(id: number, data: UpdateOrderDetailInput): Promise<OrderDetail | null> {
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

        // Fetch existing po_number for the record being updated
        const [currentRow] = await pool.query<RowDataPacket[]>(
            'SELECT ponumber FROM eorder_eorderdatadtl WHERE id = ?',
            [id]
        );
        const poNumber = currentRow[0]?.ponumber;

        // Fetch the standardized CREATEDATE for this PO
        let syncedCreatedDate = null;
        if (poNumber) {
            const [existing] = await pool.query<RowDataPacket[]>(
                'SELECT CREATEDATE FROM eorder_eorderdatadtl WHERE ponumber = ? AND id != ? LIMIT 1',
                [poNumber, id]
            );
            syncedCreatedDate = existing[0]?.CREATEDATE;
        }

        const columnMap: Record<string, string> = {
            po_number: 'ponumber',
            po_date: 'podate',
            dlv_date: 'dlvdate',
            principle: 'principal',
            sku: 'sku',
            order_qty: 'orderqty',
            uom: 'uom',
            stock_on_hand: 'stockonhand',
            filename: 'filename',
            order_type: 'order_type',
            periode: 'periode',
            modified_by: 'MODIFIEDBY',
        };

        const fields: string[] = [];
        const params: unknown[] = [];

        for (const [key, value] of Object.entries(data)) {
            const columnName = columnMap[key];
            if (columnName && value !== undefined) {
                fields.push(`${columnName} = ?`);
                params.push(value);
            }
        }

        // Apply synced CREATEDATE if found
        if (syncedCreatedDate) {
            fields.push('CREATEDATE = ?');
            params.push(syncedCreatedDate);
        }

        if (fields.length === 0) {
            fields.push('MODIFIEDDATE = ?');
            params.push(now);
        } else {
            if (!fields.some(f => f.startsWith('MODIFIEDDATE'))) {
                fields.push('MODIFIEDDATE = ?');
                params.push(now);
            }
        }

        params.push(id);

        await pool.query<ResultSetHeader>(
            `UPDATE eorder_eorderdatadtl SET ${fields.join(', ')} WHERE id = ?`,
            params
        );

        return this.findById(id);
    },

    async submit(id: number, notes?: string, modifiedBy?: string): Promise<OrderDetail | null> {
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

        await pool.query<ResultSetHeader>(
            `UPDATE eorder_eorderdatadtl SET release_flag = 'Y', release_notes = ?, MODIFIEDBY = ?, MODIFIEDDATE = ? WHERE id = ?`,
            [notes ?? null, modifiedBy ?? null, now, id]
        );

        return this.findById(id);
    },

    async cancel(id: number, notes?: string, modifiedBy?: string): Promise<OrderDetail | null> {
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

        await pool.query<ResultSetHeader>(
            `UPDATE eorder_eorderdatadtl SET cancel_flag = 'Y', notes = ?, MODIFIEDBY = ?, MODIFIEDDATE = ? WHERE id = ?`,
            [notes ?? null, modifiedBy ?? null, now, id]
        );

        return this.findById(id);
    },
};
