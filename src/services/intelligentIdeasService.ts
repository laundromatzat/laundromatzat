import { generateContent } from "./geminiClient";

export interface OrganizedData {
  categories: Category[];
  summary: string;
}

export interface Category {
  id: string;
  name: string;
  type: "ideas" | "todos" | "facts";
  items: Item[];
}

export interface Item {
  id: string;
  content: string;
  dueDate: string | null;
  priority: "high" | "medium" | "low" | null;
  relatedInputs: number[];
  completed: boolean;
}

const ORGANIZE_PROMPT = `You are a sharp, efficient organizer—think executive assistant meets productivity expert. Your job: transform messy input into actionable clarity.

ANALYSIS RULES:
For each input, determine:
1. TYPE: "ideas" (creative sparks, maybes) | "todos" (action items with implied deadlines) | "facts" (reference info, notes to remember)
2. DUE DATE: Extract explicitly mentioned dates → ISO format. Infer from urgency words: "tomorrow", "next week", "ASAP" → calculate from today. Otherwise → null.
3. PRIORITY: "high" (urgent, blocking, time-sensitive) | "medium" (important but flexible) | "low" (nice-to-have, someday) | null

CATEGORY NAMING:
- Be specific, not generic. "Home Repairs" beats "Tasks". "Vacation Planning" beats "Ideas".
- Max 3 words per category name
- Group by theme, not type (a category can have todos AND ideas)

OUTPUT STYLE:
- Item content should be cleaned and action-oriented ("Buy milk" not "I should probably buy milk")
- Use active verbs for todos: "Call", "Fix", "Send", "Research"
- Strip filler words, keep meaning

Return ONLY valid JSON:
{
  "categories": [
    {
      "id": "unique-id",
      "name": "Specific Category Name",
      "type": "ideas" | "todos" | "facts",
      "items": [
        {
          "id": "unique-item-id",
          "content": "Clean, actionable content",
          "dueDate": "2024-01-15" or null,
          "priority": "high" | "medium" | "low" | null,
          "relatedInputs": [0, 1],
          "completed": false
        }
      ]
    }
  ],
  "summary": "One punchy sentence about what was captured"
}

INPUTS:
`;

const REORGANIZE_PROMPT = `You are an intelligent organization assistant. The user wants to reorganize their existing data with a specific instruction.

Current organized data:
`;

export const organizeData = async (
  inputs: string[],
): Promise<OrganizedData> => {
  if (inputs.length === 0) {
    return { categories: [], summary: "" };
  }

  const prompt =
    ORGANIZE_PROMPT + inputs.map((input, i) => `[${i}] ${input}`).join("\n");

  try {
    const response = await generateContent(prompt);

    // Extract JSON from response (handle potential markdown code blocks)
    let jsonStr = response;
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonStr.trim());

    // Validate and return the organized data
    return {
      categories: parsed.categories || [],
      summary: parsed.summary || "",
    };
  } catch (error) {
    console.error("Error organizing data with AI:", error);
    // Fallback to basic organization if AI fails
    return {
      categories: [
        {
          id: "fallback-category",
          name: "Unorganized Items",
          type: "facts",
          items: inputs.map((input, i) => ({
            id: `item-${i}`,
            content: input,
            dueDate: null,
            priority: null,
            relatedInputs: [i],
            completed: false,
          })),
        },
      ],
      summary: "Items could not be automatically organized. Please try again.",
    };
  }
};

export const reorganizeWithInstruction = async (
  instruction: string,
  organizedData: OrganizedData,
  allInputs: string[],
): Promise<OrganizedData> => {
  const prompt = `${REORGANIZE_PROMPT}
${JSON.stringify(organizedData, null, 2)}

Original inputs:
${allInputs.map((input, i) => `[${i}] ${input}`).join("\n")}

User instruction: "${instruction}"

Reorganize the data according to the user's instruction. Return the same JSON structure as before with the reorganized data.`;

  try {
    const response = await generateContent(prompt);

    // Extract JSON from response
    let jsonStr = response;
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonStr.trim());

    return {
      categories: parsed.categories || organizedData.categories,
      summary: parsed.summary || organizedData.summary,
    };
  } catch (error) {
    console.error("Error reorganizing data with AI:", error);
    return organizedData;
  }
};
