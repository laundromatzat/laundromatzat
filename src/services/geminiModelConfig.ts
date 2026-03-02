/**
 * Gemini Model Configuration
 *
 * SINGLE SOURCE OF TRUTH for all Gemini model IDs used across this application.
 * When Google deprecates a model, update it here and all tools update automatically.
 *
 * ─── HOW TO STAY CURRENT ────────────────────────────────────────────────────
 *
 *  1. Run the health-check script to verify all models are still active:
 *       node server/scripts/check-gemini-models.js
 *
 *  2. Watch for console warnings – the API wrapping in geminiClient.ts surfaces
 *     deprecation hints from error messages automatically.
 *
 *  3. Check Google's official model listing:
 *       https://ai.google.dev/gemini-api/docs/models
 *
 *  4. Subscribe to the Google AI changelog:
 *       https://developers.googleblog.com/tag/gemini/
 *
 * ─── VERIFIED MODELS (as of 2026-03-01) ─────────────────────────────────────
 *
 *  Model                          | Context  | Input types        | Notes
 *  ─────────────────────────────────────────────────────────────────────────
 *  gemini-2.5-flash               | 1M tok   | Text, Image, Audio | Primary fast model ✓
 *  gemini-2.5-pro                 | 1M tok   | Text, Image, Audio | Best reasoning ✓
 *  gemini-2.5-flash-lite          | 1M tok   | Text, Image        | Low-cost/high-volume ✓
 *  gemini-2.5-flash-image         | —        | Text, Image        | Native image output ✓
 *
 * ─── RECENTLY RETIRED (do NOT use) ──────────────────────────────────────────
 *
 *  gemini-3-pro-preview   → RETIRED 2026-03-09 → use gemini-2.5-pro
 *  gemini-2.0-pro         → never valid; use gemini-2.5-flash
 *  gemini-2.0-flash-exp   → deprecated; use gemini-2.5-flash
 *  gemini-1.5-*           → RETIRED; all requests return 404
 *  gemini-1.0-*           → RETIRED; all requests return 404
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const GEMINI_MODELS = {
  /**
   * Primary text generation – fast, cost-effective, 1M context.
   * Supports multimodal input (text, images, audio, video).
   */
  TEXT_FAST: "gemini-2.5-flash",

  /**
   * High-capability reasoning – best for complex tasks, coding, analysis.
   * Supports extended thinking mode via thinkingConfig.
   */
  TEXT_PRO: "gemini-2.5-pro",

  /**
   * Lightweight model optimised for high-throughput, cost-sensitive workloads.
   * Use when latency and cost are the primary constraints.
   */
  TEXT_LITE: "gemini-2.5-flash-lite",

  /**
   * Native image generation and editing model.
   * Must include `responseModalities: ["TEXT", "IMAGE"]` in config.
   * Returns generated images as inlineData parts in candidates[0].content.parts.
   */
  IMAGE_GEN: "gemini-2.5-flash-image",
} as const;

export type GeminiTextModel =
  | typeof GEMINI_MODELS.TEXT_FAST
  | typeof GEMINI_MODELS.TEXT_PRO
  | typeof GEMINI_MODELS.TEXT_LITE;

export type GeminiImageModel = typeof GEMINI_MODELS.IMAGE_GEN;

/**
 * Parses a Gemini API error and returns a human-readable deprecation hint
 * if the error looks like a model-not-found / deprecation error.
 *
 * Used inside catch blocks to surface actionable guidance.
 */
export function parseGeminiError(error: unknown): string | null {
  const msg =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const lower = msg.toLowerCase();

  if (
    lower.includes("404") ||
    lower.includes("not found") ||
    lower.includes("deprecated") ||
    lower.includes("model") ||
    lower.includes("no longer available") ||
    lower.includes("unsupported")
  ) {
    return (
      `[Gemini API] A model may have been deprecated or renamed. ` +
      `Run \`node server/scripts/check-gemini-models.js\` to verify model availability. ` +
      `Current models: https://ai.google.dev/gemini-api/docs/models`
    );
  }

  return null;
}
