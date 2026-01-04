import createDOMPurify from "dompurify";
import { z } from "zod";
import { generateContent } from "./geminiClient";

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
  return markup
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
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

const CarvingVariationSchema = z.object({
  name: z.string(),
  description: z.string(),
  svg: z.string(),
});

const VariationsResponseSchema = z.array(CarvingVariationSchema);

const DetailedImageSchema = z.object({
  view: z.string(),
  svg: z.string(),
});

const DetailedImagesResponseSchema = z.array(DetailedImageSchema);

export interface CarvingVariation {
  name: string;
  description: string;
  svg: string;
}

export interface DetailedImage {
  view: string;
  svg: string;
}

export async function generateCarvingVariations(
  description: string,
  _apiKey?: string,
  options?: WoodCarvingServiceOptions
): Promise<CarvingVariation[]> {
  const prompt = `For this wood carving project: "${description}"

Create 4 distinct design variations for a wood carving. Each variation should offer a different artistic interpretation or style approach.

Generate complete, valid SVG markup for each variation showing:
- The carved design with realistic wood grain texture
- Depth and relief details using gradients and shadows
- Different styles (e.g., realistic, geometric, traditional, abstract)
- Clear visual distinction between variations

Return ONLY a JSON array (no markdown, no backticks) with this structure:
[
  {
    "name": "Variation 1 Name",
    "description": "Brief description of this design approach",
    "svg": "<svg width='400' height='400' xmlns='http://www.w3.org/2000/svg'><!-- complete SVG code here --></svg>"
  },
  {
    "name": "Variation 2 Name",
    "description": "Brief description of this design approach",
    "svg": "<svg width='400' height='400' xmlns='http://www.w3.org/2000/svg'><!-- complete SVG code here --></svg>"
  },
  {
    "name": "Variation 3 Name",
    "description": "Brief description of this design approach",
    "svg": "<svg width='400' height='400' xmlns='http://www.w3.org/2000/svg'><!-- complete SVG code here --></svg>"
  },
  {
    "name": "Variation 4 Name",
    "description": "Brief description of this design approach",
    "svg": "<svg width='400' height='400' xmlns='http://www.w3.org/2000/svg'><!-- complete SVG code here --></svg>"
  }
]

Make the SVGs visually appealing with:
- Realistic wood colors (browns, tans, warm tones)
- Wood grain texture patterns
- Shadow and highlight effects to show depth
- Clean, professional artistic rendering
- Distinct visual style for each variation`;

  const fetchContent = options?.contentFetcher ?? generateContent;
  const responseText = await fetchContent(prompt);
  const cleanJson = responseText
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  try {
    const variations = VariationsResponseSchema.parse(JSON.parse(cleanJson));
    const sanitizedVariations = await Promise.all(
      variations.map(async (variation) => ({
        name: variation.name,
        description: variation.description,
        svg: await sanitizeSvg(variation.svg),
      }))
    );
    return sanitizedVariations;
  } catch (error) {
    console.error(
      "Failed to parse carving variations response:",
      error,
      responseText
    );
    throw new Error(
      "The carving visualizer returned an invalid response. Please try again."
    );
  }
}

export async function generateDetailedImages(
  originalDescription: string,
  selectedVariation: CarvingVariation,
  userNotes?: string,
  _apiKey?: string,
  options?: WoodCarvingServiceOptions
): Promise<DetailedImage[]> {
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
