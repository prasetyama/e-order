import pool from '../lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { CreateOrderDetailInput, InitializeOrderDetailInput, UpdateOrderDetailInput, OrderDetail } from '../schemas/orderDetail.schema';

interface OrderDetailRow extends RowDataPacket, OrderDetail { }

interface Filters {
    dist_id?: number;
    principle?: string;
    periode?: string;
    filename?: string;
    status?: 'DRAFT' | 'SUBMITTED' | 'CANCELLED';
    grouped?: boolean;
}

const DRAFT_TABLE = 'eorder.eorder_draforderdistributor';

const SELECT_QUERY = `
    SELECT 
        Id as id,
        CAST(DistId AS UNSIGNED) as dist_id,
        OrderDate as po_date,
        RddDate as dlv_date,
        Principal as principle,
        Sku as sku,
        OrderQty as order_qty,
        UOM as uom,
        StockOnHand as stock_on_hand,
        FileName as filename,
        ProductName as product_name,
        NULL as error_flag,
        NULL as error_notes,
        Flag as release_flag,
        NULL as release_notes,
        NULL as transfer_flag,
        OrderType as order_type,
        PeriodeOrder as periode,
        NULL as modified_by,
        NULL as modified_date,
        CreateBy as created_by,
        CreateDate as created_date,
        NULL as cancel_flag,
        NULL as cancel_notes,
        CASE WHEN flag = '1' THEN 'SUBMITTED' ELSE 'DRAFT' END as status
    FROM ${DRAFT_TABLE}
`;

/**
 * Generate FileName (used as po_number) with format: {{distid}}{{periode_order}}{{kodePrincipal}}
 * Example: 010520202503PIC
 */
function generateFileName(distId: number | string, periodeOrder: string | null | undefined, principal: string): string {
    const distIdStr = String(distId);
    // Format periode: remove dashes from YYYY-MM-DD -> YYYYMMDD or use YYYYMM
    const periodeStr = periodeOrder ? periodeOrder.replace(/-/g, '') : '';
    // Generate a short code from the principal name (first letters of each word)
    const kodePrincipal = principal
        .split(/[\s.]+/)
        .filter(w => w.length > 0)
        .map(w => w[0].toUpperCase())
        .join('');
    return `${distIdStr}${periodeStr}${kodePrincipal}`;
}

export const orderDetailRepository = {
    async findAll(filters: Filters = {}): Promise<OrderDetail[]> {
        const isGrouped = !!filters.grouped;
        const selectFields = isGrouped
            ? 'ANY_VALUE(id) as id, ANY_VALUE(dist_id) as dist_id, ANY_VALUE(po_date) as po_date, ANY_VALUE(dlv_date) as dlv_date, ANY_VALUE(principle) as principle, ANY_VALUE(status) as status, ANY_VALUE(order_type) as order_type, ANY_VALUE(periode) as periode, filename, ANY_VALUE(created_by) as created_by, ANY_VALUE(created_date) as created_date, ANY_VALUE(modified_by) as modified_by, ANY_VALUE(modified_date) as modified_date, COUNT(CASE WHEN order_qty > 0 THEN sku END) as total_sku, CAST(SUM(order_qty) AS UNSIGNED) as total_qty'
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
        if (filters.filename) {
            sql += ' AND filename = ?';
            params.push(filters.filename);
        }
        if (filters.status) {
            sql += ' AND status = ?';
            params.push(filters.status);
        }

        if (filters.grouped) {
            sql += ' GROUP BY filename';
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

        // Generate the next Id (table has no auto_increment)
        const [maxIdResult] = await pool.query<RowDataPacket[]>(
            `SELECT COALESCE(MAX(Id), 0) + 1 as nextId FROM ${DRAFT_TABLE}`
        );
        const nextId = maxIdResult[0].nextId;

        // Generate or use provided FileName (filename)
        const fileName = data.filename || generateFileName(data.dist_id, data.periode, data.principle);

        // Sync CreateDate with other items that have the same FileName (po_number)
        const [existing] = await pool.query<RowDataPacket[]>(
            `SELECT CreateDate FROM ${DRAFT_TABLE} WHERE FileName = ? LIMIT 1`,
            [fileName]
        );
        const syncedCreatedDate = existing[0]?.CreateDate || now;

        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO ${DRAFT_TABLE} 
            (Id, DistId, OrderDate, Principal, PeriodeOrder, OrderType, Sku, ProductName, Crt2Plt, OrderQty, UOM, StockOnHand, FileName, RddDate, CreateBy, CreateDate) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nextId,
                data.dist_id,
                data.po_date,
                data.principle,
                data.periode ?? null,
                data.order_type ?? null,
                data.sku ?? null,
                data.product_name ?? null,
                data.crt2plt ?? null,
                data.order_qty ?? null,
                data.uom ?? null,
                data.stock_on_hand ?? 0,
                fileName,
                (data as any).dlv_date ?? null,
                data.created_by ?? null,
                syncedCreatedDate,
            ]
        );

        const created = await this.findById(nextId);
        return created!;
    },

    async initialize(data: InitializeOrderDetailInput): Promise<{ first_id: number; filename: string }> {
        // Call the stored procedure - it returns a result set with first_id and filename
        const [resultSets] = await pool.query<RowDataPacket[][]>(
            `CALL eorder.sp_InitializeOrderDraft(?, ?, ?, ?, ?, ?, ?)`,
            [
                String(data.dist_id),
                data.principle,
                data.order_type ?? '3',
                data.periode ?? null,
                data.po_date,
                data.dlv_date ?? null,
                data.created_by ?? 'admin',
            ]
        ) as any;
        // The SP SELECT returns the first result set
        const spResult = (resultSets as any)[0][0];
        return { first_id: spResult.first_id, filename: spResult.filename };
    },

    async update(id: number, data: UpdateOrderDetailInput): Promise<OrderDetail | null> {
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

        // Fetch existing FileName for the record being updated
        const [currentRow] = await pool.query<RowDataPacket[]>(
            `SELECT FileName FROM ${DRAFT_TABLE} WHERE Id = ?`,
            [id]
        );
        const currentFileName = currentRow[0]?.FileName;

        // Fetch the standardized CreateDate for this FileName group
        let syncedCreatedDate = null;
        if (currentFileName) {
            const [existing] = await pool.query<RowDataPacket[]>(
                `SELECT CreateDate FROM ${DRAFT_TABLE} WHERE FileName = ? AND Id != ? LIMIT 1`,
                [currentFileName, id]
            );
            syncedCreatedDate = existing[0]?.CreateDate;
        }

        const columnMap: Record<string, string> = {
            po_date: 'OrderDate',
            dlv_date: 'RddDate',
            principle: 'Principal',
            sku: 'Sku',
            order_qty: 'OrderQty',
            uom: 'UOM',
            stock_on_hand: 'StockOnHand',
            filename: 'FileName',
            order_type: 'OrderType',
            periode: 'PeriodeOrder',
            product_name: 'ProductName',
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

        // Apply synced CreateDate if found
        if (syncedCreatedDate) {
            fields.push('CreateDate = ?');
            params.push(syncedCreatedDate);
        }

        if (fields.length === 0) {
            // Nothing to update
            return this.findById(id);
        }

        params.push(id);

        await pool.query<ResultSetHeader>(
            `UPDATE ${DRAFT_TABLE} SET ${fields.join(', ')} WHERE Id = ?`,
            params
        );

        return this.findById(id);
    },

    async submit(id: number, notes?: string, modifiedBy?: string): Promise<OrderDetail | null> {
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

        await pool.query<ResultSetHeader>(
            `UPDATE ${DRAFT_TABLE} SET Flag = 1 WHERE Id = ?`,
            [id]
        );

        return this.findById(id);
    },

    async submitBulk(filename: string): Promise<void> {
        await pool.query(
            `CALL eorder.sp_SubmitOrderDraft(?)`,
            [filename]
        );
    },

    async cancel(id: number, notes?: string, modifiedBy?: string): Promise<OrderDetail | null> {
        await pool.query<ResultSetHeader>(
            `DELETE FROM ${DRAFT_TABLE} WHERE Id = ?`,
            [id]
        );

        return null;
    },
};
