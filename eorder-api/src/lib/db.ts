import mysql from 'mysql2/promise';

let pool: mysql.Pool;

function getPool(): mysql.Pool {
    if (!pool) {
        pool = mysql.createPool({
            host: process.env.DATABASE_HOST || 'localhost',
            port: parseInt(process.env.DATABASE_PORT || '3306'),
            user: process.env.DATABASE_USER || 'root',
            password: process.env.DATABASE_PASSWORD || '',
            database: process.env.DATABASE_NAME || 'eorder',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            dateStrings: true,
        });
    }
    return pool;
}

export default {
    query: <T extends mysql.QueryResult>(sql: string, params?: unknown[]) =>
        getPool().query<T>(sql, params),
};
