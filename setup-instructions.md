# AI Agent Setup - Quick Start Guide

## Step 1: Configure Environment

Edit `.env.local` and add these values:

```env
# GitHub Integration (REQUIRED)
GITHUB_TOKEN=ghp_YOUR_ACTUAL_TOKEN_HERE  # Get from: https://github.com/settings/tokens
GITHUB_REPO_OWNER=stephenmatzat
GITHUB_REPO_NAME=laundromatzat
GITHUB_DEFAULT_BRANCH=main

# Database (if not already set elsewhere)
# DATABASE_URL=postgresql://user:password@localhost:5432/your_db_name

# AI Agent Configuration
AI_AGENT_MAX_CONCURRENT_TASKS=1
AI_AGENT_TIMEOUT_MINUTES=30
AI_AGENT_REQUIRE_APPROVAL=false

# LM Studio Configuration
LM_STUDIO_API_URL=http://localhost:1234
LM_STUDIO_MODEL_NAME=qwen3-vl-8b-instruct

# Workspace Root
WORKSPACE_ROOT=/Users/stephenmatzat/Projects/laundromatzat
```

## Step 2: Get GitHub Personal Access Token

1. Visit: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name: "Laundromatzat AI Agent"
4. Select scope: ✓ **repo** (Full control of private repositories)
5. Click "Generate token"
6. Copy the token (starts with `ghp_`)
7. Paste into `.env.local` replacing `ghp_YOUR_ACTUAL_TOKEN_HERE`

## Step 3: Run Database Migration

```bash
# Make sure your DATABASE_URL is set (check your existing .env files)
# Then run:
npm run server &  # Start server to initialize DB
sleep 3
psql $DATABASE_URL -f server/migrations/add_agent_tables.sql
```

OR if you have the database connection details:

```bash
psql postgresql://user:password@host:port/dbname -f server/migrations/add_agent_tables.sql
```

## Step 4: Start Services

```bash
# Make sure LM Studio is running on port 1234
# Then start your application:
npm run dev
```

## Step 5: Test the AI Agent

1. Navigate to `/tools/dev-task-manager`
2. Create a simple test task:
   - Title: "Add console.log to homepage"
   - Description: "Add a console.log statement to the main page component"
   - Category: Feature
   - Priority: Low
3. Click the robot icon (🤖) on the task card
4. Watch the real-time logs in the task detail modal!

## Troubleshooting

**If migration fails:**
- Check that DATABASE_URL is set correctly
- Ensure PostgreSQL is running
- Verify you have CREATE TABLE permissions

**If agent doesn't start:**
- Check that LM Studio is running: `curl http://localhost:1234/v1/models`
- Verify GitHub token is valid
- Check server logs for errors

**If WebSocket doesn't connect:**
- Check browser console for connection errors
- Ensure server is running on port 4000
- Verify no firewall blocking WebSocket connections

## Next Steps After Testing

1. Review the agent-created branch on GitHub
2. Check if GitHub Actions ran successfully
3. Merge the branch if everything looks good
4. Try more complex tasks!

Enjoy your autonomous AI coding agent! 🤖✨
