import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useMemo, useState } from "react";
import {
  getCategorySortIndex,
  getPayrollCode,
  payrollCodeMap,
} from "../../utils/payrollCodes";
import {
  HourEntry,
  PaycheckData,
  ReportedHourEntry,
} from "../../types/paystubTypes";
import { ReportedHoursInput } from "./ReportedHoursInput";
import { BankIcon } from "./icons/BankIcon";
import { CalendarIcon } from "./icons/CalendarIcon";
import { ChevronDownIcon } from "./icons/ChevronDownIcon";
import { ClockIcon } from "./icons/ClockIcon";

interface PaycheckTableProps {
  paycheckData: PaycheckData[];
  onHoursChange: (
    index: number,
    week: "week1" | "week2",
    hours: ReportedHourEntry[]
  ) => void;
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// --- Sub-components ---

// --- Sub-components ---

const SectionHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  iconClassName?: string;
}> = ({ icon, title, subtitle, iconClassName }) => (
  <div className="flex items-center gap-2 mb-4">
    <div
      className={clsx(
        "p-1.5 rounded-lg",
        iconClassName || "bg-zinc-800 text-zinc-400"
      )}
    >
      {icon}
    </div>
    <div>
      <h4 className="font-semibold text-zinc-200 text-base leading-tight">
        {title}
      </h4>
      {subtitle && <p className="text-sm text-zinc-400">{subtitle}</p>}
    </div>
  </div>
);

const PaidHoursList: React.FC<{ data: HourEntry[] }> = ({ data }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
    {data.map((entry, idx) => (
      <div
        key={idx}
        className="flex justify-between items-center py-2 px-3 rounded-lg bg-zinc-900/30 border border-zinc-800/50"
      >
        <span className="text-base text-zinc-300 font-medium">
          {entry.category}
        </span>
        <span className="font-mono font-semibold text-zinc-200 text-base">
          {(entry.hours || 0).toFixed(2)}
        </span>
      </div>
    ))}
    {data.length === 0 && (
      <div className="text-zinc-500 text-sm italic py-2 col-span-full">
        No paid hours recorded
      </div>
    )}
  </div>
);

interface BankVerificationFlag {
  type: "warning" | "caution";
  message: string;
}

const BankedHoursList: React.FC<{
  data: HourEntry[];
  userReportedHours?: {
    week1?: ReportedHourEntry[];
    week2?: ReportedHourEntry[];
  };
  verificationFlags?: Record<string, BankVerificationFlag>;
}> = ({ data, userReportedHours, verificationFlags }) => {
  // Calculate projections
  const allReportedEntries = [
    ...(userReportedHours?.week1 || []),
    ...(userReportedHours?.week2 || []),
  ];
  const bankChanges: { [key: string]: number } = {};
  allReportedEntries.forEach((entry) => {
    const codeInfo = payrollCodeMap[entry.code];
    if (codeInfo && codeInfo.bankEffect) {
      const { category, multiplier } = codeInfo.bankEffect;
      const change = entry.hours * multiplier;
      bankChanges[category] = (bankChanges[category] || 0) + change;
    }
  });

  const getAbbreviation = (name: string) => {
    const abbreviations: Record<string, string> = {
      Vacation: "Vac",
      "Compensatory Time Off": "CTO",
      "Management Leave": "MGMT",
      "Public Health Emergency Leave": "PHE",
      "Floating Holiday": "FH",
      "Sick Leave": "Sick",
    };
    return abbreviations[name] || name;
  };

  const orderedCategories = [
    "Vacation",
    "Sick Leave",
    "Floating Holiday",
    "Public Health Emergency Leave",
    "Compensatory Time Off",
    "Management Leave",
  ];

  // Create a map of existing data for quick lookup, normalizing categories
  const dataMap = new Map();
  data.forEach((item) => {
    let category = item.category;
    // Normalize Sick Pay variations to Sick Leave
    if (category === "Sick Pay") category = "Sick Leave";
    dataMap.set(category, item);
  });

  // Create the display list ensuring all ordered categories are present
  const displayData = orderedCategories.map((category) => {
    return dataMap.get(category) || { category, hours: 0, current: 0, ytd: 0 };
  });

  // Add any other categories that might exist in data but not in the ordered list
  data.forEach((item) => {
    let category = item.category;
    if (category === "Sick Pay") category = "Sick Leave";

    if (!orderedCategories.includes(category)) {
      displayData.push(item);
    }
  });

  return (
    <div className="flex flex-wrap gap-3">
      {displayData.map((entry, idx) => {
        const change = bankChanges[entry.category] || 0;
        const flag = verificationFlags?.[entry.category];

        return (
          <div
            key={idx}
            className={clsx(
              "flex-1 min-w-[140px] flex flex-col justify-between py-2 px-3 rounded-lg border transition-colors",
              flag?.type === "warning"
                ? "bg-red-500/10 border-red-500/30"
                : flag?.type === "caution"
                  ? "bg-amber-500/10 border-amber-500/30"
                  : "bg-zinc-900/30 border-zinc-800/50"
            )}
          >
            <div className="flex justify-between items-center gap-3">
              <div className="flex items-center gap-1.5 min-w-0">
                {flag && (
                  <div
                    className={clsx(
                      "flex-shrink-0 w-1.5 h-1.5 rounded-full",
                      flag.type === "warning" ? "bg-red-500" : "bg-amber-500"
                    )}
                    title={flag.message}
                  />
                )}
                <span
                  className="text-sm text-zinc-400 font-medium truncate cursor-help decoration-dotted underline decoration-zinc-600 underline-offset-2"
                  title={
                    flag
                      ? `${entry.category}\n⚠️ ${flag.message}`
                      : entry.category
                  }
                >
                  {getAbbreviation(entry.category)}
                </span>
              </div>
              <span className="font-mono font-semibold text-zinc-200">
                {(entry.hours || 0).toFixed(2)}
              </span>
            </div>
            {change !== 0 && (
              <div className="flex justify-end items-center gap-1 text-[10px] border-t border-zinc-800/50 pt-1 mt-1">
                <span className="text-zinc-600">Proj:</span>
                <span
                  className={clsx(
                    "font-mono font-medium",
                    change > 0 ? "text-emerald-400" : "text-amber-400"
                  )}
                >
                  {change > 0 ? "+" : ""}
                  {change.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const DiscrepancyBar: React.FC<{
  paidHours: HourEntry[];
  userReportedHours?: {
    week1?: ReportedHourEntry[];
    week2?: ReportedHourEntry[];
  };
}> = ({ paidHours, userReportedHours }) => {
  const allReportedEntries = [
    ...(userReportedHours?.week1 || []),
    ...(userReportedHours?.week2 || []),
  ];

  // Calculate totals
  const totalPaid = paidHours
    .filter((p) => !getPayrollCode(p.category)?.excludeFromTotal)
    .reduce((sum, p) => sum + p.hours, 0);

  const reportedHoursByCategory: { [key: string]: number } = {};
  allReportedEntries.forEach((entry) => {
    const codeInfo = payrollCodeMap[entry.code];
    if (codeInfo && codeInfo.paid) {
      const matchedCategory = paidHours.find((ph) =>
        codeInfo.paidCategoryMatch.includes(ph.category.toLowerCase())
      );
      const categoryKey = matchedCategory
        ? matchedCategory.category
        : codeInfo.paidCategoryMatch[0];
      reportedHoursByCategory[categoryKey] =
        (reportedHoursByCategory[categoryKey] || 0) + entry.hours;
    }
  });

  const totalReported = Object.entries(reportedHoursByCategory)
    .filter(([category]) => !getPayrollCode(category)?.excludeFromTotal)
    .reduce((sum, [, h]) => sum + h, 0);

  const diff = totalPaid - totalReported;
  const isBalanced = Math.abs(diff) < 0.01;

  if (allReportedEntries.length === 0) return null;

  return (
    <div
      className={clsx(
        "mt-6 p-4 rounded-xl border flex items-center justify-between transition-colors",
        isBalanced
          ? "bg-emerald-500/10 border-emerald-500/20"
          : "bg-amber-500/10 border-amber-500/20"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={clsx(
            "w-2 h-2 rounded-full",
            isBalanced ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
          )}
        />
        <span
          className={clsx(
            "font-medium text-sm",
            isBalanced ? "text-emerald-200" : "text-amber-200"
          )}
        >
          {isBalanced ? "Hours Balanced" : "Discrepancy Detected"}
        </span>
      </div>

      <div className="flex items-center gap-6 text-sm">
        <div className="flex flex-col items-end">
          <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
            Paid
          </span>
          <span className="font-mono text-zinc-300">
            {totalPaid.toFixed(2)}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
            Reported
          </span>
          <span className="font-mono text-zinc-300">
            {totalReported.toFixed(2)}
          </span>
        </div>
        <div className="w-px h-8 bg-white/10 mx-2" />
        <div className="flex flex-col items-end">
          <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
            Diff
          </span>
          <span
            className={clsx(
              "font-mono font-bold",
              isBalanced ? "text-emerald-400" : "text-amber-400"
            )}
          >
            {diff > 0 ? "+" : ""}
            {diff.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---

type GroupedPaychecks = {
  [year: string]: {
    [month: string]: {
      data: PaycheckData;
      originalIndex: number;
      verificationFlags: Record<string, BankVerificationFlag>;
    }[];
  };
};

export const PaycheckTable: React.FC<PaycheckTableProps> = ({
  paycheckData,
  onHoursChange,
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {}
  );

  const groupedData = useMemo(() => {
    // Sort data chronologically (oldest first) to calculate changes
    const sortedData = [...paycheckData].sort(
      (a, b) =>
        new Date(a.payPeriodStart).getTime() -
        new Date(b.payPeriodStart).getTime()
    );

    const groups: GroupedPaychecks = {};

    sortedData.forEach((data, index) => {
      // Find original index in the prop array
      const originalIndex = paycheckData.indexOf(data);

      // Calculate verification flags
      const verificationFlags: Record<string, BankVerificationFlag> = {};
      const previousData = index > 0 ? sortedData[index - 1] : null;

      if (previousData) {
        const categoriesToCheck = [
          "Vacation",
          "Sick Leave",
          "Floating Holiday",
          "Compensatory Time Off",
          "Management Leave",
        ];

        categoriesToCheck.forEach((category) => {
          // Helper to find hours with normalization
          const findHours = (pData: PaycheckData, cat: string) => {
            const entry = pData.bankedHours.find((h) => {
              const hCat =
                h.category === "Sick Pay" ? "Sick Leave" : h.category;
              return hCat === cat;
            });
            return entry?.hours || 0;
          };

          const currentHours = findHours(data, category);
          const previousHours = findHours(previousData, category);
          const bankChange = currentHours - previousHours;

          // Get reported usage from current AND previous paystub (to account for timing)
          const getReportedForCategory = (pData: PaycheckData) => {
            const entries = [
              ...(pData.userReportedHours?.week1 || []),
              ...(pData.userReportedHours?.week2 || []),
            ];
            return entries
              .filter((e) => {
                const codeInfo = payrollCodeMap[e.code];
                // Check if the code's bank effect category matches our target category
                // Note: payrollCodes.ts now uses "Sick Leave" as the category for SLP
                return (
                  codeInfo?.bankEffect?.category === category &&
                  codeInfo.bankEffect.multiplier < 0
                );
              })
              .reduce((sum, e) => sum + e.hours, 0);
          };

          const reportedUsageCurrent = getReportedForCategory(data);
          const reportedUsagePrevious = getReportedForCategory(previousData);
          const totalRecentUsage = reportedUsageCurrent + reportedUsagePrevious;

          // Logic:
          // 1. Unexplained Drop: Bank dropped significantly (> 0.5), but no recent usage reported.
          if (bankChange < -0.5 && totalRecentUsage === 0) {
            verificationFlags[category] = {
              type: "warning",
              message: `Bank dropped ${Math.abs(bankChange).toFixed(2)} hrs, but no usage reported recently.`,
            };
          }
          // 2. Missing Deduction: User reported usage, but bank didn't drop (or increased).
          // Note: This is "Caution" because accruals might mask the drop.
          else if (totalRecentUsage > 0 && bankChange >= 0) {
            verificationFlags[category] = {
              type: "caution",
              message: `Reported usage of ${totalRecentUsage.toFixed(2)} hrs, but bank balance didn't decrease (could be due to accruals).`,
            };
          }
        });
      }

      const date = new Date(data.payPeriodStart + "T00:00:00");
      const year = date.getFullYear().toString();
      const month = date.toLocaleString("default", { month: "long" });
      if (!groups[year]) groups[year] = {};
      if (!groups[year][month]) groups[year][month] = [];
      groups[year][month].push({ data, originalIndex, verificationFlags });
    });

    // Reverse the arrays within groups so newest is first for display
    Object.keys(groups).forEach((year) => {
      Object.keys(groups[year]).forEach((month) => {
        groups[year][month].reverse();
      });
    });

    return groups;
  }, [paycheckData]);

  useEffect(() => {
    // Set default expanded state for the most recent month
    const years = Object.keys(groupedData).sort().reverse();
    if (years.length > 0) {
      const latestYear = years[0];
      const months = Object.keys(groupedData[latestYear]).sort(
        (a, b) =>
          new Date(`1 ${b} 2000`).getTime() - new Date(`1 ${a} 2000`).getTime()
      );
      if (months.length > 0) {
        const latestMonth = months[0];
        const monthKey = `${latestYear}-${latestMonth}`;
        setExpandedGroups((prev) => {
          if (prev[latestYear] === undefined && prev[monthKey] === undefined) {
            return { ...prev, [latestYear]: true, [monthKey]: true };
          }
          return prev;
        });
      }
    }
  }, [groupedData]);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const years = Object.keys(groupedData).sort().reverse();

  return (
    <div className="space-y-8">
      {years.map((year) => {
        const yearKey = year;
        const isYearExpanded = expandedGroups[yearKey];
        const months = Object.keys(groupedData[year]).sort(
          (a, b) =>
            new Date(`1 ${b} 2000`).getTime() -
            new Date(`1 ${a} 2000`).getTime()
        );

        return (
          <div key={yearKey} className="space-y-4">
            <button
              onClick={() => toggleGroup(yearKey)}
              className="flex items-center gap-3 text-zinc-400 hover:text-zinc-200 transition-colors group"
            >
              <h3 className="text-2xl font-bold tracking-tight text-white">
                {year}
              </h3>
              <div className="h-px flex-1 bg-zinc-800 group-hover:bg-zinc-700 transition-colors" />
              <ChevronDownIcon
                className={clsx(
                  "w-5 h-5 transition-transform duration-200",
                  isYearExpanded && "rotate-180"
                )}
              />
            </button>

            <AnimatePresence>
              {isYearExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-8 pl-0 md:pl-4">
                    {months.map((month) => {
                      const monthKey = `${year}-${month}`;
                      const isMonthExpanded = expandedGroups[monthKey];

                      return (
                        <div key={monthKey} className="space-y-4">
                          <button
                            onClick={() => toggleGroup(monthKey)}
                            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors w-full group"
                          >
                            <div
                              className={clsx(
                                "w-1.5 h-1.5 rounded-full bg-indigo-500 transition-opacity",
                                isMonthExpanded ? "opacity-100" : "opacity-50"
                              )}
                            />
                            <h4 className="font-semibold text-lg">{month}</h4>
                            <ChevronDownIcon
                              className={clsx(
                                "w-4 h-4 ml-1 transition-transform duration-200",
                                isMonthExpanded && "rotate-180"
                              )}
                            />
                          </button>

                          <AnimatePresence>
                            {isMonthExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="grid grid-cols-1 gap-6">
                                  {groupedData[year][month].map(
                                    ({
                                      data,
                                      originalIndex,
                                      verificationFlags,
                                    }) => (
                                      <div
                                        key={`${data.payPeriodStart}-${originalIndex}`}
                                        className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl shadow-black/20"
                                      >
                                        {/* Card Header */}
                                        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                          <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                                              <CalendarIcon className="w-5 h-5" />
                                            </div>
                                            <div>
                                              <p className="text-sm text-zinc-400 font-medium uppercase tracking-wider">
                                                Pay Period
                                              </p>
                                              <p className="text-zinc-100 font-semibold text-lg">
                                                {formatDate(
                                                  data.payPeriodStart
                                                )}{" "}
                                                <span className="text-zinc-500 mx-1">
                                                  —
                                                </span>{" "}
                                                {formatDate(data.payPeriodEnd)}
                                              </p>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium border border-emerald-500/20">
                                              Analyzed
                                            </span>
                                          </div>
                                        </div>

                                        {/* Card Body - Two Column Layout */}
                                        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:divide-x lg:divide-zinc-800">
                                          {/* Left Column: Source Data */}
                                          <div className="space-y-6">
                                            <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4">
                                              <SectionHeader
                                                icon={
                                                  <ClockIcon className="w-4 h-4" />
                                                }
                                                title="Paid Hours"
                                                subtitle="Extracted from paystub"
                                                iconClassName="bg-indigo-500/10 text-indigo-400"
                                              />
                                              <PaidHoursList
                                                data={[...data.paidHours].sort(
                                                  (a, b) =>
                                                    getCategorySortIndex(
                                                      a.category
                                                    ) -
                                                    getCategorySortIndex(
                                                      b.category
                                                    )
                                                )}
                                              />
                                            </div>
                                          </div>

                                          {/* Right Column: User Input */}
                                          <div className="lg:pl-8 space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-500/5 border border-zinc-500/10 rounded-xl p-4">
                                              <div>
                                                <h5 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                                                  Week 1
                                                </h5>
                                                <ReportedHoursInput
                                                  entries={
                                                    data.userReportedHours
                                                      ?.week1 || []
                                                  }
                                                  onChange={(entries) =>
                                                    onHoursChange(
                                                      originalIndex,
                                                      "week1",
                                                      entries
                                                    )
                                                  }
                                                />
                                              </div>
                                              <div>
                                                <h5 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                                                  Week 2
                                                </h5>
                                                <ReportedHoursInput
                                                  entries={
                                                    data.userReportedHours
                                                      ?.week2 || []
                                                  }
                                                  onChange={(entries) =>
                                                    onHoursChange(
                                                      originalIndex,
                                                      "week2",
                                                      entries
                                                    )
                                                  }
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Footer: Discrepancy Bar */}
                                        <div className="px-6 pb-6 space-y-6">
                                          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
                                            <SectionHeader
                                              icon={
                                                <BankIcon className="w-4 h-4" />
                                              }
                                              title="Banked Hours"
                                              subtitle="Available balance"
                                              iconClassName="bg-emerald-500/10 text-emerald-400"
                                            />
                                            <BankedHoursList
                                              data={data.bankedHours}
                                              userReportedHours={
                                                data.userReportedHours
                                              }
                                              verificationFlags={
                                                verificationFlags
                                              }
                                            />
                                          </div>
                                          <DiscrepancyBar
                                            paidHours={data.paidHours}
                                            userReportedHours={
                                              data.userReportedHours
                                            }
                                          />
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};
