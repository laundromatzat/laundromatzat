import { GoogleGenAI, type Chat } from "@google/genai";
import { AI_SYSTEM_PROMPT } from "@/constants";
import { generateContentLocal, createLocalChatSession } from "./localAIClient";

const FUNCTION_INSTRUCTIONS = `
Available function:
  • searchProjects(query: string, opts?: { type?: 'Video'|'Photo'|'Cinemagraph', dateFrom?: string, dateTo?: string, includeTags?: string[], excludeTags?: string[] }) → returns matching project objects.

When a user asks to find or filter projects, respond **only** with JSON in this exact shape:

{ "name": "searchProjects", "arguments": { "query": "<their search phrase>", "opts": { /* optional filters */ } } }

Rules:
- Use type when they specify media (e.g., "videos", "photos", "cinemagraphs").
- Use dateFrom/dateTo for ranges like "in 2024" (dateFrom: "01/2024", dateTo: "12/2024") or "since 2019" (dateFrom: "2019").
- Use includeTags for explicit names in the corpus (e.g., ["Michael"], ["Bernal Heights Park"])
- Use excludeTags if they say things like "not Michael".
- Keep other text in query; geo/alias expansion is handled locally.

Examples:
{ "name": "searchProjects", "arguments": { "query": "hawaii", "opts": { "type": "Video" } } }
{ "name": "searchProjects", "arguments": { "query": "bernal sunset", "opts": { "type": "Cinemagraph" } } }
{ "name": "searchProjects", "arguments": { "query": "alaska", "opts": { "dateFrom": "06/2023", "dateTo": "07/2023" } } }
{ "name": "searchProjects", "arguments": { "query": "beach", "opts": { "includeTags": ["Michael"] } } }

Do not add any other keys, prose, or code‑fences.`;

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const AI_PROVIDER = import.meta.env.VITE_AI_PROVIDER || "gemini";

function getClient(): GoogleGenAI {
  if (!API_KEY) {
    throw new Error(
      "Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your environment variables.",
    );
  }
  return new GoogleGenAI({ apiKey: API_KEY });
}

export interface ChatSessionLike {
  sendMessage(message: string): Promise<string>;
  sendMessageStream(message: string): AsyncIterable<{ text: string }>;
}

export type ClientChatSession = ChatSessionLike;

export async function generateContent(prompt: string): Promise<string> {
  if (AI_PROVIDER === "local") {
    return generateContentLocal(prompt, AI_SYSTEM_PROMPT);
  }

  try {
    const client = getClient();
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: {
          role: "system",
          parts: [{ text: AI_SYSTEM_PROMPT }],
        },
      },
    });
    return response.text ?? "";
  } catch (error) {
    console.error("Gemini generateContent failure:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to generate content with Gemini.");
  }
}

export async function sendMessage(message: string): Promise<string> {
  try {
    const session = await createChatSession();
    return await session.sendMessage(message);
  } catch (error) {
    console.error("Failed to send message:", error);
    throw error instanceof Error
      ? error
      : new Error(
          "Could not connect to the assistant. Please try again later.",
        );
  }
}

class ClientChatSessionImpl implements ChatSessionLike {
  private chat: Chat;

  constructor(chat: Chat) {
    this.chat = chat;
  }

  async sendMessage(message: string): Promise<string> {
    try {
      const response = await this.chat.sendMessage({ message });
      return response.text ?? "";
    } catch (error) {
      console.error("Gemini chat failure:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to send chat message to Gemini.");
    }
  }

  async *sendMessageStream(message: string): AsyncIterable<{ text: string }> {
    try {
      const result = await this.chat.sendMessageStream({ message });
      for await (const chunk of result) {
        const text = chunk.text;
        if (text) {
          yield { text };
        }
      }
    } catch (error) {
      console.error("Gemini chat stream failure:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to stream chat message from Gemini.");
    }
  }
}

export async function createChatSession(): Promise<ChatSessionLike> {
  if (AI_PROVIDER === "local") {
    return createLocalChatSession(
      `${AI_SYSTEM_PROMPT}\n${FUNCTION_INSTRUCTIONS}`,
    );
  }

  const client = getClient();
  const chat = client.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: {
        role: "system",
        parts: [{ text: `${AI_SYSTEM_PROMPT}\n${FUNCTION_INSTRUCTIONS}` }],
      },
    },
  });

  return new ClientChatSessionImpl(chat);
}

/**
 * Generate images using Gemini Imagen (nano-banana model)
 * @param prompts Array of text prompts to generate images from
 * @returns Array of base64-encoded image data URLs
 */
export async function generateImages(prompts: string[]): Promise<string[]> {
  if (AI_PROVIDER === "local") {
    throw new Error("Image generation is not supported with local AI provider");
  }

  // Temporary placeholder implementation
  // Imagen API requires specific setup and may not be available in all regions
  console.warn(
    "Using placeholder images. Imagen API setup required for actual image generation.",
  );

  return prompts.map((prompt, index) => {
    const titles = [
      "Cutting Pattern Layout",
      "Hand-Sewing Assembly",
      "Finished Product",
    ];
    const title = titles[index] || `Image ${index + 1}`;

    // Create a simple but informative SVG placeholder
    const svg = `<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad${index}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="800" height="450" fill="url(#grad${index})"/>
      <rect x="50" y="50" width="700" height="350" fill="white" opacity="0.1" rx="10"/>
      <text x="400" y="200" font-family="Arial, sans-serif" font-size="32" fill="white" text-anchor="middle" font-weight="bold">
        ${title}
      </text>
      <text x="400" y="240" font-family="Arial, sans-serif" font-size="16" fill="white" text-anchor="middle" opacity="0.9">
        ${prompt.slice(0, 60)}${prompt.length > 60 ? "..." : ""}
      </text>
      <text x="400" y="280" font-family="Arial, sans-serif" font-size="14" fill="white" text-anchor="middle" opacity="0.7">
        Image generation requires Imagen API setup
      </text>
    </svg>`;

    return `data:image/svg+xml;base64,${btoa(svg)}`;
  });
}
