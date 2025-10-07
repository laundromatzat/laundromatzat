import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:5173', 'https://laundromatzat.com', 'https://www.laundromatzat.com'];

function parseOrigins(value: string | undefined): string[] {
  if (!value) {
    return DEFAULT_ALLOWED_ORIGINS;
  }

  return value
    .split(',')
    .map(origin => origin.trim())
    .filter(origin => origin.length > 0);
}

export const config = {
  port: Number.parseInt(process.env.PORT ?? '3001', 10),
  adminApiKey: process.env.MAILING_LIST_ADMIN_KEY ?? 'dev-admin-key-change-me',
  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
  allowedOrigins: parseOrigins(process.env.CORS_ORIGINS),
  storagePath: process.env.MAILING_LIST_STORAGE_PATH ?? path.resolve(process.cwd(), 'data', 'subscribers.json'),
  outboxPath: process.env.MAILING_LIST_OUTBOX_PATH ?? path.resolve(process.cwd(), 'data', 'outbox'),
  smtpUrl: process.env.MAILING_LIST_SMTP_URL,
  fromEmail: process.env.MAILING_LIST_FROM_EMAIL ?? 'updates@example.com',
};
