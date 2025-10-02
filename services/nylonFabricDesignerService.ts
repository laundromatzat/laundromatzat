import { z } from 'zod';
import { generateContent } from './geminiService';

const VisualRepresentationSchema = z.object({
  stage: z.string(),
  svg: z.string(),
});

const VisualsResponseSchema = z.array(VisualRepresentationSchema);

export async function generateSewingGuide(description: string): Promise<string> {
  const prompt = `You are an expert in hand-sewing nylon fabric and crafting. Analyze the following project description and create a comprehensive hand-sewing guide.

CRITICAL REQUIREMENTS:
- ALL instructions must be for HAND SEWING ONLY - NO sewing machines
- Use handheld needle and thread exclusively
- Can recommend Speedy Stitcher sewing awl tool for heavy-duty seams
- Reference techniques from MYOG (Make Your Own Gear) hand-sewing guides
- Focus on hand-sewing stitches: running stitch, backstitch, whipstitch, saddle stitch, etc.

Research and reference techniques from:
- MYOG (Make Your Own Gear) hand-sewing guides
- Bushcraft and camping gear repair techniques
- Leather working hand-sewing methods (applicable to heavy nylon)
- Traditional sailmaking hand-sewing techniques
- DIY ultralight backpacking hand-sewing guides

Format your response with clear HTML structure using these tags:
- <h3> for major sections
- <h4> for subsections
- <p> for paragraphs
- <ul> and <ol> for lists
- <strong> for emphasis
- <div class="tip-box"> for tips and notes

Include these sections:
1. Project Overview & Analysis
2. Materials Needed (specific nylon types, waxed thread, bonded nylon thread, notions)
3. Tools Required (needles, Speedy Stitcher if needed, awl, scissors, pins, clips)
4. Fabric Cutting Guide (with measurements and diagram descriptions)
5. Step-by-Step Hand-Sewing Assembly Instructions
   - Where to place folds
   - Where to hand-stitch (backstitch, running stitch, whipstitch, saddle stitch, etc.)
   - When to use Speedy Stitcher for heavy-duty seams
   - Hem instructions (hand-rolled, whipstitch, etc.)
   - How to connect pieces by hand
6. Hand-Sewing Finishing Techniques
7. Pro Tips & Common Mistakes to Avoid

Use professional hand-sewing terminology and explain techniques like:
- Hand-stitch types and when to use them (backstitch for strength, running stitch for basting, whipstitch for edges)
- Proper seam allowances for hand-sewn nylon
- How to lock stitches at beginning and end
- Edge finishing methods by hand
- Tips for working with slippery nylon fabric when hand-sewing
- When to use Speedy Stitcher awl for thick seams or heavy-duty work

PROJECT DESCRIPTION:
${description}

Generate the complete guide now:`;
  return generateContent(prompt);
}

export async function generateProjectImages(description: string) {
  const prompt = `For this hand-sewn nylon fabric project: "${description}"

Create 3 visual representations using SVG code. Generate complete, valid SVG markup for:

1. CUTTING PATTERN DIAGRAM - Show the pattern pieces laid out with measurements, fold lines, and cutting instructions
2. ASSEMBLY DIAGRAM - Show how pieces connect with stitch lines, seam allowances, and assembly order
3. FINISHED PRODUCT RENDERING - Show an isometric or 3D-style view of the completed item

Return ONLY a JSON array (no markdown, no backticks) with this structure:
[
  {
    "stage": "Cutting Pattern",
    "svg": "<svg width='400' height='300' xmlns='http://www.w3.org/2000/svg'><!-- complete SVG code here --></svg>"
  },
  {
    "stage": "Assembly Diagram",
    "svg": "<svg width='400' height='300' xmlns='http://www.w3.org/2000/svg'><!-- complete SVG code here --></svg>"
  },
  {
    "stage": "Finished Product",
    "svg": "<svg width='400' height='300' xmlns='http://www.w3.org/2000/svg'><!-- complete SVG code here --></svg>"
  }
]

Make the SVGs detailed, technical, and professional looking with:
- Clear labels and measurements
- Different colors for different pattern pieces
- Dotted lines for fold lines
- Dashed lines for stitch lines
- Arrows showing assembly direction
- Realistic proportions`;

  const responseText = await generateContent(prompt);
  const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

  try {
    const visuals = VisualsResponseSchema.parse(JSON.parse(cleanJson));
    return visuals;
  } catch (error) {
    console.error('Failed to parse project visuals response:', error, responseText);
    throw new Error('The fabric designer returned an invalid visualization response. Please try again.');
  }
}
