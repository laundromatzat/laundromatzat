# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- **Mission Control**: A comprehensive Admin Dashboard for monitoring server health, managing user approvals, and tracking AI usage.
  - User Management: Approve, delete, and view user roles.
  - Server Stats: Real-time monitoring of active users, memory usage, and uptime.
  - AI Usage Tracking: Detailed breakdown of token usage and costs by user, tool, and model.
  - Dev Task Manager: Integrated task management for development workflows.
- **MediaInsight Pro**: Significant interactions and UI improvements for the Electron-based media analysis tool.
  - New "Glassmorphism" design system.
  - Enhanced file system explorer and analysis display.
  - Persistence for user settings and analysis history.
- **New Creative Tools**:
  - **Intelligent Ideas Board**: A canvas for brainstorming with AI assistance.
  - **Wood Carving Visualizer**: Tool for visualizing wood carving projects.
  - **Pin Pals**: A Pinterest-style collaborative board.
- **Shimmer Loading States**: Standardized loading animations across the application (ProjectGrid, ToolsSection, etc.) for a smoother user experience.
- **Electron Development Scripts**: Added `npm run electron:dev:all` to run the full stack (Frontend, Backend, Electron) concurrently.

### Changed

- **Paystub Analyzer**: Migrated to use **Aura** design system components for a cohesive look and feel.
- **LLM Strategy**: Optimized toolchain to primarily use **Google Gemini API** for cost-efficiency and performance, while keeping local LLMs (LM Studio) for specialized privacy-focused tasks (MediaInsight).
- **ComfyUI Integration**:
  - Upgraded ComfyUI Manager.
  - Consolidated ComfyUI models and workflows to external storage.
  - Improved startup scripts for reliable connection.

### Fixed

- **Backend Persistence**: Resolved issues with profile pictures and session data not persisting correctly in production environments.
- **Security Vulnerabilities**: Patched dependencies and fixed code-level vulnerabilities (XSS, path traversal) identified by security scans.
- **Linting**: Cleared extensive linting errors across the codebase to ensure clean CI/CD pipelines.
