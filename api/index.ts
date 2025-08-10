import express from 'express';
import cors from 'cors';
import knex from 'knex';
import knexConfig from './knexfile';

const db = knex(knexConfig.development);

const app = express();
// Cloud Run sets process.env.PORT; fall back to 8080 for local dev
const port = Number(process.env.PORT) || 8080;

const allowedOrigins = [
  'http://localhost:5173',
  'https://laundromatzat.com',
  'https://www.laundromatzat.com'
];

const options: cors.CorsOptions = {
  origin: allowedOrigins
};

app.use(cors(options));

app.get('/', (_req, res) => {
  res.send('Hello from the backend!');
});

app.get('/api/portfolio', async (_req, res) => {
  try {
    const portfolioItems = await db('portfolio').select();
    res.json(portfolioItems);
  } catch (err) {
    res.status(500).json({ message: "Error fetching portfolio items" });
  }
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
