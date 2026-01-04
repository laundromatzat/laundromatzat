# Agent Instructions

These instructions apply to the entire repository. Read and follow them before making any changes.

## Gemini API requirements

The Gemini API requirements for the official JavaScript/TypeScript SDK apply to this project:

- **Use the correct SDK** – depend on `@google/genai` (Google Gen AI SDK).
- **Instantiate the client properly** – create a `GoogleGenAI` instance and rely on the `VITE_GEMINI_API_KEY` environment variable.
- **Call the current methods** – invoke model operations through `ai.models.*`.
- **Prefer current model names** – default to `gemini-2.5-flash` for general tasks.
- **Work with updated types and errors** – refer to responses as `GenerateContentResponse` and handle errors using `ApiError`.

## Workflow & Quality Control

This project uses **Husky** and **lint-staged** to enforce code quality.

- **Pre-commit checks**: `eslint` scans all staged `.ts` and `.tsx` files.
- **Accessibility**: Accessibility rules (`jsx-a11y`) are enforced.
- **Action**: Always run `npm run lint` before attempting to commit. If `lint-staged` fails, the commit will be blocked. Fix errors before retrying.

## Architecture

This is a **static** React application.

- Do NOT introduce backend servers (Express, etc.).
- All data should be fetched from `data/projects.json` or external APIs directly from the client.
- Complex logic should be handled client-side or mocked if necessary.
