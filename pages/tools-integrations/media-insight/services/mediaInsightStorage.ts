/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnalysisResult } from "../types";

interface CachedAnalysis {
  filePath: string;
  fileName: string;
  result: AnalysisResult;
  thumbnail?: string;
  lastModified: number;
  cachedAt: number;
}

const CACHE_PREFIX = "mediainsight_cache_";
const CACHE_EXPIRY_DAYS = 30;
const MAX_CACHE_SIZE_MB = 5;

/**
 * Save analysis result to localStorage
 */
export function saveAnalysis(
  filePath: string,
  fileName: string,
  result: AnalysisResult,
  thumbnail?: string,
  lastModified?: number
): void {
  try {
    const cached: CachedAnalysis = {
      filePath,
      fileName,
      result,
      thumbnail,
      lastModified: lastModified || Date.now(),
      cachedAt: Date.now(),
    };

    const key = `${CACHE_PREFIX}${filePath}`;
    localStorage.setItem(key, JSON.stringify(cached));

    // Clean up old entries if cache is too large
    cleanupCache();
  } catch (error) {
    console.error("Failed to save analysis to cache:", error);
  }
}

/**
 * Get analysis result from localStorage
 */
export function getAnalysis(
  filePath: string,
  lastModified?: number
): CachedAnalysis | null {
  try {
    const key = `${CACHE_PREFIX}${filePath}`;
    const cached = localStorage.getItem(key);

    if (!cached) {
      return null;
    }

    const data: CachedAnalysis = JSON.parse(cached);

    // Check if cache is expired (30 days)
    const expiryTime = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    if (Date.now() - data.cachedAt > expiryTime) {
      localStorage.removeItem(key);
      return null;
    }

    // Check if file has been modified since caching
    if (lastModified && data.lastModified && lastModified > data.lastModified) {
      localStorage.removeItem(key);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Failed to get analysis from cache:", error);
    return null;
  }
}

/**
 * Get all cached analyses for a workspace
 */
export function getAllCachedAnalyses(): CachedAnalysis[] {
  const analyses: CachedAnalysis[] = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        const cached = localStorage.getItem(key);
        if (cached) {
          const data: CachedAnalysis = JSON.parse(cached);
          analyses.push(data);
        }
      }
    }
  } catch (error) {
    console.error("Failed to get all cached analyses:", error);
  }

  return analyses;
}

/**
 * Clear all cached analyses
 */
export function clearCache(): void {
  try {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.error("Failed to clear cache:", error);
  }
}

/**
 * Clean up old cache entries if total size exceeds limit
 */
function cleanupCache(): void {
  try {
    // Calculate total cache size
    let totalSize = 0;
    const entries: Array<{ key: string; size: number; cachedAt: number }> = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        const value = localStorage.getItem(key);
        if (value) {
          const size = new Blob([value]).size;
          totalSize += size;

          const data: CachedAnalysis = JSON.parse(value);
          entries.push({ key, size, cachedAt: data.cachedAt });
        }
      }
    }

    // If total size exceeds limit, remove oldest entries
    const maxSizeBytes = MAX_CACHE_SIZE_MB * 1024 * 1024;
    if (totalSize > maxSizeBytes) {
      // Sort by cachedAt (oldest first)
      entries.sort((a, b) => a.cachedAt - b.cachedAt);

      // Remove oldest entries until under limit
      let currentSize = totalSize;
      for (const entry of entries) {
        if (currentSize <= maxSizeBytes) {
          break;
        }
        localStorage.removeItem(entry.key);
        currentSize -= entry.size;
      }
    }
  } catch (error) {
    console.error("Failed to cleanup cache:", error);
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  count: number;
  sizeMB: number;
  oldestEntry: number | null;
} {
  let count = 0;
  let totalSize = 0;
  let oldestEntry: number | null = null;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        const value = localStorage.getItem(key);
        if (value) {
          count++;
          totalSize += new Blob([value]).size;

          const data: CachedAnalysis = JSON.parse(value);
          if (!oldestEntry || data.cachedAt < oldestEntry) {
            oldestEntry = data.cachedAt;
          }
        }
      }
    }
  } catch (error) {
    console.error("Failed to get cache stats:", error);
  }

  return {
    count,
    sizeMB: totalSize / (1024 * 1024),
    oldestEntry,
  };
}
