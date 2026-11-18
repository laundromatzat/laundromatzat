import React, { useId, useMemo, useState } from "react";
import clsx from "clsx";
import {
  EMPTY_FILTERS,
  Facet,
  FacetSection,
  VideoFilters,
  activeFacetCount,
  hasActiveFilters,
} from "@/utils/videoFilters";
import MultiSelect from "./MultiSelect";

interface FilterBarProps {
  filters: VideoFilters;
  onChange: (next: VideoFilters) => void;
  years: Facet[];
  people: Facet[];
  /** Locations under their regional headings. */
  locations: FacetSection[];
  resultCount: number;
  totalCount: number;
}

/**
 * The look the search box and the Filters button share.
 *
 * Carries no width, padding or border colour: those differ per control, and
 * appending a utility to this string does not reliably override one inside it.
 * Two utilities from the same group have equal specificity, so the winner is
 * whichever Tailwind emits last -- `w-auto` on the Filters button never beat
 * the `w-full` that used to live here, which left the button spanning the whole
 * row on top of the search box. State the differing value once, per control.
 */
const CONTROL = clsx(
  "rounded-xl border bg-aura-surface",
  "py-2 min-h-[2.75rem] text-sm text-aura-text-primary",
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-aura-text-primary",
);

type Axis = "year" | "people" | "location";

/** A flat list is one section with no heading. */
function flat(options: Facet[]): FacetSection[] {
  return [{ heading: "", depth: 0, options }];
}

/**
 * Search and narrow the library.
 *
 * Search stays visible because it carries the long tail on its own. The three
 * axes behind it -- when, who, where -- each take any number of picks, and
 * fold away on a phone so the first thing on screen is a video.
 */
function FilterBar({
  filters,
  onChange,
  years,
  people,
  locations,
  resultCount,
  totalCount,
}: FilterBarProps): React.ReactNode {
  const searchId = useId();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  // One list open at a time: a second one opening over the first would hide it.
  const [openAxis, setOpenAxis] = useState<Axis | null>(null);

  const active = hasActiveFilters(filters);
  const activeCount = activeFacetCount(filters);

  // Stable per axis, so an open list does not re-subscribe its outside-click
  // listener on every keystroke in the search box.
  const openChange = useMemo(() => {
    const forAxis = (axis: Axis) => (shown: boolean) =>
      setOpenAxis((current) => (shown ? axis : current === axis ? null : current));
    return { year: forAxis("year"), people: forAxis("people"), location: forAxis("location") };
  }, []);

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
            className={clsx(
              CONTROL,
              "w-full px-4 border-aura-border placeholder:text-aura-text-tertiary",
            )}
          />
        </div>

        {/* The axes are always on screen where there is room for them. */}
        <button
          type="button"
          onClick={() => {
            setOpen((shown) => !shown);
            setOpenAxis(null);
          }}
          aria-expanded={open}
          aria-controls={panelId}
          className={clsx(
            CONTROL,
            "md:hidden shrink-0 whitespace-nowrap px-4",
            "border-aura-border text-aura-text-secondary",
          )}
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
        className={clsx("gap-3 sm:grid-cols-3", open ? "grid" : "hidden md:grid")}
      >
        {years.length > 1 ? (
          <MultiSelect
            label="Year"
            anyLabel="Any year"
            sections={flat(years)}
            selected={filters.years.map(String)}
            onChange={(picked) => onChange({ ...filters, years: picked.map(Number) })}
            open={openAxis === "year"}
            onOpenChange={openChange.year}
          />
        ) : null}

        {people.length > 0 ? (
          <MultiSelect
            label="People"
            anyLabel="Anyone"
            sections={flat(people)}
            selected={filters.people}
            onChange={(picked) => onChange({ ...filters, people: picked })}
            open={openAxis === "people"}
            onOpenChange={openChange.people}
          />
        ) : null}

        {locations.length > 0 ? (
          <MultiSelect
            label="Location"
            anyLabel="Anywhere"
            sections={locations}
            selected={filters.locations}
            onChange={(picked) => onChange({ ...filters, locations: picked })}
            open={openAxis === "location"}
            onOpenChange={openChange.location}
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
