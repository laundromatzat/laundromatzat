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

const ORGANIZE_PROMPT = `You are an intelligent organization assistant. Analyze the following inputs and organize them into structured categories.

For each input, determine:
1. The type: "ideas" (creative thoughts, suggestions), "todos" (action items, tasks), or "facts" (information, notes, reminders)
2. Extract any due dates mentioned (return in ISO format or null)
3. Determine priority based on urgency cues: "high", "medium", "low", or null
4. Group related items into meaningful categories

Return a JSON object with this exact structure:
{
  "categories": [
    {
      "id": "unique-id",
      "name": "Category Name",
      "type": "ideas" | "todos" | "facts",
      "items": [
        {
          "id": "unique-item-id",
          "content": "The extracted/cleaned content",
          "dueDate": "2024-01-15" or null,
          "priority": "high" | "medium" | "low" | null,
          "relatedInputs": [0, 1],
          "completed": false
        }
      ]
    }
  ],
  "summary": "A brief summary of what was captured and organized"
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
