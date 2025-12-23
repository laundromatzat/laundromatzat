const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for many hosted Postgres services like Render/Heroku
  },
});

const initializeDatabase = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          profile_picture TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS public_health_docs (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          filename TEXT NOT NULL,
          rag_store_name TEXT NOT NULL,
          analysis_result_json TEXT,
          tags TEXT,
          category TEXT,
          version TEXT,
          uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS paychecks (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          payPeriodStart TEXT,
          payPeriodEnd TEXT,
          paidHours TEXT,
          bankedHours TEXT,
          userReportedHours TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS mediscribe_examples (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          original_text TEXT NOT NULL,
          rewritten_text TEXT NOT NULL,
          style_tags TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS neuroaesthetic_preferences (
          user_id INTEGER PRIMARY KEY REFERENCES users(id),
          sensitivities TEXT,
          colorPreferences TEXT,
          designGoals TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS neuroaesthetic_history (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          original_image_url TEXT,
          generated_image_url TEXT,
          analysis_json TEXT,
          preferences_snapshot_json TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS pin_pals_gallery (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          image_url TEXT NOT NULL,
          pet_type TEXT,
          pet_count INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS links (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          title TEXT NOT NULL,
          url TEXT NOT NULL,
          description TEXT,
          tags TEXT,
          image_url TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Database initialized successfully.");
  } catch (err) {
    console.error("Error initializing database:", err);
  }
};

// Auto-initialize on import/startup
initializeDatabase();

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
