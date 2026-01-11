# Dev Task Manager - User Guide

## Overview

The Dev Task Manager is a mobile-friendly task management system designed specifically for tracking website development tasks. It allows you to easily add features, bugs, and fixes from your mobile device and generate AI-ready prompts for coding agents like Claude Code or Google Gemini.

## Features

### 1. Mobile-Optimized Quick Add
- **Fast task entry** from any device (mobile or desktop)
- **Category selection**: Feature, Bug, Enhancement, Fix, Refactor, Docs, Other
- **Priority levels**: Low, Medium, High, Urgent
- **Tags support** for easy organization

### 2. Task Organization
- **Visual dashboard** showing task counts by status and priority
- **Filtering** by status, priority, and category
- **Real-time updates** across devices
- **Offline support** with IndexedDB caching

### 3. AI Agent Integration
The standout feature is the **AI Prompt Generator** that creates ready-to-use prompts for AI coding agents.

#### How to Use with AI Agents:

##### Option 1: Quick Copy from Task Card
1. Hover over any task card
2. Click the sparkle icon (✨)
3. Prompt is automatically copied to clipboard
4. Paste into Claude Code or Google Gemini

##### Option 2: Detailed Prompt from Task View
1. Click on any task to open the detail view
2. Click "Show AI Agent Prompt"
3. Review the generated prompt with full context
4. Click "Copy" button
5. Paste into your AI agent

### 4. Task Management
- **Status tracking**: New → In Progress → Completed
- **Quick status updates** directly from task cards
- **Edit tasks** with full details
- **Delete tasks** when no longer needed
- **Notes field** for additional context

## Mobile Workflow

### Adding a Task from Your Phone
1. Navigate to `/tools/dev-task-manager`
2. Tap "Quick Add Task"
3. Enter title and description
4. Select category and priority
5. Add tags (optional)
6. Tap "Add Task"

### Promoting a Task to AI Agent
1. Find the task in your list
2. Tap on the task to open details
3. Tap "Show AI Agent Prompt"
4. Tap "Copy"
5. Open Claude Code or Gemini on your computer
6. Paste the prompt to start implementation

## Desktop Workflow

### Same features, enhanced UI
- Hover actions for quick access
- Larger view for editing and reviewing
- Easier typing and navigation

## Generated AI Prompts

The system automatically generates comprehensive prompts that include:

- **Task type context** (Feature, Bug, Enhancement, etc.)
- **Priority level** with urgency indicators
- **Full description** of what needs to be done
- **Additional notes** you've added
- **Tags** for context
- **Clear instructions** for the AI agent to analyze, implement, test, and commit

### Example Generated Prompt:

```
Implement the following new feature: Add dark mode toggle

HIGH PRIORITY - This task should be completed as soon as possible.

Description:
Add a toggle switch in the settings page that allows users to switch between light and dark themes. The preference should be saved and persist across sessions.

Additional Notes:
Make sure to update all existing components to support both themes. Use CSS variables for easy theming.

Tags: ui, settings, theme

Please analyze the codebase, implement the necessary changes, test thoroughly, and commit the work.
```

## Data Persistence

- **Server-side storage** (PostgreSQL) when logged in
- **Local IndexedDB cache** for offline access
- **Automatic sync** when connection is restored
- **User-specific** tasks (private to your account)

## Access

- **URL**: `/tools/dev-task-manager`
- **Authentication**: Required (protected route)
- **Permissions**: User-level access

## Best Practices

1. **Be specific** in task titles and descriptions
2. **Use tags** to group related tasks
3. **Set appropriate priority** levels
4. **Update status** as you work
5. **Add notes** with implementation hints or references
6. **Review generated prompts** before sending to AI agents
7. **Keep tasks focused** on single changes

## Database Schema

Tasks are stored with the following fields:
- `id`: Unique identifier
- `user_id`: Owner of the task
- `title`: Brief description (required)
- `description`: Detailed information
- `category`: Type of task
- `priority`: Importance level
- `status`: Current state
- `tags`: Comma-separated labels
- `ai_prompt`: Custom AI prompt (optional)
- `notes`: Additional context
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp

## API Endpoints

- `GET /api/dev-tasks` - Fetch all tasks
- `POST /api/dev-tasks` - Create new task
- `PUT /api/dev-tasks/:id` - Update task
- `DELETE /api/dev-tasks/:id` - Delete task

All endpoints require authentication via JWT token.

## Future Enhancements

Potential features for future versions:
- Task dependencies
- Due dates and reminders
- Collaboration/sharing
- Integration with GitHub issues
- Automatic PR creation from tasks
- Task templates
- Bulk operations
- Advanced filtering and search
- Analytics and reporting

## Support

For issues or feature requests, please use the main repository's issue tracker.
