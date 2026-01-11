import { motion } from "framer-motion";
import React, { useState, useEffect } from "react";
import { ReportedHourEntry } from "../types/paystubTypes";
import { ReportedHoursInput } from "./ReportedHoursInput";
import { PlusIcon } from "./icons/PlusIcon";
import { TrashIcon } from "./icons/TrashIcon";
import { XIcon } from "./icons/XIcon";
import { ClockIcon } from "./icons/ClockIcon";

// Re-defining these here or importing from Page if feasible, but keeping simple for now.
export type DailyHoursMap = { [date: string]: ReportedHourEntry[] };
export type WeeklyDailyDetails = { [weekStartDate: string]: DailyHoursMap };

interface FutureHoursManagerProps {
  unmatchedHours: { [weekStartDate: string]: ReportedHourEntry[] }; // Aggregate for display in list
  unmatchedDailyDetails: WeeklyDailyDetails; // Detailed daily data for editing
  onAddWeek: (weekStartDate: string) => void;
  onRemoveWeek: (weekStartDate: string) => void;
  onHoursChange: (
    weekStartDate: string,
    entries: ReportedHourEntry[],
    dailyDetails: DailyHoursMap
  ) => void;
  onClose: () => void;
}

const formatDateDisplay = (dateStr: string) => {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const formatDayHeader = (dateStr: string) => {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
};

const getDayName = (date: Date) =>
  [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ][date.getDay()];

export const FutureHoursManager: React.FC<FutureHoursManagerProps> = ({
  unmatchedHours,
  unmatchedDailyDetails,
  onAddWeek,
  onRemoveWeek,
  onHoursChange,
  onClose,
}) => {
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [activeWeekStart, setActiveWeekStart] = useState<string | null>(null);
  const [currentDailyData, setCurrentDailyData] = useState<DailyHoursMap>({});
  const [generatedEmail, setGeneratedEmail] = useState<string | null>(null);
  const [emailCopyFeedback, setEmailCopyFeedback] = useState(false);

  // Calc Helper
  const calculateWeekFromDate = (dateStr: string) => {
    const inputDate = new Date(dateStr + "T00:00:00");
    const daysSinceSat = (inputDate.getDay() + 1) % 7;
    const offset = daysSinceSat === 0 ? 7 : daysSinceSat;
    const startDate = new Date(inputDate);
    startDate.setDate(inputDate.getDate() - offset);
    return startDate;
  };

  // Initialize Default Data
  const getDefaultDailyData = (startDate: Date): DailyHoursMap => {
    const data: DailyHoursMap = {};
    for (let i = 0; i < 7; i++) {
      const current = new Date(startDate);
      current.setDate(startDate.getDate() + i);
      const key = current.toISOString().split("T")[0];
      const day = current.getDay();

      if (day === 5) {
        // Friday
        data[key] = [
          { code: "WKP", hours: 4 },
          { code: "OST", hours: 4 },
        ];
      } else if (day >= 1 && day <= 4) {
        // Mon-Thu
        data[key] = [{ code: "WKP", hours: 8 }];
      } else {
        data[key] = []; // Sat/Sun empty
      }
    }
    return data;
  };

  // Aggregate Helper
  const calculateAggregate = (
    dailyData: DailyHoursMap
  ): ReportedHourEntry[] => {
    const totals: { [code: string]: number } = {};
    Object.values(dailyData).forEach((entries) => {
      entries.forEach((e) => {
        totals[e.code] = (totals[e.code] || 0) + e.hours;
      });
    });
    return Object.entries(totals).map(([code, hours]) => ({ code, hours }));
  };

  // Email Generator
  const generateEmailText = (
    dailyData: DailyHoursMap,
    startDateStr: string
  ) => {
    const start = new Date(startDateStr + "T00:00:00");
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    let text = `Hours ${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}\n\n`;

    // Sort days
    const sortedDays = Object.keys(dailyData).sort();
    const totals: { [code: string]: number } = {};

    sortedDays.forEach((dateKey) => {
      const entries = dailyData[dateKey];
      if (entries.length === 0) return;

      const dateObj = new Date(dateKey + "T00:00:00");
      const dayText = `${getDayName(dateObj)} ${dateObj.getMonth() + 1}/${dateObj.getDate()}`;

      // Format entries text e.g. "4 WKP, 4 OST"
      const entryParts = entries.map((e) => {
        totals[e.code] = (totals[e.code] || 0) + e.hours;
        return `${e.hours} ${e.code}`;
      });

      text += `${dayText}: ${entryParts.join(", ")}\n`;
    });

    text += `\nTotal: `;
    const totalParts = Object.entries(totals).map(
      ([code, h]) => `${h} ${code}`
    );
    text += totalParts.join(", ");
    text += `\n\nThanks,\nStephen Matzat`;

    return text;
  };

  // Load Week Logic
  const loadWeek = (startKey: string) => {
    setActiveWeekStart(startKey);

    if (unmatchedDailyDetails[startKey]) {
      // Load existing daily details
      setCurrentDailyData(unmatchedDailyDetails[startKey]);
    } else {
      // No details? Try to seed from defaults
      const startDate = new Date(startKey + "T00:00:00");
      const defaults = getDefaultDailyData(startDate);
      setCurrentDailyData(defaults);
      // We immediately save this "hydration" so the state is consistent
      onHoursChange(startKey, calculateAggregate(defaults), defaults);
    }
  };

  // Effect: Update email whenever daily data changes
  useEffect(() => {
    if (activeWeekStart && currentDailyData) {
      setGeneratedEmail(generateEmailText(currentDailyData, activeWeekStart));
      // Also auto-save aggregate
      const agg = calculateAggregate(currentDailyData);
      // Debounce save? standard react... for now direct call
      onHoursChange(activeWeekStart, agg, currentDailyData);
    }
  }, [currentDailyData, activeWeekStart, onHoursChange]);

  const handleAddNewWeek = () => {
    if (!selectedDate) {
      alert("Please select a date first.");
      return;
    }
    const start = calculateWeekFromDate(selectedDate);
    const startKey = start.toISOString().split("T")[0];

    onAddWeek(startKey);
    loadWeek(startKey);
    setSelectedDate("");
  };

  const handleUpdateDay = (dateKey: string, entries: ReportedHourEntry[]) => {
    setCurrentDailyData((prev) => ({
      ...prev,
      [dateKey]: entries,
    }));
  };

  const handleCopyEmail = () => {
    if (generatedEmail) {
      navigator.clipboard.writeText(generatedEmail);
      setEmailCopyFeedback(true);
      setTimeout(() => setEmailCopyFeedback(false), 2000);
    }
  };

  const sortedWeeks = Object.keys(unmatchedHours).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  // Generate valid day keys for the active week to render input list in order
  const activeWeekDays = activeWeekStart
    ? Array.from({ length: 7 }, (_, i) => {
        const d = new Date(activeWeekStart + "T00:00:00");
        d.setDate(d.getDate() + i);
        return d.toISOString().split("T")[0];
      })
    : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col border border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-2 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 rounded-t-2xl shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">Manage Hours</h2>
            <p className="text-sm text-slate-300">
              Select a week to edit daily hours. Email text updates
              automatically.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </header>

        <div className="flex flex-col lg:flex-row flex-grow min-h-0 overflow-hidden">
          {/* Sidebar: Week List & Add */}
          <div className="w-full lg:w-56 border-r border-slate-800 flex flex-col bg-slate-900/30 shrink-0">
            <div className="p-2 border-b border-slate-800 space-y-2">
              <div>
                <label
                  htmlFor="week-date-select"
                  className="block text-xs font-medium text-slate-300 mb-1"
                >
                  Select Date
                </label>
                <input
                  id="week-date-select"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={handleAddNewWeek}
                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                <span>Add/Edit Week</span>
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-2 space-y-1 custom-scrollbar">
              <h3 className="px-2 py-1 text-xs font-bold text-slate-500 uppercase">
                Weeks
              </h3>
              {sortedWeeks.map((weekStart) => (
                <div
                  key={weekStart}
                  onClick={() => loadWeek(weekStart)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      loadWeek(weekStart);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className={`py-2 px-3 rounded-lg cursor-pointer flex justify-between items-center group transition-all ${activeWeekStart === weekStart ? "bg-indigo-500/10 border border-indigo-500/30 text-indigo-300" : "text-slate-300 hover:bg-slate-800"}`}
                >
                  <div className="text-base font-medium">
                    {formatDateDisplay(weekStart)}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveWeek(weekStart);
                      if (activeWeekStart === weekStart)
                        setActiveWeekStart(null);
                    }}
                    className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content: Daily Editor */}
          <div className="flex-1 flex flex-col min-h-0 bg-slate-950/30">
            {activeWeekStart ? (
              <div className="flex-grow overflow-y-auto p-2 custom-scrollbar">
                <h3 className="text-sm font-semibold text-white mb-1.5 flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full bg-indigo-500"></span>
                  Week of {formatDateDisplay(activeWeekStart)}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                  {activeWeekDays.map((dateKey) => (
                    <div
                      key={dateKey}
                      className="bg-slate-900/50 border border-slate-800 rounded-lg p-1.5"
                    >
                      <div className="mb-2 flex items-baseline gap-2">
                        <h4 className="text-xs font-bold text-slate-200">
                          {formatDayHeader(dateKey)}
                        </h4>
                        {/* Visual indicator for weekends */}
                        {(new Date(dateKey + "T00:00:00").getDay() === 0 ||
                          new Date(dateKey + "T00:00:00").getDay() === 6) && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-medium">
                            Weekend
                          </span>
                        )}
                      </div>

                      <ReportedHoursInput
                        entries={currentDailyData[dateKey] || []}
                        onChange={(entries) =>
                          handleUpdateDay(dateKey, entries)
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-slate-500 p-8">
                <ClockIcon className="w-16 h-16 opacity-20 mb-4" />
                <p className="text-lg font-medium">No week selected</p>
                <p className="text-sm mt-1">
                  Select a week from the sidebar or add a new one.
                </p>
              </div>
            )}
          </div>

          {/* Right Panel: Email Preview (Persistent if Active) */}
          {activeWeekStart && (
            <div className="w-full lg:w-80 border-l border-slate-800 bg-slate-900/80 flex flex-col shrink-0">
              <div className="p-2 border-b border-slate-800">
                <h3 className="font-semibold text-slate-200 text-xs text-white">
                  Email Preview
                </h3>
              </div>
              <div className="flex-grow p-3 overflow-y-auto">
                <textarea
                  readOnly
                  value={generatedEmail || ""}
                  className="w-full h-full min-h-[150px] bg-transparent border-none resize-none text-xs font-mono text-slate-200 focus:ring-0 p-0 leading-relaxed"
                />
              </div>
              <div className="p-2 border-t border-slate-800">
                <button
                  onClick={handleCopyEmail}
                  className={`w-full py-2 rounded-md text-xs font-medium transition-all ${emailCopyFeedback ? "bg-emerald-500 text-white" : "bg-slate-800 hover:bg-slate-700 text-white"}`}
                >
                  {emailCopyFeedback ? "Copied!" : "Copy Text"}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
