
import { Router } from 'express';
import { GeminiService, MissingGeminiApiKeyError } from '../services/geminiService';

export function createGeminiRouter(service: GeminiService): Router {
  const router = Router();

  router.post('/chat', async (req, res) => {
    try {
      const { message } = req.body;
      if (typeof message !== 'string') {
        return res.status(400).json({ error: 'Message must be a string.' });
      }

      const responseText = await service.sendMessage(message);
      res.json({ message: responseText });

    } catch (error) {
      console.error('Gemini chat error:', error);
      if (error instanceof MissingGeminiApiKeyError) {
        return res.status(503).json({ error: error.message });
      }
      res.status(500).json({
        error: error instanceof Error ? error.message : 'An unexpected error occurred.',
      });
    }
  });

  router.post('/generate-content', async (req, res) => {
    try {
      const { prompt } = req.body;
      if (typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Prompt must be a string.' });
      }

      const responseText = await service.generateContent(prompt);
      res.json({ content: responseText });

    } catch (error) {
      console.error('Gemini generateContent error:', error);
      if (error instanceof MissingGeminiApiKeyError) {
        return res.status(503).json({ error: error.message });
      }
      res.status(500).json({
        error: error instanceof Error ? error.message : 'An unexpected error occurred.',
      });
    }
  });

  return router;
}
