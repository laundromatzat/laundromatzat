import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import React, { useCallback, useEffect, useState } from "react";
import { ConfirmationModal } from "../components/paystub-analyzer/ConfirmationModal";
import { FileUpload } from "../components/paystub-analyzer/FileUpload";
import { FutureHoursManager } from "../components/paystub-analyzer/FutureHoursManager";
import { PaycheckSpreadsheet } from "../components/paystub-analyzer/PaycheckSpreadsheet";
import { PaycheckTable } from "../components/paystub-analyzer/PaycheckTable";
import { DocumentTextIcon } from "../components/paystub-analyzer/icons/DocumentTextIcon";

import { ViewGridIcon } from "../components/paystub-analyzer/icons/ViewGridIcon";
import { ViewListIcon } from "../components/paystub-analyzer/icons/ViewListIcon";
import { TrashIcon } from "../components/paystub-analyzer/icons/TrashIcon";
import { ClockIcon } from "../components/paystub-analyzer/icons/ClockIcon";
import { useAuth } from "../context/AuthContext";
import { useLoading } from "../context/LoadingContext";
import {
  analyzePaycheckPdf,
  fetchPaychecks,
  setAuthToken,
} from "../services/paystubApiService";
import { PaycheckData, ReportedHourEntry } from "../types/paystubTypes";

type ViewMode = "card" | "spreadsheet";

const UNMATCHED_HOURS_STORAGE_KEY = "paystub_unmatched_hours";
const UNMATCHED_DAILY_DETAILS_STORAGE_KEY = "paystub_unmatched_daily_details";

// Type for daily breakdown: { "2023-10-27": [{ code: "WKP", hours: 8 }] }
export type DailyHoursMap = { [date: string]: ReportedHourEntry[] };
// Type for week storage: { "2023-10-23": { "2023-10-23": [...], "2023-10-24": [...] } }
export type WeeklyDailyDetails = { [weekStartDate: string]: DailyHoursMap };

const PaystubAnalyzerPage: React.FC = () => {
  const [paycheckData, setPaycheckData] = useState<PaycheckData[]>([]);
  const [unmatchedReportedHours, setUnmatchedReportedHours] = useState<{
    [weekStartDate: string]: ReportedHourEntry[];
  }>(() => {
    try {
      const storedHours = localStorage.getItem(UNMATCHED_HOURS_STORAGE_KEY);
      return storedHours ? JSON.parse(storedHours) : {};
    } catch (error) {
      console.error("Failed to load unmatched hours from localStorage", error);
      return {};
    }
  });

  const [unmatchedDailyDetails, setUnmatchedDailyDetails] =
    useState<WeeklyDailyDetails>(() => {
      try {
        const stored = localStorage.getItem(
          UNMATCHED_DAILY_DETAILS_STORAGE_KEY
        );
        return stored ? JSON.parse(stored) : {};
      } catch (error) {
        console.error("Failed to load daily details from localStorage", error);
        return {};
      }
    });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [isFutureHoursModalOpen, setIsFutureHoursModalOpen] = useState(false);
  const [isClearDataModalOpen, setIsClearDataModalOpen] = useState(false);

  const { token } = useAuth();

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  useEffect(() => {
    try {
      localStorage.setItem(
        UNMATCHED_HOURS_STORAGE_KEY,
        JSON.stringify(unmatchedReportedHours)
      );
    } catch (error) {
      console.error("Failed to save unmatched hours to localStorage", error);
    }
  }, [unmatchedReportedHours]);

  useEffect(() => {
    try {
      localStorage.setItem(
        UNMATCHED_DAILY_DETAILS_STORAGE_KEY,
        JSON.stringify(unmatchedDailyDetails)
      );
    } catch (error) {
      console.error("Failed to save daily details to localStorage", error);
    }
  }, [unmatchedDailyDetails]);

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchPaychecks();
      setPaycheckData(data);
    } catch (e) {
      console.error("Failed to fetch history:", e);
      setError("Failed to load data. Please check connection.");
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAnalysisComplete = useCallback(
    (data: PaycheckData) => {
      const formatDateToKey = (date: Date): string =>
        date.toISOString().split("T")[0];

      const payPeriodStartDate = new Date(data.payPeriodStart + "T00:00:00");
      const week1StartDateKey = formatDateToKey(payPeriodStartDate);

      const week2StartDate = new Date(payPeriodStartDate);
      week2StartDate.setDate(payPeriodStartDate.getDate() + 7);
      const week2StartDateKey = formatDateToKey(week2StartDate);

      let hoursWereMatched = false;
      const newUnmatchedHours = { ...unmatchedReportedHours };
      const userReportedHours: {
        week1: ReportedHourEntry[];
        week2: ReportedHourEntry[];
      } = { week1: [], week2: [] };

      if (newUnmatchedHours[week1StartDateKey]) {
        userReportedHours.week1 = newUnmatchedHours[week1StartDateKey];
        delete newUnmatchedHours[week1StartDateKey];
        hoursWereMatched = true;
      }
      if (newUnmatchedHours[week2StartDateKey]) {
        userReportedHours.week2 = newUnmatchedHours[week2StartDateKey];
        delete newUnmatchedHours[week2StartDateKey];
        hoursWereMatched = true;
      }

      if (hoursWereMatched) {
        setUnmatchedReportedHours(newUnmatchedHours);
      }

      const finalData = { ...data, userReportedHours };

      setPaycheckData((prevData) => {
        const existingIndex = prevData.findIndex(
          (p) =>
            p.payPeriodStart === finalData.payPeriodStart &&
            p.payPeriodEnd === finalData.payPeriodEnd
        );
        if (existingIndex !== -1) {
          const updatedData = [...prevData];
          const previousHours = updatedData[existingIndex].userReportedHours;
          updatedData[existingIndex] = {
            ...finalData,
            userReportedHours:
              finalData.userReportedHours?.week1?.length ||
              finalData.userReportedHours?.week2?.length
                ? finalData.userReportedHours
                : previousHours,
          };
          return updatedData.sort(
            (a, b) =>
              new Date(b.payPeriodStart).getTime() -
              new Date(a.payPeriodStart).getTime()
          );
        }
        return [...prevData, finalData].sort(
          (a, b) =>
            new Date(b.payPeriodStart).getTime() -
            new Date(a.payPeriodStart).getTime()
        );
      });
    },
    [unmatchedReportedHours]
  );

  const { setIsLoading: setGlobalLoading } = useLoading();

  const handleFileProcess = async (files: FileList) => {
    setIsLoading(true);
    setGlobalLoading(true);
    setError(null);
    const errors: string[] = [];

    for (const file of Array.from(files)) {
      try {
        const data = await analyzePaycheckPdf(file);
        // Normalize data structure if backend returns different keys
        const normalizedData = {
          ...data,
          paidHours: data.paidHours || (data as any).hoursPaid || [],
          bankedHours: data.bankedHours || (data as any).bankedHours || [],
        };
        handleAnalysisComplete(normalizedData);
      } catch (e) {
        const errorMessage =
          e instanceof Error ? e.message : "An unknown error occurred.";
        errors.push(`- ${file.name}: ${errorMessage}`);
      }
    }

    if (errors.length > 0) {
      const plural = files.length > 1;
      const successCount = files.length - errors.length;
      const errorHeader = `Completed with ${errors.length} error${errors.length > 1 ? "s" : ""} (processed ${successCount}/${files.length} file${plural ? "s" : ""} successfully).`;
      setError(`${errorHeader}\n\nDetails:\n${errors.join("\n")}`);
    }

    setIsLoading(false);
    setGlobalLoading(false);
  };

  const handleHoursChange = async (
    index: number,
    week: "week1" | "week2",
    entries: ReportedHourEntry[]
  ) => {
    // Optimistic update
    const updatedData = [...paycheckData];
    const currentData = { ...updatedData[index] };

    if (!currentData.userReportedHours) {
      currentData.userReportedHours = { week1: [], week2: [] };
    }
    currentData.userReportedHours[week] = entries;
    updatedData[index] = currentData;

    setPaycheckData(updatedData);

    // Persist to backend
    try {
      const { updatePaycheckReportedHours } = await import(
        "../services/paystubApiService"
      );
      if (currentData.id) {
        await updatePaycheckReportedHours(
          currentData.id,
          currentData.userReportedHours
        );
      }
    } catch (err) {
      console.error("Failed to persist reported hours:", err);
      // Optionally revert state or show error toast
    }
  };

  const handleFutureHoursChange = useCallback(
    (
      weekStartDate: string,
      entries: ReportedHourEntry[],
      dailyDetails?: DailyHoursMap
    ) => {
      setUnmatchedReportedHours((prev) => ({
        ...prev,
        [weekStartDate]: entries,
      }));
      if (dailyDetails) {
        setUnmatchedDailyDetails((prev) => ({
          ...prev,
          [weekStartDate]: dailyDetails,
        }));
      }
    },
    []
  );

  const handleAddFutureWeek = useCallback(
    (weekStartDate: string) => {
      if (!unmatchedReportedHours[weekStartDate]) {
        setUnmatchedReportedHours((prev) => ({
          ...prev,
          [weekStartDate]: [],
        }));
        // Initialize daily details for this week if needed
        setUnmatchedDailyDetails((prev) => ({
          ...prev,
          [weekStartDate]: {},
        }));
      }
    },
    [unmatchedReportedHours]
  );

  const handleRemoveFutureWeek = useCallback((weekStartDate: string) => {
    setUnmatchedReportedHours((prev) => {
      const next = { ...prev };
      delete next[weekStartDate];
      return next;
    });
    setUnmatchedDailyDetails((prev) => {
      const next = { ...prev };
      delete next[weekStartDate];
      return next;
    });
  }, []);

  const ViewToggle = () => (
    <div className="flex justify-end mb-6">
      <div className="inline-flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800">
        <button
          onClick={() => setViewMode("card")}
          aria-pressed={viewMode === "card"}
          className={clsx(
            "px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2",
            viewMode === "card"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          )}
        >
          <ViewListIcon className="w-4 h-4" />
          <span>Cards</span>
        </button>
        <button
          onClick={() => setViewMode("spreadsheet")}
          aria-pressed={viewMode === "spreadsheet"}
          className={clsx(
            "px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2",
            viewMode === "spreadsheet"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          )}
        >
          <ViewGridIcon className="w-4 h-4" />
          <span>Table</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-zinc-950 min-h-screen text-base text-zinc-200 font-sans selection:bg-indigo-500/30 rounded-3xl -mx-4 sm:-mx-6 lg:-mx-8 -mt-20 p-4 sm:p-6 lg:p-8">
      <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 pointer-events-none" />

      <main className="relative container mx-auto p-4 md:p-8 max-w-7xl">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 backdrop-blur-sm">
              <DocumentTextIcon className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Paystub Analyzer <span className="text-indigo-400">Pro</span>
              </h1>
              <p className="text-base text-zinc-300">
                Intelligent Payroll Tracking
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Future: Add user profile or settings here */}
          </div>
        </motion.header>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <div className="relative bg-red-500/10 p-4 rounded-xl border border-red-500/20 text-red-200 backdrop-blur-sm">
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  Processing Error
                </h3>
                <pre className="whitespace-pre-wrap text-sm mt-2 font-mono bg-black/20 p-3 rounded-lg border border-white/5">
                  {error}
                </pre>
                <button
                  onClick={() => setError(null)}
                  className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/10 transition-colors"
                  aria-label="Dismiss error"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-8">
          {paycheckData.length === 0 &&
            Object.keys(unmatchedReportedHours).length === 0 &&
            !isLoading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20 px-6 rounded-3xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm"
              >
                <div className="w-20 h-20 mx-auto bg-zinc-800/50 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-white/10">
                  <DocumentTextIcon className="h-10 w-10 text-zinc-400" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-2">
                  No paystubs analyzed yet
                </h3>
                <p className="text-zinc-400 max-w-md mx-auto mb-8">
                  Upload your PDF paystubs to automatically extract hours, track
                  earnings, and verify your paycheck accuracy.
                </p>
                <div className="flex justify-center">
                  {/* The FileUpload component will be the primary call to action */}
                </div>
              </motion.div>
            )}

          {paycheckData.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ViewToggle />
              {viewMode === "card" ? (
                <PaycheckTable
                  paycheckData={paycheckData}
                  onHoursChange={handleHoursChange}
                />
              ) : (
                <PaycheckSpreadsheet
                  paycheckData={paycheckData}
                  onHoursChange={handleHoursChange}
                />
              )}
            </motion.div>
          )}
        </div>
      </main>

      <ConfirmationModal
        isOpen={isClearDataModalOpen}
        title="Clear All Data?"
        message="Are you sure you want to delete all uploaded paystubs and reported hours? This action cannot be undone."
        isDestructive={true}
        onCancel={() => setIsClearDataModalOpen(false)}
        onConfirm={async () => {
          try {
            const { clearAllData } = await import(
              "../services/paystubApiService"
            );
            await clearAllData();
            setPaycheckData([]);
            setUnmatchedReportedHours({});
            setUnmatchedDailyDetails({}); // Clear daily details as well
            setIsClearDataModalOpen(false);
          } catch (e) {
            console.error("Failed to clear data:", e);
            setError("Failed to clear data.");
            setIsClearDataModalOpen(false);
          }
        }}
      />

      {/* Floating Action Bar */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 p-2 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50"
      >
        <FileUpload onFileProcess={handleFileProcess} isLoading={isLoading} />

        <div className="w-px h-8 bg-white/10 mx-1" />

        <button
          onClick={() => setIsFutureHoursModalOpen(true)}
          className="flex items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/25"
          title="Manage Future Week Hours & Timekeeper"
        >
          <ClockIcon className="w-5 h-5" />
          <span className="hidden sm:inline">Manage Hours</span>
        </button>

        <div className="w-px h-8 bg-white/10 mx-1" />

        <button
          onClick={() => setIsClearDataModalOpen(true)}
          className="flex items-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-medium transition-all hover:scale-105 active:scale-95 border border-red-500/20"
          title="Clear All Data"
        >
          <TrashIcon className="w-5 h-5" />
          <span className="hidden sm:inline">Clear Data</span>
        </button>
      </motion.div>

      {isFutureHoursModalOpen && (
        <FutureHoursManager
          unmatchedHours={unmatchedReportedHours}
          unmatchedDailyDetails={unmatchedDailyDetails}
          onAddWeek={handleAddFutureWeek}
          onRemoveWeek={handleRemoveFutureWeek}
          onHoursChange={handleFutureHoursChange}
          onClose={() => setIsFutureHoursModalOpen(false)}
        />
      )}
    </div>
  );
};

export default PaystubAnalyzerPage;
