import { AI_SYSTEM_PROMPT } from '../constants';
import { ChatSessionLike } from './geminiClient';

const LOCAL_API_URL = import.meta.env.VITE_LOCAL_AI_URL || 'http://localhost:1234/v1';
const LOCAL_MODEL = import.meta.env.VITE_LOCAL_AI_MODEL || 'local-model';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

interface ChatCompletionChunk {
  choices: {
    delta: {
      content?: string;
    };
  }[];
}

async function fetchCompletion(messages: Message[], stream: boolean = false): Promise<Response> {
  const response = await fetch(`${LOCAL_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: LOCAL_MODEL,
      messages,
      stream,
    }),
  });

  if (!response.ok) {
    throw new Error(`Local AI API error: ${response.statusText}`);
  }

  return response;
}

export async function generateContentLocal(prompt: string, systemInstruction?: string): Promise<string> {
  const messages: Message[] = [
    { role: 'system', content: systemInstruction || AI_SYSTEM_PROMPT },
    { role: 'user', content: prompt },
  ];

  try {
    const response = await fetchCompletion(messages);
    const data = (await response.json()) as ChatCompletionResponse;
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Local AI generateContent failure:', error);
    throw error instanceof Error ? error : new Error('Failed to generate content with Local AI.');
  }
}

class LocalChatSession implements ChatSessionLike {
  private history: Message[];
  private systemInstruction: string;

  constructor(systemInstruction: string = AI_SYSTEM_PROMPT) {
    this.systemInstruction = systemInstruction;
    this.history = [];
  }

  async sendMessage(message: string): Promise<string> {
    this.history.push({ role: 'user', content: message });
    
    const messages: Message[] = [
      { role: 'system', content: this.systemInstruction },
      ...this.history
    ];

    try {
      const response = await fetchCompletion(messages);
      const data = (await response.json()) as ChatCompletionResponse;
      const reply = data.choices[0]?.message?.content || '';
      
      this.history.push({ role: 'assistant', content: reply });
      return reply;
    } catch (error) {
      console.error('Local AI chat failure:', error);
      throw error instanceof Error ? error : new Error('Failed to send chat message to Local AI.');
    }
  }

  async *sendMessageStream(message: string): AsyncIterable<{ text: string }> {
    this.history.push({ role: 'user', content: message });
    
    const messages: Message[] = [
      { role: 'system', content: this.systemInstruction },
      ...this.history
    ];

    try {
      const response = await fetchCompletion(messages, true);
      
      if (!response.body) throw new Error('Response body is null');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullReply = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '');
            if (dataStr === '[DONE]') continue;

            try {
              const data = JSON.parse(dataStr) as ChatCompletionChunk;
              const text = data.choices[0]?.delta?.content;
              if (text) {
                fullReply += text;
                yield { text };
              }
            } catch (e) {
              console.warn('Error parsing stream chunk', e);
            }
          }
        }
      }
      
      this.history.push({ role: 'assistant', content: fullReply });
    } catch (error) {
      console.error('Local AI chat stream failure:', error);
      throw error instanceof Error ? error : new Error('Failed to stream chat message from Local AI.');
    }
  }
}

export async function createLocalChatSession(systemInstruction?: string): Promise<ChatSessionLike> {
  return new LocalChatSession(systemInstruction);
}
