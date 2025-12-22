import React, { useMemo } from 'react';
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

function ProjectFilters({ value, onChange, available }: ProjectFiltersProps): React.ReactNode {
  // Flatten available years into a list for chips
  // We want "All", then years descending
  const yearChips = useMemo(() => {
    const years = [...available.years].sort((a, b) => b - a);
    return years;
  }, [available.years]);

  const activeYear = value.yearRange ? value.yearRange[0] : null;

  const handleYearClick = (year: number | null) => {
    if (year === null) {
      onChange({ ...value, yearRange: null });
    } else {
      // If clicking the already active year, toggle it off (reset)
      if (activeYear === year) {
        onChange({ ...value, yearRange: null });
      } else {
        onChange({ ...value, yearRange: [year, year] });
      }
    }
  };

  return (
    <div className="w-full overflow-x-auto pb-4 pt-2 scrollbar-hide">
      <div className="flex items-center gap-3 px-1">
        {/* 'All' Chip */}
        <button
          type="button"
          onClick={() => handleYearClick(null)}
          className={clsx(
            'whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium transition-all duration-300 border',
            activeYear === null
              ? 'bg-aura-text-primary text-aura-bg border-aura-text-primary'
              : 'bg-transparent text-aura-text-secondary border-aura-text-secondary/30 hover:border-aura-text-primary hover:text-aura-text-primary'
          )}
        >
          All
        </button>

        {/* Year Chips */}
        {yearChips.map(year => {
          const isActive = activeYear === year;
          return (
            <button
              key={year}
              type="button"
              onClick={() => handleYearClick(year)}
              className={clsx(
                'whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium transition-all duration-300 border',
                isActive
                  ? 'bg-aura-text-primary text-aura-bg border-aura-text-primary'
                  : 'bg-transparent text-aura-text-secondary border-aura-text-secondary/30 hover:border-aura-text-primary hover:text-aura-text-primary'
              )}
            >
              {year}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ProjectFilters;
