#!/usr/bin/env node
/**
 * CI Status Monitor
 *
 * Monitors GitHub Actions CI status for a commit and reports when complete.
 * Used by AI agents to automatically detect CI failures and trigger fixes.
 *
 * Usage:
 *   node .github/scripts/monitor-ci-status.js [commit-sha] [options]
 *
 * Options:
 *   --timeout=300000      Max time to wait in ms (default: 5 minutes)
 *   --poll-interval=15000 Check interval in ms (default: 15 seconds)
 *   --silent              Suppress progress output
 *
 * Exit codes:
 *   0 - CI passed
 *   1 - CI failed
 *   2 - Timeout
 *   3 - Error
 */

const { execSync } = require("child_process");

// Parse command line arguments
const args = process.argv.slice(2);
const commitSha =
  args.find((arg) => !arg.startsWith("--")) || getLatestCommitSha();
const options = {
  timeout:
    parseInt(args.find((arg) => arg.startsWith("--timeout="))?.split("=")[1]) ||
    300000,
  pollInterval:
    parseInt(
      args.find((arg) => arg.startsWith("--poll-interval="))?.split("=")[1]
    ) || 15000,
  silent: args.includes("--silent"),
};

function log(message) {
  if (!options.silent) {
    console.log(message);
  }
}

function getLatestCommitSha() {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch (error) {
    console.error("❌ Error getting latest commit SHA:", error.message);
    process.exit(3);
  }
}

function getRepoInfo() {
  try {
    const remoteUrl = execSync("git config --get remote.origin.url", {
      encoding: "utf8",
    }).trim();
    const match = remoteUrl.match(/github\.com[:/](.+?)\/(.+?)(\.git)?$/);

    if (!match) {
      throw new Error("Could not parse GitHub repository from remote URL");
    }

    const [, owner, repo] = match;
    return { owner, repo: repo.replace(".git", "") };
  } catch (error) {
    console.error("❌ Error getting repository info:", error.message);
    process.exit(3);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkCIStatus(owner, repo, sha) {
  try {
    // Get combined status for the commit
    const statusJson = execSync(
      `gh api repos/${owner}/${repo}/commits/${sha}/status`,
      { encoding: "utf8" }
    );

    const status = JSON.parse(statusJson);

    // Also check for check runs (GitHub Actions)
    const checksJson = execSync(
      `gh api repos/${owner}/${repo}/commits/${sha}/check-runs`,
      { encoding: "utf8" }
    );

    const checks = JSON.parse(checksJson);

    // Determine overall status
    if (
      status.state === "success" &&
      checks.check_runs.every(
        (c) => c.conclusion === "success" || c.conclusion === null
      )
    ) {
      return { state: "success", checks: checks.check_runs };
    }

    if (
      status.state === "failure" ||
      checks.check_runs.some((c) => c.conclusion === "failure")
    ) {
      const failedChecks = checks.check_runs.filter(
        (c) => c.conclusion === "failure"
      );
      return { state: "failure", checks: failedChecks };
    }

    if (
      status.state === "pending" ||
      checks.check_runs.some(
        (c) => c.status === "in_progress" || c.status === "queued"
      )
    ) {
      return { state: "pending", checks: checks.check_runs };
    }

    // No checks yet - still pending
    return { state: "pending", checks: [] };
  } catch (error) {
    if (error.message.includes("gh: command not found")) {
      console.error("❌ GitHub CLI (gh) is not installed.");
      console.error("Install it from: https://cli.github.com/");
      process.exit(3);
    }
    throw error;
  }
}

async function monitorCI() {
  const { owner, repo } = getRepoInfo();
  const shortSha = commitSha.substring(0, 7);

  log(`🔍 Monitoring CI for commit ${shortSha}...`);
  log(`📊 Repository: ${owner}/${repo}`);
  log(
    `⏱️  Timeout: ${options.timeout / 1000}s | Poll interval: ${options.pollInterval / 1000}s\n`
  );

  const startTime = Date.now();
  let lastState = null;

  while (Date.now() - startTime < options.timeout) {
    try {
      const result = await checkCIStatus(owner, repo, commitSha);
      const elapsed = Math.round((Date.now() - startTime) / 1000);

      // Only log state changes to reduce noise
      if (result.state !== lastState) {
        if (result.state === "pending") {
          log(`⏳ CI is running... (${elapsed}s elapsed)`);
        }
        lastState = result.state;
      }

      if (result.state === "success") {
        log(`\n✅ CI PASSED! (${elapsed}s total)`);
        if (result.checks.length > 0) {
          log(
            `   Successful checks: ${result.checks.map((c) => c.name).join(", ")}`
          );
        }
        process.exit(0);
      }

      if (result.state === "failure") {
        log(`\n❌ CI FAILED! (${elapsed}s total)`);
        if (result.checks.length > 0) {
          log(`   Failed checks:`);
          result.checks.forEach((check) => {
            log(`   - ${check.name}: ${check.conclusion}`);
            if (check.output?.title) {
              log(`     ${check.output.title}`);
            }
          });
        }
        log(
          `\n💡 Fetch detailed errors with: node .github/scripts/fetch-ci-errors.js ${shortSha}`
        );
        process.exit(1);
      }

      // Still pending - wait and check again
      await sleep(options.pollInterval);
    } catch (error) {
      console.error(`⚠️  Error checking CI status: ${error.message}`);
      await sleep(options.pollInterval);
    }
  }

  // Timeout
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  log(`\n⏱️  CI monitoring timed out after ${elapsed}s`);
  log(`   The workflow may still be running. Check manually at:`);
  log(`   https://github.com/${owner}/${repo}/commit/${commitSha}/checks`);
  process.exit(2);
}

// Run the monitor
monitorCI().catch((error) => {
  console.error("❌ Fatal error:", error.message);
  process.exit(3);
});
