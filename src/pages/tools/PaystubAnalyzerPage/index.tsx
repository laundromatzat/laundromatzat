import { AnimatePresence, motion } from "framer-motion";
import React, { useCallback, useEffect, useState } from "react";
import { ConfirmationModal } from "./components/ConfirmationModal";
import { EditPaystubModal } from "./components/EditPaystubModal";
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
import { AuraButton } from "@/components/aura";
import { DesignGallery, SortOption } from "@/components/DesignGallery";
import { ClockIcon as HistoryIcon } from "@heroicons/react/24/outline";

import { useAuth } from "@/context/AuthContext";
import { useLoading } from "@/context/LoadingContext";
import {
  analyzePaycheckPdf,
  fetchPaychecks,
  setAuthToken,
} from "@/services/paystubApiService";
import { HourEntry, PaycheckData, ReportedHourEntry } from "./types/paystubTypes";

type ViewMode = "card" | "spreadsheet";

const UNMATCHED_HOURS_KEY = "paystub_unmatched_hours";
const UNMATCHED_DAILY_KEY = "paystub_unmatched_daily_details";

export type DailyHoursMap = { [date: string]: ReportedHourEntry[] };
export type WeeklyDailyDetails = { [weekStartDate: string]: DailyHoursMap };

const normalizeDate = (dateStr: string): string => {
  if (!dateStr) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
    const [m, d, y] = dateStr.split("/");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? dateStr : d.toISOString().split("T")[0];
};

// ── Stats helpers ─────────────────────────────────────────────────────────────

function calcYTDOT(paychecks: PaycheckData[]): number {
  const year = new Date().getFullYear();
  let total = 0;
  paychecks.forEach((p) => {
    if (!p.payPeriodStart?.startsWith(String(year))) return;
    const all = [...(p.userReportedHours?.week1 ?? []), ...(p.userReportedHours?.week2 ?? [])];
    all.forEach((e) => {
      if (e.code === "OST" || e.code === "CTE") total += e.hours;
    });
  });
  return total;
}

// ── Page ──────────────────────────────────────────────────────────────────────

const PaystubAnalyzerPage: React.FC = () => {
  const [paycheckData, setPaycheckData] = useState<PaycheckData[]>([]);
  const [unmatchedReportedHours, setUnmatchedReportedHours] = useState<{
    [weekStartDate: string]: ReportedHourEntry[];
  }>(() => {
    try {
      const s = localStorage.getItem(UNMATCHED_HOURS_KEY);
      return s ? JSON.parse(s) : {};
    } catch {
      return {};
    }
  });
  const [unmatchedDailyDetails, setUnmatchedDailyDetails] = useState<WeeklyDailyDetails>(() => {
    try {
      const s = localStorage.getItem(UNMATCHED_DAILY_KEY);
      return s ? JSON.parse(s) : {};
    } catch {
      return {};
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("card");

  const [showFutureHours, setShowFutureHours] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const [editData, setEditData] = useState<PaycheckData | null>(null);

  const { token } = useAuth();
  const { setIsLoading: setGlobalLoading } = useLoading();

  // Sync auth token
  useEffect(() => { setAuthToken(token); }, [token]);

  // Persist unmatched hours
  useEffect(() => {
    try { localStorage.setItem(UNMATCHED_HOURS_KEY, JSON.stringify(unmatchedReportedHours)); } catch {}
  }, [unmatchedReportedHours]);

  useEffect(() => {
    try { localStorage.setItem(UNMATCHED_DAILY_KEY, JSON.stringify(unmatchedDailyDetails)); } catch {}
  }, [unmatchedDailyDetails]);

  // Load from server
  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      setPaycheckData(await fetchPaychecks());
    } catch {
      setError("Failed to load data. Please check connection.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleAnalysisComplete = useCallback(
    (data: PaycheckData) => {
      const fmtKey = (d: Date) => d.toISOString().split("T")[0];
      const w1start = new Date(data.payPeriodStart + "T00:00:00");
      const w2start = new Date(w1start);
      w2start.setDate(w1start.getDate() + 7);
      const w1key = fmtKey(w1start);
      const w2key = fmtKey(w2start);

      const newUnmatched = { ...unmatchedReportedHours };
      const userReportedHours: { week1: ReportedHourEntry[]; week2: ReportedHourEntry[] } = {
        week1: [],
        week2: [],
      };

      if (newUnmatched[w1key]) { userReportedHours.week1 = newUnmatched[w1key]; delete newUnmatched[w1key]; }
      if (newUnmatched[w2key]) { userReportedHours.week2 = newUnmatched[w2key]; delete newUnmatched[w2key]; }

      if (userReportedHours.week1.length || userReportedHours.week2.length) {
        setUnmatchedReportedHours(newUnmatched);
      }

      const finalData = { ...data, userReportedHours };

      setPaycheckData((prev) => {
        const idx = prev.findIndex(
          (p) => p.payPeriodStart === finalData.payPeriodStart && p.payPeriodEnd === finalData.payPeriodEnd,
        );
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = {
            ...finalData,
            userReportedHours:
              finalData.userReportedHours.week1.length || finalData.userReportedHours.week2.length
                ? finalData.userReportedHours
                : prev[idx].userReportedHours,
          };
          return next.sort((a, b) => new Date(b.payPeriodStart).getTime() - new Date(a.payPeriodStart).getTime());
        }
        return [...prev, finalData].sort(
          (a, b) => new Date(b.payPeriodStart).getTime() - new Date(a.payPeriodStart).getTime(),
        );
      });
    },
    [unmatchedReportedHours],
  );

  const handleFileProcess = async (files: FileList) => {
    setIsLoading(true);
    setGlobalLoading(true);
    setError(null);
    const errors: string[] = [];

    for (const file of Array.from(files)) {
      try {
        const data = await analyzePaycheckPdf(file);
        handleAnalysisComplete({
          ...data,
          payPeriodStart: normalizeDate(data.payPeriodStart),
          payPeriodEnd: normalizeDate(data.payPeriodEnd),
          pdfUrl: URL.createObjectURL(file),
          paidHours: data.paidHours || (data as unknown as { hoursPaid: typeof data.paidHours }).hoursPaid || [],
          bankedHours: data.bankedHours || [],
        });
      } catch (e) {
        errors.push(`- ${file.name}: ${e instanceof Error ? e.message : "Unknown error"}`);
      }
    }

    if (errors.length) {
      const successes = files.length - errors.length;
      setError(`Completed with ${errors.length} error(s) (${successes}/${files.length} succeeded).\n\n${errors.join("\n")}`);
    }
    setIsLoading(false);
    setGlobalLoading(false);
  };

  const handleHoursChange = async (index: number, week: "week1" | "week2", entries: ReportedHourEntry[]) => {
    const updated = [...paycheckData];
    const cur = { ...updated[index] };
    cur.userReportedHours = { ...(cur.userReportedHours ?? { week1: [], week2: [] }), [week]: entries };
    updated[index] = cur;
    setPaycheckData(updated);

    try {
      const { updatePaycheckReportedHours } = await import("@/services/paystubApiService");
      if (cur.id) await updatePaycheckReportedHours(cur.id, cur.userReportedHours);
    } catch (err) {
      console.error("Failed to persist reported hours:", err);
    }
  };

  const handleFutureHoursChange = useCallback(
    (weekStartDate: string, entries: ReportedHourEntry[], dailyDetails?: DailyHoursMap) => {
      setUnmatchedReportedHours((prev) => ({ ...prev, [weekStartDate]: entries }));
      if (dailyDetails) {
        setUnmatchedDailyDetails((prev) => ({ ...prev, [weekStartDate]: dailyDetails }));
      }
    },
    [],
  );

  const handleAddFutureWeek = useCallback(
    (weekStartDate: string) => {
      if (!unmatchedReportedHours[weekStartDate]) {
        setUnmatchedReportedHours((prev) => ({ ...prev, [weekStartDate]: [] }));
        setUnmatchedDailyDetails((prev) => ({ ...prev, [weekStartDate]: {} }));
      }
    },
    [unmatchedReportedHours],
  );

  const handleRemoveFutureWeek = useCallback((weekStartDate: string) => {
    setUnmatchedReportedHours((prev) => { const n = { ...prev }; delete n[weekStartDate]; return n; });
    setUnmatchedDailyDetails((prev) => { const n = { ...prev }; delete n[weekStartDate]; return n; });
  }, []);

  // ── Stats ────────────────────────────────────────────────────────────────────

  const latestPeriod = paycheckData[0];
  const ytdOT = calcYTDOT(paycheckData);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="bg-aura-bg min-h-screen text-base text-aura-text-primary selection:bg-aura-accent/30 p-4 sm:p-6 lg:p-8">
      {/* Background grid */}
      <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-40 pointer-events-none" />

      <main className="relative container mx-auto max-w-7xl">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-aura-accent/10 rounded-xl border border-aura-accent/20">
              <DocumentTextIcon className="w-7 h-7 text-aura-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-aura-text-primary">
                Paystub Analyzer <span className="text-aura-accent">Pro</span>
              </h1>
              <p className="text-sm text-aura-text-secondary">Intelligent Payroll Tracking</p>
            </div>
          </div>

          <button
            onClick={() => setIsGalleryOpen(true)}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 text-sm bg-white hover:bg-aura-surface text-aura-text-secondary hover:text-aura-text-primary rounded-full shadow-sm hover:shadow-md transition-all"
          >
            <HistoryIcon className="w-4 h-4" />
            History
          </button>
        </motion.header>

        {/* ── Stats bar ─────────────────────────────────────────────────── */}
        {paycheckData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center gap-x-6 gap-y-1 mb-6 px-4 py-2.5 bg-white/60 backdrop-blur-sm rounded-xl border border-aura-text-primary/10 text-sm"
          >
            <span className="text-aura-text-secondary">
              <strong className="text-aura-text-primary font-semibold">{paycheckData.length}</strong> paystubs
            </span>
            {latestPeriod && (
              <span className="text-aura-text-secondary">
                Latest:{" "}
                <strong className="text-aura-text-primary font-semibold">
                  {new Date(latestPeriod.payPeriodStart + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  {" – "}
                  {new Date(latestPeriod.payPeriodEnd + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </strong>
              </span>
            )}
            {ytdOT > 0 && (
              <span className="flex items-center gap-1 text-amber-600 font-semibold">
                <span>⚡</span>
                {ytdOT.toFixed(ytdOT % 1 === 0 ? 0 : 2)} hrs YTD OT
              </span>
            )}
          </motion.div>
        )}

        {/* ── Error banner ─────────────────────────────────────────────── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <div className="relative bg-red-500/10 p-4 rounded-xl border border-red-500/20 text-red-200">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  Processing Error
                </h3>
                <pre className="whitespace-pre-wrap text-xs mt-2 font-mono bg-black/20 p-3 rounded-lg">
                  {error}
                </pre>
                <button
                  onClick={() => setError(null)}
                  className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/10 text-red-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Loading skeletons ────────────────────────────────────────── */}
        {isLoading && paycheckData.length === 0 && (
          <div className="space-y-3">
            <Skeleton className="h-9 w-48 rounded-lg ml-auto" />
            <div className="bg-white/50 rounded-2xl border border-aura-text-primary/10 overflow-hidden">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-4 grid grid-cols-6 gap-4 border-b border-aura-text-primary/5 last:border-0">
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

        {/* ── Empty state ──────────────────────────────────────────────── */}
        {paycheckData.length === 0 && Object.keys(unmatchedReportedHours).length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 px-6 rounded-3xl border border-aura-text-primary/10 bg-white/60 backdrop-blur-sm"
          >
            <div className="w-16 h-16 mx-auto bg-white rounded-2xl flex items-center justify-center mb-5 ring-1 ring-aura-text-primary/10 shadow-sm">
              <DocumentTextIcon className="h-8 w-8 text-aura-accent" />
            </div>
            <h3 className="text-xl font-semibold text-aura-text-primary mb-2">No paystubs yet</h3>
            <p className="text-aura-text-secondary max-w-sm mx-auto mb-8 text-sm">
              Upload your PDF paystubs to extract hours, track earnings, and verify accuracy.
            </p>
            {/* Inline file upload in empty state */}
            <div className="max-w-xs mx-auto">
              <FileUpload onFileProcess={handleFileProcess} isLoading={isLoading} />
            </div>
          </motion.div>
        )}

        {/* ── Loaded data ──────────────────────────────────────────────── */}
        {paycheckData.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* View toggle */}
            <div className="flex justify-end mb-5">
              <div className="inline-flex items-center bg-white/60 p-1 rounded-lg border border-aura-text-primary/10 gap-0.5">
                <AuraButton
                  size="sm"
                  variant={viewMode === "card" ? "accent" : "ghost"}
                  onClick={() => setViewMode("card")}
                  icon={<ViewListIcon className="w-4 h-4" />}
                >
                  Cards
                </AuraButton>
                <AuraButton
                  size="sm"
                  variant={viewMode === "spreadsheet" ? "accent" : "ghost"}
                  onClick={() => setViewMode("spreadsheet")}
                  icon={<ViewGridIcon className="w-4 h-4" />}
                >
                  Table
                </AuraButton>
              </div>
            </div>

            {viewMode === "card" ? (
              <PaycheckTable
                paycheckData={paycheckData}
                onHoursChange={handleHoursChange}
                onEdit={(p) => setEditData({ ...p })}
              />
            ) : (
              <PaycheckSpreadsheet
                paycheckData={paycheckData}
                onHoursChange={handleHoursChange}
                onEdit={(p) => setEditData({ ...p })}
              />
            )}
          </motion.div>
        )}
      </main>

      {/* ── Floating action bar ──────────────────────────────────────────── */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 p-2 bg-white/90 backdrop-blur-xl border border-aura-text-primary/10 rounded-2xl shadow-2xl shadow-black/10"
      >
        <FileUpload onFileProcess={handleFileProcess} isLoading={isLoading} />

        <div className="w-px h-7 bg-aura-text-primary/10" />

        <button
          onClick={() => setShowFutureHours(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-aura-accent hover:bg-aura-accent/90 text-white rounded-xl font-semibold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg shadow-aura-accent/25"
        >
          <ClockIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Manage Hours</span>
        </button>

        <div className="w-px h-7 bg-aura-text-primary/10" />

        <button
          onClick={() => setShowClearConfirm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-semibold text-sm transition-all hover:scale-105 active:scale-95 border border-red-500/20"
          title="Clear All Data"
        >
          <TrashIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Clear</span>
        </button>
      </motion.div>

      {/* ── Modals ───────────────────────────────────────────────────────── */}

      <ConfirmationModal
        isOpen={showClearConfirm}
        title="Clear All Data?"
        message="Delete all uploaded paystubs and reported hours? This cannot be undone."
        isDestructive
        onCancel={() => setShowClearConfirm(false)}
        onConfirm={async () => {
          try {
            const { clearAllData } = await import("@/services/paystubApiService");
            await clearAllData();
            setPaycheckData([]);
            setUnmatchedReportedHours({});
            setUnmatchedDailyDetails({});
          } catch {
            setError("Failed to clear data.");
          } finally {
            setShowClearConfirm(false);
          }
        }}
      />

      {showFutureHours && (
        <FutureHoursManager
          unmatchedHours={unmatchedReportedHours}
          unmatchedDailyDetails={unmatchedDailyDetails}
          onAddWeek={handleAddFutureWeek}
          onRemoveWeek={handleRemoveFutureWeek}
          onHoursChange={handleFutureHoursChange}
          onClose={() => setShowFutureHours(false)}
        />
      )}

      {editData && (
        <EditPaystubModal
          data={editData}
          onChange={setEditData}
          onSave={() => {
            setPaycheckData((prev) =>
              prev.map((p) =>
                p.payPeriodStart === editData.payPeriodStart && p.payPeriodEnd === editData.payPeriodEnd
                  ? editData
                  : p,
              ),
            );
            setEditData(null);
          }}
          onClose={() => setEditData(null)}
        />
      )}

      {/* ── History gallery ─────────────────────────────────────────────── */}
      <DesignGallery<PaycheckData & { id: string | number }>
        title="Paystub History"
        fetchEndpoint="/paychecks"
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onLoad={(item) => {
          const exists = paycheckData.some(
            (p) => p.payPeriodStart === item.payPeriodStart && p.payPeriodEnd === item.payPeriodEnd,
          );
          if (!exists) setPaycheckData((prev) => [item, ...prev]);
          setIsGalleryOpen(false);
        }}
        emptyMessage="No paystubs found. Upload a PDF to get started."
        sortOptions={
          [
            {
              label: "Newest First",
              value: "date-desc",
              compareFn: (a: unknown, b: unknown) =>
                new Date((b as PaycheckData).payPeriodStart || 0).getTime() -
                new Date((a as PaycheckData).payPeriodStart || 0).getTime(),
            },
            {
              label: "Oldest First",
              value: "date-asc",
              compareFn: (a: unknown, b: unknown) =>
                new Date((a as PaycheckData).payPeriodStart || 0).getTime() -
                new Date((b as PaycheckData).payPeriodStart || 0).getTime(),
            },
          ] as SortOption[]
        }
        renderPreview={(item) => (
          <div className="flex flex-col gap-4 h-full">
            <div className="bg-slate-900 rounded-xl p-5 border border-slate-800">
              <h3 className="text-base font-semibold text-white mb-3">Pay Period</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-slate-400">Start</span>
                  <p className="text-white font-medium text-sm">
                    {new Date(item.payPeriodStart).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">End</span>
                  <p className="text-white font-medium text-sm">
                    {new Date(item.payPeriodEnd).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 flex-1 overflow-y-auto">
              <h3 className="text-base font-semibold text-white mb-3">Paid Hours</h3>
              <div className="space-y-1.5">
                {item.paidHours.map((e: HourEntry, i: number) => (
                  <div key={i} className="flex justify-between py-1.5 border-b border-slate-800 last:border-0">
                    <span className="text-slate-300 text-sm">{e.category}</span>
                    <span className="text-white font-mono text-sm">{e.hours.toFixed(2)} hrs</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        renderItem={(item) => (
          <div className="flex flex-col h-full bg-white border border-slate-200 rounded-lg overflow-hidden hover:border-blue-400 transition-colors cursor-pointer">
            <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pay Period</span>
                <DocumentTextIcon className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <p className="text-xs font-semibold text-slate-900">
                {new Date(item.payPeriodStart).toLocaleDateString()} – {new Date(item.payPeriodEnd).toLocaleDateString()}
              </p>
            </div>
            <div className="flex-1 p-3 space-y-1">
              {item.paidHours.slice(0, 3).map((e: HourEntry, i: number) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-slate-500 truncate">{e.category}</span>
                  <span className="text-slate-800 font-mono font-semibold ml-1">{e.hours.toFixed(2)}</span>
                </div>
              ))}
              {item.paidHours.length > 3 && (
                <p className="text-[10px] text-slate-400">+{item.paidHours.length - 3} more</p>
              )}
            </div>
          </div>
        )}
      />
    </div>
  );
};

export default PaystubAnalyzerPage;
