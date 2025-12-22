const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");

/**
 * Parses a CCSF paystub PDF deterministically using text coordinates.
 * Returns null if parsing fails or if the PDF is an image scan (no text).
 *
 * @param {Buffer} pdfBuffer
 * @returns {Promise<Object|null>} Parsed data or null
 */
async function parsePdfDeterministically(pdfBuffer) {
  try {
    const data = new Uint8Array(pdfBuffer);
    const loadingTask = pdfjsLib.getDocument(data);
    const pdfDocument = await loadingTask.promise;
    const page = await pdfDocument.getPage(1);
    const textContent = await page.getTextContent();

    if (!textContent || textContent.items.length === 0) {
      console.log(
        "Deterministic Parser: No text found (likely scanned image)."
      );
      return null;
    }

    // 1. Map items to a structured format [x, y, text]
    // PDF coordinates: (0,0) is bottom-left. Y increases upwards.
    const items = textContent.items
      .map((item) => {
        let text = item.str;
        // Try to decode if it looks like URI component, otherwise keep as is
        try {
          text = decodeURIComponent(item.str);
        } catch (e) {
          // If decoding fails, use original string
          text = item.str;
        }
        return {
          x: Math.round(item.transform[4]),
          y: Math.round(item.transform[5]),
          text: text.trim(),
        };
      })
      .filter((i) => i.text.length > 0);

    // 2. Group by Row (Y-coordinate with tolerance)
    const rows = [];
    const TOLERANCE = 2; // pixels

    items.forEach((item) => {
      let row = rows.find((r) => Math.abs(r.y - item.y) <= TOLERANCE);
      if (!row) {
        row = { y: item.y, items: [] };
        rows.push(row);
      }
      row.items.push(item);
    });

    // Sort rows top-to-bottom (descending Y)
    rows.sort((a, b) => b.y - a.y);

    // Sort items in each row left-to-right (ascending X)
    rows.forEach((row) => {
      row.items.sort((a, b) => a.x - b.x);
    });

    // --- EXTRACTION LOGIC ---

    const result = {
      payPeriodStart: null,
      payPeriodEnd: null,
      paidHours: [],
      bankedHours: [],
    };

    // Helper: Find text in a row
    const findInRow = (row, text) =>
      row.items.find((i) => i.text.includes(text));
    // Helper: Get value at specific X range in a row
    const getValAtX = (row, minX, maxX) => {
      const item = row.items.find((i) => i.x >= minX && i.x <= maxX);
      return item ? item.text : null;
    };

    // SECTION FLAGS
    let inHoursSection = false;
    let inBankedSection = false;

    // COORDINATE ZONES (Default fallback, will be calibrated)
    let ZONES = {
      CURRENT_HOURS_MIN: 110,
      CURRENT_HOURS_MAX: 160,
      YTD_HOURS_MIN: 190,
      BANKED_BALANCE_MIN: 540, // Widened from 560
      BANKED_BALANCE_MAX: 620, // Widened from 600
    };

    for (const row of rows) {
      const rowText = row.items.map((i) => i.text).join(" ");

      // 1. Dates
      if (rowText.includes("Pay Period Begin Date")) {
        // Look for the date value. Usually to the right.
        // Layout: Label at X=174, Value at X=333
        const dateItem = row.items.find((i) => i.x > 300);
        if (dateItem) result.payPeriodStart = normalizeDate(dateItem.text);
      }
      if (rowText.includes("Pay Period End Date")) {
        const dateItem = row.items.find((i) => i.x > 300);
        if (dateItem) result.payPeriodEnd = normalizeDate(dateItem.text);
      }

      // 2. Detect Sections
      if (rowText.includes("HOURS AND EARNINGS")) {
        inHoursSection = true;
        inBankedSection = false;
        continue;
      }
      if (rowText.includes("PAID TIME OFF")) {
        inHoursSection = false;
        inBankedSection = true;
        continue;
      }
      if (
        rowText.includes("TOTAL") ||
        rowText.includes("BEFORE-TAX") ||
        rowText.includes("AFTER-TAX")
      ) {
        // End of a section
        if (inHoursSection && rowText.includes("TOTAL")) inHoursSection = false;
      }

      // 2.5 Calibrate Zones based on Headers
      if (inHoursSection) {
        // Check if this row is the header row for the main section (Description at left)
        const descriptionHeader = row.items.find(
          (i) => i.text === "Description" && i.x < 50
        );

        if (descriptionHeader) {
          // Look for "Current" or "Hours" to the right of Description
          const potentialHeaders = row.items.filter(
            (i) => i.x > descriptionHeader.x
          );
          const targetHeader = potentialHeaders.find(
            (i) => i.text === "Current" || i.text === "Hours"
          );

          if (targetHeader) {
            ZONES.CURRENT_HOURS_MIN = targetHeader.x - 20;
            ZONES.CURRENT_HOURS_MAX = targetHeader.x + 40;
            console.log(
              `Deterministic Parser: Calibrated CURRENT_HOURS zone to ${ZONES.CURRENT_HOURS_MIN}-${ZONES.CURRENT_HOURS_MAX} based on header "${targetHeader.text}" at X=${targetHeader.x}`
            );
          }
        }
      }
      if (inBankedSection) {
        const balanceHeader = row.items.find((i) => i.text === "Balance");
        if (balanceHeader) {
          ZONES.BANKED_BALANCE_MIN = balanceHeader.x - 30; // Widened tolerance
          ZONES.BANKED_BALANCE_MAX = balanceHeader.x + 50;
          console.log(
            `Deterministic Parser: Calibrated BANKED_BALANCE zone to ${ZONES.BANKED_BALANCE_MIN}-${ZONES.BANKED_BALANCE_MAX}`
          );
        }
      }

      // 3. Extract Paid Hours
      if (inHoursSection) {
        // We expect: [Description] ... [Current] ... [YTD]
        // Description is usually at X=16.
        const descriptionItem = row.items.find((i) => i.x < 100);

        if (
          descriptionItem &&
          ![
            "Description",
            "Rate",
            "Hours",
            "Earnings",
            "Current",
            "YTD",
          ].includes(descriptionItem.text)
        ) {
          // Check for Current Hours
          const currentVal = getValAtX(
            row,
            ZONES.CURRENT_HOURS_MIN,
            ZONES.CURRENT_HOURS_MAX
          );

          // CRITICAL: Only add if there is a value in the CURRENT zone.
          // If blank, it's 0/YTD-only, so we skip it.
          if (currentVal) {
            const hours = parseNumber(currentVal);
            if (hours !== 0) {
              result.paidHours.push({
                category: descriptionItem.text,
                hours: hours,
              });
            }
          }
        }
      }

      // 4. Extract Banked Hours
      if (inBankedSection) {
        // Description at X=371 ("Vacation:", "Sick Leave:", etc.)
        // Balance at X=576
        const descriptionItem = row.items.find((i) => i.x > 300 && i.x < 500);

        if (descriptionItem && descriptionItem.text.includes(":")) {
          const category = descriptionItem.text.replace(":", "").trim();
          const balanceVal = getValAtX(
            row,
            ZONES.BANKED_BALANCE_MIN,
            ZONES.BANKED_BALANCE_MAX
          );

          // DEBUG LOGGING
          if (category.includes("Sick")) {
            console.log(
              `DEBUG: Found Sick category "${category}". Row items:`,
              JSON.stringify(row.items)
            );
            console.log(
              `DEBUG: Extracted balance value: "${balanceVal}" from zone ${ZONES.BANKED_BALANCE_MIN}-${ZONES.BANKED_BALANCE_MAX}`
            );
          }

          if (balanceVal) {
            result.bankedHours.push({
              category: category,
              hours: parseNumber(balanceVal),
            });
          }
        }
      }
    }

    // Validation
    if (
      !result.payPeriodStart ||
      !result.payPeriodEnd ||
      result.paidHours.length === 0
    ) {
      console.log(
        "Deterministic Parser: Incomplete data extracted. Falling back to LLM."
      );
      return null;
    }

    console.log("Deterministic Parser: Successfully extracted data.");
    return result;
  } catch (error) {
    console.error("Deterministic Parser Error:", error);
    return null; // Fallback to LLM on error
  }
}

function parseNumber(str) {
  if (!str) return 0;
  const clean = str.replace(/,/g, "").trim();
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

function normalizeDate(dateStr) {
  if (!dateStr) return null;
  // MM/DD/YYYY -> YYYY-MM-DD
  const match = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) {
    const [_, m, d, y] = match;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return dateStr;
}

module.exports = { parsePdfDeterministically };
