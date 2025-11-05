# Agent Instructions

These instructions apply to the entire repository. Read and follow them before making any changes.

## Gemini API requirements

The Gemini API recently introduced updated requirements for the official JavaScript/TypeScript SDK. When working on any Gemini-related functionality (frontend or backend) in this codebase:

- **Use the correct SDK** – depend on `@google/genai` (Google Gen AI SDK). Do **not** use deprecated packages such as `@google/generative-ai` or `@google-ai/generativelanguage`.
- **Instantiate the client properly** – create a `GoogleGenAI` instance (`const ai = new GoogleGenAI({});`) and rely on the `GEMINI_API_KEY` environment variable whenever possible. Passing the API key directly is acceptable but should remain the exception.
- **Call the current methods** – invoke model operations through `ai.models.*` (`ai.models.generateContent`, `ai.models.generateContentStream`, etc.). Avoid legacy helpers like `getGenerativeModel`, `generateContent`, `generateContentStream`, or `generationConfig` objects.
- **Prefer current model names** – default to the latest production-ready models such as `gemini-2.5-flash` for general or multimodal tasks, `gemini-2.5-pro` for complex reasoning or coding, `imagen-4.0-*` for image generation, `gemini-2.5-flash-image-preview` for image editing, and `veo-3.0-*-preview` for video generation. Do **not** target deprecated models (for example `gemini-1.5-*` or `gemini-pro`).
- **Work with updated types and errors** – refer to responses as `GenerateContentResponse` and handle errors using `ApiError`. Legacy type names like `GenerateContentResult` or `GoogleGenAIError` are outdated.
- **Review the upstream guidelines** – confirm details against the official instructions whenever you touch Gemini-related code: <https://github.com/googleapis/js-genai/blob/main/codegen_instructions.md>. If the upstream document changes, mirror relevant updates here.

If your change introduces new Gemini interactions, update this file (and any related documentation) so future contributors stay aligned with the current API guidance.
