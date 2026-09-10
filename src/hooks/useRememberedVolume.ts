import { useEffect } from "react";

const STORAGE_KEY = "laundromatzat:volume";

interface Stored {
  volume: number;
  muted: boolean;
}

function read(): Stored | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Stored>;
    if (typeof parsed.volume !== "number" || !Number.isFinite(parsed.volume)) {
      return null;
    }
    return { volume: Math.min(Math.max(parsed.volume, 0), 1), muted: Boolean(parsed.muted) };
  } catch {
    // Private browsing, cleared site data, or storage blocked entirely.
    return null;
  }
}

function write(value: Stored): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Not being able to remember the volume is not worth breaking playback.
  }
}

/**
 * Carries volume and mute across videos and across visits.
 *
 * Paging through a library resets the <video> element every time, so without
 * this someone who turned the sound down has to turn it down again on every
 * single video.
 */
export function useRememberedVolume(video: HTMLVideoElement | null): void {
  useEffect(() => {
    if (!video) {
      return;
    }

    const stored = read();
    if (stored) {
      video.volume = stored.volume;
      video.muted = stored.muted;
    }

    const handleVolumeChange = () => {
      write({ volume: video.volume, muted: video.muted });
    };

    video.addEventListener("volumechange", handleVolumeChange);
    return () => video.removeEventListener("volumechange", handleVolumeChange);
  }, [video]);
}
