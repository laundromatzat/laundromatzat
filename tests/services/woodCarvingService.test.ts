import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateCarvingVariations } from "../../services/woodCarvingService";

// Mock generateContent from geminiClient
vi.mock("../../services/geminiClient", () => ({
  generateContent: vi.fn(),
}));

// Mock GoogleGenAI
vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn(() => ({
    models: {
      generateImage: vi.fn(),
    },
  })),
}));

describe("woodCarvingService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateCarvingVariations", () => {
    it("should return 3 variations with different styles", async () => {
      const { generateContent } = await import("../../services/geminiClient");

      // Mock successful image generation responses
      vi.mocked(generateContent)
        .mockResolvedValueOnce("data:image/png;base64,iVBORw0KGgoAAAANS")
        .mockResolvedValueOnce("data:image/png;base64,iVBORw0KGgoAAAANT")
        .mockResolvedValueOnce("data:image/png;base64,iVBORw0KGgoAAAANU");

      const variations = await generateCarvingVariations("A wooden bird");

      expect(variations).toHaveLength(3);
      expect(variations[0]).toHaveProperty("name");
      expect(variations[0]).toHaveProperty("description");
      expect(variations[0]).toHaveProperty("imageUrl");
      expect(variations[0].imageUrl).toContain("data:image");
    });

    it("should handle generation errors gracefully", async () => {
      const { generateContent } = await import("../../services/geminiClient");

      vi.mocked(generateContent).mockRejectedValue(
        new Error("Generation failed")
      );

      await expect(
        generateCarvingVariations("A wooden bird")
      ).rejects.toThrow();
    });
  });
});
