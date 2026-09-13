import { describe, expect, it } from "vitest";
import { VIDEOS } from "@/constants";
import {
  EMPTY_FILTERS,
  KNOWN_PEOPLE,
  activeFacetCount,
  collectFilterTags,
  collectLocations,
  collectPeople,
  collectYears,
  filterVideos,
  filtersFromSearchParams,
  hasActiveFilters,
  matchesFilters,
  searchParamsFromFilters,
} from "@/utils/videoFilters";
import { makeVideo } from "../utils/testUtils";

describe("matchesFilters", () => {
  const video = makeVideo({
    title: "Drift Away",
    description: "A road film through the desert.",
    location: "New Mexico",
    tags: ["Michael", "Irene", "roadtrip"],
    date: "06/2019",
    year: 2019,
  });

  it("keeps everything when no filter is set", () => {
    expect(matchesFilters(video, EMPTY_FILTERS)).toBe(true);
  });

  it("searches title, description, location and tags alike", () => {
    for (const query of ["drift", "desert", "new mexico", "irene"]) {
      expect(matchesFilters(video, { ...EMPTY_FILTERS, query })).toBe(true);
    }
    expect(matchesFilters(video, { ...EMPTY_FILTERS, query: "iceland" })).toBe(false);
  });

  it("requires every word, so more words narrow rather than widen", () => {
    expect(matchesFilters(video, { ...EMPTY_FILTERS, query: "drift desert" })).toBe(true);
    expect(matchesFilters(video, { ...EMPTY_FILTERS, query: "drift iceland" })).toBe(false);
  });

  it("ignores case, accents and stray whitespace", () => {
    expect(matchesFilters(video, { ...EMPTY_FILTERS, query: "  DRÍFT  " })).toBe(true);
  });

  it("matches a year exactly", () => {
    expect(matchesFilters(video, { ...EMPTY_FILTERS, year: 2019 })).toBe(true);
    expect(matchesFilters(video, { ...EMPTY_FILTERS, year: 2020 })).toBe(false);
  });

  it("matches a person against the tags", () => {
    expect(matchesFilters(video, { ...EMPTY_FILTERS, person: "Irene" })).toBe(true);
    expect(matchesFilters(video, { ...EMPTY_FILTERS, person: "Tom" })).toBe(false);
  });

  it("matches a location against the location field, whole and exact", () => {
    expect(matchesFilters(video, { ...EMPTY_FILTERS, location: "New Mexico" })).toBe(true);
    expect(matchesFilters(video, { ...EMPTY_FILTERS, location: "new mexico" })).toBe(true);
    // A location is one place, not a prefix of one: "New" must not match.
    expect(matchesFilters(video, { ...EMPTY_FILTERS, location: "New" })).toBe(false);
  });

  it("matches a tag exactly, not as a substring", () => {
    expect(matchesFilters(video, { ...EMPTY_FILTERS, tag: "roadtrip" })).toBe(true);
    expect(matchesFilters(video, { ...EMPTY_FILTERS, tag: "road" })).toBe(false);
  });

  it("combines all four axes with AND", () => {
    const all = {
      query: "drift",
      year: 2019,
      person: "Irene",
      location: "New Mexico",
      tag: "roadtrip",
    };
    expect(matchesFilters(video, all)).toBe(true);
    expect(matchesFilters(video, { ...all, person: "Tom" })).toBe(false);
    expect(matchesFilters(video, { ...all, location: "Maui" })).toBe(false);
    expect(matchesFilters(video, { ...all, year: 2020 })).toBe(false);
  });

  it("survives a video with no tags or location", () => {
    const sparse = makeVideo({ tags: undefined, location: undefined });
    expect(matchesFilters(sparse, EMPTY_FILTERS)).toBe(true);
    expect(matchesFilters(sparse, { ...EMPTY_FILTERS, tag: "Irene" })).toBe(false);
    expect(matchesFilters(sparse, { ...EMPTY_FILTERS, person: "Irene" })).toBe(false);
    expect(matchesFilters(sparse, { ...EMPTY_FILTERS, location: "Maui" })).toBe(false);
  });
});

describe("collectPeople", () => {
  it("offers everyone present, however much of the library they are on", () => {
    // The regression this guards: Stephen is on every video and Michael on most,
    // so a rule that dropped tags for being too common dropped both of them --
    // the two people most likely to be searched for.
    const people = collectPeople(VIDEOS).map((f) => f.value);
    expect(people).toContain("Stephen");
    expect(people).toContain("Michael");
  });

  it("offers people on only one video too, since that is how you reach it", () => {
    const facets = collectPeople(VIDEOS);
    expect(facets.some((f) => f.count === 1)).toBe(true);
  });

  it("counts truthfully", () => {
    for (const { value, count } of collectPeople(VIDEOS)) {
      expect(filterVideos(VIDEOS, { ...EMPTY_FILTERS, person: value })).toHaveLength(count);
    }
  });

  it("leaves out anyone the library does not mention", () => {
    const videos = [makeVideo({ id: "1", tags: ["Irene"] })];
    expect(collectPeople(videos)).toEqual([{ value: "Irene", count: 1 }]);
  });

  it("only ever offers names from the curated list", () => {
    const known = new Set(KNOWN_PEOPLE);
    for (const { value } of collectPeople(VIDEOS)) {
      expect(known.has(value)).toBe(true);
    }
  });
});

describe("collectLocations", () => {
  it("takes locations verbatim from the location field", () => {
    const videos = [
      makeVideo({ id: "1", location: "Maui" }),
      makeVideo({ id: "2", location: "Maui" }),
      makeVideo({ id: "3", location: "Iceland" }),
      makeVideo({ id: "4", location: undefined }),
    ];
    expect(collectLocations(videos)).toEqual([
      { value: "Maui", count: 2 },
      { value: "Iceland", count: 1 },
    ]);
  });

  it("counts truthfully across the real library", () => {
    for (const { value, count } of collectLocations(VIDEOS)) {
      expect(filterVideos(VIDEOS, { ...EMPTY_FILTERS, location: value })).toHaveLength(count);
    }
  });
});

describe("collectFilterTags", () => {
  it("offers a tag on a single video, because that is a way to reach it", () => {
    const videos = [
      makeVideo({ id: "1", tags: ["eclipse"], location: undefined }),
      makeVideo({ id: "2", tags: [], location: undefined }),
    ];
    expect(collectFilterTags(videos)).toEqual([{ value: "eclipse", count: 1 }]);
  });

  it("leaves people to the People control", () => {
    const videos = [makeVideo({ id: "1", tags: ["Stephen", "beach"], location: undefined })];
    expect(collectFilterTags(videos).map((f) => f.value)).toEqual(["beach"]);
  });

  it("leaves a tag that only repeats a location to the Location control", () => {
    const videos = [makeVideo({ id: "1", location: "Maui", tags: ["Maui", "beach"] })];
    expect(collectFilterTags(videos).map((f) => f.value)).toEqual(["beach"]);
  });

  it("orders by how many videos a tag covers, then alphabetically", () => {
    const videos = [
      makeVideo({ id: "1", tags: ["Many", "Few"], location: undefined }),
      makeVideo({ id: "2", tags: ["Many", "Few"], location: undefined }),
      makeVideo({ id: "3", tags: ["Many", "Also"], location: undefined }),
    ];
    expect(collectFilterTags(videos)).toEqual([
      { value: "Many", count: 3 },
      { value: "Few", count: 2 },
      { value: "Also", count: 1 },
    ]);
  });

  it("is about subject, not about who or where", () => {
    const names = collectFilterTags(VIDEOS).map((f) => f.value);
    const people = new Set(collectPeople(VIDEOS).map((f) => f.value));
    const places = new Set(collectLocations(VIDEOS).map((f) => f.value));

    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(people.has(name)).toBe(false);
      expect(places.has(name)).toBe(false);
    }
    expect(names).toContain("beach");
  });

  it("counts truthfully", () => {
    for (const { value, count } of collectFilterTags(VIDEOS)) {
      expect(filterVideos(VIDEOS, { ...EMPTY_FILTERS, tag: value })).toHaveLength(count);
    }
  });
});

describe("collectYears", () => {
  it("lists the years present, newest first, with counts", () => {
    const videos = [
      makeVideo({ id: "1", year: 2019 }),
      makeVideo({ id: "2", year: 2024 }),
      makeVideo({ id: "3", year: 2019 }),
    ];
    expect(collectYears(videos)).toEqual([
      { value: "2024", count: 1 },
      { value: "2019", count: 2 },
    ]);
  });

  it("stays chronological over the real library, not ordered by size", () => {
    const years = collectYears(VIDEOS).map((f) => Number(f.value));
    expect(years).toEqual([...years].sort((a, b) => b - a));
    expect(new Set(years).size).toBe(years.length);
  });
});

describe("activeFacetCount", () => {
  it("counts the axes that fold away, and not the search box", () => {
    expect(activeFacetCount(EMPTY_FILTERS)).toBe(0);
    // The search input stays on screen when the axes are collapsed, so badging
    // the disclosure for it would point at something already visible.
    expect(activeFacetCount({ ...EMPTY_FILTERS, query: "maui" })).toBe(0);
    expect(activeFacetCount({ ...EMPTY_FILTERS, year: 2019, tag: "beach" })).toBe(2);
    expect(
      activeFacetCount({
        query: "x",
        year: 2019,
        person: "Tom",
        location: "Maui",
        tag: "beach",
      }),
    ).toBe(4);
  });
});

describe("URL round trip", () => {
  it("survives a round trip through search params", () => {
    const filters = {
      query: "maui sunset",
      year: 2019,
      person: "Irene",
      location: "Big Island",
      tag: "beach",
    };
    expect(filtersFromSearchParams(searchParamsFromFilters(filters))).toEqual(filters);
  });

  it("writes nothing for empty filters, so a clean view has a clean URL", () => {
    expect(searchParamsFromFilters(EMPTY_FILTERS).toString()).toBe("");
  });

  it("ignores a year that is not a year", () => {
    expect(filtersFromSearchParams(new URLSearchParams("year=soon")).year).toBeNull();
    expect(filtersFromSearchParams(new URLSearchParams("year=-5")).year).toBeNull();
  });

  it("trims a whitespace-only query rather than treating it as active", () => {
    expect(hasActiveFilters({ ...EMPTY_FILTERS, query: "   " })).toBe(false);
    expect(searchParamsFromFilters({ ...EMPTY_FILTERS, query: "  x " }).get("q")).toBe("x");
  });

  it("treats each axis as active on its own", () => {
    expect(hasActiveFilters({ ...EMPTY_FILTERS, person: "Tom" })).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, location: "Maui" })).toBe(true);
  });
});

describe("filterVideos over the real library", () => {
  it("returns everything when nothing is set", () => {
    expect(filterVideos(VIDEOS, EMPTY_FILTERS)).toHaveLength(VIDEOS.length);
  });

  it("finds something for every option offered on every axis", () => {
    for (const { value } of collectYears(VIDEOS)) {
      expect(
        filterVideos(VIDEOS, { ...EMPTY_FILTERS, year: Number(value) }).length,
      ).toBeGreaterThan(0);
    }
    for (const { value } of [
      ...collectPeople(VIDEOS),
      ...collectLocations(VIDEOS),
      ...collectFilterTags(VIDEOS),
    ]) {
      const byPerson = filterVideos(VIDEOS, { ...EMPTY_FILTERS, person: value });
      const byLocation = filterVideos(VIDEOS, { ...EMPTY_FILTERS, location: value });
      const byTag = filterVideos(VIDEOS, { ...EMPTY_FILTERS, tag: value });
      expect(byPerson.length + byLocation.length + byTag.length).toBeGreaterThan(0);
    }
  });
});
