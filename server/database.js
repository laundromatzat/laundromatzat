const Database = require("better-sqlite3");
const db = new Database("paystubs.db");

// Create tables if they don't exist
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        profile_picture TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS public_health_docs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        filename TEXT NOT NULL,
        rag_store_name TEXT NOT NULL,
        analysis_result_json TEXT,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS paychecks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        payPeriodStart TEXT,
        payPeriodEnd TEXT,
        paidHours TEXT,
        bankedHours TEXT,
        userReportedHours TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS mediscribe_examples (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        original_text TEXT NOT NULL,
        rewritten_text TEXT NOT NULL,
        style_tags TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS neuroaesthetic_preferences (
        user_id INTEGER PRIMARY KEY,
        sensitivities TEXT,
        colorPreferences TEXT,
        designGoals TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS neuroaesthetic_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        original_image_url TEXT,
        generated_image_url TEXT,
        analysis_json TEXT,
        preferences_snapshot_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS pin_pals_gallery (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        image_url TEXT NOT NULL,
        pet_type TEXT,
        pet_count INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        description TEXT,
        tags TEXT,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
`);

// Migration for existing tables
try {
  const tableInfo = db.prepare("PRAGMA table_info(users)").all();
  const hasProfilePicture = tableInfo.some(
    (col) => col.name === "profile_picture"
  );
  if (!hasProfilePicture) {
    db.prepare("ALTER TABLE users ADD COLUMN profile_picture TEXT").run();
    console.log("Added profile_picture column to users table");
  }
} catch (err) {
  console.log(
    "Migration check failed (safe to ignore if column exists):",
    err.message
  );
}

// Migration for pin_pals_gallery
try {
  db.prepare(
    "CREATE TABLE IF NOT EXISTS pin_pals_gallery (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, image_url TEXT NOT NULL, pet_type TEXT, pet_count INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id))"
  ).run();
} catch (err) {
  console.log("Migration for pin_pals_gallery failed:", err.message);
}

// Migration for links
try {
  db.prepare(
    "CREATE TABLE IF NOT EXISTS links (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, title TEXT NOT NULL, url TEXT NOT NULL, description TEXT, tags TEXT, image_url TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id))"
  ).run();
} catch (err) {
  console.log("Migration for links failed:", err.message);
}

// Migration for paychecks table (user_id)
try {
  const tableInfo = db.prepare("PRAGMA table_info(paychecks)").all();
  if (tableInfo.length > 0) {
    const hasUserId = tableInfo.some((col) => col.name === "user_id");
    if (!hasUserId) {
      db.prepare("ALTER TABLE paychecks ADD COLUMN user_id INTEGER").run();
      console.log("Added user_id column to paychecks table");
    }
  }
} catch (err) {
  console.log("Migration for paychecks failed:", err.message);
}

// Migration for mediscribe_examples table (user_id)
try {
  const tableInfo = db.prepare("PRAGMA table_info(mediscribe_examples)").all();
  if (tableInfo.length > 0) {
    const hasUserId = tableInfo.some((col) => col.name === "user_id");
    if (!hasUserId) {
      db.prepare(
        "ALTER TABLE mediscribe_examples ADD COLUMN user_id INTEGER"
      ).run();
      console.log("Added user_id column to mediscribe_examples table");
    }
  }
} catch (err) {
  console.log("Migration for mediscribe_examples failed:", err.message);
}

// Migration for public_health_docs table (user_id and new metadata)
try {
  const tableInfo = db.prepare("PRAGMA table_info(public_health_docs)").all();
  if (tableInfo.length > 0) {
    const hasUserId = tableInfo.some((col) => col.name === "user_id");
    if (!hasUserId) {
      db.prepare(
        "ALTER TABLE public_health_docs ADD COLUMN user_id INTEGER"
      ).run();
      console.log("Added user_id column to public_health_docs table");
    }

    const hasTags = tableInfo.some((col) => col.name === "tags");
    if (!hasTags) {
      db.prepare("ALTER TABLE public_health_docs ADD COLUMN tags TEXT").run();
      console.log("Added tags column to public_health_docs table");
    }

    const hasCategory = tableInfo.some((col) => col.name === "category");
    if (!hasCategory) {
      db.prepare(
        "ALTER TABLE public_health_docs ADD COLUMN category TEXT"
      ).run();
      console.log("Added category column to public_health_docs table");
    }

    const hasVersion = tableInfo.some((col) => col.name === "version");
    if (!hasVersion) {
      db.prepare(
        "ALTER TABLE public_health_docs ADD COLUMN version TEXT"
      ).run();
      console.log("Added version column to public_health_docs table");
    }
  }
} catch (err) {
  console.log("Migration for public_health_docs failed:", err.message);
}

// Migration for neuroaesthetic_preferences
try {
  db.prepare(
    "CREATE TABLE IF NOT EXISTS neuroaesthetic_preferences (user_id INTEGER PRIMARY KEY, sensitivities TEXT, colorPreferences TEXT, designGoals TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id))"
  ).run();
} catch (err) {
  console.log("Migration for neuroaesthetic_preferences failed:", err.message);
}

// Migration for neuroaesthetic_history
try {
  db.prepare(
    "CREATE TABLE IF NOT EXISTS neuroaesthetic_history (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, original_image_url TEXT, generated_image_url TEXT, analysis_json TEXT, preferences_snapshot_json TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id))"
  ).run();
} catch (err) {
  console.log("Migration for neuroaesthetic_history failed:", err.message);
}

// Migration for pin_pals_gallery
try {
  db.prepare(
    "CREATE TABLE IF NOT EXISTS pin_pals_gallery (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, image_url TEXT NOT NULL, pet_type TEXT, pet_count INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id))"
  ).run();
} catch (err) {
  console.log("Migration for pin_pals_gallery failed:", err.message);
}

console.log("Database initialized successfully.");

module.exports = db;
