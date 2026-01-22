import { getApiUrl } from "@/utils/api";
import { CarvingVariation, GeneratedDesign } from "./woodCarvingService";

export type WoodCarvingProject = {
  id: number;
  description: string;
  variations: CarvingVariation[];
  selectedVariation: CarvingVariation | null;
  blueprint: GeneratedDesign | null;
  createdAt: string;
};

export type WoodCarvingProjectData = {
  id?: number;
  description: string;
  variations?: CarvingVariation[];
  selectedVariation?: CarvingVariation | null;
  blueprint?: GeneratedDesign | null;
};

/**
 * Save a new project to the backend
 */
export const saveProject = async (
  data: WoodCarvingProjectData,
): Promise<WoodCarvingProject> => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Authentication required");

  const response = await fetch(getApiUrl("/api/wood-carving/projects"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      description: data.description,
      variations: data.variations || [],
      selectedVariation: data.selectedVariation || null,
      blueprint: data.blueprint || null,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to save project");
  }

  return response.json();
};

/**
 * Update an existing project
 */
export const updateProject = async (
  id: number,
  data: WoodCarvingProjectData,
): Promise<WoodCarvingProject> => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Authentication required");

  const response = await fetch(getApiUrl(`/api/wood-carving/projects/${id}`), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      description: data.description,
      variations: data.variations || [],
      selectedVariation: data.selectedVariation || null,
      blueprint: data.blueprint || null,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update project");
  }

  return response.json();
};

/**
 * Load all projects for the authenticated user
 */
export const loadProjects = async (): Promise<WoodCarvingProject[]> => {
  const token = localStorage.getItem("token");
  if (!token) return [];

  const response = await fetch(getApiUrl("/api/wood-carving/projects"), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.error("Failed to load projects");
    return [];
  }

  const data = await response.json();
  return data.projects || [];
};

/**
 * Delete a project by ID
 */
export const deleteProject = async (projectId: number): Promise<void> => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Authentication required");

  const response = await fetch(
    getApiUrl(`/api/wood-carving/projects/${projectId}`),
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete project");
  }
};
