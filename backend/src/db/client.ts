import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface IDatabaseClient {
  isPostgres: boolean;
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  execute(sql: string, params?: any[]): Promise<void>;
  transaction<T>(fn: () => Promise<T>): Promise<T>;
}

class SQLiteDatabaseClient implements IDatabaseClient {
  public isPostgres = false;
  private db: Database.Database;

  constructor() {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const dbPath = path.join(dataDir, 'flowcrm.sqlite');
    logger.info(`Initializing SQLite local database at ${dbPath}`);
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.initTables();
  }

  private initTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS organisations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS organisation_members (
        id TEXT PRIMARY KEY,
        organisation_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'member',
        created_at TEXT NOT NULL,
        UNIQUE(organisation_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS integrations (
        id TEXT PRIMARY KEY,
        organisation_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
        provider TEXT NOT NULL DEFAULT 'woocommerce',
        store_url TEXT NOT NULL,
        encrypted_credentials TEXT NOT NULL DEFAULT '{}',
        connection_status TEXT NOT NULL DEFAULT 'disconnected',
        last_sync_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(organisation_id, provider)
      );

      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        organisation_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
        external_customer_id INTEGER,
        first_name TEXT NOT NULL DEFAULT '',
        last_name TEXT NOT NULL DEFAULT '',
        email TEXT NOT NULL,
        phone TEXT,
        billing_address TEXT NOT NULL DEFAULT '{}',
        shipping_address TEXT NOT NULL DEFAULT '{}',
        total_orders INTEGER NOT NULL DEFAULT 0,
        total_spent REAL NOT NULL DEFAULT 0.0,
        currency TEXT NOT NULL DEFAULT 'USD',
        segment TEXT NOT NULL DEFAULT 'new',
        is_guest INTEGER NOT NULL DEFAULT 0,
        last_order_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_cust_org_ext 
        ON customers (organisation_id, external_customer_id) 
        WHERE external_customer_id IS NOT NULL;

      CREATE INDEX IF NOT EXISTS idx_cust_org_email 
        ON customers (organisation_id, email);

      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        organisation_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
        external_order_id INTEGER NOT NULL,
        customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
        order_number TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        currency TEXT NOT NULL DEFAULT 'USD',
        total_amount REAL NOT NULL DEFAULT 0.0,
        payment_method TEXT NOT NULL DEFAULT 'unknown',
        placed_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(organisation_id, external_order_id)
      );

      CREATE INDEX IF NOT EXISTS idx_orders_org_cust 
        ON orders (organisation_id, customer_id);

      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        external_product_id INTEGER,
        product_name TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price REAL NOT NULL DEFAULT 0.0,
        total_price REAL NOT NULL DEFAULT 0.0
      );

      CREATE INDEX IF NOT EXISTS idx_items_order_id 
        ON order_items (order_id);

      CREATE TABLE IF NOT EXISTS communications (
        id TEXT PRIMARY KEY,
        organisation_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
        customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
        channel TEXT NOT NULL DEFAULT 'email',
        purpose TEXT NOT NULL DEFAULT 'general',
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        generated_by_ai INTEGER NOT NULL DEFAULT 0,
        approved_by TEXT,
        approved_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS customer_notes (
        id TEXT PRIMARY KEY,
        organisation_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
        customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        author_id TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS activity_logs (
        id TEXT PRIMARY KEY,
        organisation_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
        actor_id TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        action TEXT NOT NULL,
        metadata TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sync_logs (
        id TEXT PRIMARY KEY,
        organisation_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
        integration_id TEXT REFERENCES integrations(id) ON DELETE SET NULL,
        sync_type TEXT NOT NULL DEFAULT 'full',
        status TEXT NOT NULL DEFAULT 'in_progress',
        records_processed INTEGER NOT NULL DEFAULT 0,
        error_message TEXT,
        started_at TEXT NOT NULL,
        completed_at TEXT
      );
    `);
  }

  public async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const sqliteSql = sql.replace(/\$(\d+)/g, '@p$1');
    const paramObj: Record<string, any> = {};
    params.forEach((val, idx) => {
      paramObj[`p${idx + 1}`] = val;
    });
    const stmt = this.db.prepare(sqliteSql);
    const rows = (Object.keys(paramObj).length > 0 ? stmt.all(paramObj) : stmt.all()) as T[];
    return rows;
  }

  public async execute(sql: string, params: any[] = []): Promise<void> {
    const sqliteSql = sql.replace(/\$(\d+)/g, '@p$1');
    const paramObj: Record<string, any> = {};
    params.forEach((val, idx) => {
      paramObj[`p${idx + 1}`] = val;
    });
    const stmt = this.db.prepare(sqliteSql);
    if (Object.keys(paramObj).length > 0) {
      stmt.run(paramObj);
    } else {
      stmt.run();
    }
  }

  public async transaction<T>(fn: () => Promise<T>): Promise<T> {
    return this.db.transaction(fn)();
  }
}

class PostgresDatabaseClient implements IDatabaseClient {
  public isPostgres = true;
  private pool: Pool;

  constructor(connectionString: string) {
    logger.info('Connecting to PostgreSQL database via connection string...');
    this.pool = new Pool({
      connectionString,
      ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
    });
  }

  public async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const client = await this.pool.connect();
    try {
      const res = await client.query(sql, params);
      return res.rows;
    } finally {
      client.release();
    }
  }

  public async execute(sql: string, params: any[] = []): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(sql, params);
    } finally {
      client.release();
    }
  }

  public async transaction<T>(fn: () => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn();
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}

export const db: IDatabaseClient =
  env.DATABASE_URL && env.DATABASE_URL.startsWith('postgresql://')
    ? new PostgresDatabaseClient(env.DATABASE_URL)
    : new SQLiteDatabaseClient();
