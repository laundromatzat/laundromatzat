import type { NextFunction, Request, Response } from 'express';
import { config } from '../utils/config';

export function requireAdminApiKey(req: Request, res: Response, next: NextFunction): void {
  const providedKey = req.header('x-api-key');

  if (!providedKey || providedKey !== config.adminApiKey) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
}
