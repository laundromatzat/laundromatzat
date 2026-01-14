import { API_BASE_URL } from "./api";

/**
 * Constructs full avatar URL with cache-busting timestamp
 * Handles both relative paths and absolute URLs
 *
 * @param profilePicture - User's profile picture path (relative or absolute)
 * @returns Full avatar URL with cache-busting, or null if no picture
 */
export function getAvatarUrl(
  profilePicture: string | null | undefined
): string | null {
  if (!profilePicture) return null;

  // Already absolute URL (e.g., from external provider)
  if (profilePicture.startsWith("http")) {
    return profilePicture;
  }

  // Relative path - construct full URL with cache-busting timestamp
  const baseUrl = `${API_BASE_URL}${profilePicture}`;
  return `${baseUrl}?t=${Date.now()}`;
}
