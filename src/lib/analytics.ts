/* eslint-disable no-console */

export interface AnalyticsClient {
  track: (event: string, payload?: Record<string, unknown>) => void;
}

const noopClient: AnalyticsClient = {
  track: (event, payload) => {
    if (import.meta.env.DEV) {
      console.debug(`[analytics] ${event}`, payload ?? {});
    }
  },
};

export const analytics: AnalyticsClient = noopClient;

export const trackReset = (source: string): void => {
  analytics.track('onReset', { source });
};

export const trackFilterApplied = (filters: unknown, resultCount: number): void => {
  analytics.track('onFilterApplied', { filters, resultCount });
};

export const trackChatQuery = (resultCount: number): void => {
  analytics.track('onChatQuery', { resultCount });
};

export const trackChatOpen = (): void => {
  analytics.track('onChatOpen');
};

export const trackChatClose = (): void => {
  analytics.track('onChatClose');
};

export const trackChatReset = (reason: string): void => {
  analytics.track('onChatReset', { reason });
};

export const trackChatError = (context: string, error?: unknown): void => {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : undefined;
  analytics.track('onChatError', { context, message });
};

export const trackChatClear = (): void => {
  analytics.track('onChatClear');
};

export default analytics;
