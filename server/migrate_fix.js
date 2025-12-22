const Database = require("better-sqlite3");
const db = new Database("paystubs.db");

console.log("Starting manual migration for public_health_docs...");

try {
  const tableInfo = db.prepare("PRAGMA table_info(public_health_docs)").all();
  if (tableInfo.length > 0) {
    const hasUserId = tableInfo.some((col) => col.name === "user_id");
    if (!hasUserId) {
      db.prepare(
        "ALTER TABLE public_health_docs ADD COLUMN user_id INTEGER"
      ).run();
      console.log("SUCCESS: Added user_id column to public_health_docs table");
    } else {
      console.log("INFO: user_id column already exists.");
    }
  } else {
    console.log("ERROR: Table public_health_docs does not exist!");
  }
} catch (err) {
  console.error("Migration failed:", err.message);
}

console.log("Migration attempt finished.");
