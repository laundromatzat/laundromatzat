import { describe, expect, it } from "vitest";
import { matchPath } from "react-router-dom";

describe("video deep links", () => {
  // scripts/prerender.mjs writes dist/vids/<slug>/index.html, and GitHub Pages
  // redirects /vids/<slug> to /vids/<slug>/ to serve it. The client router has
  // to pick the video back up from that redirected path, or a shared link would
  // land on the grid instead of the video.
  it("matches with or without a trailing slash", () => {
    expect(matchPath("/vids/:slug", "/vids/drift-away")?.params.slug).toBe(
      "drift-away",
    );
    expect(matchPath("/vids/:slug", "/vids/drift-away/")?.params.slug).toBe(
      "drift-away",
    );
  });
});
