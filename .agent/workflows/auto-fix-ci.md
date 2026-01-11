---
description: Automatically monitor and fix CI failures after push
---

# Auto-Fix CI Workflow

This workflow automatically monitors CI status after pushing code and fixes any errors that occur.

**Status**: ✅ Enabled by default for all AI agents

## How It Works

1. After pushing code to GitHub, automatically monitor CI status
2. If CI fails, fetch error details from commit comments
3. Parse and fix the identified issues
4. Commit and push the fixes
5. Repeat monitoring (max 3 attempts to prevent infinite loops)

## Configuration

- **Max Retries**: 3 attempts
- **Timeout**: 5 minutes per CI run
- **Poll Interval**: 15 seconds
- **Notification**: Only on final failure

## Usage

### Automatic (Default)

After any `git push origin main`, this workflow runs automatically.

### Manual Trigger

If you want to manually trigger the auto-fix process:

```bash
node .github/scripts/auto-fix-ci.js
```

## Steps

The workflow performs these steps in sequence:

// turbo-all

### 1. Monitor CI Status

Wait for the CI workflow to complete and check its status.

```bash
node .github/scripts/monitor-ci-status.js
```

**Exit codes**:

- `0` = CI passed ✅ (stop here)
- `1` = CI failed ❌ (continue to step 2)
- `2` = Timeout ⏱️ (notify user)
- `3` = Error ⚠️ (notify user)

### 2. Fetch Error Details

If CI failed, fetch the error comment from the commit.

```bash
node .github/scripts/fetch-ci-errors.js
```

This retrieves the formatted error output that was automatically posted to the commit.

### 3. Parse and Fix Errors

Analyze the error output and fix the identified issues:

- **Lint errors**: Fix TypeScript/ESLint issues
- **Build errors**: Resolve compilation problems
- **Type errors**: Add proper type annotations

Use the error format to extract:

- File paths
- Line numbers
- Error descriptions
- Rule names

### 4. Commit and Push Fix

After fixing the errors, commit and push the changes.

```bash
git add .
git commit -m "fix: auto-resolve CI errors (attempt X/3)"
git push origin main
```

The commit message includes the attempt number to track retries.

### 5. Repeat Monitoring

Return to step 1 and monitor the new CI run.

**Safety limits**:

- Maximum 3 total attempts
- If 3rd attempt fails, notify user and stop
- Track attempts in commit messages

## Safety Mechanisms

### Infinite Loop Prevention

1. **Attempt Counter**: Tracked in commit messages
   - `fix: auto-resolve CI errors (attempt 1/3)`
   - `fix: auto-resolve CI errors (attempt 2/3)`
   - `fix: auto-resolve CI errors (attempt 3/3)`

2. **Max Retry Limit**: Hard stop at 3 attempts

3. **User Notification**: On final failure, notify user with:
   - All attempted fixes
   - Remaining errors
   - Suggestion to review manually

### Error Detection

Before attempting a fix, verify:

- Errors are parseable and actionable
- Files mentioned in errors exist
- Changes won't break other functionality

## Example Execution

```
🔍 Monitoring CI for commit a1b2c3d...
⏳ CI is running... (15s elapsed)
⏳ CI is running... (30s elapsed)

❌ CI FAILED! (47s total)
   Failed checks:
   - build: failure
     ESLint found 3 errors

💡 Fetching error details...

📝 Found errors:
   - components/Example.tsx:45 - Missing semicolon
   - pages/Test.tsx:12 - Unused variable
   - lib/utils.ts:89 - Type error

🔧 Fixing errors...
   ✅ Fixed components/Example.tsx
   ✅ Fixed pages/Test.tsx
   ✅ Fixed lib/utils.ts

📤 Committing fix: "fix: auto-resolve CI errors (attempt 1/3)"
🚀 Pushing to GitHub...

🔍 Monitoring CI for commit d4e5f6g...
⏳ CI is running... (15s elapsed)

✅ CI PASSED! (34s total)
   Successful checks: build, lint

✨ Auto-fix complete!
```

## Disabling Auto-Fix

If you want to disable auto-fix for a specific session, set:

```bash
export ANTIGRAVITY_AUTO_FIX_CI=false
```

Or remove the `// turbo-all` annotation from this file.

## Troubleshooting

### CI monitoring times out

- Check if GitHub Actions is experiencing delays
- Verify the workflow is actually running on GitHub
- Increase timeout: `--timeout=600000` (10 minutes)

### Fixes don't resolve errors

- Review the error parsing logic
- Check if errors require manual intervention
- Verify file paths are correct

### Infinite loop detected

- Check commit history for repeated fix attempts
- Verify attempt counter is incrementing
- Ensure max retry limit is enforced

## Related Files

- [monitor-ci-status.js](file:///Users/stephenmatzat/Projects/laundromatzat/.github/scripts/monitor-ci-status.js) - CI status monitoring
- [fetch-ci-errors.js](file:///Users/stephenmatzat/Projects/laundromatzat/.github/scripts/fetch-ci-errors.js) - Error fetching
- [AI_AGENT_GUIDE.md](file:///Users/stephenmatzat/Projects/laundromatzat/.github/AI_AGENT_GUIDE.md) - Complete documentation
