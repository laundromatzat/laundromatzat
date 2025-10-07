import { Project, ProjectType } from '../types';
import { PROJECTS } from '../constants';

// --- Search helpers: normalization, synonyms, and geo aliasing ---
function normalize(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^a-z0-9\s]/g, ' ')     // drop punctuation
    .replace(/\s+/g, ' ')             // collapse whitespace
    .trim();
}

// If the user types any of the keys, expand the query with these terms
const QUERY_SYNONYMS: Record<string, string[]> = {
  'hawaii': ['hi', 'maui', 'big island', 'hawaii island', 'hawaiʻi', 'kona', 'hilo'],
  'alaska': ['ak', 'denali', 'seward', 'glacier bay'],
  'california': ['ca', 'san francisco', 'sf', 'bernal', 'pacifica', 'sea ranch', 'bear valley', 'channel islands'],
  'arizona': ['az', 'grand canyon', 'sedona', 'antelope canyon'],
  'new mexico': ['nm', 'santa fe', 'abiquiu'],
  'montana': ['glacier national park', 'glacier np', 'american alps'],
  'wyoming': ['grand teton', 'yellowstone'],
  'washington': ['seattle'],
  'british columbia': ['vancouver'],
  'canada': ['banff', 'jasper', 'alberta'],
  'mexico': ['puerto vallarta'],
  'spain': ['madrid'],
  'austria': ['vienna', 'salzburg', 'innsbruck'],
  'iceland': ['reykjavik']
};

// Non‑geographic synonyms (content types, modalities, common phrasing)
const QUERY_NONGEO_SYNONYMS: Record<string, string[]> = {
  // Content types
  'video': ['videos', 'clip', 'film', 'movie'],
  'videos': ['video', 'clips', 'films', 'movies'],
  'photo': ['image', 'picture', 'pic', 'still', 'photograph'],
  'image': ['photo', 'picture', 'pic', 'still', 'photograph'],
  'cinemagraph': ['loop', 'living photo', 'live photo', 'gif', 'motion photo'],
  'gif': ['cinemagraph', 'loop'],
  // Common scene terms
  'sunset': ['dusk', 'golden hour'],
  'sunrise': ['dawn', 'first light'],
  'beach': ['shore', 'seaside', 'coast'],
  'mountain': ['alps', 'range', 'peaks'],
  'vanlife': ['van life', 'campervan'],
};

const STOPWORDS = new Set(['any','from','in','of','the','a','an','to','show','me','please']);

const GEO_VOCAB: Set<string> = (() => {
  const s = new Set<string>();
  for (const [k, v] of Object.entries(QUERY_SYNONYMS)) {
    s.add(normalize(k));
    v.forEach(t => s.add(normalize(t)));
  }
  return s;
})();

const TYPE_VOCAB = new Set([
  'video','videos','clip','clips','film','films','movie','movies',
  'photo','photos','image','images','picture','pictures','pic','pics','still','stills',
  'cinemagraph','cinemagraphs','gif','gifs','loop','loops','motion photo','live photo','living photo'
].map(normalize));

function addSynonyms(terms: Set<string>, base: string, dict: Record<string,string[]>) {
  for (const [key, extras] of Object.entries(dict)) {
    if (base.includes(key)) extras.forEach((t) => terms.add(normalize(t)));
  }
}

// Per‑project augmentations: if a project mentions any of these needles,
// we also add their mapped aliases to the project index to make matching broader.
const PROJECT_GEO_ALIASES: Array<{ needles: RegExp; aliases: string[] }> = [
  { needles: /\b(maui|big island|hawaii island|hawai\u02bbi)\b/i, aliases: ['hawaii', 'hi'] },
  { needles: /\b(denali|seward|glacier bay)\b/i, aliases: ['alaska', 'ak'] },
  { needles: /\b(bernal heights|pacifica|sea ranch|bear valley|channel islands|san francisco|sf)\b/i, aliases: ['california', 'ca'] },
  { needles: /\b(grand canyon|sedona|antelope canyon)\b/i, aliases: ['arizona', 'az'] },
  { needles: /\b(santa fe|abiquiu)\b/i, aliases: ['new mexico', 'nm'] },
  { needles: /\b(glacier national park)\b/i, aliases: ['montana'] },
  { needles: /\b(grand teton|yellowstone)\b/i, aliases: ['wyoming'] },
  { needles: /\b(seattle)\b/i, aliases: ['washington'] },
  { needles: /\b(vancouver)\b/i, aliases: ['british columbia'] },
  { needles: /\b(banff|jasper|alberta)\b/i, aliases: ['canada'] },
  { needles: /\b(puerto vallarta)\b/i, aliases: ['mexico'] },
  { needles: /\b(madrid)\b/i, aliases: ['spain'] },
  { needles: /\b(vienna|salzburg|innsbruck|austria)\b/i, aliases: ['austria'] },
  { needles: /\b(iceland|reykjavik)\b/i, aliases: ['iceland'] }
];

function expandQuery(query: string): string[] {
  const nq = normalize(query);
  const terms = new Set<string>([nq]);
  for (const [key, extras] of Object.entries(QUERY_SYNONYMS)) {
    if (nq.includes(key)) {
      extras.forEach((t) => terms.add(normalize(t)));
    }
  }
  // NEW: also expand non‑geo synonyms
  addSynonyms(terms, nq, QUERY_NONGEO_SYNONYMS);

  nq.split(' ').forEach((t) => t && terms.add(t));
  return Array.from(terms);
}

function projectTypeLabel(p: Project): 'Video'|'Photo'|'Cinemagraph'|null {
  switch (p.type) {
    case ProjectType.Video: return 'Video';
    case ProjectType.Photo: return 'Photo';
    case ProjectType.Cinemagraph: return 'Cinemagraph';
    default: return null;
  }
}

function projectHaystack(p: Project): string {
  const base = normalize([
    p.title,
    p.description,
    p.date,
    p.location,
    (p.tags || []).join(' ')
  ].join(' '));

  const aliases: string[] = [];
  for (const rule of PROJECT_GEO_ALIASES) {
    if (rule.needles.test(p.location) || rule.needles.test(base)) {
      aliases.push(...rule.aliases);
    }
  }
  return `${base} ${normalize(aliases.join(' '))}`.trim();
}

// --- Structured search: helpers and types ---

export type SearchOptions = {
  type?: 'Video' | 'Photo' | 'Cinemagraph';
  dateFrom?: string; // accepts YYYY, MM/YYYY, YYYY-MM, or YYYY-MM-DD
  dateTo?: string;   // same formats
  includeTags?: string[];
  excludeTags?: string[];
};

function parseYearMonth(s?: string): number | null {
  if (!s) return null;
  const n = normalize(s).replace(/\b(about|around|since|after|before)\b/g, '').trim();
  // Try YYYY-MM or YYYY/MM or YYYY
  let m = n.match(/^(\d{4})[-\/]?(\d{2})?$/);
  if (m) {
    const y = Number(m[1]);
    const mo = m[2] ? Number(m[2]) : 1;
    return y * 100 + mo; // YYYYMM as comparable number
  }
  // Try MM/YYYY
  m = n.match(/^(\d{2})[-\/]?(\d{4})$/);
  if (m) return Number(m[2]) * 100 + Number(m[1]);
  return null;
}

function projectYearMonth(p: Project): number | null {
  // Project dates are mostly MM/YYYY
  const n = parseYearMonth(p.date);
  return n;
}

function tagsMatch(p: Project, includeTags?: string[], excludeTags?: string[]): boolean {
  const norm = (a: string[]) => a.map((t) => normalize(t));
  const ptags = norm((p.tags || []) as string[]);
  if (includeTags && includeTags.length) {
    const inc = norm(includeTags);
    for (const t of inc) if (!ptags.includes(t)) return false;
  }
  if (excludeTags && excludeTags.length) {
    const exc = norm(excludeTags);
    for (const t of exc) if (ptags.includes(t)) return false;
  }
  return true;
}

export function searchProjects(query: string, opts: SearchOptions = {}): Project[] {
  const q = (query || '').trim();
  const { type, dateFrom, dateTo, includeTags, excludeTags } = opts;
  if (!q && !type && !dateFrom && !dateTo && !includeTags && !excludeTags) return [];

  const expanded = q ? expandQuery(q) : [];
  const fromNum = parseYearMonth(dateFrom) ?? null;
  const toNum = parseYearMonth(dateTo) ?? null;

  return PROJECTS.filter((p) => {
    // Type filter (matches human label via enum mapping)
    if (type && projectTypeLabel(p) !== type) return false;

    // Date range filter (inclusive)
    if (fromNum || toNum) {
      const pm = projectYearMonth(p);
      if (pm == null) return false;
      if (fromNum && pm < fromNum) return false;
      if (toNum && pm > toNum) return false;
    }

    // Tag filters
    if (!tagsMatch(p, includeTags, excludeTags)) return false;

    // Query text match (if provided): tighter rules to reduce false positives
    if (expanded.length) {
      const hay = projectHaystack(p);
      const geoNeedles = expanded.filter(t => GEO_VOCAB.has(t));
      const contentNeedles = expanded.filter(t => !TYPE_VOCAB.has(t) && !STOPWORDS.has(t));
      // If the query includes any geo terms, require at least one geo match
      if (geoNeedles.length > 0 && !geoNeedles.some(n => hay.includes(n))) return false;
      // If there are any non-generic tokens, require at least one content match
      if (contentNeedles.length > 0 && !contentNeedles.some(n => hay.includes(n))) return false;
    }

    return true;
  });
}

function extractMessageFromJson(data: unknown): string {
  if (data && typeof data === 'object') {
    const maybeRecord = data as Record<string, unknown>;
    if (typeof maybeRecord.message === 'string') {
      return maybeRecord.message;
    }
    if (typeof maybeRecord.content === 'string') {
      return maybeRecord.content;
    }
  }
  return JSON.stringify(data ?? {});
}

async function postChat(message: string): Promise<Response> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    let errorMessage = `HTTP error! Status: ${response.status}`;
    try {
      const errorBody = await response.json();
      if (errorBody && typeof errorBody.error === 'string') {
        errorMessage = errorBody.error;
      }
    } catch {
      // ignore JSON parse errors for non-JSON responses
    }
    throw new Error(errorMessage);
  }

  return response;
}

export async function* sendStreamingMessage(message: string): AsyncGenerator<string> {
  try {
    const response = await postChat(message);
    const contentType = response.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
      const data = await response.json();
      yield extractMessageFromJson(data);
      return;
    }

    if (response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          if (chunk) {
            yield chunk;
          }
        }
      }
      return;
    }

    const fallbackText = await response.text();
    if (fallbackText) {
      yield fallbackText;
    }
  } catch (error) {
    console.error('Failed to stream message:', error);
    throw error instanceof Error ? error : new Error('Could not connect to the assistant. Please try again later.');
  }
}

export async function sendMessage(message: string): Promise<string> {
  let full = '';
  for await (const chunk of sendStreamingMessage(message)) {
    full += chunk;
  }
  return full;
}

export async function generateContent(prompt: string): Promise<string> {
  try {
    const response = await fetch('/api/generate-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({})) as { error?: string };
      throw new Error(errorBody.error || `HTTP error! Status: ${response.status}`);
    }

    const data = await response.json() as { message?: string; content?: string };
    if (typeof data.content === 'string') {
      return data.content;
    }
    if (typeof data.message === 'string') {
      return data.message;
    }

    throw new Error('Unexpected response shape from Gemini service.');

  } catch (error) {
    console.error('Failed to generate content:', error);
    throw error instanceof Error ? error : new Error('Could not reach the content generation service. Please try again later.');
  }
}

