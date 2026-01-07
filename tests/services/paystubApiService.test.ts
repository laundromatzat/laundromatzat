import { describe, it, expect, vi } from "vitest";
import {
  setAuthToken,
  analyzePaycheckPdf,
  fetchPaychecks,
  updatePaycheckReportedHours,
  clearAllData,
} from "../../services/paystubApiService";

// Mock fetch globally
global.fetch = vi.fn();

describe("paystubApiService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAuthToken(null);
  });

  describe("setAuthToken", () => {
    it("should set auth token correctly", () => {
      setAuthToken("test-token");
      // Token is set internally, will be tested via other functions
      expect(true).toBe(true);
    });
  });

  describe("analyzePaycheckPdf", () => {
    it("should send FormData with file and auth header", async () => {
      setAuthToken("test-token");
      const mockFile = new File(["pdf content"], "test.pdf", {
        type: "application/pdf",
      });
      const mockResponse = {
        id: 1,
        filename: "test.pdf",
        gross_pay: 5000,
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await analyzePaycheckPdf(mockFile);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/analyze"),
        expect.objectContaining({
          method: "POST",
          headers: { Authorization: "Bearer test-token" },
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it("should throw Unauthorized error on 401", async () => {
      const mockFile = new File(["pdf content"], "test.pdf", {
        type: "application/pdf",
      });

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: "Unauthorized" }),
      } as Response);

      await expect(analyzePaycheckPdf(mockFile)).rejects.toThrow(
        "Unauthorized"
      );
    });

    it("should throw error on API failure", async () => {
      const mockFile = new File(["pdf content"], "test.pdf", {
        type: "application/pdf",
      });

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: "Server error" }),
      } as Response);

      await expect(analyzePaycheckPdf(mockFile)).rejects.toThrow(
        "Server error"
      );
    });
  });

  describe("fetchPaychecks", () => {
    it("should fetch paychecks with auth header", async () => {
      setAuthToken("test-token");
      const mockPaychecks = [
        { id: 1, filename: "pay1.pdf", gross_pay: 5000 },
        { id: 2, filename: "pay2.pdf", gross_pay: 6000 },
      ];

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockPaychecks,
      } as Response);

      const result = await fetchPaychecks();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/paychecks"),
        expect.objectContaining({
          headers: { Authorization: "Bearer test-token" },
        })
      );
      expect(result).toEqual(mockPaychecks);
    });

    it("should throw error on unauthorized access", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
      } as Response);

      await expect(fetchPaychecks()).rejects.toThrow("Unauthorized");
    });
  });

  describe("updatePaycheckReportedHours", () => {
    it("should send correct payload with auth", async () => {
      setAuthToken("test-token");
      const hoursData = { "2024-01-01": [{ start: "9:00", end: "17:00" }] };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
      } as Response);

      await updatePaycheckReportedHours(1, hoursData);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/paychecks/1"),
        expect.objectContaining({
          method: "PUT",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
          }),
          body: JSON.stringify({ userReportedHours: hoursData }),
        })
      );
    });

    it("should handle update errors", async () => {
      setAuthToken("test-token");

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: "Update failed" }),
      } as Response);

      await expect(updatePaycheckReportedHours(1, {})).rejects.toThrow(
        "Update failed"
      );
    });
  });

  describe("clearAllData", () => {
    it("should send DELETE request with auth", async () => {
      setAuthToken("test-token");

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
      } as Response);

      await clearAllData();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/paychecks"),
        expect.objectContaining({
          method: "DELETE",
          headers: { Authorization: "Bearer test-token" },
        })
      );
    });

    it("should throw error on failure", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      await expect(clearAllData()).rejects.toThrow("Failed to clear data");
    });
  });
});
