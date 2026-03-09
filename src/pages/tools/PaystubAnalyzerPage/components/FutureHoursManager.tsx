import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useEffect, useMemo } from "react";
import { ReportedHourEntry } from "../types/paystubTypes";
import { ReportedHoursInput } from "./ReportedHoursInput";
import { PlusIcon } from "./icons/PlusIcon";
import { TrashIcon } from "./icons/TrashIcon";
import { XIcon } from "./icons/XIcon";
import { ClockIcon } from "./icons/ClockIcon";
import {
  generateOTFormPDF,
  otFormFilename,
  calcOTSummary,
  type OTDayEntry,
  type OTFormInput,
} from "@/services/otFormGenerator";

// ── Types ─────────────────────────────────────────────────────────────────────

export type DailyHoursMap = { [date: string]: ReportedHourEntry[] };
export type WeeklyDailyDetails = { [weekStartDate: string]: DailyHoursMap };

interface FutureHoursManagerProps {
  unmatchedHours: { [weekStartDate: string]: ReportedHourEntry[] };
  unmatchedDailyDetails: WeeklyDailyDetails;
  onAddWeek: (weekStartDate: string) => void;
  onRemoveWeek: (weekStartDate: string) => void;
  onHoursChange: (
    weekStartDate: string,
    entries: ReportedHourEntry[],
    dailyDetails: DailyHoursMap,
  ) => void;
  onClose: () => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const EMPLOYEE_NAME = "Stephen Matzat";
const DEPARTMENT = "Department of Public Health";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Visual accent per payroll code */
const CODE_COLORS: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  OST: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-300",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
  },
  CTE: {
    bg: "bg-orange-50",
    text: "text-orange-800",
    border: "border-orange-300",
    badge: "bg-orange-100 text-orange-700 border-orange-200",
  },
  WKP: {
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
    badge: "bg-slate-100 text-slate-600 border-slate-200",
  },
  SLP: {
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
  },
  VAP: {
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
  },
};

function codeColor(code: string) {
  return CODE_COLORS[code] ?? CODE_COLORS["WKP"];
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function calcWeekStart(dateStr: string): Date {
  const input = new Date(dateStr + "T00:00:00");
  // Week starts on Sunday: Sun=0 … Sat=6 → offset back to Sunday
  const dayOfWeek = input.getDay(); // 0=Sun
  const offset = dayOfWeek === 0 ? 7 : dayOfWeek; // push back to prior Sunday
  const start = new Date(input);
  start.setDate(input.getDate() - offset);
  return start;
}

function toKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

function fmtDisplay(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function fmtDayHeader(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function fmtEmailDay(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return `${DAY_NAMES[d.getDay()]} ${d.getMonth() + 1}/${d.getDate()}`;
}

function isWeekend(dateStr: string): boolean {
  const day = new Date(dateStr + "T00:00:00").getDay();
  return day === 0 || day === 6;
}

function weekDaysFor(startKey: string): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startKey + "T00:00:00");
    d.setDate(d.getDate() + i);
    return toKey(d);
  });
}

// ── Default data ──────────────────────────────────────────────────────────────

function getDefaultDailyData(startDate: Date): DailyHoursMap {
  const data: DailyHoursMap = {};
  for (let i = 0; i < 7; i++) {
    const cur = new Date(startDate);
    cur.setDate(startDate.getDate() + i);
    const key = toKey(cur);
    const day = cur.getDay();
    if (day === 5) {
      data[key] = [{ code: "WKP", hours: 4 }, { code: "OST", hours: 4 }];
    } else if (day >= 1 && day <= 4) {
      data[key] = [{ code: "WKP", hours: 8 }];
    } else {
      data[key] = [];
    }
  }
  return data;
}

// ── Aggregation ───────────────────────────────────────────────────────────────

function calcAggregate(dailyData: DailyHoursMap): ReportedHourEntry[] {
  const totals: Record<string, number> = {};
  Object.values(dailyData).forEach((entries) =>
    entries.forEach((e) => {
      totals[e.code] = (totals[e.code] ?? 0) + e.hours;
    }),
  );
  return Object.entries(totals).map(([code, hours]) => ({ code, hours }));
}

function calcWeekSummary(dailyData: DailyHoursMap) {
  const codes: Record<string, number> = {};
  Object.values(dailyData).forEach((entries) =>
    entries.forEach((e) => {
      codes[e.code] = (codes[e.code] ?? 0) + e.hours;
    }),
  );
  const total = Object.values(codes).reduce((s, h) => s + h, 0);
  return { codes, total };
}

// ── Email generator ───────────────────────────────────────────────────────────

function generateEmailText(dailyData: DailyHoursMap, startKey: string): string {
  const start = new Date(startKey + "T00:00:00");
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  let text = `Hours ${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}\n\n`;

  const sortedDays = Object.keys(dailyData).sort();
  const totals: Record<string, number> = {};
  let hasOT = false;

  sortedDays.forEach((dateKey) => {
    const entries = dailyData[dateKey];
    if (!entries || entries.length === 0) return;
    const dayText = fmtEmailDay(dateKey);
    const parts = entries.map((e) => {
      totals[e.code] = (totals[e.code] ?? 0) + e.hours;
      if (e.code === "OST" || e.code === "CTE") hasOT = true;
      return `${e.hours} ${e.code}`;
    });
    text += `${dayText}: ${parts.join(", ")}\n`;
  });

  text += `\nTotal: ${Object.entries(totals).map(([c, h]) => `${h} ${c}`).join(", ")}`;

  if (hasOT) {
    text += `\n\nOT Form attached.`;
  }

  text += `\n\nThanks,\n${EMPLOYEE_NAME}`;
  return text;
}

// ── OT day entries for PDF ────────────────────────────────────────────────────

function buildOTDayEntries(dailyData: DailyHoursMap, startKey: string): OTDayEntry[] {
  return weekDaysFor(startKey).map((dateKey) => {
    const entries = dailyData[dateKey] ?? [];
    const ost = entries.filter((e) => e.code === "OST").reduce((s, e) => s + e.hours, 0);
    const cte = entries.filter((e) => e.code === "CTE").reduce((s, e) => s + e.hours, 0);
    return { date: dateKey, ostHours: ost, cteHours: cte };
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────

/** Colour-coded chip for a single code total */
function CodeChip({ code, hours }: { code: string; hours: number }) {
  const c = codeColor(code);
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${c.badge}`}
    >
      {code}
      <span className="font-mono">{hours % 1 === 0 ? hours : hours.toFixed(2)}</span>
    </span>
  );
}

/** Summary bar shown above the day grid */
function WeekSummaryBar({ dailyData }: { dailyData: DailyHoursMap }) {
  const { codes, total } = calcWeekSummary(dailyData);
  if (total === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-slate-900 border-b border-slate-700 text-xs">
      <span className="text-slate-400 font-medium shrink-0">Week total:</span>
      <span className="font-mono font-bold text-white">{total % 1 === 0 ? total : total.toFixed(2)} hrs</span>
      <span className="text-slate-600">·</span>
      {Object.entries(codes).map(([code, hrs]) => (
        <CodeChip key={code} code={code} hours={hrs} />
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type RightTab = "email" | "ot";

export const FutureHoursManager: React.FC<FutureHoursManagerProps> = ({
  unmatchedHours,
  unmatchedDailyDetails,
  onAddWeek,
  onRemoveWeek,
  onHoursChange,
  onClose,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [activeWeekStart, setActiveWeekStart] = useState<string | null>(null);
  const [currentDailyData, setCurrentDailyData] = useState<DailyHoursMap>({});
  const [rightTab, setRightTab] = useState<RightTab>("email");
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [pdfFeedback, setPdfFeedback] = useState(false);

  // Computed from the selected date — show preview of what week will be added
  const previewWeekStart = useMemo(() => {
    if (!selectedDate) return null;
    const ws = calcWeekStart(selectedDate);
    return toKey(ws);
  }, [selectedDate]);

  // Derived email text, OT summary
  const emailText = useMemo(() => {
    if (!activeWeekStart) return "";
    return generateEmailText(currentDailyData, activeWeekStart);
  }, [currentDailyData, activeWeekStart]);

  const otDayEntries = useMemo(() => {
    if (!activeWeekStart) return [];
    return buildOTDayEntries(currentDailyData, activeWeekStart);
  }, [currentDailyData, activeWeekStart]);

  const otSummary = useMemo(() => calcOTSummary(otDayEntries), [otDayEntries]);

  // Persist + aggregate whenever daily data changes
  useEffect(() => {
    if (!activeWeekStart) return;
    const agg = calcAggregate(currentDailyData);
    onHoursChange(activeWeekStart, agg, currentDailyData);
  }, [currentDailyData, activeWeekStart]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadWeek = (startKey: string) => {
    setActiveWeekStart(startKey);
    if (unmatchedDailyDetails[startKey]) {
      setCurrentDailyData(unmatchedDailyDetails[startKey]);
    } else {
      const ws = new Date(startKey + "T00:00:00");
      const defaults = getDefaultDailyData(ws);
      setCurrentDailyData(defaults);
      onHoursChange(startKey, calcAggregate(defaults), defaults);
    }
  };

  const handleAddNewWeek = () => {
    if (!previewWeekStart) return;
    onAddWeek(previewWeekStart);
    loadWeek(previewWeekStart);
    setSelectedDate("");
  };

  const handleUpdateDay = (dateKey: string, entries: ReportedHourEntry[]) => {
    setCurrentDailyData((prev) => ({ ...prev, [dateKey]: entries }));
  };

  const handleCopyEmail = () => {
    if (!emailText) return;
    navigator.clipboard.writeText(emailText);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleDownloadOTForm = () => {
    if (!activeWeekStart) return;
    const formInput: OTFormInput = {
      employeeName: EMPLOYEE_NAME,
      department: DEPARTMENT,
      weekStartDate: activeWeekStart,
      dailyEntries: otDayEntries,
    };
    const pdf = generateOTFormPDF(formInput);
    pdf.save(otFormFilename(activeWeekStart));
    setPdfFeedback(true);
    setTimeout(() => setPdfFeedback(false), 2500);
  };

  const handlePreviewOTForm = () => {
    if (!activeWeekStart) return;
    const formInput: OTFormInput = {
      employeeName: EMPLOYEE_NAME,
      department: DEPARTMENT,
      weekStartDate: activeWeekStart,
      dailyEntries: otDayEntries,
    };
    const pdf = generateOTFormPDF(formInput);
    window.open(pdf.output("bloburl"), "_blank");
  };

  const sortedWeeks = Object.keys(unmatchedHours).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime(),
  );

  const activeWeekDays = activeWeekStart ? weekDaysFor(activeWeekStart) : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex justify-center items-center p-3"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="bg-slate-950 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col border border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal header ──────────────────────────────────────────────── */}
        <header className="flex justify-between items-center px-4 py-3 border-b border-slate-800 bg-slate-900/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <ClockIcon className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Manage Hours</h2>
              <p className="text-xs text-slate-400">Enter daily hours · Auto-generates email &amp; OT form</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </header>

        <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
          {/* ── Sidebar ───────────────────────────────────────────────────── */}
          <aside className="w-full lg:w-52 shrink-0 border-r border-slate-800 flex flex-col bg-slate-900/40">
            {/* Add week control */}
            <div className="p-3 border-b border-slate-800 space-y-2">
              <label htmlFor="add-week-date" className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Add a Week
              </label>
              <input
                id="add-week-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
              {previewWeekStart && selectedDate && (
                <p className="text-[10px] text-indigo-300 font-medium">
                  Week of {fmtDisplay(previewWeekStart)}
                </p>
              )}
              <button
                onClick={handleAddNewWeek}
                disabled={!selectedDate}
                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                Add / Open Week
              </button>
            </div>

            {/* Week list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {sortedWeeks.length === 0 && (
                <p className="text-[11px] text-slate-500 px-2 py-4 text-center">
                  No weeks added yet.
                </p>
              )}
              {sortedWeeks.map((weekStart) => {
                const agg = unmatchedHours[weekStart] ?? [];
                const totalHrs = agg.reduce((s, e) => s + e.hours, 0);
                const hasOT = agg.some((e) => e.code === "OST" || e.code === "CTE");
                const isActive = activeWeekStart === weekStart;

                return (
                  <div
                    key={weekStart}
                    onClick={() => loadWeek(weekStart)}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && loadWeek(weekStart)}
                    role="button"
                    tabIndex={0}
                    className={`group px-3 py-2 rounded-lg cursor-pointer transition-all flex flex-col gap-0.5 ${
                      isActive
                        ? "bg-indigo-500/15 border border-indigo-500/30 text-indigo-300"
                        : "text-slate-300 hover:bg-slate-800 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold truncate">{fmtDisplay(weekStart)}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveWeek(weekStart);
                          if (isActive) setActiveWeekStart(null);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 ml-1 transition-all"
                      >
                        <TrashIcon className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="text-slate-500 font-mono">{totalHrs % 1 === 0 ? totalHrs : totalHrs.toFixed(1)} hrs</span>
                      {hasOT && (
                        <span className="px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 font-semibold">
                          ⚡ OT
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          {/* ── Daily editor ──────────────────────────────────────────────── */}
          <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {activeWeekStart ? (
              <>
                {/* Week summary bar */}
                <WeekSummaryBar dailyData={currentDailyData} />

                {/* Day cards grid */}
                <div className="flex-1 overflow-y-auto p-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
                    {activeWeekDays.map((dateKey) => {
                      const entries = currentDailyData[dateKey] ?? [];
                      const dayTotal = entries.reduce((s, e) => s + e.hours, 0);
                      const weekend = isWeekend(dateKey);
                      const hasOT = entries.some((e) => e.code === "OST" || e.code === "CTE");

                      return (
                        <div
                          key={dateKey}
                          className={`rounded-xl border flex flex-col overflow-hidden transition-all ${
                            weekend
                              ? "border-slate-800 bg-slate-900/30 opacity-70"
                              : hasOT
                                ? "border-amber-500/30 bg-amber-900/10"
                                : "border-slate-700/60 bg-slate-900/50"
                          }`}
                        >
                          {/* Day header */}
                          <div
                            className={`px-2 py-1.5 flex items-center justify-between border-b ${
                              weekend
                                ? "bg-slate-800/30 border-slate-800"
                                : hasOT
                                  ? "bg-amber-500/10 border-amber-500/20"
                                  : "bg-slate-800/50 border-slate-700/50"
                            }`}
                          >
                            <span className="text-[11px] font-bold text-slate-200 leading-none">
                              {fmtDayHeader(dateKey)}
                            </span>
                            <div className="flex items-center gap-1">
                              {weekend && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 font-medium">
                                  Off
                                </span>
                              )}
                              {hasOT && !weekend && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">
                                  OT
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Entries with colour badges */}
                          <div className="flex-1 p-1.5 space-y-0.5">
                            {entries.length > 0 && (
                              <div className="space-y-0.5 mb-1.5">
                                {entries.map((e, i) => {
                                  const c = codeColor(e.code);
                                  return (
                                    <div
                                      key={i}
                                      className={`flex items-center justify-between px-1.5 py-0.5 rounded border text-[10px] font-semibold ${c.badge}`}
                                    >
                                      <span>{e.code}</span>
                                      <span className="font-mono">{e.hours % 1 === 0 ? e.hours : e.hours.toFixed(2)}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            <ReportedHoursInput
                              entries={entries}
                              onChange={(newEntries) => handleUpdateDay(dateKey, newEntries)}
                            />
                          </div>

                          {/* Day total footer */}
                          {dayTotal > 0 && (
                            <div
                              className={`px-2 py-1 border-t text-right text-[10px] font-mono font-bold ${
                                hasOT
                                  ? "border-amber-500/20 text-amber-400 bg-amber-900/5"
                                  : "border-slate-700/50 text-slate-400 bg-slate-800/30"
                              }`}
                            >
                              {dayTotal % 1 === 0 ? dayTotal : dayTotal.toFixed(2)} hrs
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 gap-4">
                <ClockIcon className="w-14 h-14 opacity-15" />
                <div className="text-center">
                  <p className="text-base font-semibold text-slate-400">No week selected</p>
                  <p className="text-sm mt-1 text-slate-600">
                    Pick a date and click &quot;Add / Open Week&quot; to get started.
                  </p>
                </div>
              </div>
            )}
          </main>

          {/* ── Right panel: Email / OT Form ──────────────────────────────── */}
          {activeWeekStart && (
            <aside className="w-full lg:w-80 shrink-0 border-l border-slate-800 bg-slate-900/80 flex flex-col">
              {/* Tab bar */}
              <div className="flex border-b border-slate-800 shrink-0">
                <button
                  onClick={() => setRightTab("email")}
                  className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                    rightTab === "email"
                      ? "border-b-2 border-indigo-400 text-indigo-300 bg-indigo-500/5"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  ✉️ Email Preview
                </button>
                <button
                  onClick={() => setRightTab("ot")}
                  className={`flex-1 py-2.5 text-xs font-semibold transition-colors relative ${
                    rightTab === "ot"
                      ? "border-b-2 border-amber-400 text-amber-300 bg-amber-500/5"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  📋 OT Form
                  {otSummary.hasOT && (
                    <span className="absolute top-1.5 right-3 w-1.5 h-1.5 rounded-full bg-amber-400" />
                  )}
                </button>
              </div>

              <AnimatePresence mode="wait">
                {rightTab === "email" ? (
                  <motion.div
                    key="email"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col flex-1 min-h-0"
                  >
                    <div className="flex-1 p-3 overflow-y-auto">
                      <textarea
                        readOnly
                        value={emailText}
                        className="w-full h-full min-h-[200px] bg-transparent border-none resize-none text-xs font-mono text-slate-200 focus:ring-0 p-0 leading-relaxed outline-none"
                      />
                    </div>
                    <div className="p-3 border-t border-slate-800 space-y-2 shrink-0">
                      {otSummary.hasOT && (
                        <p className="text-[10px] text-amber-400 font-medium flex items-center gap-1.5">
                          <span>⚡</span>
                          &quot;OT Form attached.&quot; added — download the form below.
                        </p>
                      )}
                      <button
                        onClick={handleCopyEmail}
                        className={`w-full py-2 rounded-lg text-xs font-semibold transition-all ${
                          copyFeedback
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-800 hover:bg-slate-700 text-white"
                        }`}
                      >
                        {copyFeedback ? "✓ Copied!" : "Copy Email Text"}
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="ot"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col flex-1 min-h-0"
                  >
                    {/* OT Summary */}
                    <div className="p-3 space-y-3 flex-1 overflow-y-auto">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        OT Summary — Week of {fmtDisplay(activeWeekStart)}
                      </p>

                      <div className="space-y-2">
                        <div className={`flex items-center justify-between px-3 py-2.5 rounded-lg border ${
                          otSummary.totalOST > 0
                            ? "bg-amber-500/10 border-amber-500/25 text-amber-300"
                            : "bg-slate-800/50 border-slate-700 text-slate-500"
                        }`}>
                          <div>
                            <div className="text-xs font-semibold">OST — Overtime Pay</div>
                            <div className="text-[10px] text-current opacity-70">Paid at 1.5×</div>
                          </div>
                          <span className="font-mono font-bold text-lg">
                            {otSummary.totalOST.toFixed(otSummary.totalOST % 1 === 0 ? 0 : 2)}
                            <span className="text-xs ml-0.5 font-normal opacity-60">hrs</span>
                          </span>
                        </div>

                        <div className={`flex items-center justify-between px-3 py-2.5 rounded-lg border ${
                          otSummary.totalCTE > 0
                            ? "bg-orange-500/10 border-orange-500/25 text-orange-300"
                            : "bg-slate-800/50 border-slate-700 text-slate-500"
                        }`}>
                          <div>
                            <div className="text-xs font-semibold">CTE — Comp Time Earned</div>
                            <div className="text-[10px] text-current opacity-70">Banked at 1.5×</div>
                          </div>
                          <span className="font-mono font-bold text-lg">
                            {otSummary.totalCTE.toFixed(otSummary.totalCTE % 1 === 0 ? 0 : 2)}
                            <span className="text-xs ml-0.5 font-normal opacity-60">hrs</span>
                          </span>
                        </div>

                        {(otSummary.totalOST + otSummary.totalCTE) > 0 && (
                          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800 border border-slate-700">
                            <span className="text-xs text-slate-400 font-semibold">Total OT Hours</span>
                            <span className="font-mono font-bold text-white">
                              {(otSummary.totalOST + otSummary.totalCTE).toFixed(2)} hrs
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Per-day OT breakdown */}
                      {otSummary.hasOT && (
                        <div className="mt-1">
                          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                            Daily Breakdown
                          </p>
                          <div className="space-y-1">
                            {otDayEntries
                              .filter((d) => d.ostHours > 0 || d.cteHours > 0)
                              .map((d) => (
                                <div
                                  key={d.date}
                                  className="flex items-center justify-between text-[11px] px-2 py-1 rounded bg-slate-800/60 border border-slate-700"
                                >
                                  <span className="text-slate-300">{fmtDayHeader(d.date)}</span>
                                  <span className="flex gap-1.5">
                                    {d.ostHours > 0 && (
                                      <span className="font-mono text-amber-400 font-semibold">
                                        {d.ostHours} OST
                                      </span>
                                    )}
                                    {d.cteHours > 0 && (
                                      <span className="font-mono text-orange-400 font-semibold">
                                        {d.cteHours} CTE
                                      </span>
                                    )}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {!otSummary.hasOT && (
                        <div className="text-center py-6 text-slate-500">
                          <p className="text-sm">No OT hours this week.</p>
                          <p className="text-xs mt-1 text-slate-600">
                            Add OST or CTE entries to a day to generate the OT form.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="p-3 border-t border-slate-800 space-y-2 shrink-0">
                      <button
                        onClick={handleDownloadOTForm}
                        disabled={!otSummary.hasOT}
                        className={`w-full py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                          pdfFeedback
                            ? "bg-emerald-500 text-white"
                            : otSummary.hasOT
                              ? "bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98]"
                              : "bg-slate-800 text-slate-600 cursor-not-allowed"
                        }`}
                      >
                        {pdfFeedback ? (
                          <>✓ Downloaded!</>
                        ) : (
                          <>⬇ Download OT Authorization PDF</>
                        )}
                      </button>
                      {otSummary.hasOT && (
                        <button
                          onClick={handlePreviewOTForm}
                          className="w-full py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          Preview in browser →
                        </button>
                      )}
                      <p className="text-[10px] text-slate-600 text-center leading-snug">
                        Dates, hours, and employee name are auto-filled. Print and add supervisor signature.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </aside>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
