
import { GoogleGenAI, type Chat } from '@google/genai';
import { config } from '../utils/config';
import { AI_SYSTEM_PROMPT } from '../../constants';

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

export class MissingGeminiApiKeyError extends Error {
  constructor() {
    super('Gemini API key is not configured. Please add GEMINI_API_KEY to your environment and restart the server.');
    this.name = 'MissingGeminiApiKeyError';
  }
}

export class GeminiService {
  private ai: GoogleGenAI | null = null;
  private chatSession: Chat | null = null;

  constructor(private readonly apiKey: string | undefined) {}

  private getClient(): GoogleGenAI {
    if (this.ai) {
      return this.ai;
    }

    if (!this.apiKey) {
      throw new MissingGeminiApiKeyError();
    }

    this.ai = new GoogleGenAI({ apiKey: this.apiKey });
    return this.ai;
  }

  private getChatSession(): Chat {
    if (this.chatSession) {
      return this.chatSession;
    }

    const client = this.getClient();

    this.chatSession = client.chats.create({
      model: 'gemini-1.5-pro-latest',
      config: {
        systemInstruction: {
          role: 'system',
          parts: [{ text: `${AI_SYSTEM_PROMPT}\n${FUNCTION_INSTRUCTIONS}` }],
        },
      },
    });

    return this.chatSession;
  }

  async generateContent(prompt: string): Promise<string> {
    try {
      const client = this.getClient();
      const response = await client.models.generateContent({
        model: 'gemini-1.5-pro-latest',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: {
            role: 'system',
            parts: [{ text: AI_SYSTEM_PROMPT }],
          },
        },
      });
      return response.text ?? '';
    } catch (error) {
      console.error('Gemini generateContent failure:', error);
      throw error instanceof Error ? error : new Error('Failed to generate content with Gemini.');
    }
  }

  async sendMessage(message: string): Promise<string> {
    try {
      const chat = this.getChatSession();
      const response = await chat.sendMessage({ message });
      return response.text ?? '';
    } catch (error) {
      console.error('Gemini chat failure:', error);
      throw error instanceof Error ? error : new Error('Failed to send chat message to Gemini.');
    }
  }
}

export const geminiService = new GeminiService(config.geminiApiKey);
