import { Project, ProjectType } from "@/types";
import { parseYearMonth } from "./projectDates";

type JsonProject = {
  id: string | number;
  type: string;
  title: string;
  description: string;
  imageUrl: string;
  projectUrl?: string;
  streamUrl?: string;
  tags?: string[];
  date: string;
  year?: number;
  location?: string;
  gpsCoords?: string;
};

function coerceProjectType(value: string): ProjectType {
  const normalized = value.trim().toLowerCase();
  if (normalized === "video" || normalized === "videos") {
    return ProjectType.Video;
  }
  throw new Error(`Unknown project type: ${value}`);
}

function parseTags(input?: string[]): string[] | undefined {
  if (!input || input.length === 0) {
    return undefined;
  }

  const items = input.map((item) => item.trim()).filter((item) => item.length > 0);

  return items.length > 0 ? Array.from(new Set(items)) : undefined;
}

function ensureYear(date: string, explicitYear?: number): number {
  if (typeof explicitYear === "number" && Number.isFinite(explicitYear)) {
    return explicitYear;
  }

  const parsed = parseYearMonth(date);
  if (parsed === null) {
    throw new Error(`Unable to derive year from date: ${date}`);
  }

  return Math.floor(parsed / 100);
}

function createProject(base: JsonProject): Project {
  return {
    id: String(base.id),
    type: coerceProjectType(base.type),
    title: base.title,
    description: base.description,
    imageUrl: base.imageUrl,
    projectUrl: base.projectUrl,
    streamUrl: base.streamUrl,
    tags: parseTags(base.tags),
    date: base.date,
    year: ensureYear(base.date, base.year),
    location: base.location,
    gpsCoords: base.gpsCoords,
  };
}

export function parseProjectsFromJson(input: JsonProject[] | unknown): Project[] {
  if (!Array.isArray(input)) {
    throw new Error("Project JSON must be an array.");
  }

  return input.map((project) => createProject(project as JsonProject));
}
