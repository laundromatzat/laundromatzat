#!/usr/bin/env node
/**
 * Check Local SQLite Database for Medical Data
 *
 * This checks if paystubs.db exists and searches for medical terms
 */

const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const dbPath = path.join(__dirname, "paystubs.db");

if (!fs.existsSync(dbPath)) {
  console.log("❌ paystubs.db not found");
  console.log("   This is expected if you're only using Render PostgreSQL");
  process.exit(0);
}

console.log("🔍 Checking local SQLite database...\n");

try {
  const db = new Database(dbPath, { readonly: true });

  // Get all tables
  const tables = db
    .prepare(
      `
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
  `
    )
    .all();

  console.log("📊 Tables found:", tables.map((t) => t.name).join(", "));

  const SEARCH_TERMS = ["GenoSure", "NRTI", "NNRTI", "INSTI", "Labcorp"];

  // Search each table
  for (const table of tables) {
    const tableName = table.name;
    console.log(`\n📋 Checking table: ${tableName}`);

    // Get column names
    const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
    const textColumns = columns
      .filter((c) => c.type.includes("TEXT") || c.type.includes("VARCHAR"))
      .map((c) => c.name);

    if (textColumns.length === 0) {
      console.log("   No text columns to search");
      continue;
    }

    // Search each text column for each term
    for (const term of SEARCH_TERMS) {
      const conditions = textColumns.map((col) => `${col} LIKE ?`).join(" OR ");
      const params = textColumns.map(() => `%${term}%`);

      const query = `SELECT * FROM ${tableName} WHERE ${conditions} LIMIT 5`;
      const results = db.prepare(query).all(...params);

      if (results.length > 0) {
        console.log(`\n⚠️  FOUND "${term}" in ${tableName}:`);
        results.forEach((row, i) => {
          console.log(`   Record ${i + 1}:`, JSON.stringify(row, null, 2));
        });
      }
    }
  }

  console.log("\n✅ Local database check complete!");
  db.close();
} catch (error) {
  console.error("❌ Error:", error.message);
}
