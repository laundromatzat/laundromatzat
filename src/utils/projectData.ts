import { Project, ProjectType } from '@/types';
import { parseCsv } from './csv';
import { parseYearMonth } from './projectDates';

type JsonProject = {
  id: string;
  type: string;
  title: string;
  description: string;
  imageUrl: string;
  projectUrl?: string;
  tags?: string[] | string;
  categories?: string[] | string;
  date: string;
  year?: number;
  location?: string;
  gpsCoords?: string;
};

const PROJECT_TYPE_MAP: Record<string, ProjectType> = {
  video: ProjectType.Video,
  videos: ProjectType.Video,
  photo: ProjectType.Photo,
  photos: ProjectType.Photo,
  image: ProjectType.Photo,
  images: ProjectType.Photo,
  cinemagraph: ProjectType.Cinemagraph,
  cinemagraphs: ProjectType.Cinemagraph,
  tool: ProjectType.Tool,
  tools: ProjectType.Tool,
};

function coerceProjectType(value: string): ProjectType {
  const normalized = value.trim().toLowerCase();
  const mapped = PROJECT_TYPE_MAP[normalized as keyof typeof PROJECT_TYPE_MAP];
  if (!mapped) {
    throw new Error(`Unknown project type: ${value}`);
  }
  return mapped;
}

function parseDelimitedList(input?: string[] | string): string[] | undefined {
  if (!input || (Array.isArray(input) && input.length === 0)) {
    return undefined;
  }

  const raw = Array.isArray(input) ? input : input.split(/[;|]/);
  const items = raw
    .map(item => item.trim())
    .filter(item => item.length > 0);

  return items.length > 0 ? Array.from(new Set(items)) : undefined;
}

function ensureYear(date: string, explicitYear?: number): number {
  if (typeof explicitYear === 'number' && Number.isFinite(explicitYear)) {
    return explicitYear;
  }

  const parsed = parseYearMonth(date);
  if (parsed === null) {
    throw new Error(`Unable to derive year from date: ${date}`);
  }

  return Math.floor(parsed / 100);
}

function createProject(base: JsonProject): Project {
  const tags = parseDelimitedList(base.tags);
  const categories = parseDelimitedList(base.categories);
  const year = ensureYear(base.date, base.year);

  return {
    id: String(base.id),
    type: coerceProjectType(base.type),
    title: base.title,
    description: base.description,
    imageUrl: base.imageUrl,
    projectUrl: base.projectUrl,
    tags,
    categories,
    date: base.date,
    year,
    location: base.location,
    gpsCoords: base.gpsCoords,
  };
}

export function parseProjectsFromJson(input: JsonProject[] | unknown): Project[] {
  if (!Array.isArray(input)) {
    throw new Error('Project JSON must be an array.');
  }

  return input.map(project => createProject(project as JsonProject));
}

type CsvProjectRow = Record<string, string>;

export function parseProjectsFromCsv(text: string): Project[] {
  const { headers, rows } = parseCsv(text);
  if (headers.length === 0) {
    return [];
  }

  return rows.map(columns => {
    const row = headers.reduce<CsvProjectRow>((acc, header, index) => {
      acc[header] = columns[index] ?? '';
      return acc;
    }, {} as CsvProjectRow);

    return createProject({
      id: row.id,
      type: row.type,
      title: row.title,
      description: row.description,
      imageUrl: row.coverImage ?? row.imageUrl,
      projectUrl: row.sourceUrl ?? row.projectUrl,
      tags: row.tags,
      categories: row.categories,
      date: row.date,
      year: row.year ? Number.parseInt(row.year, 10) : undefined,
      location: row.location,
      gpsCoords: row.gpsCoords,
    });
  });
}
