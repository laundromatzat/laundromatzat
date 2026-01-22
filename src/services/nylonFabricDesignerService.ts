import createDOMPurify from "dompurify";
import { z } from "zod";
import { generateContent } from "./geminiClient";

type ContentFetcher = (prompt: string) => Promise<string>;

type NylonFabricDesignerServiceOptions = {
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

function applyExecutableContentStrippingOnce(markup: string): string {
  return (
    markup
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
      .replace(/data:text\/html[^"'\s>]*/gi, "")
  );
}

function stripExecutableContent(markup: string): string {
  if (!markup) return "";

  let previous: string;
  let current = markup;

  do {
    previous = current;
    current = applyExecutableContentStrippingOnce(previous);
  } while (current !== previous);

  return current;
}

async function sanitizeGuideContent(html: string): Promise<string> {
  if (!html) {
    return "";
  }

  const domPurify = getDomPurify();
  if (!domPurify) {
    return stripExecutableContent(html);
  }

  return domPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "h3",
      "h4",
      "p",
      "ul",
      "ol",
      "li",
      "strong",
      "em",
      "div",
      "span",
      "br",
    ],
    ALLOWED_ATTR: ["class"],
    FORBID_TAGS: ["script", "style"],
  });
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

/**
 * Validates SVG markup for common errors and provides warnings
 * Returns the SVG (potentially fixed) or throws an error if critically invalid
 */
function validateAndFixSvg(svgMarkup: string): string {
  if (!svgMarkup || !svgMarkup.trim().startsWith("<svg")) {
    throw new Error("Invalid SVG: Does not start with <svg tag");
  }

  let fixedSvg = svgMarkup;
  let fixCount = 0;

  // Auto-fix: Remove font family names from numeric attributes (common AI mistake)
  // e.g., y='Arial, sans-serif' should be removed or replaced with a default value
  const fontInNumericPattern =
    /(?:x|y|x1|y1|x2|y2|cx|cy|r|width|height)=["'](?:[^"']*(?:Arial|sans-serif|serif|monospace|Helvetica|Times|Courier)[^"']*)["']/gi;
  const fontMatches = fixedSvg.match(fontInNumericPattern);

  if (fontMatches && fontMatches.length > 0) {
    console.warn(
      "[SVG Validation] Found font names in numeric attributes. Auto-fixing...",
    );
    fontMatches.forEach((match) => {
      console.warn(`  Removing invalid: ${match}`);
      // Remove these attributes entirely as they're invalid
      fixedSvg = fixedSvg.replace(match, "");
      fixCount++;
    });
  }

  // Check for string concatenation in numeric attributes (e.g., y="41.5+13")
  const invalidNumericPattern =
    /(?:x|y|x1|y1|x2|y2|cx|cy|r|width|height)=["']([^"']*[+\-*/]|[^"']*\/[^"']*|[^"'0-9.\- ]+[^"']*)["']/gi;
  const matches = fixedSvg.match(invalidNumericPattern);

  if (matches && matches.length > 0) {
    console.warn(
      "[SVG Validation] Found invalid numeric attributes with expressions:",
    );
    console.warn("[SVG Validation] This may cause rendering errors.");

    // Log the first few examples
    matches.slice(0, 3).forEach((match) => {
      console.warn(`  Example: ${match}`);
    });
  }

  // Check for missing xmlns
  if (!fixedSvg.includes("xmlns=")) {
    console.warn("[SVG Validation] Missing xmlns attribute, adding default");
    fixedSvg = fixedSvg.replace(
      "<svg",
      '<svg xmlns="http://www.w3.org/2000/svg"',
    );
    fixCount++;
  }

  // Check for viewBox (recommended for responsive SVGs)
  if (!fixedSvg.includes("viewBox=")) {
    console.warn(
      "[SVG Validation] Missing viewBox attribute, SVG may not scale correctly",
    );
  }

  if (fixCount > 0) {
    console.log(`[SVG Validation] Auto-fixed ${fixCount} issue(s)`);
  }

  return fixedSvg;
}

const VisualRepresentationSchema = z.object({
  stage: z.string(),
  svg: z.string(),
});

const VisualsResponseSchema = z.array(VisualRepresentationSchema);

import { performResearch } from "./researchService";

export async function generateSewingGuide(
  description: string,
  _apiKey?: string,
  options?: NylonFabricDesignerServiceOptions,
): Promise<string> {
  const fetchContent = options?.contentFetcher ?? generateContent;

  // 1. Perform Grounding/Research Step
  let researchContext = "";
  if (options?.onResearchStart) options.onResearchStart();

  // Create a specific research query based on the user's project
  const researchTopic = `Technical requirements, materials, and stitch techniques for: ${description}`;
  researchContext = await performResearch(
    researchTopic,
    "Technical Sewing & Softgoods Manufacturing",
  );

  if (options?.onResearchComplete) options.onResearchComplete(researchContext);

  // 2. Main Generation Step with Grounding
  const prompt = `You are an expert in hand-sewing nylon fabric and crafting. Analyze the following project description and create a comprehensive hand-sewing guide.

RESEARCH CONTEXT (Verified Facts):
${researchContext}

CRITICAL REQUIREMENTS:
- ALL instructions must be for HAND SEWING ONLY - NO sewing machines
- Use handheld needle and thread exclusively
- Can recommend Speedy Stitcher sewing awl tool for heavy-duty seams
- Reference techniques from MYOG (Make Your Own Gear) hand-sewing guides
- Focus on hand-sewing stitches: running stitch, backstitch, whipstitch, saddle stitch, etc.

Research and reference techniques from:
- MYOG (Make Your Own Gear) hand-sewing guides
- Bushcraft and camping gear repair techniques
- Leather working hand-sewing methods (applicable to heavy nylon)
- Traditional sailmaking hand-sewing techniques
- DIY ultralight backpacking hand-sewing guides

Format your response with clear HTML structure using these tags:
- <h3> for major sections
- <h4> for subsections
- <p> for paragraphs
- <ul> and <ol> for lists
- <strong> for emphasis
- <div class="tip-box"> for tips and notes

Include these sections:
1. Project Overview & Analysis
2. Materials Needed (specific nylon types, waxed thread, bonded nylon thread, notions)
3. Tools Required (needles, Speedy Stitcher if needed, awl, scissors, pins, clips)
4. Fabric Cutting Guide (with measurements and diagram descriptions)
5. Step-by-Step Hand-Sewing Assembly Instructions
   - Where to place folds
   - Where to hand-stitch (backstitch, running stitch, whipstitch, saddle stitch, etc.)
   - When to use Speedy Stitcher for heavy-duty seams
   - Hem instructions (hand-rolled, whipstitch, etc.)
   - How to connect pieces by hand
6. Hand-Sewing Finishing Techniques
7. Pro Tips & Common Mistakes to Avoid

Use professional hand-sewing terminology and explain techniques like:
- Hand-stitch types and when to use them (backstitch for strength, running stitch for basting, whipstitch for edges)
- Proper seam allowances for hand-sewn nylon
- How to lock stitches at beginning and end
- Edge finishing methods by hand
- Tips for working with slippery nylon fabric when hand-sewing
- When to use Speedy Stitcher awl for thick seams or heavy-duty work

PROJECT DESCRIPTION:
${description}

Generate the complete guide now:`;

  const guide = await fetchContent(prompt);
  return sanitizeGuideContent(guide);
}

export async function generateProjectImages(
  description: string,
  _apiKey?: string,
  options?: NylonFabricDesignerServiceOptions,
) {
  const prompt = `For this hand-sewn nylon fabric project: "${description}"

Create 3 DETAILED, PROFESSIONAL visual representations using SVG code. Generate complete, valid SVG markup for:

1. CUTTING PATTERN DIAGRAM - A technical flat pattern showing all fabric pieces with precise measurements, grain lines, fold lines, notches, and cutting margins
2. ASSEMBLY DIAGRAM - A step-by-step assembly guide showing how pieces connect, with numbered steps, stitch types, seam allowances, and directional arrows
3. FINISHED PRODUCT RENDERING - An isometric or perspective view of the completed item with realistic proportions, showing all features and details

CRITICAL SVG REQUIREMENTS:
- ALL numeric attributes (x, y, x1, y1, x2, y2, cx, cy, r, width, height, etc.) MUST be calculated numbers, NOT string expressions
- WRONG: y="41.5+13" or x="width/2" or y="Arial, sans-serif" or x="sans-serif"
- CORRECT: y="54.5" or x="200"
- NEVER put font family names (Arial, sans-serif, Helvetica, etc.) in numeric position attributes
- Font families belong ONLY in font-family attributes, NOT in x, y, width, height, etc.
- Use viewBox for responsive scaling: viewBox="0 0 800 600"
- Include proper xmlns attribute: xmlns="http://www.w3.org/2000/svg"
- Use semantic grouping with <g> tags
- Add descriptive <title> and <desc> tags for accessibility

VISUAL DESIGN REQUIREMENTS:
- Use a clean, professional color palette (similar to technical drawings)
- Background: white or light gray (#f5f5f5)
- Pattern pieces: different pastel colors (#FFE5E5, #E5F5FF, #E5FFE5, etc.) with dark borders
- Measurements: in Arial or sans-serif font, 12-14px, dark color (#333)
- Fold lines: dashed stroke-dasharray="5,5" in blue (#0066CC)
- Stitch lines: dashed stroke-dasharray="3,3" in red (#CC0000)
- Cut lines: solid black lines, stroke-width="2"
- Arrows: use <marker> elements for professional arrow heads
- Labels: clear, legible text with background rectangles for contrast
- Grid or reference lines where appropriate

SPECIFIC DETAILS TO INCLUDE:
Cutting Pattern:
- All dimensions clearly labeled with measurement lines and text
- Grain line arrows
- "Fold" indicators with fold line symbols
- Notches marked with small triangles
- Seam allowance marked (typically 1/4" or 1/2")
- "Cut 1" or "Cut 2" annotations
- Pattern piece names

Assembly Diagram:
- Step numbers in circles
- Different stitch types illustrated (backstitch, running stitch, whipstitch)
- Seam allowance width labeled
- "Right side" and "wrong side" of fabric indicated
- Arrows showing which direction to sew
- Cross-sections showing how pieces overlap
- Annotations for critical assembly points

Finished Product:
- Realistic 3D perspective or isometric view
- Show all functional features (pockets, closures, straps, etc.)
- Shading to show depth and dimension
- Highlights to show fabric texture
- Scale reference (e.g., "8 inches" with a dimension line)

Return ONLY a JSON array (no markdown, no backticks, no code fences) with this exact structure:
[
  {
    "stage": "Cutting Pattern",
    "svg": "<svg viewBox='0 0 800 600' xmlns='http://www.w3.org/2000/svg'><!-- complete calculated SVG code --></svg>"
  },
  {
    "stage": "Assembly Diagram", 
    "svg": "<svg viewBox='0 0 800 600' xmlns='http://www.w3.org/2000/svg'><!-- complete calculated SVG code --></svg>"
  },
  {
    "stage": "Finished Product",
    "svg": "<svg viewBox='0 0 800 600' xmlns='http://www.w3.org/2000/svg'><!-- complete calculated SVG code --></svg>"
  }
]`;

  const fetchContent = options?.contentFetcher ?? generateContent;
  const responseText = await fetchContent(prompt);

  // Robust JSON extraction - handles conversational text
  function extractJsonArray(text: string): string {
    // First, try to extract JSON from markdown code fences
    const codeBlockMatch = text.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1];
    }

    // If no code fence, look for a JSON array anywhere in the text
    const jsonArrayMatch = text.match(/\[[\s\S]*\]/);
    if (jsonArrayMatch) {
      return jsonArrayMatch[0];
    }

    // If still not found, throw error
    throw new Error("No JSON array found in response");
  }

  try {
    const cleanJson = extractJsonArray(responseText);
    const visuals = VisualsResponseSchema.parse(JSON.parse(cleanJson));
    const sanitizedVisuals = await Promise.all(
      visuals.map(async (visual) => {
        try {
          // Validate the SVG first
          const validatedSvg = validateAndFixSvg(visual.svg);
          // Then sanitize it
          const sanitizedSvg = await sanitizeSvg(validatedSvg);
          return {
            stage: visual.stage,
            svg: sanitizedSvg,
          };
        } catch (validationError) {
          console.error(
            `[SVG Validation] Failed to validate SVG for "${visual.stage}":`,
            validationError,
          );
          // Return a placeholder SVG on validation failure
          return {
            stage: visual.stage,
            svg: `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
              <rect width="400" height="300" fill="#f5f5f5"/>
              <text x="200" y="150" text-anchor="middle" font-size="16" fill="#666">
                Error generating ${visual.stage}
              </text>
            </svg>`,
          };
        }
      }),
    );
    return sanitizedVisuals;
  } catch (error) {
    console.error(
      "Failed to parse project visuals response:",
      error,
      responseText,
    );
    throw new Error(
      "The fabric designer returned an invalid visualization response. Please try again.",
    );
  }
}
