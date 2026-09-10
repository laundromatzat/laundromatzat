#!/usr/bin/env node
/**
 * Bakes per-video link-preview tags into static HTML after `vite build`.
 *
 * The site is a client-rendered SPA, so a crawler that fetches /vids/<slug>
 * receives the empty app shell — react-helmet only writes the real title,
 * description and og:image once React has mounted, which link unfurlers
 * (Slack, iMessage, Facebook, Bluesky, most search crawlers) never do. This
 * writes dist/vids/<slug>/index.html for every video, with the same tags the
 * running app would produce, so a shared link shows the video's own thumbnail
 * and blurb.
 *
 * The generated files are the same app shell plus a different <head>, so the
 * client router still takes over normally once the page loads.
 *
 * Run from `npm run build`, before index.html is copied to 404.html.
 */
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const PROJECTS_FILE = path.join(ROOT, "src", "data", "projects.json");

export const SITE_NAME = "Laundromatzat";
export const SITE_TITLE = "Music Videos";
export const SITE_DESCRIPTION =
  "Road films, holiday epics, and family travelogues spanning two decades.";

/** Mirrors src/utils/slugs.ts. */
export function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

/** Mirrors src/utils/projectDates.ts for the MM/YYYY shape projects.json uses. */
export function parseYearMonth(value) {
  const match = String(value ?? "").match(/^(\d{2})\/(\d{4})$/);
  if (!match) {
    return null;
  }

  const month = Number(match[1]);
  const year = Number(match[2]);
  return month >= 1 && month <= 12 ? year * 100 + month : null;
}

/** Mirrors compareProjectsByDateDesc: newest first, undated last. */
export function compareByDateDesc(a, b) {
  const aValue = parseYearMonth(a?.date);
  const bValue = parseYearMonth(b?.date);

  if (aValue === null && bValue === null) return 0;
  if (aValue === null) return 1;
  if (bValue === null) return -1;
  return bValue - aValue;
}

/** Mirrors src/utils/socialMetadata.ts. */
export function buildSocialMetadata(projects, project) {
  const fallbackImage = projects.find((candidate) => candidate.imageUrl)?.imageUrl;

  if (!project) {
    return {
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      path: "/",
      type: "website",
      image: fallbackImage,
      imageAlt: fallbackImage ? SITE_TITLE : undefined,
    };
  }

  const image = project.imageUrl ?? fallbackImage;

  return {
    title: project.title,
    description: project.description || SITE_DESCRIPTION,
    path: `/vids/${slugify(project.title)}`,
    type: "video.other",
    image,
    imageAlt: image ? project.title : undefined,
    videoUrl: project.projectUrl,
  };
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Renders the <head> block for one page. */
export function renderHeadTags(metadata, siteUrl) {
  const fullTitle = `${metadata.title} · ${SITE_NAME}`;
  const canonical = new URL(metadata.path, siteUrl).toString();

  const tags = [
    ["link", { rel: "canonical", href: canonical }],
    ["meta", { name: "description", content: metadata.description }],
    ["meta", { property: "og:site_name", content: SITE_NAME }],
    ["meta", { property: "og:title", content: fullTitle }],
    ["meta", { property: "og:description", content: metadata.description }],
    ["meta", { property: "og:url", content: canonical }],
    ["meta", { property: "og:type", content: metadata.type }],
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    ["meta", { name: "twitter:title", content: fullTitle }],
    ["meta", { name: "twitter:description", content: metadata.description }],
  ];

  if (metadata.image) {
    tags.push(
      ["meta", { property: "og:image", content: metadata.image }],
      ["meta", { property: "og:image:alt", content: metadata.imageAlt ?? metadata.title }],
      ["meta", { name: "twitter:image", content: metadata.image }],
      ["meta", { name: "twitter:image:alt", content: metadata.imageAlt ?? metadata.title }],
    );
  }

  if (metadata.videoUrl) {
    tags.push(
      ["meta", { property: "og:video", content: metadata.videoUrl }],
      ["meta", { property: "og:video:secure_url", content: metadata.videoUrl }],
      ["meta", { property: "og:video:type", content: "video/mp4" }],
    );
  }

  const rendered = tags.map(([tag, attributes]) => {
    const serialized = Object.entries(attributes)
      .map(([key, value]) => `${key}="${escapeHtml(value)}"`)
      .join(" ");
    return `    <${tag} ${serialized} data-prerendered />`;
  });

  return [`    <title>${escapeHtml(fullTitle)}</title>`, ...rendered].join("\n");
}

/**
 * Swaps the shell's <title> and appends the prerendered tags.
 *
 * The shell title is removed rather than left in place: unfurlers take the
 * first <title> they find, so a leftover would win over the per-video one.
 */
export function injectHead(shellHtml, headTags) {
  const withoutTitle = shellHtml.replace(/[ \t]*<title>[\s\S]*?<\/title>\n?/i, "");

  if (!/<\/head>/i.test(withoutTitle)) {
    throw new Error("Built index.html has no </head> to inject into.");
  }

  return withoutTitle.replace(/<\/head>/i, `${headTags}\n  </head>`);
}

/** A sitemap so search engines find every video page, not just the index. */
export function renderSitemap(metadataList, siteUrl) {
  const entries = metadataList
    .map((metadata) => {
      const loc = escapeHtml(new URL(metadata.path, siteUrl).toString());
      return `  <url><loc>${loc}</loc></url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
}

async function main() {
  const siteUrl = process.env.VITE_SITE_URL ?? "https://laundromatzat.com";
  const shellPath = path.join(DIST, "index.html");

  let shellHtml;
  try {
    shellHtml = await fs.readFile(shellPath, "utf8");
  } catch {
    throw new Error(`No built app shell at ${shellPath}. Run "vite build" first.`);
  }

  const projects = JSON.parse(await fs.readFile(PROJECTS_FILE, "utf8"));
  const ordered = [...projects].sort(compareByDateDesc);

  // The library index, so a link to the site root unfurls too.
  await fs.writeFile(
    shellPath,
    injectHead(shellHtml, renderHeadTags(buildSocialMetadata(ordered), siteUrl)),
    "utf8",
  );

  const seen = new Set();
  const sitemapEntries = [buildSocialMetadata(ordered)];
  let written = 0;

  for (const project of ordered) {
    const slug = slugify(project.title);
    if (!slug) {
      console.warn(`  skipped "${project.title}" — title produces an empty slug`);
      continue;
    }
    if (seen.has(slug)) {
      console.warn(`  skipped "${project.title}" — slug "${slug}" is already taken`);
      continue;
    }
    seen.add(slug);

    const metadata = buildSocialMetadata(ordered, project);
    const html = injectHead(shellHtml, renderHeadTags(metadata, siteUrl));

    // Both spellings, because the shared link has no trailing slash and static
    // hosts disagree about how to resolve it: GitHub Pages redirects
    // /vids/<slug> to the directory index, other hosts look for <slug>.html.
    // Whichever one the host picks, it gets this video's tags.
    await fs.mkdir(path.join(DIST, "vids", slug), { recursive: true });
    await fs.writeFile(path.join(DIST, "vids", slug, "index.html"), html, "utf8");
    await fs.writeFile(path.join(DIST, "vids", `${slug}.html`), html, "utf8");
    sitemapEntries.push(metadata);
    written += 1;
  }

  await fs.writeFile(
    path.join(DIST, "sitemap.xml"),
    renderSitemap(sitemapEntries, siteUrl),
    "utf8",
  );

  console.log(
    `prerender: wrote ${written} video pages, the index, and sitemap.xml (base ${siteUrl})`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`prerender failed: ${error.message}`);
    process.exit(1);
  });
}
