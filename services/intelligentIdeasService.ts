import { generateContent } from './geminiService';

export interface OrganizedData {
  categories: Category[];
  summary: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'ideas' | 'todos' | 'facts';
  items: Item[];
}

export interface Item {
  id: string;
  content: string;
  dueDate: string | null;
  priority: 'high' | 'medium' | 'low' | null;
  relatedInputs: number[];
  completed: boolean;
}

export const organizeData = async (inputs: string[]): Promise<OrganizedData> => {
  const prompt = `You are an intelligent personal assistant that organizes stream-of-consciousness thoughts, ideas, and to-dos.

I will provide you with a list of user inputs (thoughts, ideas, tasks, facts). Your job is to:

1. Analyze ALL inputs together to understand context and relationships
2. Identify distinct topics and create/update categories as needed
3. Group related items together (e.g., if a new input adds details to an existing to-do, merge them)
4. Extract actionable to-dos with realistic due dates when urgency is implied
5. Organize ideas by theme
6. Keep track of facts/information to remember
7. Dynamically create, merge, or split categories based on what makes sense

All inputs:
${inputs.map((input, i) => `[${i + 1}] ${input}`).join('\n\n')}

Respond with a JSON object with this structure:
{
  "categories": [
    {
      "id": "unique-id-string",
      "name": "Category Name",
      "type": "ideas|todos|facts",
      "items": [
        {
          "id": "unique-item-id",
          "content": "The organized/merged content",
          "dueDate": "YYYY-MM-DD or null",
          "priority": "high|medium|low or null",
          "relatedInputs": [1, 3, 5],
          "completed": false
        }
      ]
    }
  ],
  "summary": "A brief overview of what's been captured and organized"
}

Guidelines:
- Generate unique IDs for each category and item (use descriptive strings like "work-tasks", "project-alpha-idea-1")
- Be intelligent about merging related items
- Infer due dates from context ("by Friday", "this week", "urgent", etc.)
- Today's date is ${new Date().toISOString().split('T')[0]}
- Create subcategories when items naturally cluster
- Use clear, concise category names
- If something doesn't fit existing categories, create a new one
- Remove empty categories
- Set completed to false for all items initially

CRITICAL: Respond ONLY with valid JSON. Do not include any text before or after the JSON object. Do not use markdown code blocks.`;

  const responseText = await generateContent(prompt);
  const cleanJson = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  try {
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('Failed to parse organization response:', error, responseText);
    throw new Error('The ideas assistant returned an invalid response. Please try again.');
  }
};

export const reorganizeWithInstruction = async (instruction: string, organizedData: OrganizedData, allInputs: string[]): Promise<OrganizedData> => {
    if (!organizedData || allInputs.length === 0) {
        throw new Error("Please add some content first before giving organizational instructions.");
    }

    const prompt = `You are an intelligent personal assistant. The user has given you an instruction on how to reorganize their existing data.

Current organization:
${JSON.stringify(organizedData, null, 2)}

Original inputs:
${allInputs.map((input, i) => `[${i + 1}] ${input}`).join('\n\n')}

User's organizational instruction:
"${instruction}"

Please reorganize the data according to the user's instruction. Maintain all existing item IDs and completion statuses. Only change the structure, categories, groupings, or presentation as requested.

Respond with a JSON object with the same structure as the current organization, but reorganized according to the instruction.

CRITICAL: Respond ONLY with valid JSON. Do not include any text before or after the JSON object. Do not use markdown code blocks.`;

    const responseText = await generateContent(prompt);
    const cleanJson = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    try {
        return JSON.parse(cleanJson);
    } catch (error) {
        console.error('Failed to parse reorganize response:', error, responseText);
        throw new Error('The ideas assistant returned an invalid response. Please try again.');
    }
};

