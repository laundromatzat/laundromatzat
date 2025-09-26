import { Router } from 'express';
import { MailingListService } from '../services/mailingListService';
import { requireAdminApiKey } from '../middleware/apiKeyAuth';

export function createMailingListRouter(service: MailingListService): Router {
  const router = Router();

  router.post('/subscribe', async (req, res) => {
    try {
      const subscriber = await service.subscribe({
        email: req.body?.email,
        name: req.body?.name,
      });

      res.status(201).json({
        id: subscriber.id,
        email: subscriber.email,
        name: subscriber.name,
        subscribedAt: subscriber.subscribedAt,
      });
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Unable to subscribe at this time.',
      });
    }
  });

  router.get('/subscribers', requireAdminApiKey, async (_req, res) => {
    try {
      const subscribers = await service.listSubscribers();
      res.json({ subscribers });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unable to load subscribers.',
      });
    }
  });

  router.delete('/subscribers/:id', requireAdminApiKey, async (req, res) => {
    try {
      await service.unsubscribe(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(404).json({
        error: error instanceof Error ? error.message : 'Subscriber not found.',
      });
    }
  });

  router.post('/updates', requireAdminApiKey, async (req, res) => {
    try {
      const result = await service.sendBatchUpdate({
        subject: req.body?.subject,
        text: req.body?.text,
        html: req.body?.html,
      });

      res.status(202).json(result);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Unable to send update.',
      });
    }
  });

  return router;
}
