import { GoogleGenAI } from "@google/genai";
import { GeneratedDesign } from "../types";

/**
 * Orchestrates the generation of the carving plan.
 * 1. Generates a text guide.
 * 2. Generates concept art (using user reference if available).
 * 3. Generates an orthographic schematic based on the CONCEPT ART to ensure alignment.
 */
export const generateCarvingPlan = async (
  promptText: string,
  referenceImageBase64?: string
): Promise<GeneratedDesign> => {

  // Initialize the client inside the function to capture the current process.env.API_KEY
  // This is crucial for environments where the key is selected/injected at runtime.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    // 1. Generate Text Guide
    const textModel = 'gemini-3-flash-preview';
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
    const textContents: any = { parts: [] };
    if (referenceImageBase64) {
      textContents.parts.push({
        inlineData: {
          mimeType: 'image/jpeg', // Assuming jpeg for simplicity, or detect mime type
          data: referenceImageBase64
        }
      });
      textContents.parts.push({ text: "Analyze this reference image. " + textPrompt });
    } else {
      textContents.parts.push({ text: textPrompt });
    }

    const textResponse = await ai.models.generateContent({
      model: textModel,
      contents: textContents,
    });
    const guideText = textResponse.text || "No guide generated.";

    // 2. Generate Concept Art
    // Using gemini-3-pro-image-preview for high quality generation
    const imageModel = 'gemini-3-pro-image-preview';
    
    const conceptParts: any[] = [];
    
    // If user provided a reference, use it to guide the concept art
    if (referenceImageBase64) {
        conceptParts.push({
            inlineData: {
                mimeType: 'image/jpeg',
                data: referenceImageBase64
            }
        });
        conceptParts.push({ text: `Transform this reference image into a finished, polished wood carving of ${promptText}. Photorealistic, studio lighting, masterpiece, detailed texture of wood grain. Isolated on a neutral background.` });
    } else {
        conceptParts.push({ text: `A finished, polished wood carving of ${promptText}. Photorealistic, studio lighting, masterpiece, detailed texture of wood grain. Isolated on a neutral background.` });
    }
    
    const conceptResponse = await ai.models.generateContent({
        model: imageModel,
        contents: { parts: conceptParts },
        config: {
            imageConfig: {
                aspectRatio: "1:1",
                imageSize: "1K"
            }
        }
    });

    let conceptUrl = "https://picsum.photos/500/500"; // Fallback
    let conceptBase64 = ""; // Capture this to pass to the next step
    
    // Extract Image
    for (const part of conceptResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            conceptBase64 = part.inlineData.data;
            conceptUrl = `data:image/png;base64,${conceptBase64}`;
            break;
        }
    }

    // 3. Generate Technical Blueprint (Schematic)
    // CRITICAL: We use the *Generated Concept Art* as the input to ensure alignment.
    
    const schematicParts: any[] = [];
    
    // The specific prompt structure requested for technical blueprints
    const blueprintPrompt = `
      Create a technical, black and white line drawing (blueprint style) for a wood carving project based on: "${promptText}".
      The drawing MUST match the form and details of the attached reference image exactly.
      The background MUST be a technical graph paper (light blue or gray grid pattern) to assist with measurements.
      SHOW 4 DISTINCT VIEWS arranged in a 2x2 grid.
      YOU MUST LABEL EACH STAGE CLEARLY with bold text:
      1. "Blank Block" (The starting cuboid).
      2. "Geometric Blocking" (Rough cuts).
      3. "Rounding" (Smoothing form).
      4. "Final Detail" (Finished carving).
      Use clean lines, high contrast, and ensure the graph paper grid is visible but does not obscure the drawing.
    `;
    
    if (conceptBase64) {
        // Feed the concept art back into the model
        schematicParts.push({
            inlineData: {
                mimeType: 'image/png',
                data: conceptBase64
            }
        });
        schematicParts.push({ text: blueprintPrompt });
    } else {
        // Fallback if concept generation failed (rare) - remove "attached reference" phrasing
        schematicParts.push({ text: blueprintPrompt.replace("match the form and details of the attached reference image exactly", "be highly detailed") });
    }

    const schematicResponse = await ai.models.generateContent({
        model: imageModel,
        contents: { parts: schematicParts },
         config: {
            imageConfig: {
                aspectRatio: "1:1",
                imageSize: "1K" // Higher res helps with measurement accuracy
            }
        }
    });

    let schematicUrl = "https://picsum.photos/500/500?grayscale"; // Fallback

     // Extract Image
     for (const part of schematicResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            schematicUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
        }
    }

    return {
      guideText,
      conceptUrl,
      schematicUrl
    };

  } catch (error) {
    console.error("GenAI Error:", error);
    // Rethrow with a clean message, or pass the original for 403 checks
    throw error;
  }
};