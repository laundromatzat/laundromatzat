
import { GoogleGenAI, Chat } from '@google/genai';
import { AI_SYSTEM_PROMPT } from '../constants';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // A simple way to handle the missing key in a development environment.
  // In a real app, you might have a more robust configuration check.
  console.warn("API_KEY environment variable not set. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export function createChatSession(): Chat {
  if (!API_KEY) {
    // Return a mock chat object if the API key is missing
    return {
      sendMessage: async () => ({ text: "AI is not configured. Please set the API_KEY." }),
      sendMessageStream: async function*() {
        yield { text: "AI is not configured." };
        yield { text: " Please set the API_KEY." };
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
