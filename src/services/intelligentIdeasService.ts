// This service previously used Gemini for idea organization.
// It has been disabled as part of the Chat Agent removal.

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

export const organizeData = async (
  inputs: string[]
): Promise<OrganizedData> => {
  console.warn("AI organization is disabled.");
  return {
    categories: [
      {
        id: "static-placeholder",
        name: "AI Disabled",
        type: "facts",
        items: inputs.map((input, i) => ({
          id: `item-${i}`,
          content: input,
          dueDate: null,
          priority: null,
          relatedInputs: [],
          completed: false,
        })),
      },
    ],
    summary: "AI Assistant features have been removed. Data is unorganized.",
  };
};

export const reorganizeWithInstruction = async (
  instruction: string,
  organizedData: OrganizedData,
  allInputs: string[]
): Promise<OrganizedData> => {
  console.warn("AI reorganization is disabled.", {
    instruction,
    count: allInputs.length,
  });
  return organizedData;
};
