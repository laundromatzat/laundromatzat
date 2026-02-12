import createDOMPurify from "dompurify";

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

import { performResearch } from "./researchService";

export async function generateSewingGuide(
  description: string,
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
  const prompt = `You are a seasoned craftsperson writing for Make: Magazine or a premium MYOG (Make Your Own Gear) blog. Your tone is warm, encouraging, and precise—like a skilled mentor sharing hard-won knowledge.

GROUNDING CONTEXT (Use these verified facts):
${researchContext}

STYLE GUIDE:
- Write like a craftsperson, not a textbook. Use phrases like "you'll want to..." not "one should..."
- Be specific about why each step matters ("backstitching here prevents blowout under load")
- Avoid generic phrases: "ensure proper alignment", "for best results", "carefully measure"
- Include personal touches: warnings from experience, satisfying moments, common mistakes you've seen
- Use sensory details: how the thread should feel, what tight stitches look like, the sound of needle through nylon

CRITICAL CONSTRAINTS:
- HAND SEWING ONLY - no sewing machines exist in this guide
- Two primary tools: handheld needle with waxed thread AND Speedy Stitcher sewing awl
- Use needle for lighter fabrics and precise work; Speedy Stitcher for heavy-duty seams and thick layers
- Reference real techniques: sailmaker's backstitch, whipstitch, saddle stitch, awl stitching

FORMAT (Clean HTML):
- <h3> for major sections (Materials, Cutting, Assembly, Finishing)
- <h4> for subsections
- <div class="tip-box"> for pro tips and warnings
- <strong> for critical steps that could cause failure if skipped
- Short paragraphs, scannable structure

INCLUDE:
1. Project Overview (what you're making, difficulty level, time estimate)
2. Materials (specific nylon weights, thread types, notions with alternatives)
3. Tools (needles, thimble, clips—explain WHY each tool)
4. Cutting Guide (measurements, grain direction, mark placement)
5. Step-by-Step Assembly (numbered, with clear checkpoints)
6. Finishing (edge treatments, reinforcement, quality checks)
7. Troubleshooting (3-4 common mistakes and fixes)

PROJECT TO DOCUMENT:
${description}

Write the complete guide now, maintaining the voice of an experienced maker sharing their craft:`;

  const guide = await fetchContent(prompt);
  return sanitizeGuideContent(guide);
}

// Simplified version using image generation instead of SVG
import { generateImages } from "./geminiClient";

export async function generateProjectImages(description: string) {
  // Image 1: Finished product specific to the user's description
  // Images 2-3: Two critical process steps demonstrating key techniques for THIS specific project

  const imagePrompts = [
    {
      stage: "Finished Product",
      prompt: `Hero product shot of a completed, handmade ${description}.

VISUAL STYLE: Patagonia Worn Wear campaign. Authentic, purposeful, built to last.

Show this SPECIFIC item: ${description}
- The finished ${description} in use or positioned for use (not floating on white)
- High-quality ripstop nylon with intentional color blocking and visible craftsmanship
- All functional features of a ${description} clearly visible: reinforced stress points, clean hand-sewn seams, quality hardware
- Natural outdoor setting appropriate for this gear: granite rock, fallen log, trail, or camp
- Golden hour side lighting showing texture and dimensional depth
- Environmental context that tells the story of how this ${description} will be used
- Sharp focus with cinematic depth
- 16:9, warm earth tones, slightly desaturated`,
    },
    {
      stage: "Critical Step: Cutting & Layout",
      prompt: `Documentary photograph: Hands cutting pattern pieces for a ${description}.

VISUAL STYLE: Kinfolk magazine meets gear-making workshop. Clean, aspirational, real craft.

Show the process of cutting fabric for this SPECIFIC project: ${description}
- Ripstop nylon pattern pieces being cut or laid out, specifically shaped for a ${description}
- Maker's hands using rotary cutter or fabric scissors with visible wear
- Pattern templates with hand-written notes visible ("front panel", "pocket", etc.)
- Cutting mat with grid lines, steel ruler for straight cuts
- Waxed thread spool and curved needles ready nearby
- Weathered wood workbench with character
- Natural north-facing window light, soft shadows
- Top-down or 3/4 perspective showing the work surface
- 16:9, warm but not yellow color grade
- This should clearly be preparations for making a ${description}`,
    },
    {
      stage: "Critical Step: Hand-Stitching Assembly",
      prompt: `Intimate close-up: Skilled hands stitching components of a ${description} together.

VISUAL STYLE: The Prepared blog aesthetic. Honest, competent, focused craftsmanship.

Show hand-sewing THIS specific project: ${description}
- Two pieces of the ${description} being joined by hand—show a seam that would exist on this specific item
- One image should show EITHER: curved needle with waxed thread OR Speedy Stitcher sewing awl in use
- Visible stitch pattern (backstitch or awl stitch) showing expertise and even spacing
- Leather thimble on finger, showing use and wear
- The partially assembled ${description} recognizable on the work surface
- Warm workshop lighting from adjustable desk lamp
- Shallow depth of field, sharp focus on the stitch point and hands
- Canvas or denim work apron visible at frame edge
- Wood grain surface with tool marks and thread snippets
- 16:9, documentary photography feel, authentic moment captured`,
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
