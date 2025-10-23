import { Pool } from 'pg';
import { getConfig } from '../config/index.js';

const config = getConfig();

let pool;

function createPool() {
  return new Pool({
    host: config.pg.host,
    port: config.pg.port,
    database: config.pg.database,
    user: config.pg.user,
    password: config.pg.password,
    ssl: config.pg.ssl ? { rejectUnauthorized: false } : undefined,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  });
}

export function getPool() {
  if (!pool) {
    pool = createPool();
  }
  return pool;
}

export async function migrate() {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE EXTENSION IF NOT EXISTS citext;
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        email CITEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
      `);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}



