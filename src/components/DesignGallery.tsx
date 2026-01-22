import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  XMarkIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  FunnelIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { getApiUrl } from "@/utils/api";

export interface SortOption {
  label: string;
  value: string;
  compareFn: (a: unknown, b: unknown) => number;
}

export interface FilterConfig {
  type: "text" | "select" | "date";
  label: string;
  key: string;
  options?: { label: string; value: string }[];
}

interface DesignGalleryProps<T> {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  fetchEndpoint: string;
  deleteEndpoint?: string;
  renderItem: (item: T, onDelete?: () => void) => React.ReactNode;
  renderPreview?: (item: T) => React.ReactNode;
  onLoad: (item: T) => void;
  onDelete?: (id: string | number) => Promise<void>;
  emptyMessage?: string;
  sortOptions?: SortOption[];
  filterConfig?: FilterConfig[];
  itemsPerPage?: number;
}

export function DesignGallery<T extends { id: string | number }>({
  title,
  isOpen,
  onClose,
  fetchEndpoint,
  deleteEndpoint,
  renderItem,
  renderPreview,
  onLoad,
  onDelete,
  emptyMessage = "No items found in your gallery.",
  sortOptions = [],
  filterConfig = [],
  itemsPerPage = 12,
}: DesignGalleryProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingItemId, setLoadingItemId] = useState<string | number | null>(
    null,
  );
  const [deleteConfirmId, setDeleteConfirmId] = useState<
    string | number | null
  >(null);
  const [previewItem, setPreviewItem] = useState<T | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  // Sorting
  const [sortBy, setSortBy] = useState<string>(sortOptions[0]?.value || "");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(fetchEndpoint), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to load gallery items: ${res.statusText}`);
      }

      const data = await res.json();
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

  useEffect(() => {
    if (isOpen) {
      loadItems();
    }
  }, [isOpen, loadItems]);

  const handleDelete = async (id: string | number) => {
    if (!deleteEndpoint && !onDelete) return;

    try {
      if (onDelete) {
        await onDelete(id);
      } else if (deleteEndpoint) {
        const token = localStorage.getItem("token");
        const res = await fetch(getApiUrl(`${deleteEndpoint}/${id}`), {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to delete item");
      }

      // Optimistic update
      setItems((prev) => prev.filter((item) => item.id !== id));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete item. Please try again.");
    }
  };

  const handleLoadItem = (item: T) => {
    setLoadingItemId(item.id);
    setTimeout(() => {
      onLoad(item);
      setLoadingItemId(null);
      setPreviewItem(null); // Ensure preview is closed
      onClose();
    }, 300);
  };

  // Filter and search items
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Apply search
    if (searchQuery) {
      result = result.filter((item) => {
        const searchableText = JSON.stringify(item).toLowerCase();
        return searchableText.includes(searchQuery.toLowerCase());
      });
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        result = result.filter((item) => {
          const itemValue = (item as Record<string, unknown>)[key];
          return String(itemValue).toLowerCase().includes(value.toLowerCase());
        });
      }
    });

    // Apply sorting
    if (sortBy && sortOptions.length > 0) {
      const sortOption = sortOptions.find((opt) => opt.value === sortBy);
      if (sortOption) {
        result.sort(sortOption.compareFn);
      }
    }

    return result;
  }, [items, searchQuery, filters, sortBy, sortOptions]);

  // Paginate items
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters, sortBy]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="flex flex-col gap-4 p-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">{title}</h2>
              <p className="text-slate-400 text-sm">
                {filteredItems.length}{" "}
                {filteredItems.length === 1 ? "item" : "items"}
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

          {/* Search and Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search gallery..."
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Sort */}
            {sortOptions.length > 0 && (
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}

            {/* Filter Toggle */}
            {filterConfig.length > 0 && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  showFilters
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <FunnelIcon className="w-5 h-5" />
                Filters
              </button>
            )}
          </div>

          {/* Filter Controls */}
          {showFilters && filterConfig.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 border-t border-slate-800">
              {filterConfig.map((config) => (
                <div key={config.key}>
                  <label className="block text-xs text-slate-400 mb-1">
                    {config.label}
                  </label>
                  {config.type === "select" && config.options ? (
                    <select
                      value={filters[config.key] || ""}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          [config.key]: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">All</option>
                      {config.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={config.type}
                      value={filters[config.key] || ""}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          [config.key]: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
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
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <p className="text-lg">
                {searchQuery || Object.values(filters).some((v) => v)
                  ? "No items match your search"
                  : emptyMessage}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedItems.map((item) => (
                  <div
                    key={item.id}
                    className="group relative bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden hover:border-emerald-500/50 transition-all"
                  >
                    {/* Delete Confirmation Overlay */}
                    {deleteConfirmId === item.id && (
                      <div className="absolute inset-0 bg-black/90 z-20 flex flex-col items-center justify-center gap-4 p-4">
                        <p className="text-white text-center font-medium">
                          Delete this item?
                        </p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Loading Overlay */}
                    {loadingItemId === item.id && (
                      <div className="absolute inset-0 bg-black/70 z-10 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full border-4 border-slate-700 border-t-emerald-500 animate-spin"></div>
                      </div>
                    )}

                    {/* Action Buttons Container */}
                    <div className="absolute top-2 right-2 z-10 flex gap-2">
                      {/* Preview Button (Eye) */}
                      {renderPreview && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewItem(item);
                          }}
                          className="p-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                          title="Quick Look"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                      )}

                      {/* Delete Button */}
                      {(deleteEndpoint || onDelete) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(item.id);
                          }}
                          className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Item Content */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => handleLoadItem(item)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleLoadItem(item);
                        }
                      }}
                      className="cursor-pointer"
                    >
                      {renderItem(item)}
                    </div>

                    {/* Load Indicator */}
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-500 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-lg translate-y-2 group-hover:translate-y-0 duration-200 pointer-events-none">
                      Click to Load
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-slate-400 px-4">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Quick Look Preview Modal */}
      {previewItem && renderPreview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Quick Look</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleLoadItem(previewItem)}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors shadow-lg shadow-emerald-900/20"
                >
                  Load This Version
                </button>
                <button
                  onClick={() => setPreviewItem(null)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-y-auto bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl">
              {renderPreview(previewItem)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
