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

// Simplified version using image generation instead of SVG
import { generateImages } from "./geminiClient";

type NylonFabricDesignerServiceOptions = {
  onResearchStart?: () => void;
  onResearchComplete?: (findings: string) => void;
};

export async function generateProjectImages(
  description: string,
  _apiKey?: string,
  options?: NylonFabricDesignerServiceOptions,
) {
  // Create three detailed image generation prompts
  const imagePrompts = [
    {
      stage: "Cutting Pattern Layout",
      prompt: `Professional technical flat-lay photo of sewing pattern pieces laid out on a cutting mat. 
For project: ${description}

Show:
- Multiple fabric pattern pieces precisely cut from ripstop nylon
- Neatly arranged on a green self-healing cutting mat with grid lines
- Pattern pieces in different pastel colors (light blue, light pink, light yellow nylon fabric)
- Rotary cutter, fabric scissors, and measuring tape visible
- Small weights holding down pattern paper templates
- Notches and markings clearly visible on fabric edges
- Professional workshop lighting, top-down view
- Clean, organized workspace
- 16:9 aspect ratio, photorealistic style
- Documentary photography aesthetic`,
    },
    {
      stage: "Hand-Sewing Assembly Steps",
      prompt: `Professional close-up photo showing hands hand-sewing nylon fabric pieces together.
For project: ${description}

Show:
- Hands using a curved needle with waxed thread
- Nylon fabric pieces being joined with visible backstitch technique
- Speedy Stitcher sewing awl in background
- Thread, thimble, and beeswax visible on work surface
- Natural workshop lighting highlighting the stitching
- Realistic hand positions and fabric texture
- Wood or fabric work surface
- Professional craft photography style
- 16:9 aspect ratio, warm natural lighting
- Focus on the sewing technique and craftsmanship`,
    },
    {
      stage: "Finished Product Photo",
      prompt: `Professional product photography of completed hand-sewn nylon fabric item.
For project: ${description}

Show:
- Finished handmade project in use or beautifully displayed
- High-quality ripstop nylon with visible texture
- All functional features clearly visible (pockets, closures, straps, compartments)
- Realistic lighting showing dimensional depth
- Clean background (white, grey, or wood surface)
- Professional e-commerce product photo style
- Sharp focus with natural depth of field
- 16:9 aspect ratio
- Showcase craftsmanship and utility
- Photorealistic, magazine-quality aesthetic`,
    },
  ];

  try {
    const prompts = imagePrompts.map((p) => p.prompt);
    const imageDataUrls = await generateImages(prompts);

    // Return images in the expected format (matching the old SVG structure)
    return imagePrompts.map((item, index) => ({
      stage: item.stage,
      svg: imageDataUrls[index], // Using 'svg' field name for compatibility, but it's actually an image data URL
    }));
  } catch (error) {
    console.error("Failed to generate project images:", error);
    throw new Error(
      "Failed to generate visual images for your project. Please try again.",
    );
  }
}
