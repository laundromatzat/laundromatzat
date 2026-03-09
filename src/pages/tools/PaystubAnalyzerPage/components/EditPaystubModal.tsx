import React from "react";
import { AuraButton, AuraInput } from "@/components/aura";
import { HourEntry, PaycheckData } from "../types/paystubTypes";
import { DocumentTextIcon } from "./icons/DocumentTextIcon";
import { TrashIcon } from "./icons/TrashIcon";
import { XIcon } from "./icons/XIcon";

interface EditPaystubModalProps {
  data: PaycheckData;
  onChange: (data: PaycheckData) => void;
  onSave: () => void;
  onClose: () => void;
}

export const EditPaystubModal: React.FC<EditPaystubModalProps> = ({
  data,
  onChange,
  onSave,
  onClose,
}) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    role="presentation"
    onClick={onClose}
    onKeyDown={(e) => e.key === "Escape" && onClose()}
  >
    <div
      className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[88vh] border border-slate-200"
      role="presentation"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-100">
            <DocumentTextIcon className="w-4 h-4 text-indigo-600" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">Edit Paystub Data</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-5 overflow-auto flex-1 space-y-5">
        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="edit-pay-period-start" className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
              Pay Period Start
            </label>
            <AuraInput
              id="edit-pay-period-start"
              type="date"
              value={data.payPeriodStart}
              onChange={(e) => onChange({ ...data, payPeriodStart: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="edit-pay-period-end" className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
              Pay Period End
            </label>
            <AuraInput
              id="edit-pay-period-end"
              type="date"
              value={data.payPeriodEnd}
              onChange={(e) => onChange({ ...data, payPeriodEnd: e.target.value })}
            />
          </div>
        </div>

        {/* Paid hours */}
        <div>
          <p className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
            Extracted Paid Hours
          </p>
          <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
            {data.paidHours.map((entry: HourEntry, idx: number) => (
              <div key={idx} className="flex items-center gap-2">
                <AuraInput
                  type="text"
                  className="flex-1 text-sm"
                  value={entry.category}
                  onChange={(e) => {
                    const next = [...data.paidHours];
                    next[idx] = { ...next[idx], category: e.target.value };
                    onChange({ ...data, paidHours: next });
                  }}
                  placeholder="Category"
                />
                <AuraInput
                  type="number"
                  className="w-24 text-sm text-right"
                  value={entry.hours}
                  onChange={(e) => {
                    const next = [...data.paidHours];
                    next[idx] = { ...next[idx], hours: parseFloat(e.target.value) || 0 };
                    onChange({ ...data, paidHours: next });
                  }}
                  placeholder="0"
                />
                <button
                  onClick={() =>
                    onChange({ ...data, paidHours: data.paidHours.filter((_: HourEntry, i: number) => i !== idx) })
                  }
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                onChange({
                  ...data,
                  paidHours: [...data.paidHours, { category: "New Category", hours: 0 }],
                })
              }
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold mt-1 flex items-center gap-1"
            >
              + Add Category
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50 flex justify-end gap-2.5">
        <AuraButton variant="ghost" onClick={onClose} className="text-slate-600">
          Cancel
        </AuraButton>
        <AuraButton variant="accent" onClick={onSave}>
          Save Changes
        </AuraButton>
      </div>
    </div>
  </div>
);
