import React, { useState } from "react";
import { TrainingExample } from "../types";
import { Button } from "./Button";
import { Trash2, FileText } from "lucide-react";

interface StyleTrainerProps {
  examples: TrainingExample[];
  onAddExample: (example: TrainingExample) => void;
  onRemoveExample: (id: string) => void;
}

export const StyleTrainer: React.FC<StyleTrainerProps> = ({
  examples,
  onAddExample,
  onRemoveExample,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [shorthand, setShorthand] = useState("");
  const [fullNote, setFullNote] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shorthand.trim() || !fullNote.trim()) return;

    onAddExample({
      id: crypto.randomUUID(),
      shorthand,
      fullNote,
      timestamp: Date.now(),
    });

    setShorthand("");
    setFullNote("");
    setIsAdding(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-purple-600" />
            Style & Training
          </h2>
          <p className="text-slate-500 mt-1">
            Upload past examples. The AI learns your formatting and phrasing
            from these cards.
          </p>
        </div>
        <Button
          onClick={() => setIsAdding(!isAdding)}
          variant={isAdding ? "secondary" : "primary"}
        >
          {isAdding ? "Cancel" : "Add New Example"}
        </Button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl border border-purple-200 shadow-lg animate-fade-in-down">
          <h3 className="font-semibold text-slate-800 mb-4">
            Add Training Pair
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="input-shorthand"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Input (Shorthand)
                </label>
                <textarea
                  id="input-shorthand"
                  value={shorthand}
                  onChange={(e) => setShorthand(e.target.value)}
                  className="w-full h-64 p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono"
                  placeholder="e.g. pt 45y m c/o chest pain..."
                />
              </div>
              <div>
                <label
                  htmlFor="target-output"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Target Output (Full Note)
                </label>
                <textarea
                  id="target-output"
                  value={fullNote}
                  onChange={(e) => setFullNote(e.target.value)}
                  className="w-full h-64 p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono"
                  placeholder="SUBJECTIVE: The patient is a 45-year-old male..."
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary">
                Save to Memory
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {examples.length === 0 && !isAdding && (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-500">
              No training examples yet. Add one to teach the AI your style.
            </p>
          </div>
        )}

        {examples.map((ex) => (
          <div
            key={ex.id}
            className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
              <span className="text-xs font-mono text-slate-500">
                ID: {ex.id.slice(0, 8)}
              </span>
              <button
                onClick={() => onRemoveExample(ex.id)}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
              <div className="p-4">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Input
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap font-mono">
                  {ex.shorthand}
                </p>
              </div>
              <div className="p-4 bg-slate-50/50">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Learned Output
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {ex.fullNote}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
