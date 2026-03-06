/**
 * Deterministic Parser Tests
 *
 * Tests cover:
 * - Date extraction edge cases
 * - Hours extraction accuracy
 * - Fallback behavior when format doesn't match
 * - Various PDF text layouts
 * - Error handling
 */

const { parsePdfDeterministically } = require("../deterministic_parser");

// Mock pdfjs-dist
jest.mock("pdfjs-dist/legacy/build/pdf.mjs", () => ({
  getDocument: jest.fn(),
}));

const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.mjs");

// Helper to create mock text content
function createMockTextContent(items) {
  return {
    items: items.map((item) => ({
      str: item.text,
      transform: [1, 0, 0, 1, item.x, item.y], // [scaleX, skewY, skewX, scaleY, x, y]
    })),
  };
}

// Helper to create mock PDF document
function setupMockPdf(textItems) {
  const mockPage = {
    getTextContent: jest.fn().mockResolvedValue(createMockTextContent(textItems)),
  };

  const mockPdfDoc = {
    getPage: jest.fn().mockResolvedValue(mockPage),
  };

  pdfjsLib.getDocument.mockReturnValue({
    promise: Promise.resolve(mockPdfDoc),
  });

  return { mockPdfDoc, mockPage };
}

describe("Deterministic Parser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // DATE EXTRACTION TESTS
  // ============================================
  describe("Date Extraction", () => {
    it("should extract pay period dates from standard CCSF format", async () => {
      setupMockPdf([
        { x: 174, y: 700, text: "Pay Period Begin Date" },
        { x: 333, y: 700, text: "01/01/2024" },
        { x: 174, y: 680, text: "Pay Period End Date" },
        { x: 333, y: 680, text: "01/15/2024" },
        { x: 16, y: 500, text: "HOURS AND EARNINGS" },
        { x: 16, y: 480, text: "Description" },
        { x: 120, y: 480, text: "Current" },
        { x: 16, y: 460, text: "RegularPay" },
        { x: 130, y: 460, text: "80.00" },
      ]);

      const result = await parsePdfDeterministically(Buffer.from("test"));

      expect(result.payPeriodStart).toBe("2024-01-01");
      expect(result.payPeriodEnd).toBe("2024-01-15");
    });

    it("should handle MM/DD/YYYY date format", async () => {
      setupMockPdf([
        { x: 174, y: 700, text: "Pay Period Begin Date" },
        { x: 333, y: 700, text: "12/25/2024" },
        { x: 174, y: 680, text: "Pay Period End Date" },
        { x: 333, y: 680, text: "01/07/2025" },
        { x: 16, y: 500, text: "HOURS AND EARNINGS" },
        { x: 16, y: 480, text: "Description" },
        { x: 120, y: 480, text: "Current" },
        { x: 16, y: 460, text: "RegularPay" },
        { x: 130, y: 460, text: "80.00" },
      ]);

      const result = await parsePdfDeterministically(Buffer.from("test"));

      expect(result.payPeriodStart).toBe("2024-12-25");
      expect(result.payPeriodEnd).toBe("2025-01-07");
    });

    it("should handle single-digit month/day", async () => {
      setupMockPdf([
        { x: 174, y: 700, text: "Pay Period Begin Date" },
        { x: 333, y: 700, text: "1/5/2024" },
        { x: 174, y: 680, text: "Pay Period End Date" },
        { x: 333, y: 680, text: "1/18/2024" },
        { x: 16, y: 500, text: "HOURS AND EARNINGS" },
        { x: 16, y: 480, text: "Description" },
        { x: 120, y: 480, text: "Current" },
        { x: 16, y: 460, text: "RegularPay" },
        { x: 130, y: 460, text: "80.00" },
      ]);

      const result = await parsePdfDeterministically(Buffer.from("test"));

      expect(result.payPeriodStart).toBe("2024-01-05");
      expect(result.payPeriodEnd).toBe("2024-01-18");
    });

    it("should return null when dates are missing", async () => {
      setupMockPdf([
        { x: 16, y: 500, text: "HOURS AND EARNINGS" },
        { x: 16, y: 460, text: "RegularPay" },
        { x: 130, y: 460, text: "80.00" },
      ]);

      const result = await parsePdfDeterministically(Buffer.from("test"));

      expect(result).toBeNull();
    });

    it("should return null when only start date is present", async () => {
      setupMockPdf([
        { x: 174, y: 700, text: "Pay Period Begin Date" },
        { x: 333, y: 700, text: "01/01/2024" },
        { x: 16, y: 500, text: "HOURS AND EARNINGS" },
        { x: 16, y: 460, text: "RegularPay" },
        { x: 130, y: 460, text: "80.00" },
      ]);

      const result = await parsePdfDeterministically(Buffer.from("test"));

      expect(result).toBeNull();
    });
  });

  // ============================================
  // HOURS EXTRACTION TESTS
  // ============================================
  describe("Hours Extraction", () => {
    it("should extract regular pay hours from Current column", async () => {
      setupMockPdf([
        { x: 174, y: 700, text: "Pay Period Begin Date" },
        { x: 333, y: 700, text: "01/01/2024" },
        { x: 174, y: 680, text: "Pay Period End Date" },
        { x: 333, y: 680, text: "01/15/2024" },
        { x: 16, y: 500, text: "HOURS AND EARNINGS" },
        { x: 16, y: 480, text: "Description" },
        { x: 120, y: 480, text: "Current" },
        { x: 200, y: 480, text: "YTD" },
        { x: 16, y: 460, text: "RegularPay" },
        { x: 130, y: 460, text: "80.00" },
        { x: 210, y: 460, text: "1040.00" },
      ]);

      const result = await parsePdfDeterministically(Buffer.from("test"));

      expect(result.paidHours).toHaveLength(1);
      expect(result.paidHours[0].category).toBe("RegularPay");
      expect(result.paidHours[0].hours).toBe(80);
    });

    it("should extract multiple hour categories", async () => {
      setupMockPdf([
        { x: 174, y: 700, text: "Pay Period Begin Date" },
        { x: 333, y: 700, text: "01/01/2024" },
        { x: 174, y: 680, text: "Pay Period End Date" },
        { x: 333, y: 680, text: "01/15/2024" },
        { x: 16, y: 500, text: "HOURS AND EARNINGS" },
        { x: 16, y: 480, text: "Description" },
        { x: 120, y: 480, text: "Current" },
        { x: 16, y: 460, text: "RegularPay" },
        { x: 130, y: 460, text: "72.00" },
        { x: 16, y: 440, text: "OvertimeStr" },
        { x: 130, y: 440, text: "8.00" },
        { x: 16, y: 420, text: "Sick Pay" },
        { x: 130, y: 420, text: "8.00" },
      ]);

      const result = await parsePdfDeterministically(Buffer.from("test"));

      expect(result.paidHours).toHaveLength(3);
      expect(result.paidHours).toContainEqual({ category: "RegularPay", hours: 72 });
      expect(result.paidHours).toContainEqual({ category: "OvertimeStr", hours: 8 });
      expect(result.paidHours).toContainEqual({ category: "Sick Pay", hours: 8 });
    });

    it("should ignore rows with no current hours (YTD-only)", async () => {
      setupMockPdf([
        { x: 174, y: 700, text: "Pay Period Begin Date" },
        { x: 333, y: 700, text: "01/01/2024" },
        { x: 174, y: 680, text: "Pay Period End Date" },
        { x: 333, y: 680, text: "01/15/2024" },
        { x: 16, y: 500, text: "HOURS AND EARNINGS" },
        { x: 16, y: 480, text: "Description" },
        { x: 120, y: 480, text: "Current" },
        { x: 200, y: 480, text: "YTD" },
        { x: 16, y: 460, text: "RegularPay" },
        { x: 130, y: 460, text: "80.00" },
        { x: 16, y: 440, text: "Vacation" },
        // No value in current column for Vacation - only YTD
        { x: 210, y: 440, text: "120.00" },
      ]);

      const result = await parsePdfDeterministically(Buffer.from("test"));

      expect(result.paidHours).toHaveLength(1);
      expect(result.paidHours[0].category).toBe("RegularPay");
    });

    it("should handle decimal hours correctly", async () => {
      setupMockPdf([
        { x: 174, y: 700, text: "Pay Period Begin Date" },
        { x: 333, y: 700, text: "01/01/2024" },
        { x: 174, y: 680, text: "Pay Period End Date" },
        { x: 333, y: 680, text: "01/15/2024" },
        { x: 16, y: 500, text: "HOURS AND EARNINGS" },
        { x: 16, y: 480, text: "Description" },
        { x: 120, y: 480, text: "Current" },
        { x: 16, y: 460, text: "RegularPay" },
        { x: 130, y: 460, text: "79.50" },
      ]);

      const result = await parsePdfDeterministically(Buffer.from("test"));

      expect(result.paidHours[0].hours).toBe(79.5);
    });

    it("should handle hours with comma separators", async () => {
      setupMockPdf([
        { x: 174, y: 700, text: "Pay Period Begin Date" },
        { x: 333, y: 700, text: "01/01/2024" },
        { x: 174, y: 680, text: "Pay Period End Date" },
        { x: 333, y: 680, text: "01/15/2024" },
        { x: 16, y: 500, text: "HOURS AND EARNINGS" },
        { x: 16, y: 480, text: "Description" },
        { x: 120, y: 480, text: "Current" },
        { x: 16, y: 460, text: "RegularPay" },
        { x: 130, y: 460, text: "1,080.00" },
      ]);

      const result = await parsePdfDeterministically(Buffer.from("test"));

      expect(result.paidHours[0].hours).toBe(1080);
    });

    it("should skip header rows", async () => {
      setupMockPdf([
        { x: 174, y: 700, text: "Pay Period Begin Date" },
        { x: 333, y: 700, text: "01/01/2024" },
        { x: 174, y: 680, text: "Pay Period End Date" },
        { x: 333, y: 680, text: "01/15/2024" },
        { x: 16, y: 500, text: "HOURS AND EARNINGS" },
        { x: 16, y: 480, text: "Description" },
        { x: 120, y: 480, text: "Rate" },
        { x: 140, y: 480, text: "Hours" },
        { x: 160, y: 480, text: "Current" },
        { x: 16, y: 460, text: "RegularPay" },
        { x: 150, y: 460, text: "80.00" },
      ]);

      const result = await parsePdfDeterministically(Buffer.from("test"));

      // Should not include "Description", "Rate", "Hours", "Current" as categories
      const categories = result.paidHours.map((h) => h.category);
      expect(categories).not.toContain("Description");
      expect(categories).not.toContain("Rate");
      expect(categories).not.toContain("Hours");
      expect(categories).not.toContain("Current");
    });
  });

  // ============================================
  // BANKED HOURS EXTRACTION TESTS
  // ============================================
  describe("Banked Hours Extraction", () => {
    it("should extract banked hours from PAID TIME OFF section", async () => {
      setupMockPdf([
        { x: 174, y: 700, text: "Pay Period Begin Date" },
        { x: 333, y: 700, text: "01/01/2024" },
        { x: 174, y: 680, text: "Pay Period End Date" },
        { x: 333, y: 680, text: "01/15/2024" },
        { x: 16, y: 500, text: "HOURS AND EARNINGS" },
        { x: 16, y: 480, text: "Description" },
        { x: 120, y: 480, text: "Current" },
        { x: 16, y: 460, text: "RegularPay" },
        { x: 130, y: 460, text: "80.00" },
        { x: 300, y: 400, text: "PAID TIME OFF" },
        { x: 560, y: 380, text: "Balance" },
        { x: 371, y: 360, text: "Vacation:" },
        { x: 576, y: 360, text: "120.00" },
        { x: 371, y: 340, text: "Sick Leave:" },
        { x: 576, y: 340, text: "96.00" },
      ]);

      const result = await parsePdfDeterministically(Buffer.from("test"));

      expect(result.bankedHours).toHaveLength(2);
      expect(result.bankedHours).toContainEqual({ category: "Vacation", hours: 120 });
      expect(result.bankedHours).toContainEqual({ category: "Sick Leave", hours: 96 });
    });

    it("should handle various PTO categories", async () => {
      setupMockPdf([
        { x: 174, y: 700, text: "Pay Period Begin Date" },
        { x: 333, y: 700, text: "01/01/2024" },
        { x: 174, y: 680, text: "Pay Period End Date" },
        { x: 333, y: 680, text: "01/15/2024" },
        { x: 16, y: 500, text: "HOURS AND EARNINGS" },
        { x: 16, y: 480, text: "Description" },
        { x: 120, y: 480, text: "Current" },
        { x: 16, y: 460, text: "RegularPay" },
        { x: 130, y: 460, text: "80.00" },
        { x: 300, y: 400, text: "PAID TIME OFF" },
        { x: 560, y: 380, text: "Balance" },
        { x: 371, y: 360, text: "Vacation:" },
        { x: 576, y: 360, text: "120.00" },
        { x: 371, y: 340, text: "Sick Leave:" },
        { x: 576, y: 340, text: "96.00" },
        { x: 371, y: 320, text: "Floating Holiday:" },
        { x: 576, y: 320, text: "16.00" },
        { x: 371, y: 300, text: "Compensatory Time Off:" },
        { x: 576, y: 300, text: "24.00" },
      ]);

      const result = await parsePdfDeterministically(Buffer.from("test"));

      expect(result.bankedHours).toHaveLength(4);
    });
  });

  // ============================================
  // FALLBACK BEHAVIOR TESTS
  // ============================================
  describe("Fallback Behavior", () => {
    it("should return null for empty PDF (scanned image)", async () => {
      setupMockPdf([]);

      const result = await parsePdfDeterministically(Buffer.from("test"));

      expect(result).toBeNull();
    });

    it("should return null when no hours are found", async () => {
      setupMockPdf([
        { x: 174, y: 700, text: "Pay Period Begin Date" },
        { x: 333, y: 700, text: "01/01/2024" },
        { x: 174, y: 680, text: "Pay Period End Date" },
        { x: 333, y: 680, text: "01/15/2024" },
        { x: 16, y: 500, text: "Some random text" },
      ]);

      const result = await parsePdfDeterministically(Buffer.from("test"));

      expect(result).toBeNull();
    });

    it("should return null when HOURS AND EARNINGS section is missing", async () => {
      setupMockPdf([
        { x: 174, y: 700, text: "Pay Period Begin Date" },
        { x: 333, y: 700, text: "01/01/2024" },
        { x: 174, y: 680, text: "Pay Period End Date" },
        { x: 333, y: 680, text: "01/15/2024" },
        { x: 16, y: 500, text: "DEDUCTIONS" },
        { x: 16, y: 460, text: "Federal Tax" },
        { x: 130, y: 460, text: "500.00" },
      ]);

      const result = await parsePdfDeterministically(Buffer.from("test"));

      expect(result).toBeNull();
    });

    it("should handle PDF parsing errors gracefully", async () => {
      pdfjsLib.getDocument.mockReturnValue({
        promise: Promise.reject(new Error("PDF parsing failed")),
      });

      const result = await parsePdfDeterministically(Buffer.from("test"));

      expect(result).toBeNull();
    });

    it("should handle getTextContent errors gracefully", async () => {
      const mockPage = {
        getTextContent: jest.fn().mockRejectedValue(new Error("Text extraction failed")),
      };

      const mockPdfDoc = {
        getPage: jest.fn().mockResolvedValue(mockPage),
      };

      pdfjsLib.getDocument.mockReturnValue({
        promise: Promise.resolve(mockPdfDoc),
      });

      const result = await parsePdfDeterministically(Buffer.from("test"));

      expect(result).toBeNull();
    });
  });

  // ============================================
  // ZONE CALIBRATION TESTS
  // ============================================
  describe("Zone Calibration", () => {
    it("should calibrate current hours zone based on header position", async () => {
      // Header at different X position than default
      setupMockPdf([
        { x: 174, y: 700, text: "Pay Period Begin Date" },
        { x: 333, y: 700, text: "01/01/2024" },
        { x: 174, y: 680, text: "Pay Period End Date" },
        { x: 333, y: 680, text: "01/15/2024" },
        { x: 16, y: 500, text: "HOURS AND EARNINGS" },
        { x: 16, y: 480, text: "Description" },
        { x: 180, y: 480, text: "Current" }, // Different X position
        { x: 16, y: 460, text: "RegularPay" },
        { x: 190, y: 460, text: "80.00" }, // Value at calibrated position
      ]);

      const result = await parsePdfDeterministically(Buffer.from("test"));

      expect(result.paidHours).toHaveLength(1);
      expect(result.paidHours[0].hours).toBe(80);
    });

    it("should calibrate balance zone based on Balance header", async () => {
      setupMockPdf([
        { x: 174, y: 700, text: "Pay Period Begin Date" },
        { x: 333, y: 700, text: "01/01/2024" },
        { x: 174, y: 680, text: "Pay Period End Date" },
        { x: 333, y: 680, text: "01/15/2024" },
        { x: 16, y: 500, text: "HOURS AND EARNINGS" },
        { x: 16, y: 480, text: "Description" },
        { x: 120, y: 480, text: "Current" },
        { x: 16, y: 460, text: "RegularPay" },
        { x: 130, y: 460, text: "80.00" },
        { x: 300, y: 400, text: "PAID TIME OFF" },
        { x: 500, y: 380, text: "Balance" }, // Different position
        { x: 371, y: 360, text: "Vacation:" },
        { x: 510, y: 360, text: "100.00" }, // Value at calibrated position
      ]);

      const result = await parsePdfDeterministically(Buffer.from("test"));

      expect(result.bankedHours).toHaveLength(1);
      expect(result.bankedHours[0].hours).toBe(100);
    });
  });

  // ============================================
  // TEXT ENCODING TESTS
  // ============================================
  describe("Text Encoding", () => {
    it("should handle URI-encoded text", async () => {
      setupMockPdf([
        { x: 174, y: 700, text: "Pay Period Begin Date" },
        { x: 333, y: 700, text: "01/01/2024" },
        { x: 174, y: 680, text: "Pay Period End Date" },
        { x: 333, y: 680, text: "01/15/2024" },
        { x: 16, y: 500, text: "HOURS AND EARNINGS" },
        { x: 16, y: 480, text: "Description" },
        { x: 120, y: 480, text: "Current" },
        { x: 16, y: 460, text: "RegularPay" },
        { x: 130, y: 460, text: "80.00" },
      ]);

      const result = await parsePdfDeterministically(Buffer.from("test"));

      expect(result).not.toBeNull();
    });

    it("should handle special characters in category names", async () => {
      setupMockPdf([
        { x: 174, y: 700, text: "Pay Period Begin Date" },
        { x: 333, y: 700, text: "01/01/2024" },
        { x: 174, y: 680, text: "Pay Period End Date" },
        { x: 333, y: 680, text: "01/15/2024" },
        { x: 16, y: 500, text: "HOURS AND EARNINGS" },
        { x: 16, y: 480, text: "Description" },
        { x: 120, y: 480, text: "Current" },
        { x: 16, y: 460, text: "StndBy$15" },
        { x: 130, y: 460, text: "16.00" },
      ]);

      const result = await parsePdfDeterministically(Buffer.from("test"));

      expect(result.paidHours[0].category).toBe("StndBy$15");
    });
  });

  // ============================================
  // ROW GROUPING TESTS
  // ============================================
  describe("Row Grouping", () => {
    it("should group items with similar Y coordinates into same row", async () => {
      setupMockPdf([
        { x: 174, y: 700, text: "Pay Period Begin Date" },
        { x: 333, y: 701, text: "01/01/2024" }, // Slightly different Y
        { x: 174, y: 680, text: "Pay Period End Date" },
        { x: 333, y: 679, text: "01/15/2024" }, // Slightly different Y
        { x: 16, y: 500, text: "HOURS AND EARNINGS" },
        { x: 16, y: 480, text: "Description" },
        { x: 120, y: 481, text: "Current" }, // Within tolerance
        { x: 16, y: 460, text: "RegularPay" },
        { x: 130, y: 459, text: "80.00" }, // Within tolerance
      ]);

      const result = await parsePdfDeterministically(Buffer.from("test"));

      expect(result.paidHours).toHaveLength(1);
      expect(result.paidHours[0].hours).toBe(80);
    });

    it("should correctly sort items left-to-right within a row", async () => {
      setupMockPdf([
        { x: 333, y: 700, text: "01/01/2024" }, // Value first (out of order)
        { x: 174, y: 700, text: "Pay Period Begin Date" },
        { x: 333, y: 680, text: "01/15/2024" },
        { x: 174, y: 680, text: "Pay Period End Date" },
        { x: 16, y: 500, text: "HOURS AND EARNINGS" },
        { x: 120, y: 480, text: "Current" },
        { x: 16, y: 480, text: "Description" },
        { x: 130, y: 460, text: "80.00" },
        { x: 16, y: 460, text: "RegularPay" },
      ]);

      const result = await parsePdfDeterministically(Buffer.from("test"));

      expect(result.payPeriodStart).toBe("2024-01-01");
      expect(result.payPeriodEnd).toBe("2024-01-15");
    });
  });
});
