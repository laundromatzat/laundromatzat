// server/services/githubService.js
const fetch = require("node-fetch");

class GitHubService {
  constructor() {
    this.token = process.env.GITHUB_TOKEN;
    this.owner = process.env.GITHUB_REPO_OWNER || "stephenmatzat";
    this.repo = process.env.GITHUB_REPO_NAME || "laundromatzat";
    this.defaultBranch = process.env.GITHUB_DEFAULT_BRANCH || "main";
    this.apiBase = "https://api.github.com";
  }

  async request(endpoint, options = {}) {
    if (!this.token) {
      throw new Error(
        "GitHub token not configured. Please set GITHUB_TOKEN in environment variables."
      );
    }

    const url = `${this.apiBase}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: response.statusText }));
      throw new Error(`GitHub API error: ${error.message}`);
    }

    return response.json();
  }

  /**
   * Get the latest commit SHA from a branch
   */
  async getLatestCommit(branch = this.defaultBranch) {
    const data = await this.request(
      `/repos/${this.owner}/${this.repo}/git/refs/heads/${branch}`
    );
    return data.object.sha;
  }

  /**
   * Create a new branch from a base branch
   */
  async createBranch(branchName, baseBranch = this.defaultBranch) {
    const baseSha = await this.getLatestCommit(baseBranch);

    try {
      await this.request(`/repos/${this.owner}/${this.repo}/git/refs`, {
        method: "POST",
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: baseSha,
        }),
      });
      return branchName;
    } catch (error) {
      if (error.message.includes("Reference already exists")) {
        // Branch already exists, that's okay
        return branchName;
      }
      throw error;
    }
  }

  /**
   * Get file content from repository
   */
  async getFileContent(path, branch = this.defaultBranch) {
    try {
      const data = await this.request(
        `/repos/${this.owner}/${this.repo}/contents/${path}?ref=${branch}`
      );
      return {
        content: Buffer.from(data.content, "base64").toString("utf-8"),
        sha: data.sha,
      };
    } catch (error) {
      if (error.message.includes("Not Found")) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Create or update a file in the repository
   */
  async updateFile(path, content, message, branch, fileSha = null) {
    const body = {
      message,
      content: Buffer.from(content).toString("base64"),
      branch,
    };

    if (fileSha) {
      body.sha = fileSha;
    }

    return this.request(`/repos/${this.owner}/${this.repo}/contents/${path}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  /**
   * Create a commit with multiple file changes
   */
  async createCommit(branch, message, files) {
    // Get the current commit
    const currentCommit = await this.getLatestCommit(branch);
    const currentCommitData = await this.request(
      `/repos/${this.owner}/${this.repo}/git/commits/${currentCommit}`
    );
    const currentTreeSha = currentCommitData.tree.sha;

    // Create blobs for each file
    const blobs = await Promise.all(
      files.map(async (file) => {
        const blob = await this.request(
          `/repos/${this.owner}/${this.repo}/git/blobs`,
          {
            method: "POST",
            body: JSON.stringify({
              content: Buffer.from(file.content).toString("base64"),
              encoding: "base64",
            }),
          }
        );
        return {
          path: file.path,
          mode: "100644",
          type: "blob",
          sha: blob.sha,
        };
      })
    );

    // Create a new tree
    const tree = await this.request(
      `/repos/${this.owner}/${this.repo}/git/trees`,
      {
        method: "POST",
        body: JSON.stringify({
          base_tree: currentTreeSha,
          tree: blobs,
        }),
      }
    );

    // Create the commit
    const commit = await this.request(
      `/repos/${this.owner}/${this.repo}/git/commits`,
      {
        method: "POST",
        body: JSON.stringify({
          message,
          tree: tree.sha,
          parents: [currentCommit],
        }),
      }
    );

    // Update the branch reference
    await this.request(
      `/repos/${this.owner}/${this.repo}/git/refs/heads/${branch}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          sha: commit.sha,
        }),
      }
    );

    return {
      sha: commit.sha,
      branch,
      url: `https://github.com/${this.owner}/${this.repo}/commit/${commit.sha}`,
    };
  }

  /**
   * Get GitHub Actions workflow runs for a specific commit
   */
  async getWorkflowRuns(commitSha) {
    const data = await this.request(
      `/repos/${this.owner}/${this.repo}/actions/runs?head_sha=${commitSha}`
    );
    return data.workflow_runs;
  }

  /**
   * Get the status of the latest workflow run for a commit
   */
  async getCommitStatus(commitSha) {
    const runs = await this.getWorkflowRuns(commitSha);

    if (runs.length === 0) {
      return { status: "pending", url: null };
    }

    const latestRun = runs[0];
    return {
      status:
        latestRun.status === "completed"
          ? latestRun.conclusion
          : latestRun.status,
      url: latestRun.html_url,
    };
  }

  /**
   * Create a pull request
   */
  async createPullRequest(head, base, title, body) {
    return this.request(`/repos/${this.owner}/${this.repo}/pulls`, {
      method: "POST",
      body: JSON.stringify({
        title,
        body,
        head,
        base,
      }),
    });
  }

  /**
   * Generate a branch name for a task
   */
  generateBranchName(taskId, taskTitle) {
    const slug = taskTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 30);
    return `ai-agent/task-${taskId}-${slug}`;
  }
}

module.exports = new GitHubService();
