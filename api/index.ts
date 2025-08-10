import express from 'express';
import cors from 'cors';
import knex from 'knex';
import knexConfig from './knexfile';

const app = express();
// Cloud Run sets process.env.PORT; fall back to 8080 for local dev
const port = Number(process.env.PORT) || 8080;

// CORS: allow your site + localhost dev
const allowedOrigins = [
  'http://localhost:5173',
  'https://laundromatzat.com',
  'https://www.laundromatzat.com',
];

app.use(
  cors({
    origin: allowedOrigins,
  })
);

// --- DB init: run migrations/seeds on boot (works with SQLite in /tmp on Cloud Run) ---
const db = knex(knexConfig);

(async () => {
  try {
    await db.migrate.latest();
    // Optional: keep if seeds are idempotent; otherwise remove after first run
    await db.seed.run();
    console.log('DB ready');
  } catch (e) {
    console.error('DB init failed', e);
  }
})();

app.locals.db = db;

// --- Routes ---
app.get('/', (_req, res) => {
  res.send('Hello from the backend!');
});

app.get('/api/portfolio', async (_req, res) => {
  try {
    const portfolioItems = await db('portfolio').select();
    res.json(portfolioItems);
  } catch (err) {
    console.error('Error fetching portfolio items', err);
    res.status(500).json({ message: 'Error fetching portfolio items' });
  }
});

// Health/version probes (handy for CI and debugging)
app.get('/healthz', (_req, res) => res.status(200).send('ok'));
app.get('/healthz/db', async (_req, res) => {
  try {
    await db.raw('select 1');
    res.send('ok');
  } catch (e) {
    console.error('DB health check failed', e);
    res.status(500).send('db error');
  }
});
app.get('/version', (_req, res) => res.json({ sha: process.env.GITHUB_SHA || 'local' }));

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
