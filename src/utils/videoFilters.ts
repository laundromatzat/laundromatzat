import { Project } from "@/types";

export interface VideoFilters {
  /** Free text, matched across title, description, location and tags. */
  query: string;
  year: number | null;
  tag: string | null;
}

export const EMPTY_FILTERS: VideoFilters = { query: "", year: null, tag: null };

/**
 * A tag on more than this share of the library does not narrow anything.
 *
 * This archive tags almost every entry "video" and most of them with the
 * person who shot them, so offering those as filters would be offering a
 * button that does nothing.
 */
const UNHELPFULLY_COMMON = 0.6;

export function normalise(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

/** Everything about a video that free text should search. */
function haystack(video: Project): string {
  return normalise(
    [video.title, video.description, video.location, ...(video.tags ?? [])]
      .filter(Boolean)
      .join(" "),
  );
}

export function matchesFilters(video: Project, filters: VideoFilters): boolean {
  if (filters.year !== null && video.year !== filters.year) {
    return false;
  }

  if (filters.tag !== null) {
    const wanted = normalise(filters.tag);
    if (!(video.tags ?? []).some((tag) => normalise(tag) === wanted)) {
      return false;
    }
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

/** Years present in the library, newest first. */
export function collectYears(videos: Project[]): number[] {
  const years = new Set<number>();
  for (const video of videos) {
    if (Number.isFinite(video.year)) {
      years.add(video.year);
    }
  }
  return [...years].sort((a, b) => b - a);
}

export interface TagFacet {
  tag: string;
  count: number;
}

/**
 * Tags worth offering as a one-tap filter.
 *
 * A tag on a single video is a dead end -- the grid it filters to is the card
 * you already clicked -- and one on nearly everything narrows nothing. What
 * remains is the handful that actually splits the library.
 */
export function collectFilterTags(videos: Project[]): TagFacet[] {
  const counts = new Map<string, number>();
  for (const video of videos) {
    for (const tag of video.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  const ceiling = videos.length * UNHELPFULLY_COMMON;

  return [...counts.entries()]
    .filter(([, count]) => count > 1 && count <= ceiling)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function hasActiveFilters(filters: VideoFilters): boolean {
  return filters.query.trim() !== "" || filters.year !== null || filters.tag !== null;
}

/** Filters are kept in the URL so a narrowed view can be linked to. */
export function filtersFromSearchParams(params: URLSearchParams): VideoFilters {
  const year = Number(params.get("year"));
  return {
    query: params.get("q") ?? "",
    year: Number.isInteger(year) && year > 0 ? year : null,
    tag: params.get("tag"),
  };
}

export function searchParamsFromFilters(filters: VideoFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.query.trim() !== "") params.set("q", filters.query.trim());
  if (filters.year !== null) params.set("year", String(filters.year));
  if (filters.tag !== null) params.set("tag", filters.tag);
  return params;
}
