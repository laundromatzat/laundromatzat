import { getApiUrl } from "@/utils/api";

export type NylonFabricDesign = {
  id: number;
  project_name: string;
  description: string;
  guide_text: string;
  visuals_json: string;
  created_at: string;
};

export type NylonFabricDesignData = {
  id?: number;
  projectName: string;
  description: string;
  guideText: string;
  visuals: { stage: string; svg: string }[];
};

/**
 * Save a new nylon fabric design to the backend
 */
export const saveDesign = async (
  data: NylonFabricDesignData,
  authToken?: string,
): Promise<NylonFabricDesign> => {
  const token = authToken || localStorage.getItem("token");
  if (!token) throw new Error("Authentication required");

  const response = await fetch(getApiUrl("/api/nylon-fabric-designs"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      projectName: data.projectName,
      description: data.description,
      guideText: data.guideText,
      visuals: data.visuals,
    }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Invalid token - Please log in again");
    }
    try {
      const error = await response.json();
      throw new Error(error.error || "Failed to save design");
    } catch {
      throw new Error(`Failed to save design (${response.status})`);
    }
  }

  return response.json();
};

/**
 * Load all nylon fabric designs for the authenticated user
 */
export const loadDesigns = async (): Promise<NylonFabricDesign[]> => {
  const token = localStorage.getItem("token");
  if (!token) return [];

  const response = await fetch(getApiUrl("/api/nylon-fabric-designs"), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.error("Failed to load designs");
    return [];
  }

  const data = await response.json();
  return data.designs || [];
};

/**
 * Delete a design by ID
 */
export const deleteDesign = async (designId: number): Promise<void> => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Authentication required");

  const response = await fetch(
    getApiUrl(`/api/nylon-fabric-designs/${designId}`),
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete design");
  }
};
