
import { GoogleGenAI, Chat } from '@google/genai';
import { AI_SYSTEM_PROMPT } from '../constants';
 
// Access the environment variable using Vite's import.meta.env
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;

if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  // A simple way to handle the missing key in a development environment.
  // In a real app, you might have a more robust configuration check.
  console.warn("VITE_GEMINI_API_KEY environment variable not set. AI features will be disabled.");
}

export function createChatSession(): Chat {
  // Check if the 'ai' instance was successfully created
  if (!ai) {
    // Return a mock chat object if the API key is missing or AI is not initialized
    return {
      sendMessage: async () => ({ text: "AI is not configured. Please set the VITE_GEMINI_API_KEY." }),
      sendMessageStream: async function*() {
        yield { text: "AI is not configured." };
        yield { text: " Please set the VITE_GEMINI_API_KEY." };
      }
    } as unknown as Chat;
  }

  const chat: Chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: AI_SYSTEM_PROMPT,
    },
  });
  return chat;
}
