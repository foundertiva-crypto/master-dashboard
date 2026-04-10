/**
 * PostgreSQL Database Connection Pool
 */

import { Pool, QueryResult } from "pg";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString:
        process.env.DATABASE_URL ||
        `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
      max: 20,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });

    pool.on("error", (err) => {
      console.error("Unexpected PostgreSQL pool error:", err);
    });
  }
  return pool;
}

export async function query(
  text: string,
  params?: any[]
): Promise<QueryResult> {
  const start = Date.now();
  const res = await getPool().query(text, params);
  const duration = Date.now() - start;

  if (duration > 2000) {
    console.warn(`Slow query (${duration}ms): ${text.slice(0, 120)}`);
  }

  return res;
}

export async function getOne(text: string, params?: any[]): Promise<any> {
  const res = await query(text, params);
  return res.rows[0] ?? null;
}

export async function getMany(text: string, params?: any[]): Promise<any[]> {
  const res = await query(text, params);
  return res.rows;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export default { getPool, query, getOne, getMany, closePool };
