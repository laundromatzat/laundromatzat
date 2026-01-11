#!/usr/bin/env node
/**
 * GitHub Actions Error Fetcher
 *
 * This script fetches the latest commit comment containing CI errors
 * for AI agents to automatically fix issues.
 *
 * Usage:
 *   node .github/scripts/fetch-ci-errors.js [commit-sha]
 *
 * If no commit SHA is provided, it fetches errors for the latest commit.
 */

const { execSync } = require("child_process");

function getLatestCommitSha() {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch (error) {
    console.error("Error getting latest commit SHA:", error.message);
    process.exit(1);
  }
}

function fetchCommitComments(sha) {
  try {
    // Get repository info
    const remoteUrl = execSync("git config --get remote.origin.url", {
      encoding: "utf8",
    }).trim();
    const match = remoteUrl.match(/github\.com[:/](.+?)\/(.+?)(\.git)?$/);

    if (!match) {
      throw new Error("Could not parse GitHub repository from remote URL");
    }

    const [, owner, repo] = match;
    const cleanRepo = repo.replace(".git", "");

    // Use GitHub CLI to fetch commit comments
    const comments = execSync(
      `gh api repos/${owner}/${cleanRepo}/commits/${sha}/comments`,
      { encoding: "utf8" }
    );

    const parsed = JSON.parse(comments);

    // Find CI error comments
    const ciErrors = parsed.filter(
      (comment) =>
        comment.body.includes("CI Build Failed") ||
        comment.body.includes("Lint Errors")
    );

    if (ciErrors.length === 0) {
      console.log("✅ No CI errors found for this commit");
      return null;
    }

    // Return the most recent error comment
    const latestError = ciErrors[ciErrors.length - 1];
    return latestError.body;
  } catch (error) {
    if (error.message.includes("gh: command not found")) {
      console.error("❌ GitHub CLI (gh) is not installed.");
      console.error("Install it from: https://cli.github.com/");
    } else {
      console.error("Error fetching commit comments:", error.message);
    }
    process.exit(1);
  }
}

// Main execution
const commitSha = process.argv[2] || getLatestCommitSha();
console.log(`Fetching CI errors for commit: ${commitSha}\n`);

const errors = fetchCommitComments(commitSha);

if (errors) {
  console.log("=".repeat(80));
  console.log(errors);
  console.log("=".repeat(80));
} else {
  console.log("No errors to display.");
}
