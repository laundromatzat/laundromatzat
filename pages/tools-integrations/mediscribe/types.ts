export enum ModelProvider {
  GEMINI = 'GEMINI',
  LOCAL = 'LOCAL'
}

export interface TrainingExample {
  id: string;
  shorthand: string;
  fullNote: string;
  timestamp: number;
}

export interface UserSettings {
  provider: ModelProvider;
  localModelUrl: string; // e.g., http://localhost:11434/api/generate
  localModelName: string; // e.g., llama3
  useThinkingMode: boolean; // Toggle for Gemini 3.0 Thinking
}

export interface GenerationRequest {
  shorthand: string;
  examples: TrainingExample[];
  settings: UserSettings;
}

export interface AppState {
  settings: UserSettings;
  examples: TrainingExample[];
  currentView: 'generator' | 'training' | 'settings';
}

export const DEFAULT_SETTINGS: UserSettings = {
  provider: ModelProvider.GEMINI,
  localModelUrl: 'http://localhost:11434/api/generate',
  localModelName: 'llama3',
  useThinkingMode: true,
};
