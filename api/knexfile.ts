// api/knexfile.ts
import path from 'node:path';
import type { Knex } from 'knex';

const isCloudRun = !!process.env.K_SERVICE; // set by Cloud Run
const isProd = isCloudRun || process.env.NODE_ENV === 'production';

// On Cloud Run, only /tmp is writable. Use SQLite there if DATABASE_URL not set.
const sqlitePath = process.env.SQLITE_PATH || (isProd ? '/tmp/dev.sqlite3' : 'api/data/dev.sqlite3');

// After tsc, this file lives in dist-api/knexfile.js.
// So __dirname === "<repo>/dist-api". Build migration/seed paths from there.
const migrationsDir = path.join(__dirname, 'data', 'migrations');
const seedsDir = path.join(__dirname, 'seeds');

// Knex will only load files with these extensions.
const loadExtensions = isProd ? ['.js'] : ['.ts', '.js'];

const config: Knex.Config = process.env.DATABASE_URL
  ? {
      client: 'pg',
      connection: process.env.DATABASE_URL,
      migrations: { directory: migrationsDir, loadExtensions },
      seeds: { directory: seedsDir, loadExtensions },
    }
  : {
      client: 'sqlite3',
      connection: { filename: sqlitePath },
      useNullAsDefault: true,
      migrations: { directory: migrationsDir, loadExtensions },
      seeds: { directory: seedsDir, loadExtensions },
    };

export default config;
