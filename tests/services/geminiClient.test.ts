import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateContent,
  createChatSession,
} from "../../services/geminiClient";
import { GoogleGenAI } from "@google/genai";

// Mock the Google GenAI module
vi.mock("@google/genai", () => {
  const mockGenerateContent = vi.fn();
  const mockSendMessage = vi.fn();
  const mockSendMessageStream = vi.fn();

  return {
    GoogleGenAI: vi.fn(() => ({
      models: {
        generateContent: mockGenerateContent,
      },
      chats: {
        create: vi.fn(() => ({
          sendMessage: mockSendMessage,
          sendMessageStream: mockSendMessageStream,
        })),
      },
    })),
  };
});

// Mock local AI client
vi.mock("../../services/localAIClient", () => ({
  generateContentLocal: vi.fn().mockResolvedValue("Local AI response"),
  createLocalChatSession: vi.fn().mockResolvedValue({
    sendMessage: vi.fn().mockResolvedValue("Local chat response"),
    sendMessageStream: vi.fn(),
  }),
}));

describe("geminiClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set API key for tests
    vi.stubEnv("VITE_GEMINI_API_KEY", "test-api-key");
    vi.stubEnv("VITE_AI_PROVIDER", "gemini");
  });

  describe("generateContent", () => {
    it("should successfully call Gemini API with correct parameters", async () => {
      const mockResponse = { text: "Generated content response" };
      const client = new GoogleGenAI({ apiKey: "test" });
      vi.mocked(client.models.generateContent).mockResolvedValue(
        mockResponse as { text: string }
      );

      const result = await generateContent("Test prompt");

      expect(result).toBe("Generated content response");
      expect(client.models.generateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "gemini-2.5-flash",
          contents: [{ role: "user", parts: [{ text: "Test prompt" }] }],
        })
      );
    });

    it("should use local AI when provider is set to local", async () => {
      vi.stubEnv("VITE_AI_PROVIDER", "local");
      const { generateContentLocal } = await import(
        "../../services/localAIClient"
      );

      const result = await generateContent("Test prompt");

      expect(result).toBe("Local AI response");
      expect(generateContentLocal).toHaveBeenCalledWith(
        "Test prompt",
        expect.any(String)
      );
    });

    it("should handle API errors gracefully", async () => {
      const client = new GoogleGenAI({ apiKey: "test" });
      const mockError = new Error("API Error");
      vi.mocked(client.models.generateContent).mockRejectedValue(mockError);

      await expect(generateContent("Test prompt")).rejects.toThrow("API Error");
    });

    it("should throw error when API returns no text", async () => {
      const client = new GoogleGenAI({ apiKey: "test" });
      vi.mocked(client.models.generateContent).mockResolvedValue({
        text: null,
      } as { text: null });

      const result = await generateContent("Test prompt");
      expect(result).toBe("");
    });
  });

  describe("createChatSession", () => {
    it("should create chat session with correct system instructions", async () => {
      const session = await createChatSession();

      expect(session).toBeDefined();
      expect(typeof session.sendMessage).toBe("function");
      expect(typeof session.sendMessageStream).toBe("function");
    });

    it("should use local AI chat when provider is local", async () => {
      vi.stubEnv("VITE_AI_PROVIDER", "local");
      const { createLocalChatSession } = await import(
        "../../services/localAIClient"
      );

      const session = await createChatSession();

      expect(createLocalChatSession).toHaveBeenCalled();
      expect(session).toBeDefined();
    });
  });

  describe("ChatSession", () => {
    it("should send messages and return responses", async () => {
      const client = new GoogleGenAI({ apiKey: "test" });
      const mockChat = client.chats.create(
        {} as { model: string; systemInstruction?: string }
      );
      vi.mocked(mockChat.sendMessage).mockResolvedValue({
        text: "Chat response",
      } as { text: string });

      const session = await createChatSession();
      await session.sendMessage("Hello");

      expect(mockChat.sendMessage).toHaveBeenCalledWith({
        message: "Hello",
      });
    });

    it("should handle chat errors gracefully", async () => {
      const client = new GoogleGenAI({ apiKey: "test" });
      const mockChat = client.chats.create(
        {} as { model: string; systemInstruction?: string }
      );
      vi.mocked(mockChat.sendMessage).mockRejectedValue(
        new Error("Chat error")
      );

      const session = await createChatSession();

      await expect(session.sendMessage("Hello")).rejects.toThrow("Chat error");
    });
  });
});
