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
  /** Direct URL to the video file. */
  projectUrl?: string;
  tags?: string[];
  date: string;
  year: number;
  location?: string;
  gpsCoords?: string;
}
