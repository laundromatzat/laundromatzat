import { AnimatePresence, motion } from "framer-motion";
import React, { useCallback, useEffect, useState } from "react";
import { ConfirmationModal } from "./components/ConfirmationModal";
import { FileUpload } from "./components/FileUpload";
import { FutureHoursManager } from "./components/FutureHoursManager";
import { PaycheckSpreadsheet } from "./components/PaycheckSpreadsheet";
import { PaycheckTable } from "./components/PaycheckTable";
import { DocumentTextIcon } from "./components/icons/DocumentTextIcon";

import { ViewGridIcon } from "./components/icons/ViewGridIcon";
import { ViewListIcon } from "./components/icons/ViewListIcon";
import { TrashIcon } from "./components/icons/TrashIcon";

import { ClockIcon } from "./components/icons/ClockIcon";
import { Skeleton } from "@/components/ui/Skeleton";
import { AuraButton, AuraInput } from "@/components/aura";
import { DesignGallery, SortOption } from "@/components/DesignGallery";
import { ClockIcon as HistoryIcon } from "@heroicons/react/24/outline";
// Unused imports removed

import { useAuth } from "@/context/AuthContext";
import { useLoading } from "@/context/LoadingContext";
import {
  analyzePaycheckPdf,
  fetchPaychecks,
  setAuthToken,
} from "@/services/paystubApiService";
import { PaycheckData, ReportedHourEntry } from "./types/paystubTypes";

type ViewMode = "card" | "spreadsheet";

const UNMATCHED_HOURS_STORAGE_KEY = "paystub_unmatched_hours";
const UNMATCHED_DAILY_DETAILS_STORAGE_KEY = "paystub_unmatched_daily_details";

// Type for daily breakdown: { "2023-10-27": [{ code: "WKP", hours: 8 }] }
export type DailyHoursMap = { [date: string]: ReportedHourEntry[] };
// Type for week storage: { "2023-10-23": { "2023-10-23": [...], "2023-10-24": [...] } }
export type WeeklyDailyDetails = { [weekStartDate: string]: DailyHoursMap };

// Helper to ensure YYYY-MM-DD format
const normalizeDate = (dateStr: string): string => {
  if (!dateStr) return "";
  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

  // Handle MM/DD/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
    const [m, d, y] = dateStr.split("/");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // Fallback: try parsing
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split("T")[0];
  }

  return dateStr;
};

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
          UNMATCHED_DAILY_DETAILS_STORAGE_KEY,
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

  const [editModalOpen, setEditModalOpen] = useState(false);
  // const [selectedPaystubForEdit, setSelectedPaystubForEdit] = useState<PaycheckData | null>(null); // Removed unused, using editFormData
  const [editFormData, setEditFormData] = useState<PaycheckData | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const openEditModal = (paystub: PaycheckData) => {
    // setSelectedPaystubForEdit(paystub); // Unused
    setEditFormData({ ...paystub });
    setEditModalOpen(true);
  };

  const handleEditSave = () => {
    if (!editFormData) return;

    setPaycheckData((prev) =>
      prev.map((p) =>
        p.payPeriodStart === editFormData.payPeriodStart &&
        p.payPeriodEnd === editFormData.payPeriodEnd
          ? editFormData
          : p,
      ),
    );

    setEditModalOpen(false);
    setEditModalOpen(false);
    // setSelectedPaystubForEdit(null); // Unused
  };

  const { token } = useAuth();

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  useEffect(() => {
    try {
      localStorage.setItem(
        UNMATCHED_HOURS_STORAGE_KEY,
        JSON.stringify(unmatchedReportedHours),
      );
    } catch (error) {
      console.error("Failed to save unmatched hours to localStorage", error);
    }
  }, [unmatchedReportedHours]);

  useEffect(() => {
    try {
      localStorage.setItem(
        UNMATCHED_DAILY_DETAILS_STORAGE_KEY,
        JSON.stringify(unmatchedDailyDetails),
      );
    } catch (error) {
      console.error("Failed to save daily details to localStorage", error);
    }
  }, [unmatchedDailyDetails]);

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const data = await fetchPaychecks();
      setPaycheckData(data);
    } catch (e) {
      console.error("Failed to fetch history:", e);
      setError("Failed to load data. Please check connection.");
    } finally {
      setIsLoading(false);
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
            p.payPeriodEnd === finalData.payPeriodEnd,
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
              new Date(a.payPeriodStart).getTime(),
          );
        }
        return [...prevData, finalData].sort(
          (a, b) =>
            new Date(b.payPeriodStart).getTime() -
            new Date(a.payPeriodStart).getTime(),
        );
      });
    },
    [unmatchedReportedHours],
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
          payPeriodStart: normalizeDate(data.payPeriodStart),
          payPeriodEnd: normalizeDate(data.payPeriodEnd),
          pdfUrl: URL.createObjectURL(file), // Store blob URL
          paidHours:
            data.paidHours ||
            (data as unknown as { hoursPaid: ReportedHourEntry[] }).hoursPaid ||
            [],
          bankedHours:
            data.bankedHours ||
            (data as unknown as { bankedHours: ReportedHourEntry[] })
              .bankedHours ||
            [],
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
    entries: ReportedHourEntry[],
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
        "@/services/paystubApiService"
      );
      if (currentData.id) {
        await updatePaycheckReportedHours(
          currentData.id,
          currentData.userReportedHours,
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
      dailyDetails?: DailyHoursMap,
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
    [],
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
    [unmatchedReportedHours],
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
      <div className="inline-flex items-center bg-white/50 p-1 rounded-lg border border-aura-text-primary/10">
        <AuraButton
          size="sm"
          variant={viewMode === "card" ? "accent" : "ghost"}
          onClick={() => setViewMode("card")}
          icon={<ViewListIcon className="w-4 h-4" />}
          className={
            viewMode !== "card"
              ? "text-aura-text-secondary hover:bg-aura-text-primary/5"
              : ""
          }
        >
          Cards
        </AuraButton>
        <AuraButton
          size="sm"
          variant={viewMode === "spreadsheet" ? "accent" : "ghost"}
          onClick={() => setViewMode("spreadsheet")}
          icon={<ViewGridIcon className="w-4 h-4" />}
          className={
            viewMode !== "spreadsheet"
              ? "text-aura-text-secondary hover:bg-aura-text-primary/5"
              : ""
          }
        >
          Table
        </AuraButton>
      </div>
    </div>
  );

  return (
    <div className="bg-aura-bg min-h-screen text-base text-aura-text-primary font-sans selection:bg-aura-accent/30 p-4 sm:p-6 lg:p-8">
      <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-40 pointer-events-none" />

      <main className="relative container mx-auto p-4 md:p-8 max-w-7xl">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-aura-accent/10 rounded-xl border border-aura-accent/20 backdrop-blur-sm">
              <DocumentTextIcon className="w-8 h-8 text-aura-accent" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-aura-text-primary">
                Paystub Analyzer <span className="text-aura-accent">Pro</span>
              </h1>
              <p className="text-base text-aura-text-secondary">
                Intelligent Payroll Tracking
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsGalleryOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-full border border-slate-200 transition-colors shadow-sm"
            >
              <HistoryIcon className="w-4 h-4" />
              <span>History</span>
            </button>
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
          {isLoading && paycheckData.length === 0 && (
            <div className="space-y-4">
              <div className="flex justify-end mb-6">
                <Skeleton className="h-9 w-48 rounded-lg" />
              </div>
              <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-aura-text-primary/10 overflow-hidden">
                <div className="p-4 grid grid-cols-6 gap-4 border-b border-aura-text-primary/5">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton
                      key={i}
                      className="h-4 w-20 bg-aura-text-primary/10"
                    />
                  ))}
                </div>
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="p-4 grid grid-cols-6 gap-4 border-b border-aura-text-primary/5 last:border-0"
                  >
                    <Skeleton className="h-4 w-24 bg-aura-text-primary/10" />
                    <Skeleton className="h-4 w-16 bg-aura-text-primary/10" />
                    <Skeleton className="h-4 w-16 bg-aura-text-primary/10" />
                    <Skeleton className="h-4 w-20 bg-aura-text-primary/10" />
                    <Skeleton className="h-4 w-24 bg-aura-text-primary/10" />
                    <Skeleton className="h-4 w-12 bg-aura-text-primary/10 ml-auto" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {paycheckData.length === 0 &&
            Object.keys(unmatchedReportedHours).length === 0 &&
            !isLoading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20 px-6 rounded-3xl border border-aura-text-primary/10 bg-white/50 backdrop-blur-sm"
              >
                <div className="w-20 h-20 mx-auto bg-white/80 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-aura-text-primary/10">
                  <DocumentTextIcon className="h-10 w-10 text-aura-accent" />
                </div>
                <h3 className="text-2xl font-semibold text-aura-text-primary mb-2">
                  No paystubs analyzed yet
                </h3>
                <p className="text-aura-text-secondary max-w-md mx-auto mb-8">
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
                  onEdit={openEditModal}
                />
              ) : (
                <PaycheckSpreadsheet
                  paycheckData={paycheckData}
                  onHoursChange={handleHoursChange}
                  onEdit={openEditModal}
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
              "@/services/paystubApiService"
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
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 p-2 bg-white/90 backdrop-blur-xl border border-aura-text-primary/10 rounded-2xl shadow-2xl shadow-black/10"
      >
        <FileUpload onFileProcess={handleFileProcess} isLoading={isLoading} />

        <div className="w-px h-8 bg-aura-text-primary/10 mx-1" />

        <button
          onClick={() => setIsFutureHoursModalOpen(true)}
          className="flex items-center gap-2 px-4 py-3 bg-aura-accent hover:bg-aura-accent/90 text-white rounded-xl font-medium transition-all hover:scale-105 active:scale-95 shadow-lg shadow-aura-accent/25"
          title="Manage Future Week Hours & Timekeeper"
        >
          <ClockIcon className="w-5 h-5" />
          <span className="hidden sm:inline">Manage Hours</span>
        </button>

        <div className="w-px h-8 bg-aura-text-primary/10 mx-1" />

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
      {/* Edit Paystub Modal - Basic Implementation for Speed, consider moving to separate component later */}
      {editModalOpen && editFormData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-800">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h3 className="text-lg font-semibold text-white">
                Edit Paystub Data
              </h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <span className="sr-only">Close</span>
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-auto">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label
                    htmlFor="edit-pay-period-start"
                    className="block text-sm font-medium text-slate-300 mb-1"
                  >
                    Pay Period Start
                  </label>
                  <AuraInput
                    id="edit-pay-period-start"
                    type="date"
                    className="bg-slate-950 border-slate-700 text-white focus:ring-indigo-500 focus:border-indigo-500"
                    value={editFormData.payPeriodStart}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        payPeriodStart: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label
                    htmlFor="edit-pay-period-end"
                    className="block text-sm font-medium text-slate-300 mb-1"
                  >
                    Pay Period End
                  </label>
                  <AuraInput
                    id="edit-pay-period-end"
                    type="date"
                    className="bg-slate-950 border-slate-700 text-white focus:ring-indigo-500 focus:border-indigo-500"
                    value={editFormData.payPeriodEnd}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        payPeriodEnd: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <DocumentTextIcon className="w-4 h-4 text-aura-accent" />{" "}
                  Extracted Paid Hours
                </h4>
                <div className="space-y-2 bg-slate-900/30 p-4 rounded-lg border border-slate-800">
                  {editFormData.paidHours.map((entry, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <AuraInput
                        type="text"
                        className="flex-1 bg-slate-950 border-slate-700 text-white text-sm"
                        value={entry.category}
                        onChange={(e) => {
                          const newHours = [...editFormData.paidHours];
                          newHours[idx].category = e.target.value;
                          setEditFormData({
                            ...editFormData,
                            paidHours: newHours,
                          });
                        }}
                      />
                      <AuraInput
                        type="number"
                        className="w-24 bg-slate-950 border-slate-700 text-white text-sm text-right"
                        value={entry.hours}
                        onChange={(e) => {
                          const newHours = [...editFormData.paidHours];
                          newHours[idx].hours = parseFloat(e.target.value) || 0;
                          setEditFormData({
                            ...editFormData,
                            paidHours: newHours,
                          });
                        }}
                      />
                      <button
                        className="text-red-400 hover:text-red-600 p-1"
                        onClick={() => {
                          const newHours = editFormData.paidHours.filter(
                            (_, i) => i !== idx,
                          );
                          setEditFormData({
                            ...editFormData,
                            paidHours: newHours,
                          });
                        }}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() =>
                      setEditFormData({
                        ...editFormData,
                        paidHours: [
                          ...editFormData.paidHours,
                          { category: "New Category", hours: 0 },
                        ],
                      })
                    }
                    className="text-xs text-aura-accent font-medium hover:underline mt-2 flex items-center gap-1"
                  >
                    + Add Category
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
              <AuraButton
                variant="ghost"
                onClick={() => setEditModalOpen(false)}
                className="text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                Cancel
              </AuraButton>
              <AuraButton variant="accent" onClick={handleEditSave}>
                Save Changes
              </AuraButton>
            </div>
          </div>
        </div>
      )}

      {/* Paystub History Gallery */}
      <DesignGallery
        title="Paystub History"
        fetchEndpoint="/paychecks"
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onLoad={(item: PaycheckData) => {
          // Load the selected paystub into view
          const exists = paycheckData.some(
            (p) =>
              p.payPeriodStart === item.payPeriodStart &&
              p.payPeriodEnd === item.payPeriodEnd,
          );
          if (!exists) {
            setPaycheckData((prev) => [item, ...prev]);
          }
          setIsGalleryOpen(false);
        }}
        emptyMessage="No paystubs found. Upload a PDF to get started."
        sortOptions={
          [
            {
              label: "Newest First",
              value: "date-desc",
              compareFn: (a: unknown, b: unknown) => {
                const aDate = new Date(
                  (a as PaycheckData).payPeriodStart || 0,
                ).getTime();
                const bDate = new Date(
                  (b as PaycheckData).payPeriodStart || 0,
                ).getTime();
                return bDate - aDate;
              },
            },
            {
              label: "Oldest First",
              value: "date-asc",
              compareFn: (a: unknown, b: unknown) => {
                const aDate = new Date(
                  (a as PaycheckData).payPeriodStart || 0,
                ).getTime();
                const bDate = new Date(
                  (b as PaycheckData).payPeriodStart || 0,
                ).getTime();
                return aDate - bDate;
              },
            },
          ] as SortOption[]
        }
        renderPreview={(item: PaycheckData) => (
          <div className="flex flex-col gap-6 h-full">
            <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
              <h3 className="text-lg font-semibold text-white mb-4">
                Pay Period
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-slate-400">Start</span>
                  <p className="text-white font-medium">
                    {new Date(item.payPeriodStart).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-slate-400">End</span>
                  <p className="text-white font-medium">
                    {new Date(item.payPeriodEnd).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 flex-1 overflow-y-auto">
              <h3 className="text-lg font-semibold text-white mb-4">
                Paid Hours
              </h3>
              <div className="space-y-2">
                {item.paidHours.map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center py-2 border-b border-slate-800 last:border-0"
                  >
                    <span className="text-slate-300">{entry.category}</span>
                    <span className="text-white font-mono">
                      {entry.hours.toFixed(2)} hrs
                    </span>
                  </div>
                ))}
                {item.paidHours.length === 0 && (
                  <p className="text-slate-500 text-sm">
                    No paid hours recorded
                  </p>
                )}
              </div>
            </div>

            {item.bankedHours && item.bankedHours.length > 0 && (
              <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Banked Hours
                </h3>
                <div className="space-y-2">
                  {item.bankedHours.map((entry, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center py-2 border-b border-slate-800 last:border-0"
                    >
                      <span className="text-slate-300">{entry.category}</span>
                      <span className="text-emerald-400 font-mono">
                        {entry.hours.toFixed(2)} hrs
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        renderItem={(item: PaycheckData) => (
          <div className="flex flex-col h-full bg-white border border-slate-200 rounded-lg overflow-hidden hover:border-blue-400 transition-colors cursor-pointer group">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Pay Period
                </span>
                <DocumentTextIcon className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-sm font-semibold text-slate-900">
                {new Date(item.payPeriodStart).toLocaleDateString()} -{" "}
                {new Date(item.payPeriodEnd).toLocaleDateString()}
              </p>
            </div>
            <div className="flex-1 p-4 bg-white">
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wide">
                    Paid Hours
                  </span>
                  <div className="mt-1 space-y-1">
                    {item.paidHours.slice(0, 3).map((entry, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-slate-600 truncate">
                          {entry.category}
                        </span>
                        <span className="text-slate-900 font-mono font-medium ml-2">
                          {entry.hours.toFixed(2)}
                        </span>
                      </div>
                    ))}
                    {item.paidHours.length > 3 && (
                      <p className="text-xs text-slate-400">
                        +{item.paidHours.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
                {item.bankedHours && item.bankedHours.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-xs text-emerald-600 uppercase tracking-wide font-medium">
                      Banked:{" "}
                      {item.bankedHours
                        .reduce((sum, e) => sum + e.hours, 0)
                        .toFixed(2)}{" "}
                      hrs
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      />
    </div>
  );
};

export default PaystubAnalyzerPage;
