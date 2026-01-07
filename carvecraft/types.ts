export enum AppPhase {
  INPUT = 'INPUT',
  GENERATING = 'GENERATING',
  RESULTS = 'RESULTS'
}

export enum Unit {
  INCHES = 'inches',
  MM = 'mm'
}

export interface GeneratedDesign {
  conceptUrl: string;
  schematicUrl: string;
  guideText: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface MeasurementLine {
  id: string;
  p1: Point;
  p2: Point;
  distanceUnits: number;
}

export interface MeasurementState {
  referenceHeightPhysical: number;
  referenceLinePixels: number | null;
  pixelsPerUnit: number | null;
  measurements: MeasurementLine[];
}