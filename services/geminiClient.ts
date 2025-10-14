async function handleResponse(response: Response): Promise<string> {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(errorBody.error || `HTTP error! Status: ${response.status}`);
  }

  const data = await response.json() as { message?: string; content?: string };
  if ('message' in data && typeof data.message === 'string') {
    return data.message;
  }

  if ('content' in data && typeof data.content === 'string') {
    return data.content;
  }

  throw new Error('Unexpected response shape from Gemini service.');
}

export async function sendMessage(message: string): Promise<string> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Failed to send message:', error);
    throw error instanceof Error ? error : new Error('Could not connect to the assistant. Please try again later.');
  }
}

export interface ChatSessionLike {
  sendMessage(message: string): Promise<string>;
  sendMessageStream(message: string): AsyncIterable<{ text: string }>;
}

export type ClientChatSession = ChatSessionLike;

export async function generateContent(prompt: string): Promise<string> {
  try {
    const response = await fetch('/api/generate-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Failed to generate content:', error);
    throw error instanceof Error ? error : new Error('Could not reach the content generation service. Please try again later.');
  }
}

export async function createChatSession(): Promise<ChatSessionLike> {
  return {
    sendMessage: (message: string) => sendMessage(message),
    async *sendMessageStream(message: string) {
      const text = await sendMessage(message);
      yield { text };
    },
  } satisfies ChatSessionLike;
}

export { handleResponse };
