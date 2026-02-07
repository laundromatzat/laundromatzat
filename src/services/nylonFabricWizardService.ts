import { generateContent, generateImages } from "./geminiClient";
import { performResearch } from "./researchService";
import type {
  ProjectBrief,
  ConceptSketch,
  MaterialPlan,
  AssemblyStep,
  MaterialItem,
} from "@/pages/tools/NylonFabricDesignerPage/hooks/useProjectState";

// ============================================
// Phase 2: Generate Concept Sketches
// ============================================

export async function generateConceptSketches(
  brief: ProjectBrief,
): Promise<ConceptSketch[]> {
  const sizeStr = brief.size.depth
    ? `${brief.size.height}×${brief.size.width}×${brief.size.depth} ${brief.size.unit}`
    : `${brief.size.height}×${brief.size.width} ${brief.size.unit}`;

  const conceptPrompts = [
    {
      id: "minimal",
      name: "Minimal",
      style: "Clean, simple lines with minimal features",
      prompt: `Minimal, clean design of a handmade ${brief.description}. Size: ${sizeStr}. ${brief.closure} closure. Simple geometric shapes, single-color ripstop nylon, essential features only. Studio product shot, white background, soft lighting. Ultralight aesthetic.`,
    },
    {
      id: "utility",
      name: "Utility",
      style: "Feature-rich with practical additions",
      prompt: `Utility-focused design of a handmade ${brief.description}. Size: ${sizeStr}. ${brief.closure} closure with ${brief.features.join(", ")}. Rugged construction, contrasting color panels, visible reinforced seams, multiple attachment points. Outdoor gear aesthetic, natural lighting.`,
    },
    {
      id: "compact",
      name: "Compact",
      style: "Space-efficient and packable",
      prompt: `Compact, packable design of a handmade ${brief.description}. Size: ${sizeStr}. ${brief.closure} closure. Emphasis on being lightweight and compressible, neat construction, earth-tone colors. Adventure photography style, trail setting.`,
    },
    {
      id: "structured",
      name: "Structured",
      style: "Rigid with defined shape",
      prompt: `Structured, boxy design of a handmade ${brief.description}. Size: ${sizeStr}. ${brief.closure} closure. Clean angular construction, maintains shape when empty, premium hardware, professional aesthetic. Studio shot on wood surface.`,
    },
  ];

  try {
    const prompts = conceptPrompts.map((c) => c.prompt);
    const imageUrls = await generateImages(prompts);

    return conceptPrompts.map((concept, index) => ({
      id: concept.id,
      name: concept.name,
      style: concept.style,
      imageUrl: imageUrls[index],
      description: concept.style,
    }));
  } catch (error) {
    console.error("Failed to generate concept sketches:", error);
    throw new Error("Failed to generate design concepts. Please try again.");
  }
}

// ============================================
// Phase 3: Generate Material Plan
// ============================================

export async function generateMaterialPlan(
  brief: ProjectBrief,
  refinements: string[],
): Promise<MaterialPlan> {
  const sizeStr = brief.size.depth
    ? `${brief.size.height}×${brief.size.width}×${brief.size.depth} ${brief.size.unit}`
    : `${brief.size.height}×${brief.size.width} ${brief.size.unit}`;

  const refinementStr =
    refinements.length > 0
      ? `\n\nUser refinements requested: ${refinements.join("; ")}`
      : "";

  // Research grounding
  const researchContext = await performResearch(
    `Materials and fabric requirements for making a ${brief.description}, size ${sizeStr}`,
    "Technical Sewing & Softgoods Manufacturing",
  );

  const prompt = `You are an expert in MYOG (Make Your Own Gear) softgoods manufacturing in the style of Ripstop by the Roll.

GROUNDING CONTEXT:
${researchContext}

PROJECT SPECIFICATION:
- Description: ${brief.description}
- Size: ${sizeStr}
- Closure: ${brief.closure}
- Features: ${brief.features.join(", ") || "None specified"}${refinementStr}

CRITICAL: This is a HAND SEWING project. No sewing machines.

Generate a JSON response with:
1. materials: Array of {name, quantity, notes?, alternatives?} - fabric, thread, hardware
2. tools: Array of {name, notes?} - hand tools only (needles, thimble, speedy stitcher, etc)
3. estimatedTime: String like "2-3 hours"
4. difficulty: Number 1-5 (1=beginner, 5=expert)

Be specific about:
- Exact nylon weight (70D, 210D, etc)
- Thread type (waxed polyester, TX-27, etc)
- Hardware sizes

RESPOND ONLY WITH VALID JSON, no markdown:`;

  try {
    const response = await generateContent(prompt);

    // Clean the response - remove markdown code blocks if present
    let cleanJson = response.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson
        .replace(/^```(?:json)?\n?/, "")
        .replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(cleanJson);

    // Generate cut diagram
    const cutDiagramPrompt = `Technical cut layout diagram for a ${brief.description}. Size ${sizeStr}. Top-down view showing pattern pieces on fabric grain, labeled with measurements. Clean black lines on light background, engineering-style diagram. Include seam allowances marked.`;

    const [cutDiagramUrl] = await generateImages([cutDiagramPrompt]);

    return {
      materials: parsed.materials as MaterialItem[],
      tools: parsed.tools as MaterialItem[],
      estimatedTime: parsed.estimatedTime || "2-4 hours",
      difficulty: Math.min(5, Math.max(1, parsed.difficulty || 3)) as
        | 1
        | 2
        | 3
        | 4
        | 5,
      cutDiagramUrl,
    };
  } catch (error) {
    console.error("Failed to generate material plan:", error);
    throw new Error("Failed to generate material plan. Please try again.");
  }
}

// ============================================
// Phase 4: Generate Assembly Steps
// ============================================

export async function generateAssemblySteps(
  brief: ProjectBrief,
  refinements: string[],
): Promise<AssemblyStep[]> {
  const sizeStr = brief.size.depth
    ? `${brief.size.height}×${brief.size.width}×${brief.size.depth} ${brief.size.unit}`
    : `${brief.size.height}×${brief.size.width} ${brief.size.unit}`;

  const refinementStr =
    refinements.length > 0
      ? `\n\nUser refinements: ${refinements.join("; ")}`
      : "";

  const prompt = `You are a seasoned MYOG craftsperson writing step-by-step hand sewing instructions.

PROJECT: ${brief.description}
SIZE: ${sizeStr}
CLOSURE: ${brief.closure}
FEATURES: ${brief.features.join(", ") || "None"}${refinementStr}

CRITICAL CONSTRAINTS:
- HAND SEWING ONLY - no sewing machines
- Use: curved needle with waxed thread, Speedy Stitcher awl for thick layers
- Real techniques: saddle stitch, backstitch, whipstitch

Generate a JSON array of assembly steps. Each step:
{
  "number": Number (1-indexed),
  "title": String (short, action-oriented),
  "instructions": String (2-3 sentences, specific and practical),
  "tips": Array of strings (1-2 pro tips per step)
}

Include 6-10 steps covering:
1. Cutting and marking
2. Initial assembly (main body)
3. Feature additions (pockets, loops, etc.)
4. Closure installation
5. Reinforcement and finishing
6. Final inspection

Write like an experienced maker sharing hard-won knowledge. Be specific about stitch spacing, where to backstitch, common mistakes.

RESPOND ONLY WITH VALID JSON ARRAY, no markdown:`;

  try {
    const response = await generateContent(prompt);

    // Clean the response
    let cleanJson = response.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson
        .replace(/^```(?:json)?\n?/, "")
        .replace(/\n?```$/, "");
    }

    const steps = JSON.parse(cleanJson) as Array<{
      number: number;
      title: string;
      instructions: string;
      tips: string[];
    }>;

    // Generate images for each step (batch in groups of 3 for efficiency)
    const stepImages: string[] = [];
    const imagePrompts = steps.map(
      (step) =>
        `Instructional photo: Skilled hands performing "${step.title}" step while making a ${brief.description}. Close-up documentary style, workshop lighting, focus on the technique. Curved needle or Speedy Stitcher awl visible. Wood workbench surface.`,
    );

    // Generate images in batches to avoid overwhelming the API
    for (let i = 0; i < imagePrompts.length; i += 3) {
      const batch = imagePrompts.slice(i, i + 3);
      const batchImages = await generateImages(batch);
      stepImages.push(...batchImages);
    }

    return steps.map((step, index) => ({
      number: step.number,
      title: step.title,
      instructions: step.instructions,
      tips: step.tips || [],
      imageUrl: stepImages[index],
      isCompleted: false,
    }));
  } catch (error) {
    console.error("Failed to generate assembly steps:", error);
    throw new Error(
      "Failed to generate assembly instructions. Please try again.",
    );
  }
}

// ============================================
// Legacy Export (for backwards compatibility)
// ============================================

export {
  generateSewingGuide,
  generateProjectImages,
} from "./nylonFabricDesignerService";
