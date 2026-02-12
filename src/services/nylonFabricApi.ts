import { getApiUrl } from "@/utils/api";

export type NylonFabricDesign = {
  id: number;
  design_name: string;
  instruction_image_url: string | null;
  nylon_image_url: string | null;
  prompts: Record<string, unknown> | null;
  created_at: string;
};

export type NylonFabricDesignData = {
  id?: number;
  designName: string;
  instructionImageUrl?: string;
  nylonImageUrl?: string;
  prompts?: Record<string, unknown>;
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
      designName: data.designName,
      instructionImageUrl: data.instructionImageUrl,
      nylonImageUrl: data.nylonImageUrl,
      prompts: data.prompts,
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
