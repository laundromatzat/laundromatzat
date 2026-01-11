import { Project } from "@/types";

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

export function getProjectSlug(project: Project): string {
  return slugify(project.title);
}

export function findProjectBySlug(
  projects: Project[],
  slug?: string
): Project | undefined {
  if (!slug) return undefined;

  // Try exact match first (case insensitive for safety, though slugs should be lowercase)
  const normalizedSlug = slug.toLowerCase();

  return projects.find((p) => getProjectSlug(p) === normalizedSlug);
}
