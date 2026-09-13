import { describe, expect, it } from "vitest";
import { VIDEOS } from "@/constants";
import {
  EMPTY_FILTERS,
  collectFilterTags,
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
    tags: ["Michael", "Irene"],
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

  it("matches a tag exactly, not as a substring", () => {
    expect(matchesFilters(video, { ...EMPTY_FILTERS, tag: "Irene" })).toBe(true);
    expect(matchesFilters(video, { ...EMPTY_FILTERS, tag: "Iren" })).toBe(false);
  });

  it("combines filters with AND", () => {
    expect(matchesFilters(video, { query: "drift", year: 2019, tag: "Irene" })).toBe(true);
    expect(matchesFilters(video, { query: "drift", year: 2020, tag: "Irene" })).toBe(false);
  });

  it("survives a video with no tags or location", () => {
    const sparse = makeVideo({ tags: undefined, location: undefined });
    expect(matchesFilters(sparse, EMPTY_FILTERS)).toBe(true);
    expect(matchesFilters(sparse, { ...EMPTY_FILTERS, tag: "Irene" })).toBe(false);
  });
});

describe("collectFilterTags", () => {
  /** Ten videos: enough that a share of the library means something. */
  function library(tagsFor: (index: number) => string[]) {
    return Array.from({ length: 10 }, (_, i) =>
      makeVideo({ id: String(i), tags: tagsFor(i) }),
    );
  }

  it("drops tags on a single video, which filter to the card you just clicked", () => {
    const videos = library((i) => (i < 3 ? ["Shared"] : i === 3 ? ["Lonely"] : []));
    expect(collectFilterTags(videos).map((f) => f.tag)).toEqual(["Shared"]);
  });

  it("drops a tag on nearly everything, which narrows nothing", () => {
    const videos = library((i) => (i < 3 ? ["video", "Rare"] : ["video"]));
    const tags = collectFilterTags(videos).map((f) => f.tag);
    expect(tags).not.toContain("video");
    expect(tags).toContain("Rare");
  });

  it("orders by how many videos a tag covers", () => {
    const videos = library((i) => {
      const tags = [];
      if (i < 5) tags.push("Many");
      if (i < 2) tags.push("Few");
      return tags;
    });
    expect(collectFilterTags(videos)).toEqual([
      { tag: "Many", count: 5 },
      { tag: "Few", count: 2 },
    ]);
  });

  it("offers nothing for a library too small for a share to mean anything", () => {
    // Two videos sharing a tag is 100% of the library, which narrows nothing.
    // FilterBar hides the group when this is empty, which is the right answer:
    // a library this size does not need filtering.
    const videos = [
      makeVideo({ id: "1", tags: ["Both"] }),
      makeVideo({ id: "2", tags: ["Both"] }),
    ];
    expect(collectFilterTags(videos)).toEqual([]);
  });

  it("picks usable chips out of the real library", () => {
    const facets = collectFilterTags(VIDEOS);
    const names = facets.map((f) => f.tag);

    // "video" is on nearly every entry and "Michael" on most: both are buttons
    // that would do nothing.
    expect(names).not.toContain("video");
    expect(names).not.toContain("Michael");
    expect(facets.length).toBeGreaterThan(0);
    // Every chip narrows: on more than one video, and on no more than the
    // share above which a filter stops filtering. Asserting the property
    // rather than a count, so enriching the tags cannot fail the build.
    expect(facets.every((f) => f.count > 1)).toBe(true);
    expect(facets.every((f) => f.count <= VIDEOS.length * 0.6)).toBe(true);
  });
});

describe("collectYears", () => {
  it("lists the years present, newest first, without repeats", () => {
    const videos = [
      makeVideo({ id: "1", year: 2019 }),
      makeVideo({ id: "2", year: 2024 }),
      makeVideo({ id: "3", year: 2019 }),
    ];
    expect(collectYears(videos)).toEqual([2024, 2019]);
  });

  it("covers the real library's span", () => {
    const years = collectYears(VIDEOS);
    expect(years).toEqual([...years].sort((a, b) => b - a));
    expect(new Set(years).size).toBe(years.length);
  });
});

describe("URL round trip", () => {
  it("survives a round trip through search params", () => {
    const filters = { query: "maui sunset", year: 2019, tag: "Irene" };
    const restored = filtersFromSearchParams(searchParamsFromFilters(filters));
    expect(restored).toEqual(filters);
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
});

describe("filterVideos over the real library", () => {
  it("returns everything when nothing is set", () => {
    expect(filterVideos(VIDEOS, EMPTY_FILTERS)).toHaveLength(VIDEOS.length);
  });

  it("narrows to a subset for each offered chip", () => {
    for (const { tag, count } of collectFilterTags(VIDEOS)) {
      const matched = filterVideos(VIDEOS, { ...EMPTY_FILTERS, tag });
      expect(matched).toHaveLength(count);
      expect(matched.length).toBeLessThan(VIDEOS.length);
    }
  });

  it("finds something for every year offered", () => {
    for (const year of collectYears(VIDEOS)) {
      expect(filterVideos(VIDEOS, { ...EMPTY_FILTERS, year }).length).toBeGreaterThan(0);
    }
  });
});
