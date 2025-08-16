import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Env flags & paths per project conventions
const isProd = !!process.env.K_SERVICE || process.env.NODE_ENV === 'production';
const migrationsDir = path.join(__dirname, 'data', 'migrations');
const seedsDir = path.join(__dirname, 'seeds');
const loadExtensions = isProd ? ['.js'] : ['.ts', '.js'];

// Resolve SQLite filename (prefer SQLITE_PATH; else /tmp in prod, ./data/dev.sqlite3 in dev)
const sqliteFilename = process.env.SQLITE_PATH
  ? (path.isAbsolute(process.env.SQLITE_PATH)
      ? process.env.SQLITE_PATH
      : path.join(__dirname, process.env.SQLITE_PATH))
  : (isProd ? '/tmp/dev.sqlite3' : path.join(__dirname, 'data', 'dev.sqlite3'));

// Ensure parent dir exists for SQLite file
try {
  fs.mkdirSync(path.dirname(sqliteFilename), { recursive: true });
} catch { /* ignore */ }

// Build config objects (no Knex types to avoid TS2503)
const sqliteConfig = {
  client: 'sqlite3',
  useNullAsDefault: true,
  connection: { filename: sqliteFilename },
  pool: {
    afterCreate: (conn: any, cb: any) => {
      // Enforce foreign keys
      conn.run('PRAGMA foreign_keys = ON', cb);
    },
  },
  migrations: { directory: migrationsDir, loadExtensions },
  seeds: { directory: seedsDir, loadExtensions },
} as const;

const pgConfig = {
  client: 'pg',
  connection: process.env.DATABASE_URL!,
  migrations: { directory: migrationsDir, loadExtensions: ['.js'] },
  seeds: { directory: seedsDir, loadExtensions: ['.js'] },
} as const;

// Export the chosen config (PG if DATABASE_URL present; otherwise SQLite)
export default process.env.DATABASE_URL ? pgConfig : sqliteConfig;