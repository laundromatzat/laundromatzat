import { GoogleGenAI } from "@google/genai";
import { GenerationRequest, ModelProvider, TrainingExample } from "../types";

// Initialize Gemini Client
// Note: In a real production app, ensure strict CORS policies or use a proxy.
const apiKey =
  import.meta.env.VITE_GEMINI_API_KEY ||
  import.meta.env.VITE_GOOGLE_GENAI_API_KEY ||
  import.meta.env.VITE_API_KEY ||
  "";
const ai = new GoogleGenAI({ apiKey });

const SYSTEM_INSTRUCTION = `
You are an expert clinical scribe assistant. Your goal is to convert medical shorthand or rough notes into a polished, professional clinical note in SOAP format (Subjective, Objective, Assessment, Plan).

CRITICAL INSTRUCTIONS:
1. ADAPTABILITY: Analyze the provided "Training Examples" carefully. Mimic the user's specific phrasing, abbreviation style, sentence structure, and capitalization preferences exactly.
2. STRUCTURE: Ensure the output is clearly divided into Subjective, Objective, and Assessment & Plan sections unless the user's style dictates otherwise.
3. ACCURACY: Do not hallucinate vital signs or values not present in the shorthand. If a value is missing, omit it or note it as not recorded, depending on the user's style.
4. PROFESSIONALISM: Maintain a medical professional tone.
`;

/**
 * constructPrompt utilizes the training examples to build a few-shot prompt context.
 */
const constructPrompt = (shorthand: string, examples: TrainingExample[]) => {
  let prompt = `Current Task: Convert the following shorthand into a full clinical note.\n\n`;

  if (examples.length > 0) {
    prompt = `Reference the following examples of the user's previous notes to learn their style:\n\n`;
    examples.forEach((ex, idx) => {
      prompt += `--- EXAMPLE ${idx + 1} ---\n`;
      prompt += `INPUT (Shorthand):\n${ex.shorthand}\n\n`;
      prompt += `OUTPUT (Full Note):\n${ex.fullNote}\n\n`;
    });
    prompt += `--- END EXAMPLES ---\n\nNow, perform the task for the new input below, strictly adhering to the style shown above.\n\n`;
  }

  prompt += `INPUT (Shorthand):\n${shorthand}\n\nOUTPUT (Full Note):`;
  return prompt;
};

export const generateClinicalNote = async (
  request: GenerationRequest
): Promise<string> => {
  const prompt = constructPrompt(request.shorthand, request.examples);

  if (request.settings.provider === ModelProvider.GEMINI) {
    try {
      const isThinking = request.settings.useThinkingMode;
      // Use gemini-3-pro-preview for complex reasoning (Note Generation)
      // Use gemini-2.5-flash-lite if speed is preferred and thinking is off (though we default to Pro for quality)
      const modelName = isThinking
        ? "gemini-3-pro-preview"
        : "gemini-2.5-flash-lite-latest";

      const config: {
        systemInstruction: string;
        thinkingConfig?: { thinkingBudget: number };
      } = {
        systemInstruction: SYSTEM_INSTRUCTION,
      };

      if (isThinking) {
        config.thinkingConfig = { thinkingBudget: 32768 }; // Max budget for deep reasoning on style
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: config,
      });

      return response.text || "Error: No text generated.";
    } catch (error) {
      console.error("Gemini Generation Error:", error);
      throw new Error(
        `Gemini API Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  } else {
    // Local LLM Handling
    try {
      // Basic implementation for Ollama/OpenAI compatible endpoints
      const response = await fetch(request.settings.localModelUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: request.settings.localModelName,
          prompt: `${SYSTEM_INSTRUCTION}\n\n${prompt}`,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Local Model HTTP Error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.response || data.content || JSON.stringify(data);
    } catch (error) {
      console.error("Local LLM Error:", error);
      throw new Error(
        `Local LLM Connection Failed: ${error instanceof Error ? error.message : "Check your URL and CORS settings."}`
      );
    }
  }
};

/**
 * Analyzes the differences between the original AI output and the user's edited version
 * to provide feedback on what the system is learning.
 */
export const analyzeStyleDiff = async (
  original: string,
  edited: string
): Promise<string> => {
  // Use Flash Lite for speed and low latency
  const modelName = "gemini-2.5-flash-lite-latest";

  const prompt = `
    You are a meticulous style analyzer for a clinical documentation assistant.
    Your task is to analyze the difference between the "Original AI Output" and the "User Edited Output" to understand the user's specific stylistic preferences.

    Original AI Output:
    "${original}"

    User Edited Output:
    "${edited}"

    Analyze the specific edits made. Focus on:
    1.  **Abbreviation Patterns:** (e.g., changing "patient" to "pt", "year old" to "yo")
    2.  **Formatting/Structure:** (e.g., removing headers, changing capitalization, bullet points vs paragraphs)
    3.  **Tone/Brevity:** (e.g., removing filler words, becoming more telegraphic)

    Output a concise, actionable summary using specific examples. If significant changes are found, follow this format exactly:
    
    **Change Detected:** [Describe specific change, e.g. "Changed 'Patient' to 'Pt'"]
    **Learned Rule:** [State the rule, e.g. "Prefer 'Pt' abbreviation"]
    **Future Action:** [How the model will apply this, e.g. "Will use 'Pt' in Subjective section"]

    If no significant changes are found, return "No significant stylistic changes detected."
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    });
    return response.text || "Style preferences updated.";
  } catch (e) {
    console.error("Style analysis failed", e);
    return "Style updated based on your edits.";
  }
};

export type HealthCheckResult = {
  ok: boolean;
  message: string;
  errorType?:
    | "URL_INVALID"
    | "NETWORK_CORS"
    | "MODEL_NOT_FOUND"
    | "SERVER_ERROR"
    | "INVALID_FORMAT"
    | "UNKNOWN";
  detailedError?: string;
};

export const checkLocalHealth = async (
  url: string,
  modelName: string
): Promise<HealthCheckResult> => {
  try {
    // Validate URL syntax first
    try {
      new URL(url);
    } catch {
      return {
        ok: false,
        message: "Invalid URL format",
        errorType: "URL_INVALID",
        detailedError:
          "Please check the syntax of your URL (e.g., http://localhost:11434/api/generate).",
      };
    }

    // Attempt a functional generation check (POST)
    const payload = {
      model: modelName,
      prompt: "ping",
      stream: false,
      options: { num_predict: 1 }, // Optimization for Ollama to be fast
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();

      let errorType: HealthCheckResult["errorType"] = "SERVER_ERROR";
      if (response.status === 404) errorType = "MODEL_NOT_FOUND";

      return {
        ok: false,
        message: `Server Error: ${response.status}`,
        errorType,
        detailedError: `Status: ${response.status}\nMessage: ${text}`,
      };
    }

    const data = await response.json();

    // Verify response structure
    const hasContent =
      data.response !== undefined ||
      data.content !== undefined ||
      (data.choices && data.choices.length > 0);

    if (hasContent) {
      return {
        ok: true,
        message: "Service is healthy and model is responsive.",
      };
    }

    return {
      ok: false,
      message: "Invalid Response Format",
      errorType: "INVALID_FORMAT",
      detailedError: `Response structure was unexpected.\nResponse: ${JSON.stringify(data).substring(0, 200)}...`,
    };
  } catch (error) {
    const errString = String(error);

    if (errString.includes("Failed to fetch")) {
      return {
        ok: false,
        message: "Connection Failed",
        errorType: "NETWORK_CORS",
        detailedError:
          "Browser failed to reach the server. This is usually CORS or the server is down.",
      };
    }

    return {
      ok: false,
      message: "Connection Failed",
      errorType: "UNKNOWN",
      detailedError: errString,
    };
  }
};

export interface NoteSection {
  type: "subjective" | "objective" | "assessment" | "plan" | "other";
  title: string;
  content: string;
}

/**
 * Parses a raw clinical note into structured sections using heuristics.
 * Identifies standard SOAP headers and variations.
 */
export const parseClinicalNote = (text: string): NoteSection[] => {
  const sections: NoteSection[] = [];

  // Heuristic regex to find headers like "Subjective:", "S:", "History:", etc.
  // We match newline + optional stars + keyword + optional stars + optional colon
  const headerRegex =
    /(?:^|\n)\s*(?:\*{0,2})\s*(Subjective|Objective|Assessment|Plan|History|Physical Exam|Impression|Treatment|S:|O:|A:|P:)\s*(?:\*{0,2})[:.-]?\s*/gi;

  let match;
  let lastIndex = 0;
  let lastType: NoteSection["type"] = "other";
  let lastTitle = "General";

  const mapHeaderToType = (header: string): NoteSection["type"] => {
    const h = header.toLowerCase().replace(/[:.]/g, "").trim();
    if (h.startsWith("s") || h.includes("subjective") || h.includes("history"))
      return "subjective";
    if (h.startsWith("o") || h.includes("objective") || h.includes("physical"))
      return "objective";
    if (
      h.startsWith("a") ||
      h.includes("assessment") ||
      h.includes("impression")
    )
      return "assessment";
    if (h.startsWith("p") || h.includes("plan") || h.includes("treatment"))
      return "plan";
    return "other";
  };

  while ((match = headerRegex.exec(text)) !== null) {
    // Content before this header belongs to the previous section
    const content = text.slice(lastIndex, match.index).trim();
    if (content || sections.length === 0) {
      // If it's the very first chunk and has no header, treat as Other or inferred based on content
      if (sections.length === 0 && content) {
        sections.push({ type: "other", title: "Intro / General", content });
      } else if (content) {
        sections.push({ type: lastType, title: lastTitle, content });
      }
    }

    // Update for next section
    lastTitle = match[1].replace(/[:*]/g, "").trim();
    lastType = mapHeaderToType(match[1]);
    lastIndex = headerRegex.lastIndex;
  }

  // Push the final section
  const finalContent = text.slice(lastIndex).trim();
  if (finalContent) {
    sections.push({ type: lastType, title: lastTitle, content: finalContent });
  }

  // Fallback: If no headers found at all, try to check if content looks like a specific section
  // or just return the whole thing.
  if (sections.length === 0 && text.trim()) {
    return [{ type: "other", title: "Note", content: text }];
  }

  return sections;
};
