#!/usr/bin/env node
/**
 * Auto-Fix CI Script
 *
 * Orchestrates the complete auto-fix workflow:
 * 1. Monitor CI status
 * 2. Fetch errors if failed
 * 3. Return error details for AI agent to fix
 *
 * This script is called by AI agents after pushing code.
 * It handles the monitoring and error fetching, while the AI agent
 * handles the actual fixing logic.
 *
 * Usage:
 *   node .github/scripts/auto-fix-ci.js [commit-sha]
 *
 * Exit codes:
 *   0 - CI passed, no action needed
 *   1 - CI failed, errors outputted to stdout
 *   2 - Timeout waiting for CI
 *   3 - Error occurred
 */

const { execSync, spawn } = require("child_process");
const path = require("path");

const commitSha = process.argv[2] || getLatestCommitSha();

function getLatestCommitSha() {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch (error) {
    console.error("❌ Error getting latest commit SHA:", error.message);
    process.exit(3);
  }
}

function runScript(scriptName, args = []) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, scriptName);
    const child = spawn("node", [scriptPath, ...args], {
      stdio: "inherit",
    });

    child.on("close", (code) => {
      resolve(code);
    });

    child.on("error", (error) => {
      reject(error);
    });
  });
}

async function main() {
  console.log("🤖 Auto-Fix CI - Starting...\n");

  // Step 1: Monitor CI status
  console.log("📊 Step 1: Monitoring CI status...");
  const monitorExitCode = await runScript("monitor-ci-status.js", [commitSha]);

  if (monitorExitCode === 0) {
    // CI passed!
    console.log("\n✨ CI passed! No fixes needed.");
    process.exit(0);
  }

  if (monitorExitCode === 2) {
    // Timeout
    console.log("\n⏱️  CI monitoring timed out.");
    console.log(
      "The workflow may still be running. Check GitHub Actions manually."
    );
    process.exit(2);
  }

  if (monitorExitCode === 3) {
    // Error
    console.log("\n⚠️  Error occurred while monitoring CI.");
    process.exit(3);
  }

  // CI failed (exit code 1)
  console.log("\n📋 Step 2: Fetching error details...");

  try {
    // Validate commitSha to prevent command injection
    if (!/^[a-f0-9]{40}$/.test(commitSha)) {
      console.error("❌ Invalid commit SHA format");
      process.exit(3);
    }

    const errors = execSync(
      `node ${path.join(__dirname, "fetch-ci-errors.js")} ${commitSha}`,
      { encoding: "utf8" }
    );

    console.log("\n" + "=".repeat(80));
    console.log("CI ERRORS DETECTED");
    console.log("=".repeat(80));
    console.log(errors);
    console.log("=".repeat(80));
    console.log("\n🔧 AI Agent: Please parse these errors and apply fixes.");

    process.exit(1);
  } catch (error) {
    console.error("\n❌ Error fetching CI errors:", error.message);
    process.exit(3);
  }
}

main().catch((error) => {
  console.error("❌ Fatal error:", error.message);
  process.exit(3);
});
