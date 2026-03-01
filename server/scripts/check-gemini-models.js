#!/usr/bin/env node
/**
 * Gemini Model Health Check
 * ─────────────────────────────────────────────────────────────────────────────
 * Verifies that every Gemini model the app depends on is still available and
 * has not been deprecated or retired.
 *
 * Run manually:
 *   node server/scripts/check-gemini-models.js
 *
 * Add to CI/CD (optional):
 *   - Run weekly to catch upcoming deprecations early.
 *   - The script exits with code 1 if any required model is missing.
 *
 * When a model is reported as missing, update:
 *   src/services/geminiModelConfig.ts   ← frontend model constants
 *   server/services/aiAgentService.js  ← server AGENT_MODEL constant
 *   (then re-run this script to confirm)
 *
 * Reference: https://ai.google.dev/gemini-api/docs/models
 * ─────────────────────────────────────────────────────────────────────────────
 */

const fetch = require("node-fetch");

// Try both .env locations so the script works from the project root or server/
try {
  require("dotenv").config({ path: ".env" });
} catch {
  // ignore
}
try {
  require("dotenv").config({ path: "../../.env" });
} catch {
  // ignore
}

// ── Models the app currently depends on ─────────────────────────────────────
// Keep this list in sync with src/services/geminiModelConfig.ts
const REQUIRED_MODELS = [
  { id: "gemini-2.5-flash",       role: "Primary text generation (TEXT_FAST)"    },
  { id: "gemini-2.5-pro",         role: "High-capability reasoning (TEXT_PRO)"   },
  { id: "gemini-2.5-flash-lite",  role: "Lightweight/high-volume (TEXT_LITE)"    },
  { id: "gemini-2.5-flash-image", role: "Native image generation (IMAGE_GEN)"    },
];

// ── Models the app has historically used – warn if they're still alive
// (means we haven't cleaned up a reference somewhere)
const RETIRED_MODELS = [
  "gemini-3-pro-preview",
  "gemini-2.0-pro",
  "gemini-2.0-flash-exp",
  "gemini-2.5-flash-image-preview",
  "gemini-2.5-flash-lite-latest",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-1.0-pro",
];

async function run() {
  const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!key) {
    console.error(
      "\n❌  No API key found.\n" +
        "    Set GEMINI_API_KEY in your .env file and re-run.\n",
    );
    process.exit(1);
  }

  console.log("\n🔍  Fetching available Gemini models from the API…\n");

  let data;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}&pageSize=200`,
    );
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`HTTP ${res.status}: ${body}`);
    }
    data = await res.json();
  } catch (err) {
    console.error("❌  Failed to fetch model list:", err.message);
    process.exit(1);
  }

  // Build a Set of available model IDs (strip "models/" prefix)
  const available = new Set(
    (data.models || []).map((m) => m.name.replace(/^models\//, "")),
  );

  // ── Check required models ─────────────────────────────────────────────────
  let allGood = true;
  console.log("── Required models ─────────────────────────────────────────────");
  for (const { id, role } of REQUIRED_MODELS) {
    if (available.has(id)) {
      console.log(`  ✅  ${id.padEnd(32)} ${role}`);
    } else {
      console.log(`  ❌  ${id.padEnd(32)} ${role}  ← NOT FOUND / DEPRECATED`);
      allGood = false;
    }
  }

  // ── Warn about retired models that are somehow still alive ─────────────────
  const stillAlive = RETIRED_MODELS.filter((id) => available.has(id));
  if (stillAlive.length > 0) {
    console.log(
      "\n── Retired models still active (no action needed yet) ──────────────────",
    );
    for (const id of stillAlive) {
      console.log(`  ⚠️   ${id}  — still available but scheduled for removal`);
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n────────────────────────────────────────────────────────────────");
  if (allGood) {
    console.log("✅  All required models are available. No action needed.\n");
    process.exit(0);
  } else {
    console.log(
      "❌  One or more required models are unavailable.\n" +
        "    Update the model IDs in:\n" +
        "      • src/services/geminiModelConfig.ts\n" +
        "      • server/services/aiAgentService.js  (AGENT_MODEL constant)\n" +
        "    Then re-run this script to confirm.\n" +
        "    Current models: https://ai.google.dev/gemini-api/docs/models\n",
    );
    process.exit(1);
  }
}

run();
