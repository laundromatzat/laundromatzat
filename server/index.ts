import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import nodemailer from 'nodemailer';
import { createMailingListRouter } from './routes/mailingListRoutes';
import { MailingListService } from './services/mailingListService';
import { config } from './utils/config';

import { createGeminiRouter } from './routes/geminiRoutes';
import { geminiService } from './services/geminiService';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || config.allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Not allowed by CORS'));
    },
  }),
);
app.use(express.json({ limit: '10kb' }));

const subscribeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

const mailTransport = config.smtpUrl
  ? nodemailer.createTransport(config.smtpUrl)
  : nodemailer.createTransport({ jsonTransport: true });

const mailingListService = new MailingListService({
  storagePath: config.storagePath,
  outboxPath: config.outboxPath,
  mailer: mailTransport,
  fromEmail: config.fromEmail,
});

app.use('/api/subscribe', subscribeLimiter);
app.use('/api', createMailingListRouter(mailingListService));
app.use('/api', createGeminiRouter(geminiService));

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // eslint-disable-next-line no-console
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Mailing list server is running on port ${config.port}`);
});
