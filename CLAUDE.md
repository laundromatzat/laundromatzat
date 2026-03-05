# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Install dependencies (installs both frontend and server)
npm install

# Start development (runs both Vite frontend :5173 and Express backend :4000)
npm run dev

# Start backend only
npm run server

# Build for production
npm run build

# Electron desktop app
npm run electron:dev:all  # Full dev stack (Vite + Server + Electron)
npm run electron:build:mac  # Build macOS DMG/ZIP
```

## Testing

```bash
# Unit tests (Vitest)
npm run test           # Run once
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report (50% thresholds)

# E2E tests (Playwright - Chrome/Firefox/Safari)
npm run test:e2e
npm run test:e2e:ui    # With UI

# Backend tests (Jest, from server/)
cd server && npm test
```

## Linting

```bash
npm run lint  # ESLint (TypeScript + React) - zero warnings allowed
```

Pre-commit hooks via Husky + lint-staged automatically lint changed files.

## Architecture

**Monorepo structure:**
- Root: React frontend (Vite, TypeScript, TailwindCSS)
- `server/`: Express backend (Node.js, PostgreSQL)

**Frontend stack:** React 19 + React Router 7 + TailwindCSS 3.4 + Vitest

**Backend stack:** Express 5 + PostgreSQL (pg) + Passport (Google OAuth) + JWT

**AI integration:** Google Gemini API via `@google/genai` (client-side in `services/geminiClient.ts`, server-side in `server/services/`)

**Key directories:**
- `src/pages/tools/` - Specialized tools (PaystubAnalyzer, NylonFabricDesigner, Mediscribe, etc.)
- `src/components/` - Reusable UI components
- `src/services/` - API clients and utilities
- `server/services/` - Backend services (AI agents, WebSocket)
- `server/migrations/` - Database schema migrations

## Code Patterns

- **Types-first**: Extend `src/types.ts` when adding/changing data shapes
- **Tailwind inline**: Use TailwindCSS classes inline, no separate CSS files for components
- **Aura Design System**: Custom color palette defined in `tailwind.config.ts`
- **API proxy**: Frontend `/api` requests proxy to backend :4000 via Vite config

## Environment Variables

Create `.env.local`:
```env
VITE_GEMINI_API_KEY=your_key
DATABASE_URL=postgresql://localhost/laundromatzat_dev
```

Backend also uses: `JWT_SECRET`, `NODE_ENV`, `PORT`, `SMTP_*` (for email notifications)

## Database

PostgreSQL required. Auto-creates tables on first backend start.
```bash
createdb laundromatzat_dev  # Create dev database
npm run backup              # Backup to server/backups/
```

## Testing Structure

- `tests/components/` - Component unit tests
- `tests/services/` - Service tests
- `tests/e2e/` - Playwright E2E tests
- `tests/setup.ts` - Vitest configuration
- `server/tests/` - Backend tests
