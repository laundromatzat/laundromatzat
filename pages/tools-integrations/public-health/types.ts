/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
export interface RagStore {
  name: string;
  displayName: string;
}

export interface CustomMetadata {
  key?: string;
  stringValue?: string;
  stringListValue?: string[];
  numericValue?: number;
}

export interface Document {
  name: string;
  displayName: string;
  customMetadata?: CustomMetadata[];
}

export interface GroundingChunk {
  retrievedContext?: {
    text?: string;
  };
}

export interface QueryResult {
  text: string;
  groundingChunks: GroundingChunk[];
}

export enum AppStatus {
  Initializing,
  Welcome,
  Uploading,
  Analyzing,
  Results,
  Chatting,
  UploadingStateInput,
  Error,
}

export interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
  groundingChunks?: GroundingChunk[];
}

// Organization Engine Types
export interface DuplicateInfo {
  existing_document: string;
  confidence_score: number; // 0-100
  reason: string;
}

export interface AnalyzedDocument {
  filename: string;
  short_summary: string;
  keywords: string[];
  tags: string[]; // [NEW] Broad categories like "Clinical", "Admin"
  category: string; // [NEW] Exact category e.g. "Protocol", "Report"
  suggested_path: string;
  detected_version?: string;
  possible_duplicates: DuplicateInfo[];
}

export interface SavedDocument {
  id: string;
  filename: string;
  rag_store_name: string;
  analysis: AnalyzedDocument;
  uploaded_at: string;
}

export interface AnalysisResult {
  batch_summary: string;
  documents: AnalyzedDocument[];
  proposed_hierarchy_changes: string;
  archive_recommendations: string[];
  notes_for_user: string;
}
