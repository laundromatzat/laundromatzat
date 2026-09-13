import { Project } from "@/types";
import PEOPLE from "@/data/people.json";

export interface VideoFilters {
  /** Free text, matched across title, description, location and tags. */
  query: string;
  year: number | null;
  /** One of the names in src/data/people.json, matched against tags. */
  person: string | null;
  /** An exact `location` value from the library. */
  location: string | null;
  /** Any other tag: the catch-all axis. */
  tag: string | null;
}

export const EMPTY_FILTERS: VideoFilters = {
  query: "",
  year: null,
  person: null,
  location: null,
  tag: null,
};

/**
 * The people who appear in this archive, as a filter axis of their own.
 *
 * Curated rather than derived, because a name is not distinguishable from any
 * other tag by shape alone. Splitting them out is what makes them usable: the
 * two most-tagged people are on 100% and 82% of the library, so as entries in a
 * general tag list they were being discarded for narrowing nothing.
 */
export const KNOWN_PEOPLE: readonly string[] = PEOPLE;

export function normalise(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

const PEOPLE_KEYS = new Set(KNOWN_PEOPLE.map(normalise));

/** Everything about a video that free text should search. */
function haystack(video: Project): string {
  return normalise(
    [video.title, video.description, video.location, ...(video.tags ?? [])]
      .filter(Boolean)
      .join(" "),
  );
}

function hasTag(video: Project, wanted: string): boolean {
  const key = normalise(wanted);
  return (video.tags ?? []).some((tag) => normalise(tag) === key);
}

export function matchesFilters(video: Project, filters: VideoFilters): boolean {
  if (filters.year !== null && video.year !== filters.year) {
    return false;
  }

  if (filters.person !== null && !hasTag(video, filters.person)) {
    return false;
  }

  if (
    filters.location !== null &&
    normalise(video.location ?? "") !== normalise(filters.location)
  ) {
    return false;
  }

  if (filters.tag !== null && !hasTag(video, filters.tag)) {
    return false;
  }

  const query = normalise(filters.query);
  if (query === "") {
    return true;
  }

  // Every word has to appear somewhere, so "maui 2019" narrows rather than widens.
  const text = haystack(video);
  return query.split(/\s+/).every((term) => text.includes(term));
}

export function filterVideos(videos: Project[], filters: VideoFilters): Project[] {
  return videos.filter((video) => matchesFilters(video, filters));
}

export interface Facet {
  value: string;
  count: number;
}

function countTags(videos: Project[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const video of videos) {
    for (const tag of video.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return counts;
}

/** Years present in the library, newest first -- chronology beats popularity. */
export function collectYears(videos: Project[]): Facet[] {
  const counts = new Map<number, number>();
  for (const video of videos) {
    if (Number.isFinite(video.year)) {
      counts.set(video.year, (counts.get(video.year) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, count]) => ({ value: String(year), count }));
}

/** Most-used first, then alphabetical, so the order is stable. */
function byCountThenName(a: Facet, b: Facet): number {
  return b.count - a.count || a.value.localeCompare(b.value);
}

/**
 * The people actually tagged in the library, with how often.
 *
 * Everyone present is offered, however common they are. A name on all 28 videos
 * narrows nothing, but it is still the true answer to "who is in this?", and the
 * count next to it says so without the visitor having to try it.
 */
export function collectPeople(videos: Project[]): Facet[] {
  const counts = countTags(videos);
  return KNOWN_PEOPLE.map((person) => ({
    value: person,
    count: counts.get(person) ?? 0,
  }))
    .filter((facet) => facet.count > 0)
    .sort(byCountThenName);
}

/** Locations present in the library, taken verbatim from the `location` field. */
export function collectLocations(videos: Project[]): Facet[] {
  const counts = new Map<string, number>();
  for (const video of videos) {
    const location = video.location?.trim();
    if (location) {
      counts.set(location, (counts.get(location) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort(byCountThenName);
}

/**
 * Everything else: the catch-all axis.
 *
 * People have their own control, and a tag that merely repeats a `location`
 * value is already reachable under Location, so both are dropped here to keep
 * this list about subject rather than about who and where. Nothing else is
 * withheld -- a tag on one video is a legitimate way to reach that video.
 */
export function collectFilterTags(videos: Project[]): Facet[] {
  const locations = new Set(collectLocations(videos).map((f) => normalise(f.value)));

  return [...countTags(videos).entries()]
    .filter(([tag]) => {
      const key = normalise(tag);
      return !PEOPLE_KEYS.has(key) && !locations.has(key);
    })
    .map(([value, count]) => ({ value, count }))
    .sort(byCountThenName);
}

export function hasActiveFilters(filters: VideoFilters): boolean {
  return (
    filters.query.trim() !== "" ||
    filters.year !== null ||
    filters.person !== null ||
    filters.location !== null ||
    filters.tag !== null
  );
}

/**
 * How many of the four axes are narrowing the grid.
 *
 * Deliberately not counting the query: the search box is on screen even when
 * the axes are folded away, so counting it would badge the disclosure for
 * something the visitor can already see.
 */
export function activeFacetCount(filters: VideoFilters): number {
  return [
    filters.year !== null,
    filters.person !== null,
    filters.location !== null,
    filters.tag !== null,
  ].filter(Boolean).length;
}

/** Filters are kept in the URL so a narrowed view can be linked to. */
export function filtersFromSearchParams(params: URLSearchParams): VideoFilters {
  const year = Number(params.get("year"));
  return {
    query: params.get("q") ?? "",
    year: Number.isInteger(year) && year > 0 ? year : null,
    person: params.get("person"),
    location: params.get("location"),
    tag: params.get("tag"),
  };
}

export function searchParamsFromFilters(filters: VideoFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.query.trim() !== "") params.set("q", filters.query.trim());
  if (filters.year !== null) params.set("year", String(filters.year));
  if (filters.person !== null) params.set("person", filters.person);
  if (filters.location !== null) params.set("location", filters.location);
  if (filters.tag !== null) params.set("tag", filters.tag);
  return params;
}
