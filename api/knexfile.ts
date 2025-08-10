import type { Knex } from 'knex';

const isCloudRun = !!process.env.K_SERVICE;  // set by Cloud Run
const sqlitePath =
  process.env.SQLITE_PATH || (isCloudRun ? '/tmp/dev.sqlite3' : 'api/data/dev.sqlite3');

const config: Knex.Config = process.env.DATABASE_URL
  ? {
      client: 'pg',
      connection: process.env.DATABASE_URL,
      migrations: { directory: './api/data/migrations' },
      seeds: { directory: './api/seeds' },
    }
  : {
      client: 'sqlite3',
      connection: { filename: sqlitePath },
      useNullAsDefault: true,
      migrations: { directory: './api/data/migrations' },
      seeds: { directory: './api/seeds' },
    };

export default config;
