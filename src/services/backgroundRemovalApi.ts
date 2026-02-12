import { getApiUrl } from "@/utils/api";

export type BackgroundRemovalJob = {
  id: number;
  file_name: string;
  source_image_data_url: string;
  result_image_data_url: string;
  created_at: string;
};

export type BackgroundRemovalJobData = {
  id?: number;
  fileName: string;
  sourceImageDataUrl: string;
  resultImageDataUrl: string;
};

/**
 * Save a new background removal job to the backend
 */
export const saveJob = async (
  data: BackgroundRemovalJobData,
): Promise<BackgroundRemovalJob> => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Authentication required");

  const response = await fetch(getApiUrl("/api/background-removal/jobs"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      fileName: data.fileName,
      sourceImageDataUrl: data.sourceImageDataUrl,
      resultImageDataUrl: data.resultImageDataUrl,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to save job");
  }

  return response.json();
};

/**
 * Load all background removal jobs for the authenticated user
 */
export const loadJobs = async (): Promise<BackgroundRemovalJob[]> => {
  const token = localStorage.getItem("token");
  if (!token) return [];

  const response = await fetch(getApiUrl("/api/background-removal/jobs"), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.error("Failed to load jobs");
    return [];
  }

  const data = await response.json();
  return data.jobs || [];
};

/**
 * Delete a job by ID
 */
export const deleteJob = async (jobId: number): Promise<void> => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Authentication required");

  const response = await fetch(
    getApiUrl(`/api/background-removal/jobs/${jobId}`),
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete job");
  }
};
