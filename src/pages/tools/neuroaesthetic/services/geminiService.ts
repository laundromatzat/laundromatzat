import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { AnalysisResult, UserPreferences } from "@/types";

// Helper to remove markdown code blocks if present
const cleanJsonString = (str: string): string => {
  return str
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
};

const SYSTEM_INSTRUCTION = `
You are a world-class Neuroaesthetic Architect and Scientist. You analyze spaces not just for "style", but for their biological impact on the human nervous system. 
Your knowledge base is derived from advanced neuroaesthetic research (Ramachandran's laws, Biophilia, Prospect-Refuge, Fractal Fluency, Color Psychology, Photobiology, etc.).

Key Principles to look for:
1. Biophilia: Direct nature, natural materials (wood/stone), biomorphic forms.
2. Geometry: Curvature (safety/anterior cingulate cortex) vs. Angularity (threat/amygdala).
3. Prospect & Refuge: Clear sightlines + protected backing (high-back chairs, cozy nooks).
4. Complexity: Organized complexity (fractal dimension D=1.3-1.5), rule of three, vignettes. Avoid clutter (cortisol trigger).
5. Lighting: Photobiology. Analyze natural light penetration, glare, color temperature (Kelvin), and shadow softness. Circadian alignment is key (Blue/Cool AM, Amber/Warm PM).
6. Color: Psychological impact of hues. Saturation levels (high saturation = high arousal, low saturation = calming).
7. Furniture & Flow: Layouts that encourage social connection (radial) vs isolation. Physical ease of movement (flow). Command position (bed/desk facing door).
8. Haptics/Sensory: Texture variety, "material honesty" (wood looks like wood), acoustic softening. Evaluate haptic comfort.
9. Fractal Fluency: Look for statistical fractals in nature, decor, or architecture. Optimal range is D=1.3-1.5 (mid-range complexity) to reduce stress.
10. Soundscape & Atmosphere: Infer the acoustic qualities (echoey vs damp) and suggest a synthetic sound type to balance the mood.
11. Spatial Reconfiguration: You are authorized to recommend moving major furniture, removing items that cause stress (decluttering/subtraction), and adding missing elements (addition) to achieve the neuroaesthetic goal.

When analyzing:
- Be specific.
- Cite the neurological effect (e.g., "Sharp corners here may activate the amygdala").
- Provide coordinates (0-100 scale) for specific items in the FIRST image provided.
- For soundscapes, suggest a synthetic sound type (Pink/Brown/White noise or Binaural Beats) that would optimize the room's function.
`;

export const analyzeRoom = async (
  base64Images: string[],
  preferences?: UserPreferences
): Promise<AnalysisResult> => {
  const apiKey =
    import.meta.env.VITE_GEMINI_API_KEY ||
    import.meta.env.VITE_GOOGLE_GENAI_API_KEY ||
    import.meta.env.VITE_API_KEY ||
    "";

  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey });

  let contextPrompt = "";
  if (preferences) {
    contextPrompt = `
    IMPORTANT - User Context & Sensitivities:
    The user has specified the following preferences. Tailor your analysis and suggestions to respect these:
    - Sensitivities/Aversions: ${preferences.sensitivities || "None"}
    - Color Preferences: ${preferences.colorPreferences || "None"}
    - Design Goals: ${preferences.designGoals || "General well-being"}
    
    If the user mentions specific sensitivities (e.g., to clutter or bright light), strictly evaluate the room against these.
    `;
  }

  const prompt = `
    Analyze these images of a room through the lens of Neuroaesthetics. Treat them as different angles of the same space.
    ${contextPrompt}
    
    1. Identify 3-6 specific points of interest (affirmations, critiques, suggestions). Annotate primarily on the first image.
    2. Analyze the Lighting conditions (natural vs artificial, temperature, shadows) and its circadian impact.
    3. Analyze the Color Palette and its psychological impact.
    4. Analyze the Furniture Arrangement, specifically looking at Prospect & Refuge, flow/movement, and social dynamics. Feel free to suggest moving major pieces of furniture or removing items that block flow.
    5. Analyze Texture and Material properties (haptic perception, comfort, variety).
    6. Analyze the presence of Fractal Patterns (architectural details, decor, nature).
    7. Suggest a Generative Soundscape (Pink Noise, Brown Noise, White Noise, or Binaural Beats) to enhance the room's intended function.
    
    Return a valid JSON object matching this schema:
    {
      "overview": "A 2-3 sentence summary of the room's neurological impact.",
      "neuroScore": number (0-100 based on potential for well-being),
      "dominantPrinciple": "The strongest neuroaesthetic principle present",
      "missingElements": ["List of 2-3 key missing elements"],
      "lighting": {
         "condition": "Description of current lighting state",
         "circadianImpact": "Assessment of biological impact",
         "suggestions": ["List of improvements"]
      },
      "colorPalette": {
         "palette": ["List of dominant colors found"],
         "psychologicalImpact": "Description of emotional/cognitive effect",
         "suggestions": ["List of color adjustments"]
      },
      "furnitureArrangement": {
        "currentLayout": "Description of current layout",
        "flowAssessment": "Analysis of movement and ease",
        "prospectRefugeAnalysis": "Analysis of safe vantage points",
        "suggestions": ["List of specific layout changes including moving/removing furniture"]
      },
      "texture": {
        "currentMaterials": ["List of materials identified"],
        "hapticPerception": "Assessment of tactile comfort and material honesty",
        "suggestions": ["List of texture/material improvements"]
      },
      "fractalPatterns": {
        "presence": "Description of existing patterns",
        "complexityLevel": "Assessment (e.g., Low, Optimal D=1.3-1.5, Cluttered)",
        "suggestions": ["List of ways to incorporate optimal fractals"]
      },
      "soundscape": {
        "mood": "Desired mood (e.g., Calm, Focus, Energized)",
        "suggestedType": "one of: 'pink_noise', 'brown_noise', 'white_noise', 'binaural_beats'",
        "description": "Why this soundscape suits this room."
      },
      "annotations": [
        {
          "id": "unique_id",
          "label": "Short Title",
          "type": "affirmation" | "critique" | "suggestion",
          "description": "Explanation referencing neurological impact.",
          "coordinates": { "x": number (0-100), "y": number (0-100) },
          "principle": "Related Principle name (e.g. Biophilia)",
          "principleDescription": "A short, educational definition of the principle (e.g. 'Biophilia reduces cortisol by mimicking nature')."
        }
      ]
    }
  `;

  // Prepare content parts for multiple images
  const imageParts = base64Images.map((img) => ({
    inlineData: { mimeType: "image/jpeg", data: img },
  }));

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [...imageParts, { text: prompt }],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overview: { type: Type.STRING },
            neuroScore: { type: Type.NUMBER },
            dominantPrinciple: { type: Type.STRING },
            missingElements: { type: Type.ARRAY, items: { type: Type.STRING } },
            lighting: {
              type: Type.OBJECT,
              properties: {
                condition: { type: Type.STRING },
                circadianImpact: { type: Type.STRING },
                suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
            },
            colorPalette: {
              type: Type.OBJECT,
              properties: {
                palette: { type: Type.ARRAY, items: { type: Type.STRING } },
                psychologicalImpact: { type: Type.STRING },
                suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
            },
            furnitureArrangement: {
              type: Type.OBJECT,
              properties: {
                currentLayout: { type: Type.STRING },
                flowAssessment: { type: Type.STRING },
                prospectRefugeAnalysis: { type: Type.STRING },
                suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
            },
            texture: {
              type: Type.OBJECT,
              properties: {
                currentMaterials: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                hapticPerception: { type: Type.STRING },
                suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
            },
            fractalPatterns: {
              type: Type.OBJECT,
              properties: {
                presence: { type: Type.STRING },
                complexityLevel: { type: Type.STRING },
                suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
            },
            soundscape: {
              type: Type.OBJECT,
              properties: {
                mood: { type: Type.STRING },
                suggestedType: {
                  type: Type.STRING,
                  enum: [
                    "pink_noise",
                    "brown_noise",
                    "white_noise",
                    "binaural_beats",
                  ],
                },
                description: { type: Type.STRING },
              },
            },
            annotations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  type: {
                    type: Type.STRING,
                    enum: ["affirmation", "critique", "suggestion"],
                  },
                  description: { type: Type.STRING },
                  coordinates: {
                    type: Type.OBJECT,
                    properties: {
                      x: { type: Type.NUMBER },
                      y: { type: Type.NUMBER },
                    },
                  },
                  principle: { type: Type.STRING },
                  principleDescription: { type: Type.STRING },
                },
              },
            },
          },
        },
      },
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(cleanJsonString(text));

    // Sanitization
    const result: AnalysisResult = {
      overview: parsed.overview || "Analysis unavailable.",
      neuroScore: typeof parsed.neuroScore === "number" ? parsed.neuroScore : 0,
      dominantPrinciple: parsed.dominantPrinciple || "N/A",
      missingElements: Array.isArray(parsed.missingElements)
        ? parsed.missingElements
        : [],
      lighting: parsed.lighting || {
        condition: "N/A",
        circadianImpact: "N/A",
        suggestions: [],
      },
      colorPalette: parsed.colorPalette || {
        palette: [],
        psychologicalImpact: "N/A",
        suggestions: [],
      },
      furnitureArrangement: parsed.furnitureArrangement || {
        currentLayout: "N/A",
        flowAssessment: "N/A",
        prospectRefugeAnalysis: "N/A",
        suggestions: [],
      },
      texture: parsed.texture || {
        currentMaterials: [],
        hapticPerception: "N/A",
        suggestions: [],
      },
      fractalPatterns: parsed.fractalPatterns || {
        presence: "N/A",
        complexityLevel: "N/A",
        suggestions: [],
      },
      soundscape: parsed.soundscape || {
        mood: "Neutral",
        suggestedType: "white_noise",
        description: "Standard ambient noise.",
      },
      annotations: Array.isArray(parsed.annotations) ? parsed.annotations : [],
    };

    return result;
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

export const generateNeuroaestheticImage = async (
  base64Image: string,
  analysis: AnalysisResult,
  preferences?: UserPreferences
): Promise<string> => {
  const apiKey =
    import.meta.env.VITE_GEMINI_API_KEY ||
    import.meta.env.VITE_GOOGLE_GENAI_API_KEY ||
    import.meta.env.VITE_API_KEY ||
    "";

  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey });

  let contextPrompt = "";
  if (preferences) {
    contextPrompt = `
    User Preferences & Sensitivities to honor:
    - Avoid: ${preferences.sensitivities || "None"}
    - Preferred Colors: ${preferences.colorPreferences || "None"}
    - Mood Goal: ${preferences.designGoals || "Restorative"}
    `;
  }

  const missingElements = (analysis.missingElements || []).join(", ");
  const furnitureSuggestions = (
    analysis.furnitureArrangement?.suggestions || []
  ).join(", ");
  const lightingSuggestions = (analysis.lighting?.suggestions || []).join(", ");
  const colorSuggestions = (analysis.colorPalette?.suggestions || []).join(
    ", "
  );
  const textureSuggestions = (analysis.texture?.suggestions || []).join(", ");
  const fractalSuggestions = (analysis.fractalPatterns?.suggestions || []).join(
    ", "
  );
  const designFixes = (analysis.annotations || [])
    .filter((a) => a.type === "suggestion")
    .map((a) => a.description)
    .slice(0, 3)
    .join(", ");

  const prompt = `
    Edit this image to significantly improve its neuroaesthetic quality.
    You are authorized to significantly alter the room's layout.
    
    CRITICAL INSTRUCTIONS:
    1. MOVE MAJOR FURNITURE: If the current layout blocks flow or prospect/refuge, rearrange it.
    2. REMOVE ITEMS: You may remove clutter, awkward furniture, or items that create visual noise or threat.
    3. ADD ITEMS: Insert missing elements like plants, rugs, soft lighting, or new furniture to create "refuge" or "social connection".
    
    ${contextPrompt}
    
    Specific Improvements to Implement:
    - Missing Elements to Add: ${missingElements}
    - Layout Changes (Move/Remove): ${furnitureSuggestions}
    - Lighting Adjustments: ${lightingSuggestions}
    - Color Adjustments: ${colorSuggestions}
    - Texture & Materials: ${textureSuggestions}
    - Fractal Patterns: ${fractalSuggestions} (Add optimal complexity D=1.3-1.5)
    - Key Design Fixes: ${designFixes}

    Goal: Make the space feel restorative, optimizing for the human nervous system using biophilia, soft geometry, rich textures, fractal fluency, and proper circadian lighting.
    Ensure the result is photorealistic.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: prompt },
        ],
      },
      config: {
        // No specific tool needed for basic edit via generateContent on this model
      },
    });

    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      for (const part of candidates?.[0]?.content?.parts || []) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data;
        }
      }
    }

    throw new Error("No image generated.");
  } catch (error) {
    console.error("Image generation failed:", error);
    throw error;
  }
};
