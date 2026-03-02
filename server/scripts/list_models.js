/**
 * List available Gemini models via the REST API.
 * Uses the same API key as the AI Agent service.
 *
 * Usage:  node server/scripts/list_models.js
 */

const fetch = require("node-fetch");
require("dotenv").config({ path: "../../.env" });

async function listModels() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error("GEMINI_API_KEY is not set. Check your .env file.");
    process.exit(1);
  }

  console.log("Fetching available Gemini models...\n");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
  );

  if (!response.ok) {
    console.error("Failed to list models:", response.status, response.statusText);
    const text = await response.text();
    console.error(text);
    process.exit(1);
  }

  const data = await response.json();
  const geminiModels = data.models.filter((m) => m.name.includes("gemini"));

  console.log(`Found ${geminiModels.length} Gemini models:\n`);
  geminiModels.forEach((m) => {
    const id = m.name.replace("models/", "");
    console.log(`  ${id}`);
    console.log(`    Methods: ${m.supportedGenerationMethods.join(", ")}`);
    if (m.description) {
      console.log(`    Desc:    ${m.description.slice(0, 120)}`);
    }
    console.log();
  });
}

listModels().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
