export enum ProjectType {
  Video = "video",
}

export interface Project {
  id: string;
  type: ProjectType;
  title: string;
  description: string;
  /**
   * Poster/thumbnail shown in the grid and used as the video poster.
   * Optional: a video added without one falls back to a placeholder tile.
   */
  imageUrl?: string;
  /** Direct URL to the progressive video file. Always the fallback source. */
  projectUrl?: string;
  /**
   * Optional HLS playlist (.m3u8) for adaptive-bitrate playback.
   *
   * When present the player prefers it, so a phone on a slow connection gets a
   * low rendition instead of stalling on the full-size file, and falls back to
   * `projectUrl` if HLS cannot play. See docs/VIDEO-DELIVERY.md.
   */
  streamUrl?: string;
  tags?: string[];
  date: string;
  year: number;
  location?: string;
  gpsCoords?: string;
}
