import { GoogleGenAI, Chat } from '@google/genai';
import { AI_SYSTEM_PROMPT } from '../constants';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;

if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.warn("VITE_GEMINI_API_KEY environment variable not set. AI features will be disabled.");
}

export function createChatSession(): Chat | null {
  if (!ai) {
    return null;
  }

  const chat: Chat = ai.chats.create({
    model: 'gemini-1.5-flash-latest',
    config: {
      systemInstruction: AI_SYSTEM_PROMPT,
    },
  });
  return chat;
}
