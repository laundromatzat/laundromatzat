# GitHub Actions Integration for AI Agents

## Overview

This repository is configured to automatically capture and expose CI/CD errors for AI agents to fix automatically.

## How It Works

When a GitHub Actions workflow fails (lint or build errors), the CI workflow will:

1. **Capture error output** - Lint errors are saved to `lint-output.txt`
2. **Post a commit comment** - A formatted comment is added to the failing commit containing:
   - Lint errors (if any)
   - Build failure notification (if applicable)
   - Link to the workflow run
   - Special marker for AI agents

## For AI Agents

### Automatic Error Detection

When a user reports "GitHub Actions failed" or similar:

1. **Fetch the latest commit comments** using the GitHub MCP server:

   ```javascript
   // Use mcp_github-mcp-server tools to get commit details
   const commit = await getLatestCommit("laundromatzat", "laundromatzat");
   // Check for comments containing "CI Build Failed"
   ```

2. **Or use the helper script**:
   ```bash
   node .github/scripts/fetch-ci-errors.js
   ```

### Error Comment Format

Comments will look like this:

```markdown
## ❌ CI Build Failed

### Lint Errors
```

/path/to/file.tsx
123:45 error Description of error rule-name

✖ X problems (X errors, 0 warnings)

```

---
**For AI Agents**: Use this error output to fix the issues automatically.
**Workflow Run**: https://github.com/owner/repo/actions/runs/12345
```

### Workflow for Fixing Errors

1. Parse the error comment to extract:
   - File paths
   - Line numbers
   - Error descriptions
   - Rule names

2. Fix the errors in the identified files

3. Commit and push the fixes

4. The workflow will run again and either:
   - Pass ✅ (no new comment)
   - Fail ❌ (new comment with remaining errors)

## Manual Usage

### Check for CI Errors

```bash
# For the latest commit
node .github/scripts/fetch-ci-errors.js

# For a specific commit
node .github/scripts/fetch-ci-errors.js abc123def
```

### Requirements

- GitHub CLI (`gh`) must be installed and authenticated
- Run `gh auth login` if not already authenticated

## Workflow Configuration

The CI workflow is configured in `.github/workflows/ci.yml` with:

- **Permissions**: `contents: read`, `pull-requests: write`
- **Error capture**: Lint output is piped to `lint-output.txt`
- **Continue on error**: Steps use `continue-on-error: true` to allow commenting
- **Conditional commenting**: Only comments when `lint` or `build` steps fail

## Future Enhancements

- [ ] Add support for test failures
- [ ] Include code snippets in error comments
- [ ] Suggest fixes using AI in the comment itself
- [ ] Support for pull request comments (not just commits)

## Troubleshooting

### No comments appearing

1. Check workflow permissions in repository settings
2. Verify `GITHUB_TOKEN` has write access
3. Check workflow run logs for comment step errors

### Script fails to fetch comments

1. Ensure GitHub CLI is installed: `gh --version`
2. Authenticate: `gh auth login`
3. Check repository access: `gh repo view`
