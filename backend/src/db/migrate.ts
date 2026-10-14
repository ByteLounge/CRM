import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { env } from '../config/env';
import { logger } from '../utils/logger';

async function runMigration() {
  if (!env.DATABASE_URL || !env.DATABASE_URL.startsWith('postgresql://')) {
    logger.warn('DATABASE_URL is not set to a PostgreSQL connection string. Skipping migration.');
    return;
  }

  logger.info('Connecting to Supabase PostgreSQL...');
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  let client;
  try {
    client = await pool.connect();
  } catch (connErr: any) {
    logger.error(`Connection failed: ${connErr.message} (code: ${connErr.code})`);
    await pool.end();
    throw connErr;
  }
  try {
    const sqlPath = path.resolve(__dirname, 'migrations/001_initial_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    logger.info('Executing 001_initial_schema.sql on Supabase PostgreSQL...');
    await client.query(sql);
    logger.info('✅ Successfully executed schema migration on Supabase PostgreSQL!');
  } catch (err: any) {
    logger.error('Failed to run migration on Supabase:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(() => process.exit(1));
