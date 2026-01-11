import {
  FileType,
  ChatMessage,
  AIOrganizationSuggestion,
  SummaryLength,
  OrganizationPattern,
} from "@/types";

// Default configuration - should be overridable via settings
let LM_STUDIO_BASE_URL: string = "http://localhost:1234/v1";
let LM_STUDIO_CHAT_MODEL: string = "phi-3-mini-4k-instruct";
const LM_STUDIO_API_KEY: string = "lm-studio";

export const configureLocalAI = (
  url: string,
  chatModel: string,
  visionModel?: string
) => {
  LM_STUDIO_BASE_URL = url;
  LM_STUDIO_CHAT_MODEL = chatModel;
  if (visionModel) LM_STUDIO_VISION_MODEL = visionModel;
};

export const MAX_CHARS_PER_CHUNK = 10000;
const MAX_SUMMARY_INPUT_CHARS = 10000;
const MAX_CONTEXT_SAMPLES = 3;

interface LMStudioErrorResponse {
  error?: { message: string };
}

const callLMStudioAPI = async (
  endpoint: string,
  body: object,
  signal?: AbortSignal
): Promise<{
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message: string };
}> => {
  try {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (
      LM_STUDIO_API_KEY &&
      LM_STUDIO_API_KEY !== "lm-studio" &&
      LM_STUDIO_API_KEY.trim() !== ""
    ) {
      headers["Authorization"] = `Bearer ${LM_STUDIO_API_KEY}`;
    }

    // Ensure URL doesn't have double slashes if endpoint has one
    const baseUrl = LM_STUDIO_BASE_URL.endsWith("/")
      ? LM_STUDIO_BASE_URL.slice(0, -1)
      : LM_STUDIO_BASE_URL;
    const finalUrl = `${baseUrl}${endpoint}`;

    const response = await fetch(finalUrl, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      let errorData: LMStudioErrorResponse | string = await response.text();
      try {
        errorData = JSON.parse(errorData as string) as LMStudioErrorResponse;
      } catch {
        /* ignore */
      }
      const message =
        typeof errorData === "object" && errorData?.error?.message
          ? errorData.error.message
          : `LM Studio API request failed with status ${response.status}: ${typeof errorData === "string" ? errorData : JSON.stringify(errorData)}`;
      console.error(
        "LM Studio API Error:",
        message,
        "Endpoint:",
        endpoint,
        "Status:",
        response.status
      );
      throw new Error(message);
    }
    return await response.json();
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown error connecting to LM Studio.";
    if (
      errorMessage.includes("Failed to fetch") ||
      errorMessage.includes("ECONNREFUSED")
    ) {
      throw new Error(
        `Could not connect to Local AI at ${LM_STUDIO_BASE_URL}. Ensure your local server (e.g., LM Studio, Ollama) is running.`
      );
    }
    throw new Error(`Local AI API call failed: ${errorMessage}`);
  }
};

const formatCustomPrompt = (customUserPrompt?: string): string =>
  customUserPrompt
    ? `\n\nUser's specific instructions: "${customUserPrompt}"`
    : "";

const getSummaryMaxTokens = (lengthPreference: SummaryLength): number => {
  switch (lengthPreference) {
    case "short":
      return 256;
    case "medium":
      return 512;
    case "long":
      return 1024;
    default:
      return 512;
  }
};

const generateTextCompletion = async (
  systemPrompt: string,
  userPrompt: string,
  modelIdentifier: string,
  jsonSchemaForOutput?: object,
  maxCompletionTokens = 1024
): Promise<string> => {
  const messages = [];
  if (systemPrompt && systemPrompt.trim() !== "")
    messages.push({ role: "system", content: systemPrompt });
  messages.push({ role: "user", content: userPrompt || "Provide a response." });

  const requestBody: {
    model: string;
    messages: Array<{ role: string; content: string }>;
    temperature: number;
    max_tokens: number;
    response_format?: { type: string; json_schema: { schema: object } };
  } = {
    model: modelIdentifier,
    messages: messages,
    temperature: 0.7,
    max_tokens: maxCompletionTokens,
  };
  if (jsonSchemaForOutput) {
    requestBody.response_format = {
      type: "json_schema",
      json_schema: { schema: jsonSchemaForOutput },
    };
  }

  try {
    const response = await callLMStudioAPI("/chat/completions", requestBody);
    if (
      response.choices &&
      response.choices.length > 0 &&
      response.choices[0].message?.content
    )
      return response.choices[0].message.content.trim();
    return "Error: Received an unexpected response from the local LLM.";
  } catch (error) {
    return `Error: Could not get a response from local LLM. ${(error as Error).message}`;
  }
};

const summarizeSingleChunk = async (
  chunkText: string,
  fileName: string,
  customUserPrompt?: string,
  chunkInfo: string = "",
  summaryLength: SummaryLength = "medium"
): Promise<string> => {
  const userInstructions = formatCustomPrompt(customUserPrompt);
  const systemP = "You are an expert summarizer.";
  const userP = `Summarize key info in ${chunkInfo}document "${fileName}". Be concise.${userInstructions}\n\nText:\n${chunkText.substring(0, MAX_CHARS_PER_CHUNK)}\n\nSummary:`;
  return generateTextCompletion(
    systemP,
    userP,
    LM_STUDIO_CHAT_MODEL,
    undefined,
    getSummaryMaxTokens(summaryLength)
  );
};

export const summarizeTextContent = async (
  textContent: string,
  fileName: string,
  customUserPrompt?: string,
  summaryLength: SummaryLength = "medium"
): Promise<string> => {
  try {
    if (!textContent || textContent.trim() === "")
      return "No content to summarize.";

    if (textContent.length > MAX_CHARS_PER_CHUNK) {
      const chunks: string[] = [];
      for (let i = 0; i < textContent.length; i += MAX_CHARS_PER_CHUNK)
        chunks.push(textContent.substring(i, i + MAX_CHARS_PER_CHUNK));
      const chunkSummaries: string[] = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunkSummary = await summarizeSingleChunk(
          chunks[i],
          fileName,
          customUserPrompt,
          `part ${i + 1}/${chunks.length} of `,
          summaryLength
        );
        if (chunkSummary.startsWith("Error:")) return chunkSummary;
        chunkSummaries.push(chunkSummary);
      }
      const combinedSummaries = chunkSummaries.join("\n\n---\n\n");
      const userInstructions = formatCustomPrompt(customUserPrompt);
      const systemP = "You combine partial summaries into a coherent whole.";
      const finalUserP = `Combine partial summaries from "${fileName}" into one concise overall summary.${userInstructions}\n\nPartial Summaries:\n${combinedSummaries.substring(0, MAX_SUMMARY_INPUT_CHARS)}\n\nOverall Summary:`;
      return generateTextCompletion(
        systemP,
        finalUserP,
        LM_STUDIO_CHAT_MODEL,
        undefined,
        getSummaryMaxTokens(summaryLength) * 2
      );
    } else {
      return await summarizeSingleChunk(
        textContent.substring(0, MAX_CHARS_PER_CHUNK),
        fileName,
        customUserPrompt,
        "",
        summaryLength
      );
    }
  } catch (error) {
    return `Error summarizing "${fileName}": ${(error as Error).message}`;
  }
};

export const summarizeCodeContent = async (
  codeContent: string,
  fileName: string,
  customUserPrompt?: string,
  summaryLength: SummaryLength = "medium"
): Promise<string> => {
  if (!codeContent) return "No code content.";
  const userInstructions = formatCustomPrompt(customUserPrompt);
  const systemP = "You are an expert code analyst.";
  const userP = `File: "${fileName}". Explain code purpose, key elements, functionality. Suggest improvements if any. Be concise.${userInstructions}\nCode (up to ${MAX_CHARS_PER_CHUNK} chars):\n\`\`\`\n${codeContent.substring(0, MAX_CHARS_PER_CHUNK)}\n\`\`\`\nExplanation:`;
  return generateTextCompletion(
    systemP,
    userP,
    LM_STUDIO_CHAT_MODEL,
    undefined,
    getSummaryMaxTokens(summaryLength)
  );
};

export const suggestActionsForFile = async (
  summary: string,
  fileType: FileType,
  fileName: string,
  customUserPrompt?: string
): Promise<string[]> => {
  if (!summary || summary.trim() === "" || summary.startsWith("Error:"))
    return ["Cannot suggest: summary unavailable."];

  const userInstructions = formatCustomPrompt(customUserPrompt);
  const systemP =
    "You suggest actionable tasks. Respond ONLY with valid JSON array of strings, per schema.";
  const userP = `File: "${fileName}" (${fileType}). Summary: "${summary.substring(0, MAX_CHARS_PER_CHUNK / 2)}". ${userInstructions}\nSuggest 3 distinct actions. JSON array output only. Example: ["Schedule meeting", "Extract contacts"]. Output:`;
  const actionsSchema = {
    type: "array",
    items: { type: "string" },
    description: "List of 3 suggested actionable tasks.",
  };
  let responseText = "";
  try {
    responseText = await generateTextCompletion(
      systemP,
      userP,
      LM_STUDIO_CHAT_MODEL,
      actionsSchema,
      512
    );
    if (responseText.startsWith("Error:")) return [responseText];
    let processedJsonText = responseText.trim();
    const match = processedJsonText.match(/^```(\w*)?\s*\n?(.*?)\n?\s*```$/s);
    if (match?.[2]) processedJsonText = match[2].trim();

    const parsedActions = JSON.parse(processedJsonText);
    if (
      Array.isArray(parsedActions) &&
      parsedActions.every((item) => typeof item === "string")
    )
      return parsedActions;
    return ["Failed to get actions in expected format (array of strings)."];
  } catch (error: unknown) {
    if (error instanceof SyntaxError)
      return [
        `Error: Invalid JSON for actions from LLM. (Content: "${responseText.substring(0, 100)}...")`,
      ];
    return [
      `Error suggesting actions for "${fileName}": ${(error as Error).message}`,
    ];
  }
};

export const getOrganizationRecommendations = async (
  summary: string,
  fileName: string,
  fileType: FileType,
  userDefinedPatterns: OrganizationPattern[] = [],
  customUserPrompt?: string
): Promise<AIOrganizationSuggestion> => {
  if (!summary || summary.trim() === "" || summary.startsWith("Error:"))
    return {};

  const userInstructions = formatCustomPrompt(customUserPrompt);
  let preferencesContext = "USER PREFERENCES & EXAMPLES (Prioritize these):\n";
  if (userDefinedPatterns.length > 0) {
    preferencesContext += "Defined Patterns:\n";
    userDefinedPatterns.slice(0, MAX_CONTEXT_SAMPLES).forEach((p) => {
      preferencesContext += `- Type: ${p.type}, For: ${Array.isArray(p.fileTypeApplicability) ? p.fileTypeApplicability.join("/") : p.fileTypeApplicability} files (keywords: ${p.categoryKeywords.join(",") || "any"}), Pattern: "${p.pattern}" (Desc: ${p.description || "N/A"})\n`;
    });
  }

  const systemP = `You are an AI skilled in file organization. Be CONSERVATIVE with renaming; only suggest if current name ("${fileName}") is very unclear or violates strong user preferences/patterns. If renaming, PRESERVE THE ORIGINAL FILE EXTENSION unless a format change is implied by context. Respond ONLY with a valid JSON object per schema.`;
  const userP = `
File: "${fileName}" (${fileType}). Summary: "${summary.substring(0, MAX_CHARS_PER_CHUNK / 2)}". ${userInstructions}
${preferencesContext}
Suggest organizational improvements for "${fileName}". Make it findable, understandable, aligning with preferences. JSON output only. Omit keys if no good suggestion. Output:`;

  const organizationSchema = {
    type: "object",
    properties: {
      suggestedName: {
        type: "string",
        description:
          "New, clear file name (MUST INCLUDE ORIGINAL EXTENSION like .txt, .png). Omit if current is good.",
      },
      suggestedTags: {
        type: "array",
        items: { type: "string" },
        description: "3-5 relevant keyword tags.",
      },
      suggestedLogicalPath: {
        type: "string",
        description:
          "Logical folder path (e.g., 'Work/Projects/Alpha'). Filename will be appended.",
      },
      reasoning: {
        type: "string",
        description: "Brief explanation for suggestions.",
      },
    },
    description: "Organizational suggestions. All properties optional.",
  };
  let responseText: string = "";
  try {
    responseText = await generateTextCompletion(
      systemP,
      userP,
      LM_STUDIO_CHAT_MODEL,
      organizationSchema,
      512
    );
    if (responseText.startsWith("Error:")) {
      console.error("LLM Error (org recs):", responseText);
      return {};
    }
    let processedJsonText = responseText.trim();
    const match = processedJsonText.match(/^```(\w*)?\s*\n?(.*?)\n?\s*```$/s);
    if (match?.[2]) processedJsonText = match[2].trim();
    return JSON.parse(processedJsonText) as AIOrganizationSuggestion;
  } catch {
    console.error(
      `Malformed JSON (org recs): "${responseText.substring(0, 200)}..."`
    );
    return {};
  }
};

export const chatWithLocalAI = async (
  messages: ChatMessage[],
  fileContext: string
): Promise<string> => {
  const formattedMessages = messages.map((msg) => ({
    role: msg.sender === "ai" ? "assistant" : "user",
    content: msg.text,
  }));
  // Add context as system message
  formattedMessages.unshift({
    role: "system",
    content: `Context: ${fileContext}`,
  });

  try {
    const requestBody = {
      model: LM_STUDIO_CHAT_MODEL,
      messages: formattedMessages,
      temperature: 0.7,
    };
    const response = await callLMStudioAPI("/chat/completions", requestBody);
    if (response.choices?.[0]?.message?.content)
      return response.choices[0].message.content.trim();
    return "Error: Unexpected response.";
  } catch (error) {
    return `Error: ${(error as Error).message}`;
  }
};
