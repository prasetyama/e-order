import pool from '../lib/db';
import { RowDataPacket } from 'mysql2';

interface DistributorRow extends RowDataPacket {
    dist_id: number;
    dist_name: string;
    dist_code: string;
    dist_address: string;
    dist_phone: string;
    dist_email: string;
    dist_status: string;
    dist_created_at: Date;
    dist_updated_at: Date;
}

export const distributorRepository = {
    async findAll(): Promise<DistributorRow[]> {
        const [rows] = await pool.query<DistributorRow[]>(
            'SELECT * FROM eorder_eorder_distributor'
        );
        return rows;
    },
};
