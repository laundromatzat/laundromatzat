export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000";

/**
 * Helper to construct full API URLs.
 * Usage: getApiUrl("/api/auth/login") -> "https://backend.com/api/auth/login"
 */
export const getApiUrl = (endpoint: string): string => {
  // Ensure endpoint starts with /
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${path}`;
};
