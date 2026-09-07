import rawProjects from "./data/projects.json";
import { Project } from "@/types";
import { parseProjectsFromJson } from "@/utils/projectData";

let parsedVideos: Project[] = [];
try {
  parsedVideos = parseProjectsFromJson(rawProjects as unknown);
} catch (error) {
  console.error("Failed to parse videos:", error);
  parsedVideos = [];
}

/** Every music video in the repository, straight from src/data/projects.json. */
export const VIDEOS: Project[] = parsedVideos;
