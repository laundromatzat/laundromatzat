// If VITE_API_URL is set (via secrets), use it.
// Otherwise, if we are in production mode, default to the Render URL.
// Finally, fallback to localhost for dev.
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? "https://laundromatzat-backend.onrender.com"
    : "http://localhost:4000");

/**
 * Helper to construct full API URLs.
 * Usage: getApiUrl("/api/auth/login") -> "https://backend.com/api/auth/login"
 */
export const getApiUrl = (endpoint: string): string => {
  // Ensure endpoint starts with /
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${path}`;
};
