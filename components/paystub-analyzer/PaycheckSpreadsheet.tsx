import clsx from 'clsx';
import React, { useState } from 'react';
import { getCategorySortIndex, getPayrollCode, payrollCodeMap } from '../../utils/payrollCodes';
import { HourEntry, PaycheckData, ReportedHourEntry } from '../../types/paystubTypes';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

interface PaycheckSpreadsheetProps {
  paycheckData: PaycheckData[];
  onHoursChange: (index: number, week: 'week1' | 'week2', hours: ReportedHourEntry[]) => void;
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
};

const getHoursForCategory = (entries: HourEntry[], category: string): number => {
    const entry = entries.find(e => e.category.toLowerCase() === category.toLowerCase());
    return entry ? entry.hours : 0;
};

const formatReportedHours = (entries: ReportedHourEntry[] | undefined): string => {
    if (!entries || entries.length === 0) return '-';
    return entries.map(e => `${e.code}: ${e.hours}`).join(', ');
};

const isCategoryExcluded = (category: string): boolean => {
    const codeEntry = getPayrollCode(category);
    return !!codeEntry?.excludeFromTotal;
};

export const PaycheckSpreadsheet: React.FC<PaycheckSpreadsheetProps> = ({ paycheckData, onHoursChange }) => {
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
      'paid': false,
      'other': false,
      'banked': true
  });

  const toggleSection = (section: string) => {
      setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Get all unique categories from data
  const allPaidCategoriesRaw: string[] = [...new Set<string>(paycheckData.flatMap(d => d.paidHours.map(p => p.category)))];
  
  // Split into Paid and Other based on exclusion flag
  const paidCategories = allPaidCategoriesRaw
    .filter(cat => !isCategoryExcluded(cat))
    .sort((a, b) => {
        const idxA = getCategorySortIndex(a);
        const idxB = getCategorySortIndex(b);
        if (idxA !== idxB) return idxA - idxB;
        return a.localeCompare(b);
    });

  const otherCategories = allPaidCategoriesRaw
    .filter(cat => isCategoryExcluded(cat))
    .sort((a, b) => {
        const idxA = getCategorySortIndex(a);
        const idxB = getCategorySortIndex(b);
        if (idxA !== idxB) return idxA - idxB;
        return a.localeCompare(b);
    });

  const bankedCategories: string[] = [...new Set<string>(paycheckData.flatMap(d => d.bankedHours.map(b => b.category)))].sort();

  return (
    <div className="bg-slate-900/50 p-4 sm:p-6 rounded-xl shadow-lg border border-slate-800 backdrop-blur-sm">
      <h2 className="text-xl font-semibold mb-4 text-white">Paystub History</h2>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="min-w-full divide-y divide-slate-800 border-separate border-spacing-0">
          <thead className="bg-slate-800/50">
            <tr>
              <th scope="col" className="sticky left-0 z-10 bg-slate-900/95 px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider border-b border-slate-700">Pay Period</th>
              
              {/* Paid Hours Section Header */}
              <th scope="col" colSpan={collapsedSections['paid'] ? 1 : paidCategories.length + 1} className="px-4 py-2 text-center text-xs font-bold text-indigo-400 uppercase tracking-wider border-b border-l border-slate-700 bg-slate-800/30">
                  <button onClick={() => toggleSection('paid')} className="flex items-center justify-center gap-1 w-full hover:text-indigo-300">
                      Paid Hours
                      <ChevronDownIcon className={clsx("w-4 h-4 transition-transform", collapsedSections['paid'] && "-rotate-90")} />
                  </button>
              </th>

              {/* Other Hours Section Header */}
              {otherCategories.length > 0 && (
                  <th scope="col" colSpan={collapsedSections['other'] ? 1 : otherCategories.length} className="px-4 py-2 text-center text-xs font-bold text-amber-400 uppercase tracking-wider border-b border-l border-slate-700 bg-slate-800/30">
                      <button onClick={() => toggleSection('other')} className="flex items-center justify-center gap-1 w-full hover:text-amber-300">
                          Other / Reimb
                          <ChevronDownIcon className={clsx("w-4 h-4 transition-transform", collapsedSections['other'] && "-rotate-90")} />
                      </button>
                  </th>
              )}

              {/* Banked Hours Section Header */}
              <th scope="col" colSpan={collapsedSections['banked'] ? 1 : bankedCategories.length} className="px-4 py-2 text-center text-xs font-bold text-emerald-400 uppercase tracking-wider border-b border-l border-slate-700 bg-slate-800/30">
                  <button onClick={() => toggleSection('banked')} className="flex items-center justify-center gap-1 w-full hover:text-emerald-300">
                      Banked Hours
                      <ChevronDownIcon className={clsx("w-4 h-4 transition-transform", collapsedSections['banked'] && "-rotate-90")} />
                  </button>
              </th>

              {/* Reported Section Header */}
              <th scope="col" colSpan={4} className="px-4 py-2 text-center text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-l border-slate-700 bg-slate-800/30">
                  Reported & Discrepancy
              </th>
            </tr>
            <tr>
              <th className="sticky left-0 z-10 bg-slate-900/95 border-b border-slate-700"></th>
              
              {/* Paid Columns */}
              {!collapsedSections['paid'] && paidCategories.map(cat => (
                  <th key={cat} scope="col" className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-l border-slate-800 min-w-[100px]">{cat}</th>
              ))}
              <th scope="col" className="px-4 py-2 text-right text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-l border-slate-700 bg-slate-800/20 min-w-[100px]">Total Paid</th>

              {/* Other Columns */}
              {!collapsedSections['other'] && otherCategories.map(cat => (
                  <th key={cat} scope="col" className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-l border-slate-800 min-w-[100px]">{cat}</th>
              ))}
              {collapsedSections['other'] && otherCategories.length > 0 && <th className="border-b border-l border-slate-800"></th>}

              {/* Banked Columns */}
              {!collapsedSections['banked'] && bankedCategories.map(cat => (
                  <th key={cat} scope="col" className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-l border-slate-800 min-w-[100px]">{cat}</th>
              ))}
              {collapsedSections['banked'] && <th className="border-b border-l border-slate-800"></th>}

              {/* Reported Columns */}
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-l border-slate-700 min-w-[120px]">Week 1</th>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-800 min-w-[120px]">Week 2</th>
              <th scope="col" className="px-4 py-2 text-right text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-l border-slate-700 bg-slate-800/20 min-w-[100px]">Total Rep</th>
              <th scope="col" className="px-4 py-2 text-right text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-l border-slate-700 bg-slate-800/20 min-w-[100px]">Diff</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {paycheckData.map((data, index) => {
                // Calculate Total Paid (excluding Other/Reimb)
                const totalPaidHours = data.paidHours
                    .filter(h => !isCategoryExcluded(h.category))
                    .reduce((sum, entry) => sum + entry.hours, 0);
                
                const allReportedEntries = [...(data.userReportedHours?.week1 || []), ...(data.userReportedHours?.week2 || [])];
                
                // Calculate Total Reported (excluding Other/Reimb)
                const totalUserHours = allReportedEntries
                    .filter(entry => {
                        const codeInfo = payrollCodeMap[entry.code];
                        return codeInfo?.paid && !codeInfo?.excludeFromTotal;
                    })
                    .reduce((sum, entry) => sum + entry.hours, 0);

                const discrepancy = totalPaidHours - totalUserHours;

                return (
                    <tr key={`${data.payPeriodStart}-${index}`} className="hover:bg-slate-800/30 transition-colors group">
                        <td className="sticky left-0 z-10 bg-slate-900 group-hover:bg-slate-900/95 px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-200 border-r border-slate-800">
                            {formatDate(data.payPeriodStart)} - {formatDate(data.payPeriodEnd)}
                        </td>
                        
                        {/* Paid Cells */}
                        {!collapsedSections['paid'] && paidCategories.map(cat => (
                            <td key={cat} className="px-4 py-4 whitespace-nowrap text-sm text-slate-400 text-right font-mono border-l border-slate-800/50">
                                {getHoursForCategory(data.paidHours, cat).toFixed(2)}
                            </td>
                        ))}
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-slate-200 text-right border-l border-slate-700 bg-slate-800/10 font-mono">
                            {totalPaidHours.toFixed(2)}
                        </td>

                        {/* Other Cells */}
                        {!collapsedSections['other'] && otherCategories.map(cat => (
                            <td key={cat} className="px-4 py-4 whitespace-nowrap text-sm text-amber-500/80 text-right font-mono border-l border-slate-800/50">
                                {getHoursForCategory(data.paidHours, cat).toFixed(2)}
                            </td>
                        ))}
                        {collapsedSections['other'] && otherCategories.length > 0 && (
                            <td className="px-4 py-4 text-center text-xs text-slate-600 border-l border-slate-800/50">...</td>
                        )}

                        {/* Banked Cells */}
                        {!collapsedSections['banked'] && bankedCategories.map(cat => (
                            <td key={cat} className="px-4 py-4 whitespace-nowrap text-sm text-emerald-500/80 text-right border-l border-slate-800/50 font-mono">
                                {getHoursForCategory(data.bankedHours, cat).toFixed(2)}
                            </td>
                        ))}
                        {collapsedSections['banked'] && (
                            <td className="px-4 py-4 text-center text-xs text-slate-600 border-l border-slate-800/50">...</td>
                        )}

                        {/* Reported Cells */}
                        <td className="px-4 py-4 whitespace-nowrap border-l border-slate-700 text-sm text-slate-400 font-mono">
                           {formatReportedHours(data.userReportedHours?.week1)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-400 font-mono">
                           {formatReportedHours(data.userReportedHours?.week2)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-slate-200 text-right border-l border-slate-700 bg-slate-800/10 font-mono">
                            {totalUserHours.toFixed(2)}
                        </td>
                        <td className={clsx("px-4 py-4 whitespace-nowrap text-sm font-bold text-right border-l border-slate-700 bg-slate-800/10 font-mono", discrepancy !== 0 ? 'text-red-400' : 'text-emerald-400')}>
                            {discrepancy.toFixed(2)}
                        </td>
                    </tr>
                )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};