require("dotenv").config({ path: "../.env" }); // Try to load from parent dir if running from scripts/
const fs = require("fs");
const path = require("path");
const db = require("../database");

const BACKUP_DIR = path.join(__dirname, "../backups");

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

async function backupDatabase() {
  console.log("Starting database backup...");

  // Tables to backup
  const tables = [
    "users",
    "paychecks",
    "links",
    "public_health_docs",
    "mediscribe_examples",
    "neuroaesthetic_preferences",
    "neuroaesthetic_history",
    "pin_pals_gallery",
  ];

  const backupData = {
    timestamp: new Date().toISOString(),
    tables: {},
  };

  try {
    for (const table of tables) {
      try {
        const result = await db.query(`SELECT * FROM ${table}`);
        backupData.tables[table] = result.rows;
        console.log(`Backed up ${result.rowCount} rows from '${table}'.`);
      } catch (err) {
        console.warn(
          `Warning: Could not backup table '${table}': ${err.message}`
        );
        // Continue with other tables
      }
    }

    const filename = `backup-${new Date().toISOString().replace(/:/g, "-")}.json`;
    const filepath = path.join(BACKUP_DIR, filename);

    fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));
    console.log(`\nBackup successful! Saved to: ${filepath}`);

    // Explicitly exit because the DB pool might keep the process alive
    process.exit(0);
  } catch (err) {
    console.error("Backup failed:", err);
    process.exit(1);
  }
}

backupDatabase();
