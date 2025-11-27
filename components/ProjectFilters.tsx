import React, { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';

export type Filters = {
  type?: string[];
  yearRange?: [number, number] | null;
  tags?: string[];
};

export type ProjectFiltersProps = {
  value: Filters;
  onChange: (next: Filters) => void;
  available: { types: string[]; years: number[]; tags: string[] };
  onReset?: () => void;
};

const DEBOUNCE_MS = 200;

const TYPE_LABELS: Record<string, string> = {
  video: 'Video',
  photo: 'Photo',
  image: 'Photo',
  tool: 'Tool',
  cinemagraph: 'Cinemagraph',
};

function sortUnique(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function normalizeFilters(filters: Filters): Filters {
  return {
    type: filters.type && filters.type.length > 0 ? sortUnique(filters.type) : undefined,
    yearRange: filters.yearRange ?? null,
  };
}

function getLabel(value: string): string {
  return TYPE_LABELS[value] ?? value.replace(/\b\w/g, letter => letter.toUpperCase());
}

function ProjectFilters({ value, onChange, available, onReset }: ProjectFiltersProps): React.ReactNode {
  const initialValueRef = useRef<Filters>(normalizeFilters(value));
  const [localFilters, setLocalFilters] = useState<Filters>(normalizeFilters(value));
  const skipNextOnChange = useRef(false);

  useEffect(() => {
    const normalized = normalizeFilters(value);
    initialValueRef.current = normalized;
    skipNextOnChange.current = true;
    setLocalFilters(normalized);
  }, [value]);

  useEffect(() => {
    if (skipNextOnChange.current) {
      skipNextOnChange.current = false;
      return;
    }
    const handle = window.setTimeout(() => {
      onChange(normalizeFilters(localFilters));
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [localFilters, onChange]);

  const availableTypes = useMemo(() => sortUnique(available.types), [available.types]);
  const availableYears = useMemo(() => {
    const years = [...available.years];
    years.sort((a, b) => a - b);
    return years;
  }, [available.years]);

  const [minYear, maxYear] = useMemo(() => {
    if (availableYears.length === 0) {
      return [undefined, undefined] as const;
    }
    return [availableYears[0], availableYears[availableYears.length - 1]] as const;
  }, [availableYears]);

  const hasActiveFilters = useMemo(() => {
    const normalized = normalizeFilters(localFilters);
    return Boolean((normalized.type && normalized.type.length > 0) || normalized.yearRange);
  }, [localFilters]);

  const handleToggleType = (type: string) => {
    setLocalFilters(prev => {
      const selected = new Set(prev.type ?? []);
      if (selected.has(type)) {
        selected.delete(type);
      } else {
        selected.add(type);
      }
      return { ...prev, type: Array.from(selected) };
    });
  };

  const handleYearChange = (index: 0 | 1, value: string) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) {
      setLocalFilters(prev => ({ ...prev, yearRange: null }));
      return;
    }

    setLocalFilters(prev => {
      const currentRange = prev.yearRange ?? [parsed, parsed];
      const nextRange: [number, number] = [...currentRange];
      nextRange[index] = parsed;
      const normalized: [number, number] = [Math.min(nextRange[0], nextRange[1]), Math.max(nextRange[0], nextRange[1])];
      return { ...prev, yearRange: normalized };
    });
  };

  const handleReset = () => {
    skipNextOnChange.current = true;
    setLocalFilters(initialValueRef.current);
    onReset?.();
  };

  return (
    <section className="rounded-radius-md border border-brand-surface-highlight/60 bg-brand-secondary/40 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-brand-text">Filter projects</h2>
        <button
          type="button"
          onClick={handleReset}
          disabled={!hasActiveFilters}
          className={clsx(
            'text-sm font-medium underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary',
            hasActiveFilters
              ? 'text-brand-accent hover:underline'
              : 'cursor-not-allowed text-brand-text-secondary/70',
          )}
        >
          Reset filters
        </button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-text-secondary">Type</legend>
          <div className="flex flex-wrap gap-2">
            {availableTypes.map(typeValue => {
              const isActive = localFilters.type?.includes(typeValue);
              return (
                <button
                  key={typeValue}
                  type="button"
                  onClick={() => handleToggleType(typeValue)}
                  className={clsx(
                    'rounded-radius-sm border px-3 py-1 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary',
                    isActive
                      ? 'border-brand-accent bg-brand-accent/10 text-brand-accent'
                      : 'border-brand-surface-highlight/60 bg-brand-primary/70 text-brand-text hover:border-brand-accent/60',
                  )}
                >
                  {getLabel(typeValue)}
                </button>
              );
            })}
            {availableTypes.length === 0 ? (
              <p className="text-sm text-brand-text-secondary">No types available.</p>
            ) : null}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-text-secondary">Year</legend>
          <div className="flex items-center gap-3">
            <label className="flex flex-col text-xs text-brand-text-secondary">
              <span className="uppercase tracking-[0.2em]">From</span>
              <input
                type="number"
                inputMode="numeric"
                value={localFilters.yearRange?.[0] ?? ''}
                onChange={event => handleYearChange(0, event.target.value)}
                min={minYear}
                max={maxYear}
                className="mt-1 w-24 rounded-radius-sm border border-brand-surface-highlight/60 bg-brand-primary/70 px-2 py-1 text-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60"
              />
            </label>
            <span className="text-brand-text-secondary">—</span>
            <label className="flex flex-col text-xs text-brand-text-secondary">
              <span className="uppercase tracking-[0.2em]">To</span>
              <input
                type="number"
                inputMode="numeric"
                value={localFilters.yearRange?.[1] ?? ''}
                onChange={event => handleYearChange(1, event.target.value)}
                min={minYear}
                max={maxYear}
                className="mt-1 w-24 rounded-radius-sm border border-brand-surface-highlight/60 bg-brand-primary/70 px-2 py-1 text-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60"
              />
            </label>
          </div>
          <p className="text-xs text-brand-text-secondary/80">
            Available {minYear && maxYear ? `${minYear} — ${maxYear}` : 'year range coming soon'}.
          </p>
        </fieldset>

      </div>
    </section>
  );
}

export default ProjectFilters;
