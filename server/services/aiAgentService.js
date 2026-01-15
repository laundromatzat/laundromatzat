// server/services/aiAgentService.js
const db = require("../database");
const githubService = require("./githubService");
const websocketService = require("./websocketService");
const fetch = require("node-fetch");
const path = require("path");
const fs = require("fs").promises;
const { GoogleGenerativeAI } = require("@google/generative-ai");

class AIAgentService {
  constructor() {
    this.activeExecutions = new Map(); // executionId -> execution state
    this.taskQueue = [];
    this.isProcessing = false;
    this.maxConcurrentTasks =
      parseInt(process.env.AI_AGENT_MAX_CONCURRENT_TASKS) || 1;
    this.timeoutMinutes = parseInt(process.env.AI_AGENT_TIMEOUT_MINUTES) || 30;
    this.requireApproval = process.env.AI_AGENT_REQUIRE_APPROVAL !== "false";

    // LLM Configuration - Gemini (default) or LM Studio (fallback)
    this.useGemini = process.env.USE_GEMINI !== "false"; // Default to Gemini
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.geminiModel = process.env.AI_AGENT_MODEL || "gemini-2.5-flash";

    // LM Studio fallback
    this.llmApiUrl = process.env.LM_STUDIO_API_URL || "http://localhost:1234";
    this.llmModel = process.env.LM_STUDIO_MODEL_NAME || "qwen3-vl-8b-instruct";

    // Initialize Gemini if enabled
    if (this.useGemini && this.geminiApiKey) {
      this.genAI = new GoogleGenerativeAI(this.geminiApiKey);
      console.log(`AI Agent using Gemini: ${this.geminiModel}`);
    } else {
      console.log(`AI Agent using LM Studio: ${this.llmApiUrl}`);
    }

    // Workspace configuration
    this.workspaceRoot =
      process.env.WORKSPACE_ROOT || path.resolve(__dirname, "../..");
  }

  /**
   * Submit a task to the AI agent
   */
  async submitTask(taskId, userId) {
    try {
      // Get the task details
      const taskResult = await db.query(
        "SELECT * FROM dev_tasks WHERE id = $1 AND user_id = $2",
        [taskId, userId]
      );

      if (taskResult.rows.length === 0) {
        throw new Error("Task not found or unauthorized");
      }

      const task = taskResult.rows[0];

      // Check if there's already an active execution for this task
      const existingExecution = await db.query(
        "SELECT * FROM agent_executions WHERE task_id = $1 AND status IN ($2, $3)",
        [taskId, "pending", "running"]
      );

      if (existingExecution.rows.length > 0) {
        throw new Error("Task already has an active execution");
      }

      // Create a new execution record
      const executionResult = await db.query(
        `INSERT INTO agent_executions (task_id, user_id, status, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         RETURNING *`,
        [taskId, userId, "pending"]
      );

      const execution = executionResult.rows[0];

      // Add to queue
      this.taskQueue.push({
        executionId: execution.id,
        taskId,
        userId,
        task,
      });

      // Log the submission
      await this.addLog(
        execution.id,
        "info",
        `Task submitted to AI agent: ${task.title}`
      );

      // Process queue if not already processing
      if (!this.isProcessing) {
        this.processQueue();
      }

      return execution;
    } catch (error) {
      console.error("Error submitting task to agent:", error);
      throw error;
    }
  }

  /**
   * Process the task queue
   */
  async processQueue() {
    if (this.isProcessing || this.taskQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (
      this.taskQueue.length > 0 &&
      this.activeExecutions.size < this.maxConcurrentTasks
    ) {
      const item = this.taskQueue.shift();
      this.executeTask(item).catch((error) => {
        console.error(`Error executing task ${item.taskId}:`, error);
      });
    }

    this.isProcessing = false;
  }

  /**
   * Execute a task with the AI agent
   */
  async executeTask({ executionId, taskId, userId, task }) {
    try {
      // Mark as active
      this.activeExecutions.set(executionId, {
        taskId,
        userId,
        status: "running",
      });

      // Update execution status
      await this.updateExecutionStatus(executionId, "running", new Date());

      // Notify user
      websocketService.notifyAgentStarted(userId, executionId, taskId);

      // Log start
      await this.addLog(executionId, "info", "AI agent execution started");

      // Create feature branch
      const branchName = githubService.generateBranchName(taskId, task.title);
      await this.addLog(
        executionId,
        "info",
        `Creating feature branch: ${branchName}`
      );

      try {
        await githubService.createBranch(branchName);
        await db.query(
          "UPDATE agent_executions SET github_branch = $1 WHERE id = $2",
          [branchName, executionId]
        );
      } catch (error) {
        await this.addLog(
          executionId,
          "warning",
          `Failed to create branch, using existing: ${error.message}`
        );
      }

      // Build AI prompt from task
      const prompt = this.buildPrompt(task);
      await this.addLog(
        executionId,
        "info",
        "Analyzing task and generating implementation plan"
      );

      // Execute AI agent workflow
      const result = await this.runAgentWorkflow(
        executionId,
        userId,
        task,
        prompt,
        branchName
      );

      // Mark as completed
      await this.updateExecutionStatus(
        executionId,
        "completed",
        null,
        new Date()
      );
      await this.addLog(
        executionId,
        "info",
        "Task execution completed successfully"
      );

      // Update task status
      await db.query(
        "UPDATE dev_tasks SET status = $1, updated_at = NOW() WHERE id = $2",
        ["completed", taskId]
      );

      // Notify user
      websocketService.notifyAgentCompleted(userId, executionId, result);
    } catch (error) {
      console.error(`Task execution failed for ${taskId}:`, error);
      await this.updateExecutionStatus(executionId, "failed");
      await this.addLog(
        executionId,
        "error",
        `Execution failed: ${error.message}`
      );

      // Update task status to on_hold
      await db.query(
        "UPDATE dev_tasks SET status = $1, updated_at = NOW() WHERE id = $2",
        ["on_hold", taskId]
      );

      websocketService.notifyAgentError(userId, executionId, error);
    } finally {
      this.activeExecutions.delete(executionId);

      // Process next task in queue
      if (!this.isProcessing) {
        this.processQueue();
      }
    }
  }

  /**
   * Run the AI agent workflow
   */
  async runAgentWorkflow(executionId, userId, task, prompt, branchName) {
    // Phase 1: Analysis
    await this.addLog(
      executionId,
      "progress",
      "Phase 1/4: Analyzing requirements"
    );
    websocketService.notifyAgentProgress(userId, executionId, {
      phase: "analysis",
      progress: 25,
    });

    const analysis = await this.callLLM(
      `Analyze this development task and create a detailed implementation plan:\n\n${prompt}\n\nProvide a structured analysis with:\n1. Files that need to be modified\n2. New files to create\n3. Potential challenges\n4. Testing approach`
    );

    await this.addLog(executionId, "info", `Analysis completed:\n${analysis}`);

    // Phase 2: Implementation
    await this.addLog(
      executionId,
      "progress",
      "Phase 2/4: Implementing changes"
    );
    websocketService.notifyAgentProgress(userId, executionId, {
      phase: "implementation",
      progress: 50,
    });

    const implementation = await this.callLLM(
      `Based on the following task and analysis, generate the code changes needed:\n\nTask: ${prompt}\n\nAnalysis: ${analysis}\n\nProvide the implementation as a JSON array of file changes in this format:\n[{"path": "relative/path/to/file.js", "content": "full file content"}]`
    );

    // Parse file changes from LLM response
    const fileChanges = this.parseFileChanges(implementation);
    await this.addLog(
      executionId,
      "info",
      `Generated changes for ${fileChanges.length} file(s)`
    );

    // Phase 3: Commit changes
    await this.addLog(
      executionId,
      "progress",
      "Phase 3/4: Committing changes to GitHub"
    );
    websocketService.notifyAgentProgress(userId, executionId, {
      phase: "commit",
      progress: 75,
    });

    const commitMessage = this.generateCommitMessage(task);
    const commitResult = await githubService.createCommit(
      branchName,
      commitMessage,
      fileChanges
    );

    await db.query(
      "UPDATE agent_executions SET github_commit_sha = $1 WHERE id = $2",
      [commitResult.sha, executionId]
    );

    await this.addLog(
      executionId,
      "info",
      `Changes committed: ${commitResult.url}`
    );

    // Phase 4: Monitor CI/CD
    await this.addLog(
      executionId,
      "progress",
      "Phase 4/4: Monitoring GitHub Actions"
    );
    websocketService.notifyAgentProgress(userId, executionId, {
      phase: "ci_cd",
      progress: 90,
    });

    // Wait a bit for GitHub Actions to start
    await this.sleep(5000);

    const ciStatus = await this.monitorGitHubActions(
      executionId,
      userId,
      commitResult.sha
    );

    await this.addLog(
      executionId,
      "info",
      `GitHub Actions status: ${ciStatus.status}`
    );

    return {
      branch: branchName,
      commitSha: commitResult.sha,
      commitUrl: commitResult.url,
      ciStatus: ciStatus.status,
      ciUrl: ciStatus.url,
      filesChanged: fileChanges.length,
    };
  }

  /**
   * Call the LLM with a prompt (Gemini or LM Studio)
   */
  async callLLM(prompt) {
    if (this.useGemini && this.genAI) {
      return await this.callGemini(prompt);
    }
    return await this.callLMStudio(prompt);
  }

  /**
   * Call Gemini API
   */
  async callGemini(prompt) {
    try {
      const model = this.genAI.getGenerativeModel({
        model: this.geminiModel,
        systemInstruction:
          "You are an expert software developer AI agent. Analyze tasks carefully and provide detailed, production-ready code implementations.",
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Error calling Gemini:", error);

      // Fallback to LM Studio if Gemini fails
      if (this.llmApiUrl) {
        console.log("Falling back to LM Studio...");
        return await this.callLMStudio(prompt);
      }

      throw new Error(`Failed to communicate with Gemini: ${error.message}`);
    }
  }

  /**
   * Call LM Studio API
   */
  async callLMStudio(prompt) {
    try {
      const response = await fetch(`${this.llmApiUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.llmModel,
          messages: [
            {
              role: "system",
              content:
                "You are an expert software developer AI agent. Analyze tasks carefully and provide detailed, production-ready code implementations.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 4000,
        }),
      });

      if (!response.ok) {
        throw new Error(`LM Studio API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error("Error calling LM Studio:", error);
      throw new Error(`Failed to communicate with LM Studio: ${error.message}`);
    }
  }

  /**
   * Build prompt from task
   */
  buildPrompt(task) {
    const parts = [];

    parts.push(`Task: ${task.title}`);
    parts.push(`Category: ${task.category}`);
    parts.push(`Priority: ${task.priority}`);

    if (task.description) {
      parts.push(`\nDescription:\n${task.description}`);
    }

    if (task.notes) {
      parts.push(`\nNotes:\n${task.notes}`);
    }

    if (task.tags) {
      parts.push(`\nTags: ${task.tags}`);
    }

    parts.push(
      "\nPlease implement this task following best practices and ensuring all tests pass."
    );

    return parts.join("\n");
  }

  /**
   * Parse file changes from LLM response
   */
  parseFileChanges(implementation) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = implementation.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const changes = JSON.parse(jsonMatch[0]);
        return changes.map((change) => ({
          path: change.path,
          content: change.content,
        }));
      }

      // If no JSON found, return empty array (will need manual intervention)
      console.warn("Could not parse file changes from LLM response");
      return [];
    } catch (error) {
      console.error("Error parsing file changes:", error);
      return [];
    }
  }

  /**
   * Generate commit message
   */
  generateCommitMessage(task) {
    const category =
      task.category.charAt(0).toUpperCase() + task.category.slice(1);
    return `${category}: ${task.title}\n\nImplemented by AI Agent\nTask ID: #${task.id}`;
  }

  /**
   * Monitor GitHub Actions status
   */
  async monitorGitHubActions(executionId, userId, commitSha, maxAttempts = 20) {
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const status = await githubService.getCommitStatus(commitSha);

        await db.query(
          "UPDATE agent_executions SET github_actions_status = $1, github_actions_url = $2 WHERE id = $3",
          [status.status, status.url, executionId]
        );

        websocketService.notifyAgentStatusChange(
          userId,
          executionId,
          status.status
        );

        if (status.status === "success" || status.status === "failure") {
          return status;
        }

        // Wait before checking again
        await this.sleep(10000);
        attempts++;
      } catch (error) {
        console.error("Error monitoring GitHub Actions:", error);
        break;
      }
    }

    return { status: "unknown", url: null };
  }

  /**
   * Update execution status
   */
  async updateExecutionStatus(
    executionId,
    status,
    startedAt = null,
    completedAt = null
  ) {
    const updates = ["status = $1", "updated_at = NOW()"];
    const values = [status];
    let paramCount = 2;

    if (startedAt) {
      updates.push(`started_at = $${paramCount}`);
      values.push(startedAt);
      paramCount++;
    }

    if (completedAt) {
      updates.push(`completed_at = $${paramCount}`);
      values.push(completedAt);
      paramCount++;
    }

    values.push(executionId);

    await db.query(
      `UPDATE agent_executions SET ${updates.join(", ")} WHERE id = $${paramCount}`,
      values
    );
  }

  /**
   * Add a log entry
   */
  async addLog(executionId, logType, message, metadata = null) {
    await db.query(
      `INSERT INTO agent_execution_logs (execution_id, log_type, message, metadata, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [
        executionId,
        logType,
        message,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );

    // Get user ID for this execution
    const result = await db.query(
      "SELECT user_id FROM agent_executions WHERE id = $1",
      [executionId]
    );

    if (result.rows.length > 0) {
      websocketService.notifyAgentLog(result.rows[0].user_id, executionId, {
        type: logType,
        message,
        metadata,
      });
    }
  }

  /**
   * Cancel an execution
   */
  async cancelExecution(executionId, userId) {
    const result = await db.query(
      "SELECT * FROM agent_executions WHERE id = $1 AND user_id = $2",
      [executionId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error("Execution not found or unauthorized");
    }

    const execution = result.rows[0];

    if (execution.status !== "pending" && execution.status !== "running") {
      throw new Error("Cannot cancel execution in current status");
    }

    await this.updateExecutionStatus(
      executionId,
      "cancelled",
      null,
      new Date()
    );
    await this.addLog(executionId, "info", "Execution cancelled by user");

    // Remove from active executions
    this.activeExecutions.delete(executionId);

    // Remove from queue if pending
    this.taskQueue = this.taskQueue.filter(
      (item) => item.executionId !== executionId
    );

    websocketService.notifyAgentStatusChange(userId, executionId, "cancelled");
  }

  /**
   * Get execution details
   */
  async getExecution(executionId, userId) {
    const result = await db.query(
      "SELECT * FROM agent_executions WHERE id = $1 AND user_id = $2",
      [executionId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error("Execution not found or unauthorized");
    }

    return result.rows[0];
  }

  /**
   * Get execution logs
   */
  async getExecutionLogs(executionId, userId, limit = 100, offset = 0) {
    // Verify ownership
    await this.getExecution(executionId, userId);

    const result = await db.query(
      `SELECT * FROM agent_execution_logs 
       WHERE execution_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [executionId, limit, offset]
    );

    return result.rows;
  }

  /**
   * Helper to sleep
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = new AIAgentService();
