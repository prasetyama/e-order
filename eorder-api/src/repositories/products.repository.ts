import pool from '../lib/db';
import { RowDataPacket } from 'mysql2';

export const productsRepository = {
    async findAll(principal?: string): Promise<any[]> {
        if (principal) {
            const [rows] = await pool.query<RowDataPacket[]>(
                'SELECT * FROM Eorder_ProdMaster WHERE Principal = ?',
                [principal]
            );
            return rows;
        }
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM Eorder_ProdMaster'
        );
        return rows;
    },
};

