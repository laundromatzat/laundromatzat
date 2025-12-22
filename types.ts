export enum ProjectType {
  Photo = "photo",
  Video = "video",
  Tool = "tool",
  Cinemagraph = "cinemagraph",
}

export interface Project {
  id: string;
  type: ProjectType;
  title: string;
  description: string;
  imageUrl: string;
  projectUrl?: string;
  tags?: string[];
  categories?: string[];
  date: string;
  year: number;
  location?: string;
  gpsCoords?: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
}

export interface Link {
  url: string;
  title: string;
  description: string;
  tags: string[];
}

export interface User {
  id: number;
  username: string;
  profile_picture?: string;
}
