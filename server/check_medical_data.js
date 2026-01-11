#!/usr/bin/env node
/**
 * Database Medical Data Search Script
 *
 * This script connects to your Render PostgreSQL database and searches
 * for potentially sensitive medical data (GenoSure, NRTI, etc.)
 *
 * Usage:
 *   node server/check_medical_data.js
 *
 * Requires DATABASE_URL environment variable to be set
 */

// Load environment variables from .env file
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Render PostgreSQL
  },
});

const SEARCH_TERMS = [
  "GenoSure",
  "NRTI",
  "NNRTI",
  "INSTI",
  "Labcorp",
  "Q207E",
  "V245E",
];

async function searchDatabase() {
  console.log("🔍 Searching database for medical data...\n");

  try {
    // 1. Search public_health_docs
    console.log("📋 Checking public_health_docs table...");
    for (const term of SEARCH_TERMS) {
      const result = await pool.query(
        `SELECT id, filename, category, tags, 
                LEFT(analysis_result_json, 200) as preview
         FROM public_health_docs
         WHERE analysis_result_json ILIKE $1
         LIMIT 5`,
        [`%${term}%`]
      );

      if (result.rows.length > 0) {
        console.log(`\n⚠️  FOUND "${term}" in public_health_docs:`);
        result.rows.forEach((row) => {
          console.log(`  - ID: ${row.id}, File: ${row.filename}`);
          console.log(`    Preview: ${row.preview}...\n`);
        });
      }
    }

    // 2. Search mediscribe_examples
    console.log("\n📝 Checking mediscribe_examples table...");
    for (const term of SEARCH_TERMS) {
      const result = await pool.query(
        `SELECT id, 
                LEFT(original_text, 100) as original_preview,
                LEFT(rewritten_text, 100) as rewritten_preview
         FROM mediscribe_examples
         WHERE original_text ILIKE $1 OR rewritten_text ILIKE $1
         LIMIT 5`,
        [`%${term}%`]
      );

      if (result.rows.length > 0) {
        console.log(`\n⚠️  FOUND "${term}" in mediscribe_examples:`);
        result.rows.forEach((row) => {
          console.log(`  - ID: ${row.id}`);
          console.log(`    Original: ${row.original_preview}...`);
          console.log(`    Rewritten: ${row.rewritten_preview}...\n`);
        });
      }
    }

    // 3. Get table counts
    console.log("\n📊 Database Statistics:");
    const healthDocs = await pool.query(
      "SELECT COUNT(*) FROM public_health_docs"
    );
    const mediscribe = await pool.query(
      "SELECT COUNT(*) FROM mediscribe_examples"
    );
    console.log(`  - public_health_docs: ${healthDocs.rows[0].count} records`);
    console.log(`  - mediscribe_examples: ${mediscribe.rows[0].count} records`);

    console.log("\n✅ Search complete!");
  } catch (error) {
    console.error("❌ Error searching database:", error.message);
    console.error("\nTroubleshooting:");
    console.error("  1. Ensure DATABASE_URL is set in your .env file");
    console.error("  2. Check that you have network access to Render");
    console.error("  3. Verify SSL settings match your environment");
  } finally {
    await pool.end();
  }
}

// Run the search
searchDatabase();
