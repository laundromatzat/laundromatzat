import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import nodemailer from 'nodemailer';
import { z } from 'zod';

const subscribeInputSchema = z.object({
  email: z.string().trim().email(),
  name: z
    .string()
    .trim()
    .min(1, 'Name must contain at least one character if provided.')
    .max(120, 'Name must be 120 characters or fewer.')
    .optional(),
});

const batchUpdateSchema = z
  .object({
    subject: z.string().trim().min(1, 'Subject is required.').max(200, 'Subject must be 200 characters or fewer.'),
    html: z.string().trim().optional(),
    text: z.string().trim().optional(),
  })
  .refine(data => Boolean(data.html || data.text), {
    message: 'Either HTML or plain text content must be provided.',
    path: ['html'],
  });

const subscriberSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  subscribedAt: z.string(),
});

export type Subscriber = z.infer<typeof subscriberSchema>;
export type SubscribeInput = z.infer<typeof subscribeInputSchema>;
export type BatchUpdateInput = z.infer<typeof batchUpdateSchema>;

interface MailingListServiceOptions {
  storagePath: string;
  outboxPath: string;
  mailer: nodemailer.Transporter;
  fromEmail: string;
}

export class MailingListService {
  private readonly storagePath: string;
  private readonly outboxPath: string;
  private readonly mailer: nodemailer.Transporter;
  private readonly fromEmail: string;

  constructor(options: MailingListServiceOptions) {
    this.storagePath = options.storagePath;
    this.outboxPath = options.outboxPath;
    this.mailer = options.mailer;
    this.fromEmail = options.fromEmail;

    this.ensureStorage();
  }

  private ensureStorage(): void {
    const storageDir = path.dirname(this.storagePath);
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    if (!fs.existsSync(this.storagePath)) {
      fs.writeFileSync(this.storagePath, '[]', { encoding: 'utf-8' });
    }

    if (!fs.existsSync(this.outboxPath)) {
      fs.mkdirSync(this.outboxPath, { recursive: true });
    }
  }

  private async readSubscribers(): Promise<Subscriber[]> {
    const contents = await fsp.readFile(this.storagePath, { encoding: 'utf-8' });
    const parsed = JSON.parse(contents) as unknown;
    const result = z.array(subscriberSchema).safeParse(parsed);

    if (!result.success) {
      throw new Error('Subscriber storage is corrupted.');
    }

    return result.data;
  }

  private async writeSubscribers(subscribers: Subscriber[]): Promise<void> {
    await fsp.writeFile(this.storagePath, JSON.stringify(subscribers, null, 2), {
      encoding: 'utf-8',
    });
  }

  private formatRecipient(subscriber: Subscriber): string {
    if (subscriber.name) {
      return `${subscriber.name} <${subscriber.email}>`;
    }

    return subscriber.email;
  }

  async subscribe(input: SubscribeInput): Promise<Subscriber> {
    const payload = subscribeInputSchema.parse(input);
    const normalizedEmail = payload.email.trim().toLowerCase();
    const normalizedName = payload.name?.trim();

    const subscribers = await this.readSubscribers();
    const alreadySubscribed = subscribers.some(subscriber => subscriber.email.toLowerCase() === normalizedEmail);

    if (alreadySubscribed) {
      throw new Error('You are already subscribed to the mailing list.');
    }

    const newSubscriber: Subscriber = {
      id: randomUUID(),
      email: normalizedEmail,
      name: normalizedName,
      subscribedAt: new Date().toISOString(),
    };

    subscribers.push(newSubscriber);
    await this.writeSubscribers(subscribers);

    return newSubscriber;
  }

  async listSubscribers(): Promise<Subscriber[]> {
    const subscribers = await this.readSubscribers();
    return subscribers;
  }

  async unsubscribe(id: string): Promise<void> {
    const subscribers = await this.readSubscribers();
    const nextSubscribers = subscribers.filter(subscriber => subscriber.id !== id);

    if (nextSubscribers.length === subscribers.length) {
      throw new Error('Subscriber not found.');
    }

    await this.writeSubscribers(nextSubscribers);
  }

  async sendBatchUpdate(input: BatchUpdateInput): Promise<{ recipientCount: number; messageId?: string }> {
    const payload = batchUpdateSchema.parse(input);
    const subscribers = await this.readSubscribers();

    if (subscribers.length === 0) {
      throw new Error('There are no subscribers to notify.');
    }

    const info = await this.mailer.sendMail({
      from: this.fromEmail,
      bcc: subscribers.map(subscriber => this.formatRecipient(subscriber)),
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });

    await this.persistOutboxMessage({
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
      recipients: subscribers.map(subscriber => subscriber.email),
      messageId: info.messageId,
      timestamp: new Date().toISOString(),
    });

    return {
      recipientCount: subscribers.length,
      messageId: info.messageId,
    };
  }

  private async persistOutboxMessage(entry: Record<string, unknown>): Promise<void> {
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
    const filePath = path.join(this.outboxPath, fileName);
    await fsp.writeFile(filePath, JSON.stringify(entry, null, 2), { encoding: 'utf-8' });
  }
}
