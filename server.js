const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); // If frontend and backend are on different origins
const ideasRouter = require('./src/routes/ideas');
const errorHandler = require('./src/middlewares/errorHandler'); // Your custom error handler
const ApiError = require('./src/utils/apiError'); // Assuming ApiError is also used for 404

dotenv.config(); // Load environment variables from .env file

const app = express();

// Middleware
app.use(cors()); // Configure CORS as needed
app.use(express.json()); // Parse JSON request bodies

// Routes
app.use('/api/ideas', ideasRouter);

// Basic health check (optional)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running' });
});

// Catch-all for undefined routes
app.use((req, res, next) => {
  next(new ApiError(404, 'Not Found'));
});

// Global error handler (MUST be last middleware)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Check critical environment variables on startup
  if (!process.env.OPENAI_API_KEY) {
    console.warn('WARNING: OPENAI_API_KEY is not configured for the backend.');
  }
});
