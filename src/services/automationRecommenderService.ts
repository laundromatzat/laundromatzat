import { generateContent } from "./geminiClient";

export type EffortLevel = "low" | "medium" | "high";
export type ImpactLevel = "low" | "medium" | "high";
export type AutomationCategory =
  | "development"
  | "communication"
  | "data"
  | "files"
  | "scheduling"
  | "other";

export interface AutomationRecommendation {
  id: string;
  title: string;
  description: string;
  tools: string[];
  timeSavingsPerWeek: string;
  effortLevel: EffortLevel;
  impactLevel: ImpactLevel;
  category: AutomationCategory;
  quickWin: boolean;
  exampleCommand?: string;
  steps: string[];
}

export interface AutomationAnalysis {
  summary: string;
  recommendations: AutomationRecommendation[];
  topPriority: string;
}

const ANALYSIS_PROMPT = `You are an expert automation consultant. A user will describe their daily workflows and repetitive tasks. Analyze them and identify the best automation opportunities.

For each automation opportunity, provide:
- A concise title
- Clear description of what gets automated
- Specific tools/technologies to use (e.g., "Zapier", "Python", "cron", "n8n", "Make.com", "GitHub Actions", "shell scripts")
- Estimated time savings per week (e.g., "2-3 hours/week", "30 min/day")
- Effort level: "low" (< 1 hour to set up), "medium" (half day), "high" (multiple days)
- Impact level: "low", "medium", or "high" based on time/stress reduction
- Category: one of "development", "communication", "data", "files", "scheduling", "other"
- Whether it's a quick win (true if low effort + medium/high impact)
- An example command or short code snippet if applicable (keep it under 100 chars)
- 2-4 concrete implementation steps

Return ONLY valid JSON in this exact shape:
{
  "summary": "One punchy sentence about the biggest automation opportunities",
  "topPriority": "Name of the single most impactful automation to tackle first",
  "recommendations": [
    {
      "id": "unique-kebab-id",
      "title": "Short automation title",
      "description": "What this automates and why it helps",
      "tools": ["Tool1", "Tool2"],
      "timeSavingsPerWeek": "2-3 hours",
      "effortLevel": "low",
      "impactLevel": "high",
      "category": "development",
      "quickWin": true,
      "exampleCommand": "cron: 0 9 * * 1 python report.py",
      "steps": ["Step 1", "Step 2", "Step 3"]
    }
  ]
}

Sort recommendations by impact/effort ratio (highest value first). Aim for 4-8 recommendations.

USER TASKS:
`;

export async function analyzeForAutomations(
  taskDescription: string,
): Promise<AutomationAnalysis> {
  const prompt = ANALYSIS_PROMPT + taskDescription;

  const response = await generateContent(prompt);

  let jsonStr = response;
  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  const parsed = JSON.parse(jsonStr.trim()) as {
    summary?: string;
    topPriority?: string;
    recommendations?: Array<Partial<AutomationRecommendation>>;
  };

  return {
    summary: parsed.summary ?? "",
    topPriority: parsed.topPriority ?? "",
    recommendations: (parsed.recommendations ?? []).map((rec, index) => ({
      id: rec.id ?? `rec-${index}`,
      title: rec.title ?? "Untitled",
      description: rec.description ?? "",
      tools: rec.tools ?? [],
      timeSavingsPerWeek: rec.timeSavingsPerWeek ?? "unknown",
      effortLevel: rec.effortLevel ?? "medium",
      impactLevel: rec.impactLevel ?? "medium",
      category: rec.category ?? "other",
      quickWin: rec.quickWin ?? false,
      exampleCommand: rec.exampleCommand,
      steps: rec.steps ?? [],
    })),
  };
}
