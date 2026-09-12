import React, { useId } from "react";
import clsx from "clsx";
import {
  TagFacet,
  VideoFilters,
  hasActiveFilters,
} from "@/utils/videoFilters";

interface FilterBarProps {
  filters: VideoFilters;
  onChange: (next: VideoFilters) => void;
  years: number[];
  tags: TagFacet[];
  resultCount: number;
  totalCount: number;
}

function chipClass(active: boolean): string {
  return clsx(
    // 44px, the same touch target the player's controls use. A filter row is
    // not dense UI, so there is no reason for it to be harder to tap.
    "rounded-full px-4 py-1.5 text-sm min-h-[2.75rem]",
    "border aura-transition",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-aura-text-primary focus-visible:ring-offset-2",
    active
      ? "bg-aura-text-primary text-white border-aura-text-primary"
      : "bg-aura-surface text-aura-text-secondary border-aura-border hover:border-aura-text-tertiary",
  );
}

/**
 * Search and narrow the library.
 *
 * The three controls are chosen from what the data can actually support: free
 * text carries the long tail (most tags and nearly every location appear on a
 * single video), while year and the handful of recurring tags are the axes
 * broad enough to browse by.
 */
function FilterBar({
  filters,
  onChange,
  years,
  tags,
  resultCount,
  totalCount,
}: FilterBarProps): React.ReactNode {
  const searchId = useId();
  const active = hasActiveFilters(filters);

  const toggleYear = (year: number) =>
    onChange({ ...filters, year: filters.year === year ? null : year });

  const toggleTag = (tag: string) =>
    onChange({ ...filters, tag: filters.tag === tag ? null : tag });

  return (
    <section aria-label="Filter videos" className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 basis-64">
          <label
            htmlFor={searchId}
            className="block text-xs uppercase tracking-wide text-aura-text-tertiary mb-1"
          >
            Search
          </label>
          <input
            id={searchId}
            type="search"
            value={filters.query}
            onChange={(event) => onChange({ ...filters, query: event.target.value })}
            placeholder="A title, a place, a person…"
            className={clsx(
              "w-full rounded-xl border border-aura-border bg-aura-surface",
              "px-4 py-2.5 min-h-[2.75rem] text-aura-text-primary",
              "placeholder:text-aura-text-tertiary",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-aura-text-primary",
            )}
          />
        </div>

        {active ? (
          <button
            type="button"
            onClick={() => onChange({ query: "", year: null, tag: null })}
            className={clsx(
              "rounded-xl border border-aura-border bg-aura-surface",
              "px-4 py-2.5 min-h-[2.75rem] text-sm text-aura-text-secondary",
              "hover:border-aura-text-tertiary aura-transition",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-aura-text-primary",
            )}
          >
            Clear filters
          </button>
        ) : null}
      </div>

      {years.length > 1 ? (
        <div role="group" aria-label="Filter by year" className="flex flex-wrap gap-2">
          {years.map((year) => (
            <button
              key={year}
              type="button"
              aria-pressed={filters.year === year}
              onClick={() => toggleYear(year)}
              className={chipClass(filters.year === year)}
            >
              {year}
            </button>
          ))}
        </div>
      ) : null}

      {tags.length > 0 ? (
        <div role="group" aria-label="Filter by tag" className="flex flex-wrap gap-2">
          {tags.map(({ tag, count }) => (
            <button
              key={tag}
              type="button"
              aria-pressed={filters.tag === tag}
              onClick={() => toggleTag(tag)}
              className={chipClass(filters.tag === tag)}
            >
              {tag}
              <span className="ml-1.5 text-xs opacity-60">{count}</span>
            </button>
          ))}
        </div>
      ) : null}

      <p className="text-sm text-aura-text-tertiary">
        {active
          ? `${resultCount} of ${totalCount} videos`
          : `${totalCount} videos, newest first`}
      </p>
    </section>
  );
}

export default FilterBar;
