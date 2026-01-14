import createDOMPurify from "dompurify";
import { z } from "zod";
import { generateContent } from "./geminiClient";
import { GoogleGenAI, Part } from "@google/genai";

type ContentFetcher = (prompt: string) => Promise<string>;

type WoodCarvingServiceOptions = {
  contentFetcher?: ContentFetcher;
  onResearchStart?: () => void;
  onResearchComplete?: (findings: string) => void;
};

type DOMPurifyInstance = ReturnType<typeof createDOMPurify>;

let domPurifyInstance: DOMPurifyInstance | null = null;

function getDomPurify(): DOMPurifyInstance | null {
  if (typeof window === "undefined" || !window.document) {
    return null;
  }

  if (!domPurifyInstance) {
    domPurifyInstance = createDOMPurify(window);
  }

  return domPurifyInstance;
}

function stripExecutableContent(markup: string): string {
  if (!markup) return "";

  let previous: string;
  let current = markup;

  do {
    previous = current;
    current = previous
      // Remove script tags (case-insensitive, handles various formats)
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      // Remove style tags
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
      // Remove all event handlers (on*)
      .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "")
      .replace(/\s*on\w+\s*=\s*[^\s>]+/gi, "")
      // Remove javascript: protocol
      .replace(/javascript:/gi, "")
      // Remove data: URIs that could contain scripts
      .replace(/data:text\/html[^"'\s>]*/gi, "");
  } while (current !== previous);

  return current;
}

async function sanitizeSvg(svgMarkup: string): Promise<string> {
  if (!svgMarkup) {
    return "";
  }

  const domPurify = getDomPurify();
  if (!domPurify) {
    return stripExecutableContent(svgMarkup);
  }

  return domPurify.sanitize(svgMarkup, {
    FORBID_TAGS: ["script"],
    FORBID_ATTR: ["onload", "onerror", "onclick", "onmouseover", "onfocus"],
    USE_PROFILES: { svg: true, svgFilters: true },
  });
}

// Existing Detail Schema
const DetailedImageSchema = z.object({
  view: z.string(),
  svg: z.string(),
});
const DetailedImagesResponseSchema = z.array(DetailedImageSchema);

export interface CarvingVariation {
  name: string;
  description: string;
  imageUrl: string;
}

export interface DetailedImage {
  view: string;
  svg: string;
}

// --- CarveCraft Types ---

export enum Unit {
  INCHES = "inches",
  MM = "mm",
}

export interface GeneratedDesign {
  conceptUrl: string;
  schematicUrl: string;
  guideText: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface MeasurementLine {
  id: string;
  p1: Point;
  p2: Point;
  distanceUnits: number;
}

export interface MeasurementState {
  referenceHeightPhysical: number;
  referenceLinePixels: number | null;
  pixelsPerUnit: number | null;
  measurements: MeasurementLine[];
}

// --- Existing Variation Logic ---

export async function generateCarvingVariations(
  description: string
): Promise<CarvingVariation[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("API Key not configured");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Styles kept for user selection variety, but prompt is unified for quality
  const styles = [
    {
      name: "Realistic",
      desc: "High-fidelity detailing",
    },
    {
      name: "Geometric",
      desc: "Clean modern lines",
    },
    {
      name: "Relief",
      desc: "Deep depth carving",
    },
    {
      name: "Abstract",
      desc: "Artistic interpretation",
    },
  ];

  const generateVariation = async (style: (typeof styles)[0]) => {
    // Exact prompt structure from carvecraft/services/geminiService.ts
    // We inject the style name minimally to ensure variety without breaking the "masterpiece" phrasing
    const prompt = `A finished, polished ${style.name} style wood carving of ${description}. Photorealistic, studio lighting, masterpiece, detailed texture of wood grain. Isolated on a neutral background.`;

    try {
      const result = await ai.models.generateContent({
        model: "gemini-3-pro-image-preview",
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K",
          },
        },
      });

      console.log(
        `[DEBUG] Raw API Result for ${style.name}:`,
        JSON.stringify(result, null, 2)
      );

      let imageUrl = "";

      // Check for candidates on result directly (common in some SDK versions) OR result.response
      const candidates =
        result.candidates || result?.response?.candidates || [];
      const parts = candidates?.[0]?.content?.parts || [];

      for (const part of parts) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }

      if (!imageUrl) {
        console.warn(
          `Failed to generate image for ${style.name}: `,
          result?.response?.text ? result.response.text() : "No image data"
        );
        return null;
      }

      return {
        name: style.name,
        description: style.desc,
        imageUrl: imageUrl,
      };
    } catch (e) {
      console.error(`Error generating ${style.name}: `, e);
      return null;
    }
  };

  const results = await Promise.all(styles.map((s) => generateVariation(s)));
  const validResults = results.filter((r): r is CarvingVariation => r !== null);

  if (validResults.length === 0) {
    throw new Error(
      "Failed to generate any image variations. Please check your API key/Model access."
    );
  }

  return validResults;
}

export async function generateDetailedImages(
  originalDescription: string,
  selectedVariation: CarvingVariation,
  userNotes?: string,
  _apiKey?: string,
  options?: WoodCarvingServiceOptions
): Promise<DetailedImage[]> {
  // Legacy function placeholder - can be implemented or removed in future cleanup.

  const notesContext = userNotes
    ? `\n\nUSER REQUESTED CHANGES:\n${userNotes}\n\nIncorporate these changes into the detailed renderings.`
    : "";

  const prompt = `For this wood carving design:

ORIGINAL PROJECT: "${originalDescription}"

SELECTED VARIATION: ${selectedVariation.name}
Description: ${selectedVariation.description}
${notesContext}

Create 3 highly detailed views of this carving design:

1. FRONT VIEW - Detailed frontal perspective showing the main carved elements
2. ANGLED VIEW - 3/4 perspective showing depth and relief carving details
3. DETAIL CLOSEUP - Zoomed view highlighting intricate carving details and wood texture

Return ONLY a JSON array (no markdown, no backticks) with this structure:
[
  {
    "view": "Front View",
    "svg": "<svg width='600' height='600' xmlns='http://www.w3.org/2000/svg'><!-- complete detailed SVG code --></svg>"
  },
  {
    "view": "Angled View",
    "svg": "<svg width='600' height='600' xmlns='http://www.w3.org/2000/svg'><!-- complete detailed SVG code --></svg>"
  },
  {
    "view": "Detail Closeup",
    "svg": "<svg width='600' height='600' xmlns='http://www.w3.org/2000/svg'><!-- complete detailed SVG code --></svg>"
  }
]

Make these detailed renderings with:
- Higher resolution and more intricate details than the variation preview
- Realistic wood grain patterns and texture
- Multiple levels of depth using gradients and shadows
- Tool mark details and carving texture
- Professional woodworking quality appearance
- Rich, natural wood colors with variation`;

  const fetchContent = options?.contentFetcher ?? generateContent;
  const responseText = await fetchContent(prompt);
  const cleanJson = responseText
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  try {
    const detailedImages = DetailedImagesResponseSchema.parse(
      JSON.parse(cleanJson)
    );
    const sanitizedImages = await Promise.all(
      detailedImages.map(async (image) => ({
        view: image.view,
        svg: await sanitizeSvg(image.svg),
      }))
    );
    return sanitizedImages;
  } catch (error) {
    console.error(
      "Failed to parse detailed images response:",
      error,
      responseText
    );
    throw new Error(
      "The carving visualizer returned an invalid detailed images response. Please try again."
    );
  }
}

// --- New CarveCraft Logic ---

function parseDataUrl(
  dataUrl: string
): { mimeType: string; data: string } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
}

/**
 * Orchestrates the generation of the carving plan.
 * 1. Generates a text guide.
 * 2. Generates concept art (using user reference if available).
 * 3. Generates an orthographic schematic based on the CONCEPT ART to ensure alignment.
 */
export const generateCarvingPlan = async (
  promptText: string,
  referenceImageUrl?: string
): Promise<GeneratedDesign> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("API Key not configured");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Parse the reference image if provided
  const parsedImage = referenceImageUrl
    ? parseDataUrl(referenceImageUrl)
    : null;

  try {
    // 1. Generate Text Guide
    // Use gemini-2.0-flash-exp for text generation
    const textModel = "gemini-2.0-flash-exp";
    const textPrompt = `
      You are a master woodcarver teaching a student.
      Subject: "${promptText}".
      Provide a concise "Step-by-Step Carving Strategy".
      Include:
      1. Grain direction warnings.
      2. Order of operations (roughing out -> detailing).
      3. Specific tools recommended.
      Keep it practical and under 200 words.
      Format as clean Markdown.
    `;

    // Incorporate image into text prompt if provided (multimodal)
    const textContents: { parts: Part[] } = { parts: [] };
    if (parsedImage) {
      textContents.parts.push({
        inlineData: {
          mimeType: parsedImage.mimeType,
          data: parsedImage.data,
        },
      });
      textContents.parts.push({
        text: "Analyze this reference image. " + textPrompt,
      });
    } else {
      textContents.parts.push({ text: textPrompt });
    }

    const textResponse = await ai.models.generateContent({
      model: textModel,
      contents: textContents,
    });
    const guideText = textResponse.text || "No guide generated.";

    // 2. Generate Concept Art
    // Must use an image generation model.
    const imageModel = "gemini-3-pro-image-preview";

    const conceptParts: Part[] = [];

    if (parsedImage) {
      // NOTE: gemini-3-pro-image-preview might support image input for variations.
      // If not, it might ignore it, but we MUST pass correct binary data.
      conceptParts.push({
        inlineData: {
          mimeType: parsedImage.mimeType,
          data: parsedImage.data,
        },
      });
      conceptParts.push({
        text: `Transform this reference image into a finished, polished wood carving of ${promptText}. Photorealistic, studio lighting, masterpiece, detailed texture of wood grain. Isolated on a neutral background.`,
      });
    } else {
      conceptParts.push({
        text: `A finished, polished wood carving of ${promptText}. Photorealistic, studio lighting, masterpiece, detailed texture of wood grain. Isolated on a neutral background.`,
      });
    }

    const conceptResponse = await ai.models.generateContent({
      model: imageModel,
      contents: { parts: conceptParts },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K",
        },
      },
    });

    let conceptUrl = "https://picsum.photos/seed/wood/800/800";
    let conceptBase64 = "";

    // Check for inline data (image)
    let conceptMimeType = "image/jpeg";
    const conceptCandidates =
      conceptResponse.candidates || conceptResponse?.response?.candidates || [];
    for (const part of conceptCandidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        conceptBase64 = part.inlineData.data;
        conceptMimeType = part.inlineData.mimeType || "image/jpeg";
        conceptUrl = `data:${conceptMimeType};base64,${conceptBase64}`;
        break;
      }
    }

    // 3. Generate Technical Blueprint
    const schematicParts: Part[] = [];
    const blueprintPrompt = `
      Create a technical, black and white line drawing (blueprint style) for a wood carving project.
      CRITICAL: You MUST trace the PROVIDED REFERENCE IMAGE exactly. Do not hallucinate new details.
      High contrast white lines on dark blue graph paper background.
      SHOW 3 VIEWS: Front, Side, Top.
      Match the exact proportions and pose of the visual reference.
    `;

    if (conceptBase64) {
      // Pass the generated concept art as the reference for the blueprint
      schematicParts.push({
        inlineData: { mimeType: conceptMimeType, data: conceptBase64 },
      });
      schematicParts.push({
        text: `REFERENCE IMAGE TO TRACE:\n${blueprintPrompt}`,
      });
    } else {
      schematicParts.push({ text: blueprintPrompt });
    }

    const schematicResponse = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: { parts: schematicParts },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K",
        },
      },
    });

    let schematicUrl = "https://picsum.photos/seed/blueprint/800/800?grayscale";

    const schematicCandidates =
      schematicResponse.candidates ||
      schematicResponse?.response?.candidates ||
      [];
    for (const part of schematicCandidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        schematicUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }

    return {
      guideText,
      conceptUrl,
      schematicUrl,
    };
  } catch (error) {
    console.error("GenAI Error:", error);
    throw error;
  }
};
