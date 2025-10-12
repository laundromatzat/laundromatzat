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

export default analytics;
