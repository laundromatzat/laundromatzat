"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const knex_1 = __importDefault(require("knex"));
const knexfile_1 = __importDefault(require("./knexfile"));
const db = (0, knex_1.default)(knexfile_1.default.development);
const app = (0, express_1.default)();
// Cloud Run sets process.env.PORT; fall back to 8080 for local dev
const port = Number(process.env.PORT) || 8080;
const allowedOrigins = [
    'http://localhost:5173',
    'https://laundromatzat.com',
    'https://www.laundromatzat.com'
];
const options = {
    origin: allowedOrigins
};
app.use((0, cors_1.default)(options));
app.get('/', (_req, res) => {
    res.send('Hello from the backend!');
});
app.get('/api/portfolio', async (_req, res) => {
    try {
        const portfolioItems = await db('portfolio').select();
        res.json(portfolioItems);
    }
    catch (err) {
        res.status(500).json({ message: "Error fetching portfolio items" });
    }
});
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
