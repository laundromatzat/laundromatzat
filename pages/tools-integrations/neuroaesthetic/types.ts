
export interface Coordinate {
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
}

export interface Annotation {
  id: string;
  label: string;
  type: 'affirmation' | 'critique' | 'suggestion';
  description: string;
  coordinates: Coordinate;
  principle: string; // e.g., "Biophilia", "Prospect-Refuge", "Curvature"
  principleDescription?: string; // Educational definition of the principle
}

export interface LightingAnalysis {
  condition: string;
  circadianImpact: string;
  suggestions: string[];
}

export interface ColorAnalysis {
  palette: string[];
  psychologicalImpact: string;
  suggestions: string[];
}

export interface FurnitureAnalysis {
  currentLayout: string;
  flowAssessment: string;
  prospectRefugeAnalysis: string;
  suggestions: string[];
}

export interface TextureAnalysis {
  currentMaterials: string[];
  hapticPerception: string;
  suggestions: string[];
}

export interface FractalAnalysis {
  presence: string;
  complexityLevel: string; // e.g., "Low", "Optimal (1.3-1.5)", "High/Cluttered"
  suggestions: string[];
}

export interface SoundscapeAnalysis {
  mood: string;
  suggestedType: 'pink_noise' | 'brown_noise' | 'white_noise' | 'binaural_beats';
  description: string;
}

export interface AnalysisResult {
  overview: string;
  annotations: Annotation[];
  neuroScore: number; // 0-100
  dominantPrinciple: string;
  missingElements: string[];
  lighting: LightingAnalysis;
  colorPalette: ColorAnalysis;
  furnitureArrangement: FurnitureAnalysis;
  texture: TextureAnalysis;
  fractalPatterns: FractalAnalysis;
  soundscape: SoundscapeAnalysis;
}

export interface UserPreferences {
  sensitivities: string;
  colorPreferences: string;
  designGoals: string;
}

export enum AppState {
  UPLOAD = 'UPLOAD',
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS',
  GENERATING = 'GENERATING',
  COMPARISON = 'COMPARISON'
}

export interface ImageDimensions {
  width: number;
  height: number;
}
