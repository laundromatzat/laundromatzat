import React, { useId, useState } from "react";
import clsx from "clsx";
import {
  EMPTY_FILTERS,
  Facet,
  VideoFilters,
  activeFacetCount,
  hasActiveFilters,
} from "@/utils/videoFilters";

interface FilterBarProps {
  filters: VideoFilters;
  onChange: (next: VideoFilters) => void;
  years: Facet[];
  people: Facet[];
  locations: Facet[];
  tags: Facet[];
  resultCount: number;
  totalCount: number;
}

const CONTROL = clsx(
  "w-full rounded-xl border border-aura-border bg-aura-surface",
  "px-3 py-2 min-h-[2.75rem] text-sm text-aura-text-primary",
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-aura-text-primary",
);

interface FacetSelectProps {
  label: string;
  value: string | null;
  /** Shown as the unfiltered option, e.g. "All years". */
  anyLabel: string;
  options: Facet[];
  onSelect: (value: string | null) => void;
}

/**
 * One axis, as a native select.
 *
 * Chips were the obvious thing and the wrong one: 14 years, 23 locations and 56
 * tags is more than a wrapping row can hold, and on a phone the rows pushed the
 * grid off the screen. A select shows the same counts, collapses to one line,
 * and on iOS opens the system picker.
 */
function FacetSelect({
  label,
  value,
  anyLabel,
  options,
  onSelect,
}: FacetSelectProps): React.ReactNode {
  const id = useId();

  // A value the list does not carry still has to show. Filters arrive from the
  // URL, and a link shared before the axes were split up can name a tag that is
  // now a person -- it still narrows the grid, so the control has to say so
  // rather than reading "any" over a filtered library.
  const listed = options.some((option) => option.value === value);

  return (
    <div className="min-w-0">
      <label
        htmlFor={id}
        className="block text-xs uppercase tracking-wide text-aura-text-tertiary mb-1"
      >
        {label}
      </label>
      <select
        id={id}
        value={value ?? ""}
        onChange={(event) => onSelect(event.target.value === "" ? null : event.target.value)}
        className={clsx(CONTROL, value !== null && "border-aura-text-primary")}
      >
        <option value="">{anyLabel}</option>
        {value !== null && !listed ? <option value={value}>{value}</option> : null}
        {options.map(({ value: option, count }) => (
          <option key={option} value={option}>
            {option} ({count})
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Search and narrow the library.
 *
 * Search stays visible because it carries the long tail on its own. The four
 * axes behind it -- when, who, where, what -- are the ones the data can support,
 * and they fold away on a phone so the first thing on screen is a video.
 */
function FilterBar({
  filters,
  onChange,
  years,
  people,
  locations,
  tags,
  resultCount,
  totalCount,
}: FilterBarProps): React.ReactNode {
  const searchId = useId();
  const panelId = useId();
  const [open, setOpen] = useState(false);

  const active = hasActiveFilters(filters);
  const activeCount = activeFacetCount(filters);

  return (
    <section aria-label="Filter videos" className="space-y-3">
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
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
            className={clsx(CONTROL, "px-4 placeholder:text-aura-text-tertiary")}
          />
        </div>

        {/* The four axes are always on screen where there is room for them. */}
        <button
          type="button"
          onClick={() => setOpen((shown) => !shown)}
          aria-expanded={open}
          aria-controls={panelId}
          className={clsx(CONTROL, "md:hidden w-auto shrink-0 px-4 text-aura-text-secondary")}
        >
          Filters
          {activeCount > 0 ? (
            <span className="ml-1.5 rounded-full bg-aura-text-primary px-1.5 py-0.5 text-xs text-white">
              {activeCount}
            </span>
          ) : null}
        </button>
      </div>

      <div
        id={panelId}
        className={clsx(
          "gap-3 sm:grid-cols-2 md:grid-cols-4",
          open ? "grid" : "hidden md:grid",
        )}
      >
        {years.length > 1 ? (
          <FacetSelect
            label="Year"
            anyLabel="All years"
            value={filters.year === null ? null : String(filters.year)}
            options={years}
            onSelect={(value) =>
              onChange({ ...filters, year: value === null ? null : Number(value) })
            }
          />
        ) : null}

        {people.length > 0 ? (
          <FacetSelect
            label="People"
            anyLabel="Anyone"
            value={filters.person}
            options={people}
            onSelect={(person) => onChange({ ...filters, person })}
          />
        ) : null}

        {locations.length > 0 ? (
          <FacetSelect
            label="Location"
            anyLabel="Anywhere"
            value={filters.location}
            options={locations}
            onSelect={(location) => onChange({ ...filters, location })}
          />
        ) : null}

        {tags.length > 0 ? (
          <FacetSelect
            label="Tag"
            anyLabel="Any tag"
            value={filters.tag}
            options={tags}
            onSelect={(tag) => onChange({ ...filters, tag })}
          />
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="text-sm text-aura-text-tertiary">
          {active
            ? `${resultCount} of ${totalCount} videos`
            : `${totalCount} videos, newest first`}
        </p>
        {active ? (
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            className={clsx(
              "text-sm text-aura-text-secondary underline underline-offset-4",
              "hover:text-aura-text-primary aura-transition",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-aura-text-primary rounded",
            )}
          >
            Clear filters
          </button>
        ) : null}
      </div>
    </section>
  );
}

export default FilterBar;
