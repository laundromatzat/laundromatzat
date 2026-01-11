import React from "react";
import { payrollCodeMap, sortedPayrollCodes } from "@/utils/payrollCodes";
import { ReportedHourEntry } from "../types/paystubTypes";
import { TrashIcon } from "./icons/TrashIcon";

interface ReportedHoursInputProps {
  entries: ReportedHourEntry[];
  onChange: (entries: ReportedHourEntry[]) => void;
}

export const ReportedHoursInput: React.FC<ReportedHoursInputProps> = ({
  entries,
  onChange,
}) => {
  const handleAddEntry = () => {
    let defaultCode = "WKP";
    if (entries.length === 0) defaultCode = "WKP";
    else if (entries.length === 1) defaultCode = "OST";
    else if (entries.length === 2) defaultCode = "CTE";

    const newEntries = [...entries, { code: defaultCode, hours: 0 }];
    onChange(newEntries);
  };

  const handleUpdateEntry = (
    index: number,
    updatedEntry: ReportedHourEntry
  ) => {
    const newEntries = [...entries];
    newEntries[index] = updatedEntry;
    onChange(newEntries);
  };

  const handleRemoveEntry = (index: number) => {
    const newEntries = entries.filter((_, i) => i !== index);
    onChange(newEntries);
  };

  return (
    <div className="space-y-2">
      {entries.map((entry, index) => (
        <div
          key={index}
          className="group flex items-center gap-2 bg-zinc-900/50 p-1.5 rounded-lg border border-zinc-800/50 hover:border-zinc-700 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <select
              value={entry.code}
              onChange={(e) =>
                handleUpdateEntry(index, { ...entry, code: e.target.value })
              }
              className="w-full bg-transparent border-none text-zinc-100 font-medium text-xs focus:ring-0 p-0 cursor-pointer h-5"
              aria-label={`Payroll code for entry ${index + 1}`}
            >
              {sortedPayrollCodes.map((code) => (
                <option
                  key={code}
                  value={code}
                  className="bg-zinc-900 text-zinc-300"
                >
                  {code} - {payrollCodeMap[code].description}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="number"
                value={entry.hours || ""}
                onChange={(e) =>
                  handleUpdateEntry(index, {
                    ...entry,
                    hours: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0"
                className="w-14 bg-zinc-950 border border-zinc-800 rounded py-1 px-2 text-right text-zinc-100 font-mono text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-zinc-700 h-7"
                aria-label={`Hours for entry ${index + 1}`}
              />
            </div>

            <button
              onClick={() => handleRemoveEntry(index)}
              className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
              aria-label={`Remove entry ${index + 1}`}
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}

      <button
        onClick={handleAddEntry}
        className="w-full py-1.5 border border-dashed border-zinc-700/50 rounded-lg text-xs font-medium text-zinc-400 hover:text-indigo-300 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all flex items-center justify-center gap-1.5"
      >
        <span>+ Add</span>
      </button>
    </div>
  );
};
