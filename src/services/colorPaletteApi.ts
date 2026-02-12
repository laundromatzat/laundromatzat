import { getApiUrl } from "@/utils/api";

export type ExtractedColor = {
  hex: string;
  rgb: [number, number, number];
};

export type ColorPalette = {
  id: number;
  file_name: string;
  image_data_url: string;
  palette_json: string;
  created_at: string;
};

export type ColorPaletteData = {
  id?: number;
  fileName: string;
  imageDataUrl: string;
  palette: ExtractedColor[];
};

/**
 * Save a new color palette to the backend
 */
export const savePalette = async (
  data: ColorPaletteData,
): Promise<ColorPalette> => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Authentication required");

  const response = await fetch(getApiUrl("/api/color-palettes"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      fileName: data.fileName,
      imageDataUrl: data.imageDataUrl,
      palette: data.palette,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to save palette");
  }

  return response.json();
};

/**
 * Load all color palettes for the authenticated user
 */
export const loadPalettes = async (): Promise<ColorPalette[]> => {
  const token = localStorage.getItem("token");
  if (!token) return [];

  const response = await fetch(getApiUrl("/api/color-palettes"), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.error("Failed to load palettes");
    return [];
  }

  const data = await response.json();
  return data.palettes || [];
};

/**
 * Delete a palette by ID
 */
export const deletePalette = async (paletteId: number): Promise<void> => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Authentication required");

  const response = await fetch(getApiUrl(`/api/color-palettes/${paletteId}`), {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete palette");
  }
};
