interface SubscribeResponse {
  id: string;
  email: string;
  name?: string;
  subscribedAt: string;
}

interface ApiError {
  error?: string;
}

const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : '';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? runtimeOrigin;

export async function subscribeToMailingList(input: { email: string; name?: string }): Promise<SubscribeResponse> {
  const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/api/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    let message = 'Unable to subscribe. Please try again later.';

    try {
      const error: ApiError = await response.json();
      if (error.error) {
        message = error.error;
      }
    } catch (error) {
      console.error('Failed to parse mailing list error response', error);
    }

    throw new Error(message);
  }

  return response.json();
}
