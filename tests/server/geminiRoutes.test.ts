import express from 'express';
import type { Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { createGeminiRouter } from '../../server/routes/geminiRoutes';
import { GeminiService } from '../../server/services/geminiService';

describe('Gemini routes without API key', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    const service = new GeminiService('');
    app.use('/api', createGeminiRouter(service));

    server = app.listen(0);
    await new Promise<void>((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });

    const address = server.address();
    if (typeof address === 'object' && address) {
      baseUrl = `http://127.0.0.1:${address.port}`;
    } else {
      throw new Error('Failed to determine server address');
    }
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close(error => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  });

  test('returns friendly error when GEMINI_API_KEY is missing', async () => {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'Hello?' }),
    });

    expect(response.status).toBe(503);
    const payload = await response.json();
    expect(payload).toEqual({
      error: 'Gemini API key is not configured. Please add GEMINI_API_KEY to your environment and restart the server.',
    });
  });
});
