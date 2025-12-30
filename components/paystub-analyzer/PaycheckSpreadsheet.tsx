import clsx from "clsx";
import React, { useState } from "react";
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
import { ChevronDownIcon } from "./icons/ChevronDownIcon";
import { FileTextIcon } from "./icons/FileTextIcon";
import { PencilIcon } from "./icons/PencilIcon";

interface PaycheckSpreadsheetProps {
  paycheckData: PaycheckData[];
  onHoursChange: (
    index: number,
    week: "week1" | "week2",
    hours: ReportedHourEntry[]
  ) => void;
  onEdit: (data: PaycheckData) => void;
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return "Invalid";
  const parseStr = /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
    ? dateStr + "T00:00:00"
    : dateStr;
  const date = new Date(parseStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
};

const getHoursForCategory = (
  entries: HourEntry[],
  category: string
): number => {
  const entry = entries.find(
    (e) => e.category.toLowerCase() === category.toLowerCase()
  );
  return entry ? entry.hours : 0;
};

const formatReportedHours = (
  entries: ReportedHourEntry[] | undefined
): string => {
  if (!entries || entries.length === 0) return "-";
  return entries.map((e) => `${e.code}: ${e.hours}`).join(", ");
};

const isCategoryExcluded = (category: string): boolean => {
  const codeEntry = getPayrollCode(category);
  return !!codeEntry?.excludeFromTotal;
};

export const PaycheckSpreadsheet: React.FC<PaycheckSpreadsheetProps> = ({
  paycheckData,
  onEdit,
}) => {
  const [collapsedSections, setCollapsedSections] = useState<
    Record<string, boolean>
  >({
    paid: false,
    other: false,
    banked: true,
  });

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Get all unique categories from data
  const allPaidCategoriesRaw: string[] = [
    ...new Set<string>(
      paycheckData.flatMap((d) => d.paidHours.map((p) => p.category))
    ),
  ];

  // Split into Paid and Other based on exclusion flag
  const paidCategories = allPaidCategoriesRaw
    .filter((cat) => !isCategoryExcluded(cat))
    .sort((a, b) => {
      const idxA = getCategorySortIndex(a);
      const idxB = getCategorySortIndex(b);
      if (idxA !== idxB) return idxA - idxB;
      return a.localeCompare(b);
    });

  const otherCategories = allPaidCategoriesRaw
    .filter((cat) => isCategoryExcluded(cat))
    .sort((a, b) => {
      const idxA = getCategorySortIndex(a);
      const idxB = getCategorySortIndex(b);
      if (idxA !== idxB) return idxA - idxB;
      return a.localeCompare(b);
    });

  const bankedCategories: string[] = [
    ...new Set<string>(
      paycheckData.flatMap((d) => d.bankedHours.map((b) => b.category))
    ),
  ].sort();

  return (
    <div className="bg-white/50 p-4 sm:p-6 rounded-xl shadow-lg border border-aura-text-primary/10 backdrop-blur-sm">
      <h2 className="text-xl font-semibold mb-4 text-aura-text-primary">
        Paystub History
      </h2>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="min-w-full divide-y divide-aura-text-primary/10 border-separate border-spacing-0">
          <thead className="bg-aura-text-primary/5">
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-10 bg-white/95 px-1 py-0.5 text-left text-[10px] font-medium text-aura-text-secondary uppercase tracking-wider border-b border-aura-text-primary/10"
              >
                Pay Period
              </th>
              <th className="sticky left-[100px] z-10 bg-white/95 px-1 py-0.5 text-center text-[10px] uppercase border-b border-aura-text-primary/10 w-[60px]">
                PDF
              </th>

              {/* Paid Hours Section Header */}
              <th
                scope="col"
                colSpan={
                  collapsedSections["paid"] ? 1 : paidCategories.length + 1
                }
                className="px-1 py-0.5 text-center text-[10px] font-bold text-aura-accent uppercase tracking-wider border-b border-l border-aura-text-primary/10 bg-aura-accent/10"
              >
                <button
                  onClick={() => toggleSection("paid")}
                  className="flex items-center justify-center gap-1 w-full hover:text-aura-accent/80"
                >
                  Paid Hours
                  <ChevronDownIcon
                    className={clsx(
                      "w-4 h-4 transition-transform",
                      collapsedSections["paid"] && "-rotate-90"
                    )}
                  />
                </button>
              </th>

              {/* Other Hours Section Header */}
              {otherCategories.length > 0 && (
                <th
                  scope="col"
                  colSpan={
                    collapsedSections["other"] ? 1 : otherCategories.length
                  }
                  className="px-1 py-0.5 text-center text-[10px] font-bold text-amber-600 uppercase tracking-wider border-b border-l border-aura-text-primary/10 bg-amber-500/10"
                >
                  <button
                    onClick={() => toggleSection("other")}
                    className="flex items-center justify-center gap-1 w-full hover:text-amber-300"
                  >
                    Other / Reimb
                    <ChevronDownIcon
                      className={clsx(
                        "w-4 h-4 transition-transform",
                        collapsedSections["other"] && "-rotate-90"
                      )}
                    />
                  </button>
                </th>
              )}

              {/* Banked Hours Section Header */}
              <th
                scope="col"
                colSpan={
                  collapsedSections["banked"] ? 1 : bankedCategories.length
                }
                className="px-1 py-0.5 text-center text-[10px] font-bold text-emerald-600 uppercase tracking-wider border-b border-l border-aura-text-primary/10 bg-emerald-500/10"
              >
                <button
                  onClick={() => toggleSection("banked")}
                  className="flex items-center justify-center gap-1 w-full hover:text-emerald-300"
                >
                  Banked Hours
                  <ChevronDownIcon
                    className={clsx(
                      "w-4 h-4 transition-transform",
                      collapsedSections["banked"] && "-rotate-90"
                    )}
                  />
                </button>
              </th>

              {/* Reported Section Header */}
              <th
                scope="col"
                colSpan={4}
                className="px-1 py-0.5 text-center text-[10px] font-bold text-aura-text-primary uppercase tracking-wider border-b border-l border-aura-text-primary/10 bg-aura-text-primary/5"
              >
                Reported & Discrepancy
              </th>
            </tr>
            <tr>
              <th className="sticky left-0 z-10 bg-white/95 border-b border-aura-text-primary/10"></th>

              {/* Paid Columns */}
              {!collapsedSections["paid"] &&
                paidCategories.map((cat) => (
                  <th
                    key={cat}
                    scope="col"
                    className="px-1 py-0.5 text-right text-[10px] font-medium text-aura-text-secondary uppercase tracking-wider border-b border-l border-aura-text-primary/10 min-w-[80px]"
                  >
                    {cat}
                  </th>
                ))}
              <th
                scope="col"
                className="px-1 py-0.5 text-right text-[10px] font-bold text-aura-text-primary uppercase tracking-wider border-b border-l border-aura-text-primary/10 bg-aura-text-primary/5 min-w-[80px]"
              >
                Total Paid
              </th>

              {/* Other Columns */}
              {!collapsedSections["other"] &&
                otherCategories.map((cat) => (
                  <th
                    key={cat}
                    scope="col"
                    className="px-1 py-0.5 text-right text-[10px] font-medium text-aura-text-secondary uppercase tracking-wider border-b border-l border-aura-text-primary/10 min-w-[80px]"
                  >
                    {cat}
                  </th>
                ))}
              {collapsedSections["other"] && otherCategories.length > 0 && (
                <th className="border-b border-l border-aura-text-primary/10"></th>
              )}

              {/* Banked Columns */}
              {!collapsedSections["banked"] &&
                bankedCategories.map((cat) => (
                  <th
                    key={cat}
                    scope="col"
                    className="px-1 py-0.5 text-right text-[10px] font-medium text-aura-text-secondary uppercase tracking-wider border-b border-l border-aura-text-primary/10 min-w-[80px]"
                  >
                    {cat}
                  </th>
                ))}
              {collapsedSections["banked"] && (
                <th className="border-b border-l border-aura-text-primary/10"></th>
              )}

              {/* Reported Columns */}
              <th
                scope="col"
                className="px-1 py-0.5 text-left text-[10px] font-medium text-aura-text-secondary uppercase tracking-wider border-b border-l border-aura-text-primary/10 min-w-[100px]"
              >
                Week 1
              </th>
              <th
                scope="col"
                className="px-1 py-0.5 text-left text-[10px] font-medium text-aura-text-secondary uppercase tracking-wider border-b border-aura-text-primary/10 min-w-[100px]"
              >
                Week 2
              </th>
              <th
                scope="col"
                className="px-1 py-0.5 text-right text-[10px] font-bold text-aura-text-primary uppercase tracking-wider border-b border-l border-aura-text-primary/10 bg-aura-text-primary/5 min-w-[80px]"
              >
                Total Rep
              </th>
              <th
                scope="col"
                className="px-1 py-0.5 text-right text-[10px] font-bold text-aura-text-primary uppercase tracking-wider border-b border-l border-aura-text-primary/10 bg-aura-text-primary/5 min-w-[80px]"
              >
                Diff
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-aura-text-primary/10">
            {paycheckData.map((data, index) => {
              // Calculate Total Paid (excluding Other/Reimb)
              const totalPaidHours = data.paidHours
                .filter((h) => !isCategoryExcluded(h.category))
                .reduce((sum, entry) => sum + entry.hours, 0);

              const allReportedEntries = [
                ...(data.userReportedHours?.week1 || []),
                ...(data.userReportedHours?.week2 || []),
              ];

              // Calculate Total Reported (excluding Other/Reimb)
              const totalUserHours = allReportedEntries
                .filter((entry) => {
                  const codeInfo = payrollCodeMap[entry.code];
                  return codeInfo?.paid && !codeInfo?.excludeFromTotal;
                })
                .reduce((sum, entry) => sum + entry.hours, 0);

              const discrepancy = totalPaidHours - totalUserHours;

              return (
                <tr
                  key={`${data.payPeriodStart}-${index}`}
                  className="hover:bg-aura-text-primary/5 transition-colors group"
                >
                  <td className="sticky left-0 z-10 bg-white group-hover:bg-gray-50 px-1 py-0.5 whitespace-nowrap text-xs font-medium text-aura-text-primary border-r border-aura-text-primary/10">
                    {formatDate(data.payPeriodStart)} -{" "}
                    {formatDate(data.payPeriodEnd)}
                  </td>
                  <td className="sticky left-[100px] z-10 bg-white group-hover:bg-gray-50 px-1 py-0.5 whitespace-nowrap text-center border-r border-aura-text-primary/10">
                    <div className="flex items-center justify-center gap-1">
                      {data.pdfUrl ? (
                        <a
                          href={data.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-aura-text-secondary hover:text-aura-accent"
                          title="View PDF"
                        >
                          <FileTextIcon className="w-4 h-4" />
                        </a>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                      <button
                        onClick={() => onEdit(data)}
                        className="text-aura-text-secondary hover:text-aura-accent ml-1"
                        title="Edit Hours"
                      >
                        <PencilIcon className="w-3 h-3" />
                      </button>
                    </div>
                  </td>

                  {/* Paid Cells */}
                  {!collapsedSections["paid"] &&
                    paidCategories.map((cat) => (
                      <td
                        key={cat}
                        className="px-1 py-0.5 whitespace-nowrap text-xs text-aura-text-secondary text-right font-mono border-l border-aura-text-primary/10"
                      >
                        {getHoursForCategory(data.paidHours, cat).toFixed(2)}
                      </td>
                    ))}
                  <td className="px-1 py-0.5 whitespace-nowrap text-xs font-bold text-aura-text-primary text-right border-l border-aura-text-primary/10 bg-aura-text-primary/5 font-mono">
                    {totalPaidHours.toFixed(2)}
                  </td>

                  {/* Other Cells */}
                  {!collapsedSections["other"] &&
                    otherCategories.map((cat) => (
                      <td
                        key={cat}
                        className="px-1 py-0.5 whitespace-nowrap text-xs text-amber-600/80 text-right font-mono border-l border-aura-text-primary/10"
                      >
                        {getHoursForCategory(data.paidHours, cat).toFixed(2)}
                      </td>
                    ))}
                  {collapsedSections["other"] && otherCategories.length > 0 && (
                    <td className="px-1 py-0.5 text-center text-xs text-aura-text-secondary border-l border-aura-text-primary/10">
                      ...
                    </td>
                  )}

                  {/* Banked Cells */}
                  {!collapsedSections["banked"] &&
                    bankedCategories.map((cat) => (
                      <td
                        key={cat}
                        className="px-1 py-0.5 whitespace-nowrap text-xs text-emerald-600/80 text-right border-l border-aura-text-primary/10 font-mono"
                      >
                        {getHoursForCategory(data.bankedHours, cat).toFixed(2)}
                      </td>
                    ))}
                  {collapsedSections["banked"] && (
                    <td className="px-1 py-0.5 text-center text-xs text-aura-text-secondary border-l border-aura-text-primary/10">
                      ...
                    </td>
                  )}

                  {/* Reported Cells */}
                  <td className="px-1 py-0.5 whitespace-nowrap border-l border-aura-text-primary/10 text-xs text-aura-text-secondary font-mono">
                    {formatReportedHours(data.userReportedHours?.week1)}
                  </td>
                  <td className="px-1 py-0.5 whitespace-nowrap text-xs text-aura-text-secondary font-mono">
                    {formatReportedHours(data.userReportedHours?.week2)}
                  </td>
                  <td className="px-1 py-0.5 whitespace-nowrap text-xs font-bold text-aura-text-primary text-right border-l border-aura-text-primary/10 bg-aura-text-primary/5 font-mono">
                    {totalUserHours.toFixed(2)}
                  </td>
                  <td
                    className={clsx(
                      "px-1 py-0.5 whitespace-nowrap text-xs font-bold text-right border-l border-aura-text-primary/10 bg-aura-text-primary/5 font-mono",
                      discrepancy !== 0 ? "text-red-500" : "text-emerald-500"
                    )}
                  >
                    {discrepancy.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
