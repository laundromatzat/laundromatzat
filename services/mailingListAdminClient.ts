export interface Subscriber {
  id: string;
  email: string;
  name?: string;
  subscribedAt: string;
}

interface SubscribersResponse {
  subscribers: Subscriber[];
}

export interface BatchUpdateInput {
  subject: string;
  text?: string;
  html?: string;
}

export interface BatchUpdateResponse {
  recipientCount: number;
  messageId?: string;
}

interface ApiError {
  error?: string;
}

export class MailingListAdminError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'MailingListAdminError';
    this.status = status;
  }
}

const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : '';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? runtimeOrigin;

function createHeaders(adminKey: string, extra: Record<string, string> = {}): HeadersInit {
  return {
    'x-api-key': adminKey,
    ...extra,
  };
}

export async function fetchSubscribers(adminKey: string): Promise<Subscriber[]> {
  const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/api/subscribers`, {
    method: 'GET',
    headers: createHeaders(adminKey),
  });

  if (!response.ok) {
    let message = 'Unable to load subscribers. Please verify the admin key and try again.';

    try {
      const error: ApiError = await response.json();
      if (error.error) {
        message = error.error;
      }
    } catch (error) {
      console.error('Failed to parse mailing list admin error response', error);
    }

    throw new MailingListAdminError(message, response.status);
  }

  const payload: SubscribersResponse = await response.json();
  return payload.subscribers ?? [];
}

export async function deleteSubscriber(id: string, adminKey: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/api/subscribers/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: createHeaders(adminKey),
  });

  if (response.status === 204) {
    return;
  }

  let message = 'Unable to remove the subscriber. They may have already been deleted.';

  try {
    const error: ApiError = await response.json();
    if (error.error) {
      message = error.error;
    }
  } catch (error) {
    console.error('Failed to parse mailing list admin delete error response', error);
  }

  throw new MailingListAdminError(message, response.status);
}

export async function sendBatchUpdate(
  input: BatchUpdateInput,
  adminKey: string,
): Promise<BatchUpdateResponse> {
  const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/api/updates`, {
    method: 'POST',
    headers: createHeaders(adminKey, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    let message = 'Unable to send the update. Please correct any validation errors and try again.';

    try {
      const error: ApiError = await response.json();
      if (error.error) {
        message = error.error;
      }
    } catch (error) {
      console.error('Failed to parse mailing list admin update error response', error);
    }

    throw new MailingListAdminError(message, response.status);
  }

  return response.json();
}
