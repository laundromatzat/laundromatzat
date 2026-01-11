import { generateContent } from "./geminiClient";

/**
 * Performs a "Grounding" or "Research" step to gather context before a main generation task.
 * This reduces hallucinations by providing the LLM with a synthesized set of facts to work from.
 *
 * @param topic The main topic or user request to research.
 * @param domain The specific domain to focus on (e.g., "Ultralight Backpacking", "Historical Fashion").
 * @returns A synthesized summary of relevant facts and techniques.
 */
export async function performResearch(
  topic: string,
  domain: string
): Promise<string> {
  const prompt = `You are a specialized Research Assistant for the domain: "${domain}".
  
  Your goal is to provide a dense, factual, and technical summary of information relevant to this topic:
  "${topic}"
  
  GUIDELINES:
  1. Focus on FACTS, SPECIFICATIONS, and TECHNIQUES.
  2. Avoid generic advice (e.g., "Use good thread"). Instead, be specific (e.g., "Use V69 Bonded Nylon thread").
  3. If the topic involves construction or dimensions, provide standard industry measurements.
  4. Do not generate the final creative output (no guides, no stories). ONLY provide the raw research data.
  
  OUTPUT FORMAT:
  - Bulleted list of key technical considerations.
  - Specific materials or tools recommended for this task.
  - Common pitfalls or "Gotchas" specific to this exact topic.
  
  Keep the summary concise (under 300 words) but highly technical.`;

  try {
    const researchResults = await generateContent(prompt);
    console.log(
      `[ResearchService] Completed research for "${topic}" in domain "${domain}"`
    );
    return researchResults;
  } catch (error) {
    console.warn(
      "[ResearchService] Research step failed, proceeding without ground truth:",
      error
    );
    return ""; // Fail gracefully so the main task can still attempt to run
  }
}
