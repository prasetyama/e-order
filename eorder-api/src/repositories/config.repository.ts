import pool from '../lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { Config, UpdateConfigInput } from '../schemas/config.schema';

interface ConfigRow extends RowDataPacket, Config { }

export const configRepository = {
    async findAll(): Promise<Config[]> {
        const [rows] = await pool.query<ConfigRow[]>(
            'SELECT config_key, config_value, description, updated_at FROM eorder_config'
        );
        return rows;
    },

    async findByKey(config_key: string): Promise<Config | null> {
        const [rows] = await pool.query<ConfigRow[]>(
            'SELECT config_key, config_value, description, updated_at FROM eorder_config WHERE config_key = ?',
            [config_key]
        );
        return rows[0] || null;
    },

    async update(config_key: string, data: UpdateConfigInput): Promise<boolean> {
        const [result] = await pool.query<ResultSetHeader>(
            'UPDATE eorder_config SET config_value = ? WHERE config_key = ?',
            [data.config_value, config_key]
        );
        return result.affectedRows > 0;
    }
};
