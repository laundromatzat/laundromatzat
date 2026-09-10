import { describe, expect, it } from "vitest";
import rawProjects from "@/data/projects.json";
import { VIDEOS } from "@/constants";
import { compareProjectsByDateDesc } from "@/utils/projectDates";
import { getProjectSlug } from "@/utils/slugs";
import { buildSocialMetadata } from "@/utils/socialMetadata";
import {
  buildSocialMetadata as buildSocialMetadataMjs,
  compareByDateDesc,
  escapeHtml,
  injectHead,
  renderHeadTags,
  renderSitemap,
  slugify as slugifyMjs,
} from "../../scripts/prerender.mjs";

const SITE_URL = "https://laundromatzat.com";

const orderedApp = [...VIDEOS].sort(compareProjectsByDateDesc);
const orderedScript = [...(rawProjects as { title: string; date: string }[])].sort(
  compareByDateDesc,
);

describe("prerender mirrors the app's metadata", () => {
  it("slugifies titles the same way", () => {
    for (const project of VIDEOS) {
      expect(slugifyMjs(project.title)).toBe(getProjectSlug(project));
    }
  });

  it("orders videos the same way", () => {
    expect(orderedScript.map((project) => slugifyMjs(project.title))).toEqual(
      orderedApp.map(getProjectSlug),
    );
  });

  it("produces the same social metadata for every video", () => {
    for (let index = 0; index < orderedApp.length; index += 1) {
      expect(buildSocialMetadataMjs(orderedScript, orderedScript[index])).toEqual(
        buildSocialMetadata(orderedApp, orderedApp[index]),
      );
    }
  });

  it("produces the same social metadata for the library index", () => {
    expect(buildSocialMetadataMjs(orderedScript)).toEqual(
      buildSocialMetadata(orderedApp),
    );
  });
});

describe("renderHeadTags", () => {
  const metadata = {
    title: 'Ampersands & "Quotes"',
    description: "A <script> in the blurb.",
    path: "/vids/ampersands-quotes",
    type: "video.other" as const,
    image: "https://example.com/a.webp?token=1&x=2",
    imageAlt: 'Ampersands & "Quotes"',
    videoUrl: "https://example.com/a.m4v?token=3&y=4",
  };

  it("escapes text that would otherwise break the attribute", () => {
    const html = renderHeadTags(metadata, SITE_URL);
    expect(html).toContain("Ampersands &amp; &quot;Quotes&quot;");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("a.webp?token=1&amp;x=2");
    // No raw quote or angle bracket survives into the markup: every line of
    // attributes has to stay balanced or the tag would be truncated.
    expect(html).not.toContain('"Quotes"');
    expect(html).not.toContain("<script>");
    for (const line of html.split("\n")) {
      expect((line.match(/"/g) ?? []).length % 2).toBe(0);
    }
  });

  it("emits an absolute canonical and og:url", () => {
    const html = renderHeadTags(metadata, SITE_URL);
    expect(html).toContain(`href="${SITE_URL}/vids/ampersands-quotes"`);
    expect(html).toContain(`content="${SITE_URL}/vids/ampersands-quotes"`);
  });

  it("omits image and video tags when the video has neither", () => {
    const html = renderHeadTags(
      { ...metadata, image: undefined, imageAlt: undefined, videoUrl: undefined },
      SITE_URL,
    );
    expect(html).not.toContain("og:image");
    expect(html).not.toContain("og:video");
  });

  it("marks every injected meta and link so the app can drop it on hydration", () => {
    const html = renderHeadTags(metadata, SITE_URL);
    const injected = html.split("\n").filter((line) => /<(meta|link) /.test(line));
    expect(injected.length).toBeGreaterThan(0);
    expect(injected.every((line) => line.includes("data-prerendered"))).toBe(true);
  });
});

describe("injectHead", () => {
  const shell = `<!doctype html>
<html><head>
    <meta charset="UTF-8" />
    <title>laundromatzat · music videos</title>
  </head><body></body></html>`;

  it("replaces the shell title so only one survives", () => {
    const html = injectHead(shell, renderHeadTags(
      { title: "T", description: "D", path: "/", type: "website" },
      SITE_URL,
    ));
    expect(html.match(/<title>/g)).toHaveLength(1);
    expect(html).toContain("<title>T · Laundromatzat</title>");
  });

  it("keeps the rest of the shell intact", () => {
    const html = injectHead(shell, "    <meta name=\"x\" content=\"y\" />");
    expect(html).toContain('<meta charset="UTF-8" />');
    expect(html).toContain("<body></body>");
  });

  it("fails loudly if the shell has no head", () => {
    expect(() => injectHead("<html><body></body></html>", "")).toThrow(/<\/head>/);
  });
});

describe("renderSitemap", () => {
  it("lists one absolute URL per page", () => {
    const xml = renderSitemap(
      [
        { path: "/", title: "", description: "", type: "website" as const },
        { path: "/vids/a", title: "", description: "", type: "video.other" as const },
      ],
      SITE_URL,
    );
    expect(xml).toContain("<loc>https://laundromatzat.com/</loc>");
    expect(xml).toContain("<loc>https://laundromatzat.com/vids/a</loc>");
    expect(xml.match(/<url>/g)).toHaveLength(2);
  });
});

describe("escapeHtml", () => {
  it("escapes the four characters that matter inside an attribute", () => {
    expect(escapeHtml('&<>"')).toBe("&amp;&lt;&gt;&quot;");
  });
});
