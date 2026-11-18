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
import { ChevronIcon } from "./icons/ChevronIcon";

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

type Axis = "year" | "people" | "location";

/** A flat list is one section with no heading. */
function flat(options: Facet[]): FacetSection[] {
  return [{ heading: "", depth: 0, options }];
}

/**
 * Narrow the library by when, who and where.
 *
 * Each axis takes any number of picks. On a phone they fold behind one Filters
 * button, so the first thing on screen is a video; from the md breakpoint up
 * they sit in a row and the button is hidden.
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
  const panelId = useId();
  const [open, setOpen] = useState(false);
  // One list open at a time: a second one opening over the first would hide it.
  const [openAxis, setOpenAxis] = useState<Axis | null>(null);

  const active = hasActiveFilters(filters);
  const activeCount = activeFacetCount(filters);

  // Stable per axis, so an open list does not re-subscribe its outside-click
  // listener every time a pick re-renders this bar.
  const openChange = useMemo(() => {
    const forAxis = (axis: Axis) => (shown: boolean) =>
      setOpenAxis((current) => (shown ? axis : current === axis ? null : current));
    return { year: forAxis("year"), people: forAxis("people"), location: forAxis("location") };
  }, []);

  return (
    <section aria-label="Filter videos" className="space-y-3">
      {/*
        Every utility below is stated once: two from the same group (`w-full`
        and `w-auto`, say) have equal specificity, so the winner is whichever
        Tailwind emits last. The test in VideosPage.test.tsx guards it.
      */}
      <button
        type="button"
        onClick={() => {
          setOpen((shown) => !shown);
          setOpenAxis(null);
        }}
        aria-expanded={open}
        aria-controls={panelId}
        className={clsx(
          "flex w-full items-center justify-between gap-2 md:hidden",
          "rounded-xl border border-aura-border bg-aura-surface",
          "min-h-[2.75rem] px-4 py-2 text-sm text-aura-text-primary",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-aura-text-primary",
        )}
      >
        <span>
          Filters
          {activeCount > 0 ? (
            <span className="ml-2 rounded-full bg-aura-text-primary px-1.5 py-0.5 text-xs text-white">
              {activeCount}
            </span>
          ) : null}
        </span>
        <ChevronIcon
          direction="down"
          className={clsx(
            "h-4 w-4 shrink-0 text-aura-text-tertiary aura-transition",
            open && "rotate-180",
          )}
        />
      </button>

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
