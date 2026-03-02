/**
 * CCSF OT Authorization Form Generator
 *
 * Programmatically recreates the City & County of San Francisco
 * Overtime Authorization form using jsPDF.
 *
 * Usage:
 *   const pdf = generateOTFormPDF(input);
 *   pdf.save("OT_Form_Week_of_2026-03-09.pdf");
 *   // or open a preview:
 *   window.open(pdf.output("bloburl"));
 */

import { jsPDF } from "jspdf";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OTDayEntry {
  /** YYYY-MM-DD */
  date: string;
  /** Paid overtime hours (code OST) */
  ostHours: number;
  /** Comp time earned hours (code CTE) */
  cteHours: number;
}

export interface OTFormInput {
  employeeName: string;
  department?: string;
  classification?: string;
  badgeNo?: string;
  /** YYYY-MM-DD of the Sunday that starts the work week */
  weekStartDate: string;
  dailyEntries: OTDayEntry[];
  /** Printed justification text; defaults to a generic operational reason */
  justification?: string;
}

export interface OTFormSummary {
  totalOST: number;
  totalCTE: number;
  hasOT: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function parseLocalDate(yyyyMmDd: string): Date {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function fmtShort(yyyyMmDd: string): string {
  const d = parseLocalDate(yyyyMmDd);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

function fmtLong(yyyyMmDd: string): string {
  const d = parseLocalDate(yyyyMmDd);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function fmtDayLabel(yyyyMmDd: string): string {
  const d = parseLocalDate(yyyyMmDd);
  return `${DAYS[d.getDay()]} ${d.getMonth() + 1}/${d.getDate()}`;
}

/** Derive week-ending date (Saturday) from week start (Sunday) */
function weekEndDate(weekStartDate: string): string {
  const d = parseLocalDate(weekStartDate);
  d.setDate(d.getDate() + 6);
  return d.toISOString().split("T")[0];
}

export function calcOTSummary(entries: OTDayEntry[]): OTFormSummary {
  let totalOST = 0;
  let totalCTE = 0;
  for (const e of entries) {
    totalOST += e.ostHours;
    totalCTE += e.cteHours;
  }
  return { totalOST, totalCTE, hasOT: totalOST > 0 || totalCTE > 0 };
}

// ── Drawing helpers ───────────────────────────────────────────────────────────

/** Draw a labelled field box: label above, value underlined */
function drawField(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  w: number,
  opts: { bold?: boolean; fontSize?: number } = {},
) {
  const fs = opts.fontSize ?? 7;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(90, 90, 90);
  doc.text(label, x, y);

  doc.setFontSize(fs);
  doc.setFont("helvetica", opts.bold ? "bold" : "normal");
  doc.setTextColor(0, 0, 0);
  doc.text(value, x, y + 5);

  // Underline
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.2);
  doc.line(x, y + 6, x + w, y + 6);
}

/** Filled rectangle helper */
function fillRect(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  g: number,
  b: number,
) {
  doc.setFillColor(r, g, b);
  doc.rect(x, y, w, h, "F");
}

/** Bordered cell (draws border then optional fill) */
function cellBorder(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  fill?: [number, number, number],
) {
  if (fill) {
    doc.setFillColor(...fill);
    doc.rect(x, y, w, h, "FD");
  } else {
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.rect(x, y, w, h);
  }
}

/** Centered text inside a rect */
function cellText(
  doc: jsPDF,
  text: string,
  cx: number,
  cy: number,
  cw: number,
  ch: number,
  opts: { bold?: boolean; fontSize?: number; color?: [number, number, number] } = {},
) {
  doc.setFontSize(opts.fontSize ?? 8);
  doc.setFont("helvetica", opts.bold ? "bold" : "normal");
  doc.setTextColor(...(opts.color ?? [0, 0, 0]));
  doc.text(text, cx + cw / 2, cy + ch / 2 + (opts.fontSize ?? 8) * 0.18, {
    align: "center",
  });
}

// ── Main generator ────────────────────────────────────────────────────────────

export function generateOTFormPDF(input: OTFormInput): jsPDF {
  const {
    employeeName,
    department = "Department of Public Health",
    classification = "",
    badgeNo = "",
    weekStartDate,
    dailyEntries,
    justification = "Operational requirements necessitated overtime to maintain service levels.",
  } = input;

  const weekEnd = weekEndDate(weekStartDate);
  const summary = calcOTSummary(dailyEntries);

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });

  const PW = 215.9; // letter width mm
  const ML = 15;    // left margin
  const MR = 15;    // right margin
  const CW = PW - ML - MR; // content width

  let y = 12;

  // ── Page border ──────────────────────────────────────────────────────────────
  doc.setDrawColor(60, 60, 60);
  doc.setLineWidth(0.5);
  doc.rect(ML - 3, 8, CW + 6, 266);

  // ── Header ───────────────────────────────────────────────────────────────────
  fillRect(doc, ML - 3, 8, CW + 6, 14, 15, 40, 80);

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("CITY AND COUNTY OF SAN FRANCISCO", PW / 2, y + 5, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("OVERTIME AUTHORIZATION FORM", PW / 2, y + 9.5, { align: "center" });

  y += 18;

  // ── Employee info row ─────────────────────────────────────────────────────────
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.line(ML - 3, y, ML + CW + 3, y);

  const col1w = CW * 0.38;
  const col2w = CW * 0.32;
  const col3w = CW - col1w - col2w;

  drawField(doc, "Employee Name", employeeName, ML, y + 3, col1w, { bold: true, fontSize: 9 });
  drawField(doc, "Department / Division", department, ML + col1w + 4, y + 3, col2w);
  drawField(doc, "Week Ending", fmtLong(weekEnd), ML + col1w + col2w + 8, y + 3, col3w - 8);

  y += 16;
  doc.line(ML - 3, y, ML + CW + 3, y);

  drawField(doc, "Classification / Job Title", classification, ML, y + 3, col1w);
  drawField(doc, "Badge / Employee ID", badgeNo, ML + col1w + 4, y + 3, col2w * 0.6);
  drawField(
    doc,
    "Week of",
    `${fmtShort(weekStartDate)} – ${fmtShort(weekEnd)}`,
    ML + col1w + col2w + 8,
    y + 3,
    col3w - 8,
  );

  y += 16;
  doc.line(ML - 3, y, ML + CW + 3, y);

  // ── Section title ─────────────────────────────────────────────────────────────
  fillRect(doc, ML - 3, y, CW + 6, 7, 235, 240, 250);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 50, 100);
  doc.text("OVERTIME HOURS DETAIL", ML, y + 4.5);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.text(
    "OST = Overtime (paid at 1.5×)    CTE = Comp Time Earned (banked at 1.5×)",
    ML + 55,
    y + 4.5,
  );

  y += 7;

  // ── Table ─────────────────────────────────────────────────────────────────────
  const C = {
    day: 42,
    ost: 35,
    cte: 35,
    total: 30,
    notes: CW - 42 - 35 - 35 - 30,
  };
  const ROW_H = 8;
  const HEADER_H = 9;

  // Table header
  const hFill: [number, number, number] = [15, 40, 80];
  cellBorder(doc, ML, y, C.day, HEADER_H, hFill);
  cellText(doc, "Day / Date", ML, y, C.day, HEADER_H, { bold: true, fontSize: 8, color: [255, 255, 255] });

  cellBorder(doc, ML + C.day, y, C.ost, HEADER_H, hFill);
  cellText(doc, "OST Hours", ML + C.day, y, C.ost, HEADER_H, { bold: true, fontSize: 8, color: [255, 200, 100] });

  cellBorder(doc, ML + C.day + C.ost, y, C.cte, HEADER_H, hFill);
  cellText(doc, "CTE Hours", ML + C.day + C.ost, y, C.cte, HEADER_H, { bold: true, fontSize: 8, color: [255, 160, 80] });

  cellBorder(doc, ML + C.day + C.ost + C.cte, y, C.total, HEADER_H, hFill);
  cellText(doc, "Total OT Hrs", ML + C.day + C.ost + C.cte, y, C.total, HEADER_H, { bold: true, fontSize: 8, color: [255, 255, 255] });

  cellBorder(doc, ML + C.day + C.ost + C.cte + C.total, y, C.notes, HEADER_H, hFill);
  cellText(doc, "Notes / Reason", ML + C.day + C.ost + C.cte + C.total, y, C.notes, HEADER_H, { bold: true, fontSize: 8, color: [255, 255, 255] });

  y += HEADER_H;

  // Data rows — show all 7 days, highlight rows with OT
  const weekDays: string[] = Array.from({ length: 7 }, (_, i) => {
    const d = parseLocalDate(weekStartDate);
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  weekDays.forEach((dateKey, idx) => {
    const entry = dailyEntries.find((e) => e.date === dateKey);
    const ost = entry?.ostHours ?? 0;
    const cte = entry?.cteHours ?? 0;
    const totalOT = ost + cte;
    const hasOT = totalOT > 0;

    const rowFill: [number, number, number] = hasOT
      ? [255, 251, 235]   // amber-tinted for OT rows
      : idx % 2 === 0
        ? [250, 250, 252]  // subtle stripe
        : [255, 255, 255];

    cellBorder(doc, ML, y, C.day, ROW_H, rowFill);
    cellText(doc, fmtDayLabel(dateKey), ML, y, C.day, ROW_H, { fontSize: 8 });

    cellBorder(doc, ML + C.day, y, C.ost, ROW_H, rowFill);
    if (ost > 0) {
      cellText(doc, ost.toFixed(2), ML + C.day, y, C.ost, ROW_H, {
        bold: true,
        fontSize: 9,
        color: [180, 90, 0],
      });
    }

    cellBorder(doc, ML + C.day + C.ost, y, C.cte, ROW_H, rowFill);
    if (cte > 0) {
      cellText(doc, cte.toFixed(2), ML + C.day + C.ost, y, C.cte, ROW_H, {
        bold: true,
        fontSize: 9,
        color: [160, 60, 0],
      });
    }

    cellBorder(doc, ML + C.day + C.ost + C.cte, y, C.total, ROW_H, rowFill);
    if (hasOT) {
      cellText(doc, totalOT.toFixed(2), ML + C.day + C.ost + C.cte, y, C.total, ROW_H, {
        bold: true,
        fontSize: 9,
      });
    }

    cellBorder(doc, ML + C.day + C.ost + C.cte + C.total, y, C.notes, ROW_H, rowFill);

    y += ROW_H;
  });

  // Totals row
  const totalsFill: [number, number, number] = [225, 235, 255];
  cellBorder(doc, ML, y, C.day, ROW_H, totalsFill);
  cellText(doc, "TOTALS", ML, y, C.day, ROW_H, { bold: true, fontSize: 8, color: [15, 40, 80] });

  cellBorder(doc, ML + C.day, y, C.ost, ROW_H, totalsFill);
  cellText(doc, summary.totalOST.toFixed(2), ML + C.day, y, C.ost, ROW_H, {
    bold: true,
    fontSize: 9,
    color: [180, 90, 0],
  });

  cellBorder(doc, ML + C.day + C.ost, y, C.cte, ROW_H, totalsFill);
  cellText(doc, summary.totalCTE.toFixed(2), ML + C.day + C.ost, y, C.cte, ROW_H, {
    bold: true,
    fontSize: 9,
    color: [160, 60, 0],
  });

  cellBorder(doc, ML + C.day + C.ost + C.cte, y, C.total, ROW_H, totalsFill);
  cellText(doc, (summary.totalOST + summary.totalCTE).toFixed(2), ML + C.day + C.ost + C.cte, y, C.total, ROW_H, {
    bold: true,
    fontSize: 9,
    color: [15, 40, 80],
  });

  cellBorder(doc, ML + C.day + C.ost + C.cte + C.total, y, C.notes, ROW_H, totalsFill);

  y += ROW_H + 6;

  // ── Justification ─────────────────────────────────────────────────────────────
  fillRect(doc, ML - 3, y, CW + 6, 6, 235, 240, 250);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 50, 100);
  doc.text("JUSTIFICATION / REASON FOR OVERTIME", ML, y + 4);

  y += 6;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.rect(ML - 3, y, CW + 6, 22);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  const justLines = doc.splitTextToSize(justification, CW - 4);
  doc.text(justLines, ML, y + 5);

  y += 26;

  // ── Budget / Coding ───────────────────────────────────────────────────────────
  drawField(doc, "Fund", "", ML, y, 28);
  drawField(doc, "Department Code", "", ML + 34, y, 32);
  drawField(doc, "Program", "", ML + 74, y, 32);
  drawField(doc, "Activity", "", ML + 114, y, 28);
  drawField(doc, "Project / WO", "", ML + 150, y, CW - 150);

  y += 16;

  // ── Certification language ────────────────────────────────────────────────────
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(80, 80, 80);
  doc.text(
    "I certify that the overtime listed above was authorized, necessary, and performed in accordance with the applicable MOU and Civil Service rules.",
    ML,
    y,
    { maxWidth: CW },
  );

  y += 8;

  // ── Signature blocks ──────────────────────────────────────────────────────────
  const sigW = (CW - 8) / 2;

  // Employee sig
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(ML, y + 12, ML + sigW, y + 12);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("Employee Signature", ML, y + 15);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.setFontSize(8);
  doc.text(employeeName, ML, y + 9);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  doc.line(ML + sigW * 0.55, y + 12, ML + sigW, y + 12);
  doc.text("Date", ML + sigW * 0.55, y + 15);

  // Supervisor sig
  const sx = ML + sigW + 8;
  doc.line(sx, y + 12, sx + sigW * 0.8, y + 12);
  doc.text("Supervisor / Manager Signature", sx, y + 15);

  doc.line(sx + sigW * 0.85, y + 12, sx + sigW, y + 12);
  doc.text("Date", sx + sigW * 0.85, y + 15);

  y += 22;

  // Approving authority
  doc.line(ML, y + 12, ML + sigW, y + 12);
  doc.text("Department Head / Designee Signature", ML, y + 15);

  doc.line(ML + sigW * 0.75, y + 12, ML + sigW, y + 12);
  doc.text("Date", ML + sigW * 0.75, y + 15);

  // ── Footer ────────────────────────────────────────────────────────────────────
  y += 22;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.2);
  doc.line(ML - 3, y, ML + CW + 3, y);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(130, 130, 130);
  doc.text(
    "CCSF OT Authorization · Generated " + new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    ML,
    y + 4,
  );
  doc.text(
    `Week of ${fmtShort(weekStartDate)} – ${fmtShort(weekEnd)}  |  Total OT: ${(summary.totalOST + summary.totalCTE).toFixed(2)} hrs  (OST: ${summary.totalOST.toFixed(2)}  CTE: ${summary.totalCTE.toFixed(2)})`,
    ML + CW + 3,
    y + 4,
    { align: "right" },
  );

  return doc;
}

/** Suggested filename for the generated PDF */
export function otFormFilename(weekStartDate: string): string {
  const d = parseLocalDate(weekStartDate);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `OT_Authorization_${d.getFullYear()}-${mm}-${dd}.pdf`;
}
