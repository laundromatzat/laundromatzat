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
  role?: "user" | "admin";
  is_approved?: boolean;
}

// --- Local AI & File System Types ---

export type FileType =
  | "image"
  | "video"
  | "audio"
  | "document"
  | "code"
  | "unknown";

export type SummaryLength = "short" | "medium" | "long";

export interface AIOrganizationSuggestion {
  suggestedName?: string;
  suggestedTags?: string[];
  suggestedLogicalPath?: string;
  reasoning?: string;
}

export interface OrganizationPattern {
  type: string;
  fileTypeApplicability: FileType[] | "all";
  categoryKeywords: string[];
  pattern: string;
  description?: string;
}

export interface LearnedPreferenceExample {
  fileType: FileType;
  originalValue: string;
  appliedValue: string;
  actionType: "rename" | "tag" | "move";
}

export interface UserSettings {
  localAiUrl?: string;
  localAiModel?: string;
}
