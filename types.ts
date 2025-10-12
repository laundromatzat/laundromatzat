export enum ProjectType {
  Photo = 'photo',
  Video = 'video',
  Tool = 'tool',
  Cinemagraph = 'cinemagraph',
}

export interface Project {
  id: number;
  type: ProjectType;
  title: string;
  description: string;
  imageUrl: string;
  projectUrl?: string;
  tags: string[];
  date: string;
  location?: string;
  gpsCoords?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
}

export interface Link {
  url: string;
  description: string;
  categories: string[];
}
