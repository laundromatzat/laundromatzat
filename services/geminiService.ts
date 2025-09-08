
import { Project } from '../types';
import { GoogleGenAI, Chat } from '@google/genai';
import { AI_SYSTEM_PROMPT } from '../constants';
import { PROJECTS } from '../constants';

/**
 * Local deterministic search so Gemini never hallucinates.
 * Looks for the query string in title, description, date, location, or tags.
 */
export function searchProjects(query: string): Project[] {
  const q = (query || '').toLowerCase();
  if (!q) return [];
  return PROJECTS.filter((p) => {
    const haystack = [
      p.title,
      p.description,
      p.date,
      p.location,
      (p.tags || []).join(' '),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

// For Node.js environment variables:
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

  // Build a lightweight list of project metadata to ground Gemini’s responses
  const projectSummaries = PROJECTS.map(
    ({ id, type, title, description, date, location, tags }) => ({
      id,
      type,
      title,
      description,
      date,
      location,
      tags,
    })
  );

  const FUNCTION_INSTRUCTIONS = `
Available function:
  • searchProjects(query: string) → returns matching project objects.

When a user asks to find or filter projects, respond **only** with JSON in this exact shape:

{ "name": "searchProjects", "arguments": { "query": "<their search phrase>" } }

Do not add any other keys, prose, or code‑fences.`;

  const chat: Chat = ai!.chats.create({
    model: 'gemini-1.5-flash-latest',
    config: {
      systemInstruction: `${AI_SYSTEM_PROMPT}\n${FUNCTION_INSTRUCTIONS}`,
    },
  });
  return chat;
}
