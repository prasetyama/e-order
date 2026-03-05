import pool from '../lib/db';
import { RowDataPacket } from 'mysql2';

export const productsRepository = {
    async findAll(): Promise<[]> {
        const [rows] = await pool.query<[]>(
            'SELECT * FROM Eorder_ProdMaster'
        );
        return rows;
    },
};
