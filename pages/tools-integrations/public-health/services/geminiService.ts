import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { QueryResult, AnalysisResult } from "../types";

let ai: GoogleGenAI;

export function initialize() {
  const apiKey =
    import.meta.env.VITE_GEMINI_API_KEY ||
    import.meta.env.VITE_GOOGLE_GENAI_API_KEY ||
    import.meta.env.VITE_API_KEY ||
    "";
  if (!apiKey) throw new Error("API Key is missing. Check your .env file.");
  ai = new GoogleGenAI({ apiKey });
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// [NEW] Unified Store Logic: Find existing 'Public Health Knowledge Base' or create it.
export async function ensureMainRagStore(): Promise<string> {
  if (!ai) throw new Error("Gemini AI not initialized");

  // List existing stores to find ours
  try {
    const listResp = await ai.fileSearchStores.list();
    // listResp is a Pager, so we iterate to find the store
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const store of listResp as any) {
      if (store.displayName === "Public Health Knowledge Base") {
        console.log("Found existing RAG store:", store.name);
        return store.name;
      }
    }
  } catch (err) {
    console.warn(
      "Failed to list RAG stores, proceeding to create new one.",
      err
    );
  }

  // Create if not found
  console.log("Creating new persistent RAG store...");
  const ragStore = await ai.fileSearchStores.create({
    config: { displayName: "Public Health Knowledge Base" },
  });

  if (!ragStore.name) {
    throw new Error("Failed to create RAG store: name is missing.");
  }
  return ragStore.name;
}

export async function uploadToRagStore(
  ragStoreName: string,
  file: File
): Promise<void> {
  if (!ai) throw new Error("Gemini AI not initialized");

  let op = await ai.fileSearchStores.uploadToFileSearchStore({
    fileSearchStoreName: ragStoreName,
    file: file,
  });

  while (!op.done) {
    await delay(3000);
    op = await ai.operations.get({ operation: op });
  }
}

export async function analyzeDocumentBatch(
  ragStoreName: string,
  fileNames: string[]
): Promise<AnalysisResult> {
  if (!ai) throw new Error("Gemini AI not initialized");

  const systemPrompt = `You are the document-organization engine for an internal Public Health app.
    
    The app uses a SINGLE Unified Knowledge Base.
    Your job is to analyze the NEWLY uploaded files (${fileNames.join(", ")}) and classify them so they fit into the existing corpus.

    For each document:
    1.  **Summary & Keywords**: Extract core topics.
    2.  **Versioning**: Detect if this is a new version of an existing file (check filename dates, v1/v2, etc).
    3.  **Strict Categorization**:
        - **category**: Choose ONE of: "Protocol", "Form", "Report", "Guidance", "Memo", "Training", "Other".
        - **tags**: Add 2-5 semantic tags e.g. ["Clinical", "Street Medicine", "Housing", "Harm Reduction"].
    4.  **Relationships**: Identify if this updates or relates to other likely documents (e.g. "Updates the 2023 Protocol").

    Output PURE JSON adhering to the schema.
    `;

  const analysisSchema = {
    type: Type.OBJECT,
    properties: {
      batch_summary: { type: Type.STRING },
      documents: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            filename: { type: Type.STRING },
            short_summary: { type: Type.STRING },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            category: {
              type: Type.STRING,
              enum: [
                "Protocol",
                "Form",
                "Report",
                "Guidance",
                "Memo",
                "Training",
                "Other",
              ],
            },
            suggested_path: { type: Type.STRING },
            detected_version: { type: Type.STRING },
            possible_duplicates: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  existing_document: { type: Type.STRING },
                  confidence_score: { type: Type.NUMBER },
                  reason: { type: Type.STRING },
                },
              },
            },
          },
          required: [
            "filename",
            "short_summary",
            "keywords",
            "tags",
            "category",
            "suggested_path",
          ],
        },
      },
      proposed_hierarchy_changes: { type: Type.STRING },
      archive_recommendations: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      notes_for_user: { type: Type.STRING },
    },
    required: [
      "batch_summary",
      "documents",
      "proposed_hierarchy_changes",
      "archive_recommendations",
      "notes_for_user",
    ],
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents:
        "Analyze the uploaded documents and provide the organization report.",
      config: {
        systemInstruction:
          systemPrompt +
          `\n\nReturn analysis as JSON: ${JSON.stringify(analysisSchema)}`,
        tools: [
          {
            fileSearch: {
              fileSearchStoreNames: [ragStoreName],
            },
          },
        ],
      },
    });

    let jsonText = response.text;
    if (!jsonText) throw new Error("No response received from the model.");

    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonText = jsonMatch[0];

    return JSON.parse(jsonText) as AnalysisResult;
  } catch (err) {
    console.error("Analysis failed", err);
    throw new Error("Failed to analyze documents. Please try again.");
  }
}

export async function fileSearch(
  ragStoreName: string,
  query: string
): Promise<QueryResult> {
  if (!ai) throw new Error("Gemini AI not initialized");

  // We can inject "Context Hints" into the prompt if needed, e.g. "Focus on Clinical documents"
  // For now we keep it broad to search the whole store.
  const prompt = `You are a helper for the Public Health Organizer.
  Using the context provided, answer the user's question: "${query}"
  If the answer isn't in the docs, say so.`;

  const geminiResponse: GenerateContentResponse =
    await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ fileSearch: { fileSearchStoreNames: [ragStoreName] } }],
      },
    });

  const groundingChunks =
    geminiResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

  return {
    text: geminiResponse.text || "No answer generated.",
    groundingChunks: groundingChunks,
  };
}

// Deprecated or Admin use only
export async function deleteRagStore(ragStoreName: string): Promise<void> {
  if (!ai) throw new Error("Gemini AI not initialized");
  await ai.fileSearchStores.delete({
    name: ragStoreName,
    config: { force: true },
  });
}
