import { describe, expect, it } from "vitest";
import rawProjects from "@/data/projects.json";
import { orderByPayload, pendingVideos } from "../../scripts/transcode-all.mjs";

type Entry = { title: string; projectUrl?: string; streamUrl?: string };

describe("pendingVideos", () => {
  it("skips videos that already stream, so a re-run resumes", () => {
    const queue = pendingVideos([
      { title: "A", projectUrl: "a.m4v" },
      { title: "B", projectUrl: "b.m4v", streamUrl: "b.m3u8" },
      { title: "C", projectUrl: "c.m4v" },
    ]);
    expect(queue.map((v: Entry) => v.title)).toEqual(["A", "C"]);
  });

  it("skips an entry with no source file to transcode", () => {
    expect(pendingVideos([{ title: "A" }])).toEqual([]);
  });

  it("agrees with the real library about what is left", () => {
    const projects = rawProjects as Entry[];
    const queue = pendingVideos(projects);
    expect(queue.every((v: Entry) => !v.streamUrl)).toBe(true);
    expect(queue.length).toBe(projects.filter((v) => v.projectUrl && !v.streamUrl).length);
  });
});

describe("orderByPayload", () => {
  it("puts the heaviest sources first, since they cost visitors the most", () => {
    const sizes = new Map([
      ["small", 100],
      ["huge", 900],
      ["middling", 400],
    ]);
    const ordered = orderByPayload(
      [{ title: "small" }, { title: "huge" }, { title: "middling" }],
      sizes,
    );
    expect(ordered.map((v: Entry) => v.title)).toEqual(["huge", "middling", "small"]);
  });

  it("treats an unmeasured source as last rather than dropping it", () => {
    const ordered = orderByPayload(
      [{ title: "unknown" }, { title: "known" }],
      new Map([["known", 5]]),
    );
    expect(ordered.map((v: Entry) => v.title)).toEqual(["known", "unknown"]);
  });

  it("does not mutate the queue it was given", () => {
    const input = [{ title: "a" }, { title: "b" }];
    orderByPayload(input, new Map([["b", 10]]));
    expect(input.map((v) => v.title)).toEqual(["a", "b"]);
  });
});
