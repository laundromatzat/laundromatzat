import React, { useEffect, useId, useRef } from "react";
import clsx from "clsx";
import { Facet, FacetSection } from "@/utils/videoFilters";
import { ChevronIcon } from "./icons/ChevronIcon";

interface MultiSelectProps {
  /** The axis, shown above the control: "Year". */
  label: string;
  /** What the control reads as with nothing picked: "Any year". */
  anyLabel: string;
  /** The options, under headings where the axis has them. */
  sections: FacetSection[];
  selected: string[];
  onChange: (next: string[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Above this many characters, a list of picks reads worse than a count. */
const SUMMARY_LIMIT = 22;

function labelOf(option: Facet): string {
  return option.label ?? option.value;
}

/**
 * One filter axis: a button that opens a list of checkboxes.
 *
 * Not a native <select multiple>. That control cannot show a heading inside a
 * heading, which Location needs (United States, then West), and on a desktop
 * it only takes a second pick with Ctrl or Cmd held, which nobody guesses.
 * Checkboxes say "pick any number" by their shape alone.
 *
 * The list stays open while picking, since picking several is the point, and
 * closes on Escape, on a click elsewhere, or on the button again.
 */
function MultiSelect({
  label,
  anyLabel,
  sections,
  selected,
  onChange,
  open,
  onOpenChange,
}: MultiSelectProps): React.ReactNode {
  const labelId = useId();
  const buttonId = useId();
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const closeOnOutside = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // Hand focus back to the button only if it was inside the list, so
      // Escape never pulls focus from somewhere else on the page.
      const focusWasInside = rootRef.current?.contains(document.activeElement);
      onOpenChange(false);
      if (focusWasInside) buttonRef.current?.focus();
    };
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("touchstart", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("touchstart", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, onOpenChange]);

  const toggle = (value: string) =>
    onChange(
      selected.includes(value)
        ? selected.filter((picked) => picked !== value)
        : [...selected, value],
    );

  // Read the picks back in the order the list shows them, by their labels.
  const labels = new Map<string, string>();
  for (const section of sections) {
    for (const option of section.options) labels.set(option.value, labelOf(option));
  }
  const picked = selected.map((value) => labels.get(value) ?? value);
  const joined = picked.join(", ");
  const summary =
    picked.length === 0
      ? anyLabel
      : picked.length === 1 || joined.length <= SUMMARY_LIMIT
        ? joined
        : `${picked.length} selected`;

  return (
    <div ref={rootRef} className="relative min-w-0">
      <span
        id={labelId}
        className="block text-xs uppercase tracking-wide text-aura-text-tertiary mb-1"
      >
        {label}
      </span>
      <button
        ref={buttonRef}
        id={buttonId}
        type="button"
        aria-labelledby={`${labelId} ${buttonId}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => onOpenChange(!open)}
        className={clsx(
          "flex w-full items-center justify-between gap-2 rounded-xl border bg-aura-surface",
          "min-h-[2.75rem] px-3 py-2 text-left text-sm text-aura-text-primary",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-aura-text-primary",
          selected.length > 0 ? "border-aura-text-primary" : "border-aura-border",
        )}
      >
        <span className="truncate">{summary}</span>
        <ChevronIcon
          direction="down"
          className={clsx(
            "h-4 w-4 shrink-0 text-aura-text-tertiary aura-transition",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div
          id={panelId}
          role="group"
          aria-labelledby={labelId}
          className={clsx(
            "absolute inset-x-0 top-full z-20 mt-1",
            "max-h-[min(24rem,60vh)] overflow-y-auto overscroll-contain",
            "rounded-xl border border-aura-border bg-aura-surface p-1 shadow-aura-lg",
          )}
        >
          {sections.map((section) => (
            <div
              key={`${section.depth}:${section.heading}`}
              role={section.heading ? "group" : undefined}
              aria-label={section.heading || undefined}
            >
              {section.heading ? (
                <p
                  aria-hidden="true"
                  className={clsx(
                    "pr-3 pt-3 pb-1 uppercase tracking-wide",
                    section.depth === 0
                      ? "pl-3 text-xs font-semibold text-aura-text-primary"
                      : "pl-6 text-[0.7rem] text-aura-text-tertiary",
                  )}
                >
                  {section.heading}
                </p>
              ) : null}

              {section.options.map((option) => (
                <label
                  key={`${section.heading}:${option.value}`}
                  className={clsx(
                    "flex cursor-pointer items-center gap-3 rounded-lg",
                    "min-h-[2.75rem] pr-3 text-sm text-aura-text-primary",
                    "hover:bg-aura-accent-light",
                    section.depth === 1 ? "pl-6" : "pl-3",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(option.value)}
                    onChange={() => toggle(option.value)}
                    className="h-4 w-4 shrink-0 accent-aura-text-primary"
                  />
                  <span className="flex-1">{labelOf(option)}</span>
                  <span aria-hidden="true" className="text-xs text-aura-text-tertiary">
                    {option.count}
                  </span>
                </label>
              ))}
            </div>
          ))}

          {selected.length > 0 ? (
            <div className="border-t border-aura-border mt-1 px-3 py-2">
              <button
                type="button"
                onClick={() => onChange([])}
                className={clsx(
                  "text-sm text-aura-text-secondary underline underline-offset-4",
                  "hover:text-aura-text-primary rounded",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-aura-text-primary",
                )}
              >
                Clear {label.toLowerCase()}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default MultiSelect;
