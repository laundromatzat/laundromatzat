/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Emotion {
  Happy = "Happy",
  Sad = "Sad",
  Angry = "Angry",
  Neutral = "Neutral",
}

export type MediaType = "audio" | "image" | "video";

export interface BaseAnalysisResult {
  summary: string;
  type: MediaType;
  suggestedName?: string;
  tags?: string[];
}

export interface AudioSegment {
  speaker: string;
  timestamp: string;
  content: string;
  language: string;
  translation?: string;
  emotion?: Emotion;
}

export interface AudioAnalysisResult extends BaseAnalysisResult {
  type: "audio";
  segments: AudioSegment[];
}

export interface ImageAnalysisResult extends BaseAnalysisResult {
  type: "image";
  visualElements: string[];
  detectedText?: string | string[];
  mood?: string;
}

export interface VideoSegment {
  timestamp: string;
  description: string;
  transcript?: string;
  speaker?: string;
}

export interface VideoAnalysisResult extends BaseAnalysisResult {
  type: "video";
  segments: VideoSegment[];
}

export type AnalysisResult =
  | AudioAnalysisResult
  | ImageAnalysisResult
  | VideoAnalysisResult;

export type AppStatus =
  | "idle"
  | "recording"
  | "processing"
  | "success"
  | "error"
  | "workspace_active";

export interface MediaInput {
  blob: Blob;
  base64: string;
  mimeType: string;
  type: MediaType;
  name: string;
  handle?: FileSystemFileHandle;
}

export interface WorkspaceFile {
  name: string;
  path?: string; // File path for Electron
  handle?: FileSystemFileHandle; // File handle for browser
  type: MediaType;
  status: "pending" | "analyzing" | "done" | "error";
  analysisResult?: AnalysisResult; // Renamed from 'result' for clarity
  thumbnail?: string; // Base64 data URL for thumbnail
  lastModified?: number; // Timestamp for cache invalidation
}

export interface AudioData {
  blob: Blob;
  base64: string;
  mimeType: string;
}
