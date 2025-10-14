import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as geminiClient from '../../services/geminiClient';

declare global {
  // eslint-disable-next-line no-var
  var fetch: typeof fetch | undefined;
}

describe('geminiClient', () => {
  const originalFetch = global.fetch;
  let fetchMock: vi.Mock;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.restoreAllMocks();
    global.fetch = originalFetch;
  });

  it('posts chat messages and returns the parsed response', async () => {
    const json = vi.fn().mockResolvedValue({ message: 'Hello there' });
    const response = { ok: true, json } as unknown as Response;
    fetchMock.mockResolvedValue(response);

    await expect(geminiClient.sendMessage('Hi')).resolves.toBe('Hello there');
    expect(global.fetch).toHaveBeenCalledWith('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hi' }),
    });
  });

  it('throws informative errors when chat requests fail', async () => {
    const json = vi.fn().mockResolvedValue({ error: 'Nope' });
    const response = { ok: false, status: 500, json } as unknown as Response;
    fetchMock.mockResolvedValue(response);

    await expect(geminiClient.sendMessage('Hi')).rejects.toThrow('Nope');
  });

  it('posts content requests and returns generated text', async () => {
    const json = vi.fn().mockResolvedValue({ content: 'A story' });
    const response = { ok: true, json } as unknown as Response;
    fetchMock.mockResolvedValue(response);

    await expect(geminiClient.generateContent('Write something')).resolves.toBe('A story');
    expect(global.fetch).toHaveBeenCalledWith('/api/generate-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Write something' }),
    });
  });

  it('createChatSession proxies through sendMessage and wraps streaming', async () => {
    const json = vi.fn()
      .mockResolvedValueOnce({ message: 'Stream chunk' })
      .mockResolvedValueOnce({ message: 'Stream chunk' });
    const response = { ok: true, json } as unknown as Response;
    fetchMock.mockResolvedValue(response);

    const session = await geminiClient.createChatSession();
    await expect(session.sendMessage('direct')).resolves.toBe('Stream chunk');

    const chunks: string[] = [];
    for await (const chunk of session.sendMessageStream('streamed')) {
      chunks.push(chunk.text);
    }
    expect(chunks).toEqual(['Stream chunk']);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(json).toHaveBeenCalledTimes(2);
  });
});
