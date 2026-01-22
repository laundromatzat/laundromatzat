const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

const initializeDatabase = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          profile_picture TEXT,
          role VARCHAR(50) DEFAULT 'user',
          is_approved BOOLEAN DEFAULT FALSE,
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

      CREATE TABLE IF NOT EXISTS color_palettes (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          file_name TEXT NOT NULL,
          image_data_url TEXT NOT NULL,
          palette_json TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS background_removal_jobs (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          file_name TEXT NOT NULL,
          source_image_data_url TEXT NOT NULL,
          result_image_data_url TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS wood_carving_projects (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          description TEXT NOT NULL,
          variations_json TEXT,
          selected_variation_json TEXT,
          blueprint_json TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS nylon_fabric_designs (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          design_name TEXT NOT NULL,
          instruction_image_url TEXT,
          nylon_image_url TEXT,
          prompts JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_nylon_fabric_user_designs ON nylon_fabric_designs(user_id, created_at DESC);

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

      CREATE TABLE IF NOT EXISTS dev_tasks (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          title TEXT NOT NULL,
          description TEXT,
          category VARCHAR(50) DEFAULT 'feature',
          priority VARCHAR(20) DEFAULT 'medium',
          status VARCHAR(20) DEFAULT 'new',
          tags TEXT,
          ai_prompt TEXT,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS ai_usage_logs (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          tool_name TEXT NOT NULL,
          model_name TEXT NOT NULL,
          tokens_used INTEGER,
          cost_estimate DECIMAL(10, 6),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // --- Auto-Migration for existing tables ---
    // Add role column if strictly missing
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role') THEN
          ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user';
        END IF;
      END
      $$;
    `);

    // Add is_approved column if strictly missing
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_approved') THEN
          ALTER TABLE users ADD COLUMN is_approved BOOLEAN DEFAULT FALSE;
        END IF;
      END
      $$;
    `);

    // Ensure at least one admin exists if desired (e.g., id 1)
    // We can run this safely every time or just once.
    // Let's just update the first user to be admin/approved if they exist, to prevent lockout.
    await pool.query(`
        UPDATE users SET role = 'admin', is_approved = TRUE WHERE id = (SELECT min(id) FROM users) AND (role IS NULL OR role = 'user');
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
