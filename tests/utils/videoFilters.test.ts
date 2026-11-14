import { describe, expect, it } from "vitest";
import { VIDEOS } from "@/constants";
import REGIONS from "@/data/locations.json";
import {
  EMPTY_FILTERS,
  KNOWN_PEOPLE,
  Region,
  UNGROUPED_HEADING,
  activeFacetCount,
  collectLocationSections,
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
    // Tags are no longer shown, but they are still how "roadtrip" is found.
    for (const query of ["drift", "desert", "new mexico", "irene", "roadtrip"]) {
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

  it("treats several years as alternatives", () => {
    expect(matchesFilters(video, { ...EMPTY_FILTERS, years: [2019] })).toBe(true);
    expect(matchesFilters(video, { ...EMPTY_FILTERS, years: [2018, 2019] })).toBe(true);
    expect(matchesFilters(video, { ...EMPTY_FILTERS, years: [2020, 2021] })).toBe(false);
  });

  it("treats several people as alternatives, matched against the tags", () => {
    // Emily OR Irene: Irene is in it, so it stays.
    expect(matchesFilters(video, { ...EMPTY_FILTERS, people: ["Emily", "Irene"] })).toBe(true);
    expect(matchesFilters(video, { ...EMPTY_FILTERS, people: ["Emily", "Tom"] })).toBe(false);
  });

  it("treats several locations as alternatives, each whole and exact", () => {
    expect(
      matchesFilters(video, { ...EMPTY_FILTERS, locations: ["Maui", "new mexico"] }),
    ).toBe(true);
    // A location is one place, not a prefix of one: "New" must not match.
    expect(matchesFilters(video, { ...EMPTY_FILTERS, locations: ["New"] })).toBe(false);
  });

  it("requires every axis that has picks, while picks within one are alternatives", () => {
    const all = {
      query: "drift",
      years: [2018, 2019],
      people: ["Tom", "Irene"],
      locations: ["Maui", "New Mexico"],
    };
    expect(matchesFilters(video, all)).toBe(true);
    expect(matchesFilters(video, { ...all, people: ["Tom"] })).toBe(false);
    expect(matchesFilters(video, { ...all, locations: ["Maui"] })).toBe(false);
    expect(matchesFilters(video, { ...all, years: [2020] })).toBe(false);
  });

  it("survives a video with no tags or location", () => {
    const sparse = makeVideo({ tags: undefined, location: undefined });
    expect(matchesFilters(sparse, EMPTY_FILTERS)).toBe(true);
    expect(matchesFilters(sparse, { ...EMPTY_FILTERS, people: ["Irene"] })).toBe(false);
    expect(matchesFilters(sparse, { ...EMPTY_FILTERS, locations: ["Maui"] })).toBe(false);
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
    expect(collectPeople(VIDEOS).some((f) => f.count === 1)).toBe(true);
  });

  it("counts truthfully", () => {
    for (const { value, count } of collectPeople(VIDEOS)) {
      expect(filterVideos(VIDEOS, { ...EMPTY_FILTERS, people: [value] })).toHaveLength(count);
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
});

describe("collectLocationSections", () => {
  const regions: Region[] = [
    {
      name: "United States",
      subregions: [
        { name: "West", places: { Maui: "Maui, HI", "Big Island": "Big Island, HI" } },
        { name: "Midwest", places: {} },
      ],
    },
    { name: "Europe", places: { Madrid: "Madrid, Spain" } },
    { name: "Antarctica", places: { "South Pole": "South Pole" } },
  ];

  it("files places under their region and subregion, with readable labels", () => {
    const videos = [
      makeVideo({ id: "1", location: "Maui" }),
      makeVideo({ id: "2", location: "Big Island" }),
      makeVideo({ id: "3", location: "Madrid" }),
    ];
    expect(collectLocationSections(videos, regions)).toEqual([
      { heading: "United States", depth: 0, options: [] },
      {
        heading: "West",
        depth: 1,
        options: [
          { value: "Big Island", label: "Big Island, HI", count: 1 },
          { value: "Maui", label: "Maui, HI", count: 1 },
        ],
      },
      { heading: "Europe", depth: 0, options: [{ value: "Madrid", label: "Madrid, Spain", count: 1 }] },
    ]);
  });

  it("leaves out a heading with nothing under it", () => {
    // Midwest is in the data with no places; Antarctica has a place but no video.
    const headings = collectLocationSections(
      [makeVideo({ id: "1", location: "Maui" })],
      regions,
    ).map((s) => s.heading);
    expect(headings).not.toContain("Midwest");
    expect(headings).not.toContain("Antarctica");
    expect(headings).not.toContain("Europe");
  });

  it("never loses a location the data does not mention yet", () => {
    // A new video somewhere nobody has filed must still be findable.
    const sections = collectLocationSections(
      [makeVideo({ id: "1", location: "Tokyo" })],
      regions,
    );
    expect(sections).toEqual([
      { heading: UNGROUPED_HEADING, depth: 0, options: [{ value: "Tokyo", count: 1 }] },
    ]);
  });

  it("can list one place under two regions, both selecting the same value", () => {
    const sections = collectLocationSections(
      [makeVideo({ id: "1", location: "Seattle and Vancouver" })],
      [
        {
          name: "United States",
          places: { "Seattle and Vancouver": "Seattle, WA and Vancouver, BC" },
        },
        { name: "Canada", places: { "Seattle and Vancouver": "Seattle, WA and Vancouver, BC" } },
      ],
    );
    expect(sections.map((s) => s.options[0].value)).toEqual([
      "Seattle and Vancouver",
      "Seattle and Vancouver",
    ]);
  });

  it("files every location in the real library, so nothing lands under Other", () => {
    const sections = collectLocationSections(VIDEOS);
    expect(sections.map((s) => s.heading)).not.toContain(UNGROUPED_HEADING);

    const offered = new Set(sections.flatMap((s) => s.options.map((o) => o.value)));
    for (const { value } of collectLocations(VIDEOS)) {
      expect(offered.has(value)).toBe(true);
    }
  });

  it("only files places under regions that exist in the data", () => {
    const regionNames = new Set(
      (REGIONS as { name: string; subregions?: { name: string }[] }[]).flatMap((r) => [
        r.name,
        ...(r.subregions ?? []).map((s) => s.name),
      ]),
    );
    for (const { heading } of collectLocationSections(VIDEOS)) {
      expect(regionNames.has(heading)).toBe(true);
    }
  });

  it("counts truthfully", () => {
    for (const section of collectLocationSections(VIDEOS)) {
      for (const { value, count } of section.options) {
        expect(filterVideos(VIDEOS, { ...EMPTY_FILTERS, locations: [value] })).toHaveLength(
          count,
        );
      }
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
  it("counts every pick on the folded-away axes, and not the search box", () => {
    expect(activeFacetCount(EMPTY_FILTERS)).toBe(0);
    // The search input stays on screen when the axes are collapsed, so badging
    // the disclosure for it would point at something already visible.
    expect(activeFacetCount({ ...EMPTY_FILTERS, query: "maui" })).toBe(0);
    expect(
      activeFacetCount({ ...EMPTY_FILTERS, years: [2020, 2021], people: ["Eli"] }),
    ).toBe(3);
  });
});

describe("URL round trip", () => {
  it("survives a round trip with several values per axis", () => {
    const filters = {
      query: "maui sunset",
      years: [2020, 2021],
      people: ["Emily", "Eli"],
      locations: ["Big Island", "Oak Creek Apartments | Stanford"],
    };
    expect(filtersFromSearchParams(searchParamsFromFilters(filters))).toEqual(filters);
  });

  it("repeats a parameter per pick, so values may contain commas", () => {
    const params = searchParamsFromFilters({ ...EMPTY_FILTERS, years: [2020, 2021] });
    expect(params.toString()).toBe("year=2020&year=2021");
  });

  it("still reads a single-value link from before multiple selection", () => {
    const filters = filtersFromSearchParams(new URLSearchParams("year=2019&person=Tom"));
    expect(filters.years).toEqual([2019]);
    expect(filters.people).toEqual(["Tom"]);
  });

  it("ignores the old tag parameter now that tags are not a filter", () => {
    const filters = filtersFromSearchParams(new URLSearchParams("tag=beach"));
    expect(hasActiveFilters(filters)).toBe(false);
  });

  it("writes nothing for empty filters, so a clean view has a clean URL", () => {
    expect(searchParamsFromFilters(EMPTY_FILTERS).toString()).toBe("");
  });

  it("drops years that are not years, and repeats", () => {
    expect(
      filtersFromSearchParams(new URLSearchParams("year=soon&year=-5&year=2019&year=2019"))
        .years,
    ).toEqual([2019]);
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

  it("adds up two years rather than intersecting them", () => {
    const [first, second] = collectYears(VIDEOS);
    const both = filterVideos(VIDEOS, {
      ...EMPTY_FILTERS,
      years: [Number(first.value), Number(second.value)],
    });
    expect(both).toHaveLength(first.count + second.count);
  });

  it("finds something for every option offered on every axis", () => {
    for (const { value } of collectYears(VIDEOS)) {
      expect(
        filterVideos(VIDEOS, { ...EMPTY_FILTERS, years: [Number(value)] }).length,
      ).toBeGreaterThan(0);
    }
    for (const { value } of collectPeople(VIDEOS)) {
      expect(filterVideos(VIDEOS, { ...EMPTY_FILTERS, people: [value] }).length).toBeGreaterThan(0);
    }
    for (const section of collectLocationSections(VIDEOS)) {
      for (const { value } of section.options) {
        expect(
          filterVideos(VIDEOS, { ...EMPTY_FILTERS, locations: [value] }).length,
        ).toBeGreaterThan(0);
      }
    }
  });
});
