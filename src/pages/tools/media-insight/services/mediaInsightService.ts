/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, Emotion, MediaType } from "../types";

const parseJson = (text: string) => {
  try {
    // Remove markdown code blocks
    let cleanText = text.replace(/```json\n?|```\n?/g, "").trim();

    // Remove any text before the first { or [
    const firstBrace = cleanText.indexOf("{");
    const firstBracket = cleanText.indexOf("[");
    const start =
      firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)
        ? firstBrace
        : firstBracket;

    if (start !== -1) {
      cleanText = cleanText.substring(start);
    }

    // Remove any text after the last } or ]
    const lastBrace = cleanText.lastIndexOf("}");
    const lastBracket = cleanText.lastIndexOf("]");
    const end = lastBrace > lastBracket ? lastBrace : lastBracket;

    if (end !== -1) {
      cleanText = cleanText.substring(0, end + 1);
    }

    // Try to parse
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("Failed to parse JSON response:", e);
    console.error("Raw text:", text);
    // Return a minimal valid response
    return {
      summary: "Analysis completed but response format was invalid",
      type: "image",
      visualElements: ["Unable to parse detailed analysis"],
      tags: ["error"],
    };
  }
};

// Get model configuration from localStorage
const getModelConfig = () => {
  const useLocal =
    localStorage.getItem("mediainsight_use_local_model") === "true";
  const endpoint =
    localStorage.getItem("mediainsight_local_endpoint") ||
    "http://localhost:1234/v1";
  return { useLocal, endpoint };
};

// Analyze using local OpenAI-compatible model (LM Studio, Ollama, etc.)
const analyzeWithLocalModel = async (
  base64Data: string,
  mimeType: string,
  mediaType: MediaType,
  originalName: string,
  endpoint: string,
  chatModel: string,
  visionModel: string
): Promise<AnalysisResult> => {
  const prompt = buildPrompt(mediaType, originalName);

  // Use the appropriate model based on media type
  const modelToUse =
    mediaType === "image" || mediaType === "video" ? visionModel : chatModel;

  // Ensure endpoint has /v1 suffix - LM Studio needs this
  const baseEndpoint = endpoint.replace(/\/v1$/, "") + "/v1";

  try {
    // Build the content array - standard OpenAI vision format
    const content: Array<{
      type: string;
      text?: string;
      image_url?: { url: string };
    }> = [
      {
        type: "text",
        text:
          prompt + "\n\nRespond with ONLY valid JSON, no markdown formatting.",
      },
    ];

    // Add image for vision models using standard OpenAI format
    if (mediaType === "image" || mediaType === "video") {
      content.push({
        type: "image_url",
        image_url: {
          url: `data:${mimeType};base64,${base64Data}`,
        },
      });
    }

    const response = await fetch(`${baseEndpoint}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          {
            role: "user",
            content: content,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Local model request failed: ${response.statusText}. ${errorText}`
      );
    }

    const data = await response.json();
    const responseContent = data.choices?.[0]?.message?.content;

    if (!responseContent) {
      throw new Error("No response from local model");
    }

    return { ...parseJson(responseContent), type: mediaType };
  } catch (error) {
    console.error("Local Model Analysis Error:", error);
    throw new Error(
      `Failed to connect to local model at ${baseEndpoint}. Make sure LM Studio is running with a vision model loaded. Error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

// Build prompt based on media type
const buildPrompt = (mediaType: MediaType, originalName: string): string => {
  let prompt = `Analyze this ${mediaType} file named "${originalName}". 
You are an expert file organizer. Your goal is to make this file easy to find in the future.
1. Suggest a clear, descriptive filename (lowercase, underscores, no spaces, keep original extension). Be specific but concise (e.g., "vacation_photo_beach.jpg" instead of "img_123.jpg").
2. Identify 3-5 relevant tags for Finder/File Explorer organization (e.g., "work", "invoice", "receipt", "landscape", "personal").
3. Provide a concise summary of the content.`;

  if (mediaType === "image") {
    prompt += `
Specifically for this IMAGE:
1. Describe key visual elements.
2. Extract any visible text (OCR) that is important for context.
3. Determine the mood/atmosphere.

Respond in JSON format:
{
  "summary": "string",
  "visualElements": ["string"],
  "detectedText": ["string"],
  "mood": "string",
  "suggestedName": "string",
  "tags": ["string", ...],
  "type": "image"
}`;
  } else if (mediaType === "video") {
    prompt += `
Specifically for this VIDEO:
1. Provide a concise summary of the event/action.
2. Break down into chronological segments with timestamps and visual descriptions.

Respond in JSON format:
{
  "summary": "string",
  "suggestedName": "string",
  "tags": ["string", ...],
  "segments": [
    {
      "timestamp": "string",
      "description": "string",
      "transcript": "string (optional)",
      "speaker": "string (optional)"
    }
  ],
  "type": "video"
}`;
  } else {
    prompt += `
Specifically for this AUDIO:
1. Provide a transcription with speaker identification and timestamps.
2. Detect the primary language.
3. Analyze the emotion/tone.

Respond in JSON format:
{
  "summary": "string",
  "suggestedName": "string",
  "tags": ["string", ...],
  "segments": [
    {
      "speaker": "string",
      "timestamp": "string",
      "content": "string",
      "language": "string",
      "emotion": "Happy|Sad|Angry|Neutral"
    }
  ],
  "type": "audio"
}`;
  }

  return prompt;
};

// Analyze using Gemini API
const analyzeWithGemini = async (
  base64Data: string,
  mimeType: string,
  mediaType: MediaType,
  originalName: string
): Promise<AnalysisResult> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Gemini API Key is missing. Please add VITE_GEMINI_API_KEY to your .env file or switch to local model in settings."
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelId = "gemini-2.0-flash-exp";

  let prompt = `Analyze this ${mediaType} file named "${originalName}". 
  Provide a suggested descriptive filename (lowercase, underscores, no spaces, keep extension).
  Identify 3-5 tags for local file organization.`;

  let responseSchema: {
    type: Type;
    properties: Record<string, unknown>;
    required: string[];
  } = {
    type: Type.OBJECT,
    properties: {},
    required: [],
  };

  if (mediaType === "image") {
    prompt += `
      1. Summary of contents.
      2. Key visual elements.
      3. Detected text.
      4. Mood.
    `;
    responseSchema = {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING },
        visualElements: { type: Type.ARRAY, items: { type: Type.STRING } },
        detectedText: { type: Type.STRING },
        mood: { type: Type.STRING },
        suggestedName: { type: Type.STRING },
        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
        type: { type: Type.STRING, enum: ["image"] },
      },
      required: ["summary", "visualElements", "suggestedName", "type"],
    };
  } else if (mediaType === "video") {
    prompt += `
      1. Concise summary.
      2. Chronological segments with timestamps and visual descriptions.
    `;
    responseSchema = {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING },
        suggestedName: { type: Type.STRING },
        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
        segments: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              timestamp: { type: Type.STRING },
              description: { type: Type.STRING },
              transcript: { type: Type.STRING },
              speaker: { type: Type.STRING },
            },
            required: ["timestamp", "description"],
          },
        },
        type: { type: Type.STRING, enum: ["video"] },
      },
      required: ["summary", "segments", "suggestedName", "type"],
    };
  } else {
    prompt += `
      1. Transcription with speaker identification and timestamps.
      2. Language detection.
      3. Emotion analysis.
    `;
    responseSchema = {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING },
        suggestedName: { type: Type.STRING },
        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
        segments: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              speaker: { type: Type.STRING },
              timestamp: { type: Type.STRING },
              content: { type: Type.STRING },
              language: { type: Type.STRING },
              emotion: { type: Type.STRING, enum: Object.values(Emotion) },
            },
            required: ["speaker", "timestamp", "content", "emotion"],
          },
        },
        type: { type: Type.STRING, enum: ["audio"] },
      },
      required: ["summary", "segments", "suggestedName", "type"],
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    return { ...parseJson(response.text), type: mediaType };
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

// Main export - routes to appropriate service based on settings
export const analyzeMedia = async (
  base64Data: string,
  mimeType: string,
  mediaType: MediaType,
  originalName: string
): Promise<AnalysisResult> => {
  const { useLocal, endpoint } = getModelConfig();

  if (useLocal) {
    // Configure LocalLlmService with settings
    const chatModel =
      localStorage.getItem("mediainsight_local_chat_model") ||
      "phi-3-mini-4k-instruct";
    const visionModel =
      localStorage.getItem("mediainsight_local_vision_model") ||
      "llava-phi-3-mini";

    // We can't easily import from '../../../../services/LocalLlmService' due to module resolution if not configured,
    // but assuming standard Vite path aliasing or relative paths work:
    // Actually, let's keep the existing logic for now but Update it to use the configured models
    // To properly use the robust features, we'd ideally use the service we created.
    // For this step, I will enhance `analyzeWithLocalModel` to respect the model names.

    return analyzeWithLocalModel(
      base64Data,
      mimeType,
      mediaType,
      originalName,
      endpoint,
      chatModel,
      visionModel
    );
  } else {
    return analyzeWithGemini(base64Data, mimeType, mediaType, originalName);
  }
};
