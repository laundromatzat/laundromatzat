import { Project } from "@/types";
import PEOPLE from "@/data/people.json";
import REGIONS from "@/data/locations.json";

/**
 * What the grid is narrowed by.
 *
 * Within an axis, values are alternatives: picking 2020 and 2021 shows videos
 * from either year. Across axes, every axis has to hold: 2020 + Emily shows
 * Emily's videos from 2020. An empty axis does not narrow anything.
 */
export interface VideoFilters {
  /** Free text, matched across title, description, location and tags. */
  query: string;
  years: number[];
  /** Names from src/data/people.json, matched against tags. */
  people: string[];
  /** Exact `location` values from the library. */
  locations: string[];
}

export const EMPTY_FILTERS: VideoFilters = {
  query: "",
  years: [],
  people: [],
  locations: [],
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

/**
 * Everything about a video that free text should search.
 *
 * Tags are still searched although the site no longer shows them: they are
 * how "beach" finds the beach videos, and they are where People reads names.
 */
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
  if (filters.years.length > 0 && !filters.years.includes(video.year)) {
    return false;
  }

  if (filters.people.length > 0 && !filters.people.some((person) => hasTag(video, person))) {
    return false;
  }

  if (filters.locations.length > 0) {
    const here = normalise(video.location ?? "");
    if (!filters.locations.some((location) => normalise(location) === here)) {
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

export interface Facet {
  value: string;
  /** What the option reads as. Defaults to the value itself. */
  label?: string;
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

/** A heading in the Location list, and the places filed under it. */
export interface FacetSection {
  heading: string;
  /** 0 for a region such as "United States", 1 for one inside it such as "West". */
  depth: 0 | 1;
  options: Facet[];
}

export interface Region {
  name: string;
  places?: Record<string, string>;
  subregions?: { name: string; places: Record<string, string> }[];
}

/** Heading for anything src/data/locations.json does not place yet. */
export const UNGROUPED_HEADING = "Other";

/**
 * The library's locations, filed under the regions in src/data/locations.json.
 *
 * Headings with nothing under them are left out, so a region can be listed in
 * the data before the library has a video there. A location the data does not
 * mention still appears, under "Other": a new video should never be unfindable
 * because nobody has filed its place yet. A place may sit under two regions --
 * "Seattle and Vancouver" is both -- and either checkbox selects it.
 */
export function collectLocationSections(
  videos: Project[],
  regions: readonly Region[] = REGIONS as Region[],
): FacetSection[] {
  // Keyed loosely so the data file need not match the library's capitalisation,
  // but every option carries the library's own spelling, which is what matches.
  const present = new Map(
    collectLocations(videos).map((facet) => [normalise(facet.value), facet]),
  );

  const filed = new Set<string>();
  const optionsFor = (places: Record<string, string> = {}): Facet[] =>
    Object.entries(places)
      .flatMap(([value, label]) => {
        const facet = present.get(normalise(value));
        if (!facet) return [];
        filed.add(normalise(value));
        return [{ ...facet, label }];
      })
      .sort((a, b) => (a.label ?? a.value).localeCompare(b.label ?? b.value));

  const sections: FacetSection[] = [];
  for (const region of regions) {
    const own = optionsFor(region.places);
    const children = (region.subregions ?? [])
      .map((sub) => ({ heading: sub.name, depth: 1 as const, options: optionsFor(sub.places) }))
      .filter((section) => section.options.length > 0);

    if (own.length === 0 && children.length === 0) {
      continue;
    }
    sections.push({ heading: region.name, depth: 0, options: own }, ...children);
  }

  const leftover = [...present.entries()]
    .filter(([key]) => !filed.has(key))
    .map(([, facet]) => facet)
    .sort((a, b) => a.value.localeCompare(b.value));
  if (leftover.length > 0) {
    sections.push({ heading: UNGROUPED_HEADING, depth: 0, options: leftover });
  }

  return sections;
}

export function hasActiveFilters(filters: VideoFilters): boolean {
  return filters.query.trim() !== "" || activeFacetCount(filters) > 0;
}

/**
 * How many values are narrowing the grid across the three axes.
 *
 * Counts values, not axes: picking two years and a person reads as three.
 * Deliberately not counting the query: the search box is on screen even when
 * the axes are folded away, so counting it would badge the disclosure for
 * something the visitor can already see.
 */
export function activeFacetCount(filters: VideoFilters): number {
  return filters.years.length + filters.people.length + filters.locations.length;
}

/** Repeated values collapse, so a hand-edited URL cannot double-count. */
function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

/**
 * Filters are kept in the URL so a narrowed view can be linked to.
 *
 * Several values on one axis repeat the parameter: `?year=2020&year=2021`.
 * A link from before multiple selection, with a single value, reads the same.
 */
export function filtersFromSearchParams(params: URLSearchParams): VideoFilters {
  return {
    query: params.get("q") ?? "",
    years: unique(
      params
        .getAll("year")
        .map(Number)
        .filter((year) => Number.isInteger(year) && year > 0),
    ),
    people: unique(params.getAll("person").filter(Boolean)),
    locations: unique(params.getAll("location").filter(Boolean)),
  };
}

export function searchParamsFromFilters(filters: VideoFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.query.trim() !== "") params.set("q", filters.query.trim());
  for (const year of filters.years) params.append("year", String(year));
  for (const person of filters.people) params.append("person", person);
  for (const location of filters.locations) params.append("location", location);
  return params;
}
