import React, { useState, useEffect, useCallback } from "react";
import { XMarkIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

interface DesignGalleryProps<T> {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  fetchEndpoint: string;
  renderItem: (item: T) => React.ReactNode;
  onLoad: (item: T) => void;
  emptyMessage?: string;
}

export function DesignGallery<T extends { id: string | number }>({
  title,
  isOpen,
  onClose,
  fetchEndpoint,
  renderItem,
  onLoad,
  emptyMessage = "No items found in your gallery.",
}: DesignGalleryProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadItems();
    }
  }, [isOpen, loadItems]);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(fetchEndpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to load gallery items: ${res.statusText}`);
      }

      const data = await res.json();
      // Heuristic: check for common array keys like 'history', 'pins', 'examples', 'docs'
      // or if it's an array itself.
      let list: T[] = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (data.history) {
        list = data.history;
      } else if (data.pins) {
        list = data.pins;
      } else if (data.examples) {
        list = data.examples;
      } else if (data.docs) {
        list = data.docs;
      } else {
        // Fallback: look for the first array value
        const val = Object.values(data).find(Array.isArray);
        if (val) list = val as T[];
      }

      setItems(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load gallery");
    } finally {
      setLoading(false);
    }
  }, [fetchEndpoint]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{title}</h2>
            <p className="text-slate-400 text-sm">
              View and reload your past design requests
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadItems}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Refresh"
            >
              <ArrowPathIcon className="w-6 h-6" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Close"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-slate-700 border-t-emerald-500 animate-spin"></div>
                <p className="text-slate-400 animate-pulse">
                  Loading your gallery...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-red-400">
              <p className="mb-4 text-center max-w-md">{error}</p>
              <button
                onClick={loadItems}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <p className="text-lg">{emptyMessage}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    onLoad(item);
                    onClose();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onLoad(item);
                      onClose();
                    }
                  }}
                  className="group relative bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden hover:border-emerald-500/50 transition-all cursor-pointer hover:shadow-lg hover:shadow-emerald-900/20"
                >
                  {renderItem(item)}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-emerald-500/10 transition-colors pointer-events-none" />
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-500 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-lg translate-y-2 group-hover:translate-y-0 duration-200">
                    Click to Load
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
