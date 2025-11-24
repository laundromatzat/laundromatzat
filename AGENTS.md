# Agent Instructions

These instructions apply to the entire repository. Read and follow them before making any changes.

## Gemini API requirements

The Gemini API requirements for the official JavaScript/TypeScript SDK apply to this project:

- **Use the correct SDK** – depend on `@google/genai` (Google Gen AI SDK).
- **Instantiate the client properly** – create a `GoogleGenAI` instance and rely on the `VITE_GEMINI_API_KEY` environment variable.
- **Call the current methods** – invoke model operations through `ai.models.*`.
- **Prefer current model names** – default to `gemini-2.5-flash` for general tasks.
- **Work with updated types and errors** – refer to responses as `GenerateContentResponse` and handle errors using `ApiError`.

## Architecture

This is a **static** React application.
- Do NOT introduce backend servers (Express, etc.).
- All data should be fetched from `data/projects.json` or external APIs directly from the client.
- Complex logic should be handled client-side or mocked if necessary.
