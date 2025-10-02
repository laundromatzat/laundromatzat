
import { GoogleGenAI, ChatSession } from '@google/genai';
import { config } from '../utils/config';
import { AI_SYSTEM_PROMPT } from '../../constants';
import { PROJECTS } from '../../constants';

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

export class GeminiService {
  private readonly ai: GoogleGenAI;
  private chatSession: ChatSession | null = null;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Gemini API key is not configured.');
    }
    this.ai = new GoogleGenAI(apiKey);
  }

  private getChatSession(): ChatSession {
    if (this.chatSession) {
      return this.chatSession;
    }

    this.chatSession = this.ai.startChat({
      model: 'gemini-1.5-pro-latest',
      systemInstruction: `${AI_SYSTEM_PROMPT}\n${FUNCTION_INSTRUCTIONS}`,
    });

    return this.chatSession;
  }

  async generateContent(prompt: string): Promise<string> {
    try {
      const model = this.ai.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini generateContent failure:', error);
      throw error instanceof Error ? error : new Error('Failed to generate content with Gemini.');
    }
  }

  async sendMessage(message: string): Promise<string> {
    try {
      const chat = this.getChatSession();
      const result = await chat.sendMessage(message);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini chat failure:', error);
      throw error instanceof Error ? error : new Error('Failed to send chat message to Gemini.');
    }
  }
}

export const geminiService = new GeminiService(config.geminiApiKey);
