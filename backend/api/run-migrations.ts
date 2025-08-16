// api/run-migrations.ts
// Minimal, ESM-safe migration runner (Node 20 + ts-node)
import knex from 'knex';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

async function loadKnexConfig() {
  const tsPath = path.join(__dirname, 'knexfile.ts');
  const jsPath = path.join(__dirname, 'knexfile.js');
  const chosen = existsSync(tsPath) ? tsPath : jsPath;
  if (!existsSync(chosen)) {
    throw new Error(`knexfile not found at ${tsPath} or ${jsPath}`);
  }
  const mod = await import(pathToFileURL(chosen).href);
  return (mod.default ?? mod) as any; // handles ESM default or CJS export
}

(async () => {
  try {
    const config = await loadKnexConfig();
    const db = knex(config);
    await db.migrate.latest();
    console.log('Migrations are all up to date');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();