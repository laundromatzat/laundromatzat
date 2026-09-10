import { Project } from "@/types";
import { getProjectSlug } from "./slugs";

/** Title and blurb used for the library index and as the fallback everywhere. */
export const SITE_TITLE = "Music Videos";
export const SITE_DESCRIPTION =
  "Road films, holiday epics, and family travelogues spanning two decades.";

export interface SocialMetadata {
  title: string;
  description: string;
  path: string;
  type: "website" | "video.other";
  image?: string;
  imageAlt?: string;
  videoUrl?: string;
}

/**
 * The tags a link unfurler should see for a given page.
 *
 * `scripts/prerender.mjs` bakes the same values into static HTML at build time,
 * because crawlers do not run the client router. `tests/utils/socialMetadata.test.ts`
 * asserts the two implementations stay in agreement.
 */
export function buildSocialMetadata(
  projects: Project[],
  project?: Project,
): SocialMetadata {
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
    path: `/vids/${getProjectSlug(project)}`,
    type: "video.other",
    image,
    imageAlt: image ? project.title : undefined,
    videoUrl: project.projectUrl,
  };
}
