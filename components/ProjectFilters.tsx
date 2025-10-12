import React from 'react';

export type ProjectFiltersValue = {
  type?: 'Video' | 'Photo' | 'Cinemagraph';
  yearFrom?: string;
  yearTo?: string;
  tags: string[];
};

interface ProjectFiltersProps {
  types: Array<{ label: string; value: ProjectFiltersValue['type'] }>;
  tags: string[];
  value: ProjectFiltersValue;
  onChange: (value: ProjectFiltersValue) => void;
  onReset: () => void;
}

function ProjectFilters({ types, tags, value, onChange, onReset }: ProjectFiltersProps): React.ReactNode {
  const activeFilterCount = Number(Boolean(value.type)) + Number(Boolean(value.yearFrom || value.yearTo)) + value.tags.length;

  const handleTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextType = event.target.value as ProjectFiltersValue['type'] | '';
    onChange({
      ...value,
      type: nextType || undefined,
    });
  };

  const handleYearFromChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextYear = event.target.value.trim();
    onChange({
      ...value,
      yearFrom: nextYear ? nextYear : undefined,
    });
  };

  const handleYearToChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextYear = event.target.value.trim();
    onChange({
      ...value,
      yearTo: nextYear ? nextYear : undefined,
    });
  };

  const toggleTag = (tag: string) => {
    const hasTag = value.tags.includes(tag);
    const nextTags = hasTag ? value.tags.filter(existing => existing !== tag) : [...value.tags, tag];
    onChange({
      ...value,
      tags: nextTags,
    });
  };

  return (
    <section
      aria-label="Project filters"
      className="rounded-radius-md border border-brand-surface-highlight/60 bg-brand-secondary/40 p-4 sm:p-6"
    >
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-brand-text">Filter the collection</h3>
            <p className="text-sm text-brand-text-secondary">
              Narrow the grid by media type, year, or tags. Filters apply automatically as you make selections.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {activeFilterCount > 0 ? (
              <span className="rounded-full bg-brand-primary px-3 py-1 text-xs font-medium uppercase tracking-wide text-brand-text-secondary">
                {activeFilterCount} active
              </span>
            ) : null}
            <button
              type="button"
              onClick={onReset}
              className="text-sm font-medium text-brand-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-secondary"
            >
              Clear filters
            </button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="project-type" className="text-sm font-medium text-brand-text">
                Type
              </label>
              <select
                id="project-type"
                value={value.type ?? ''}
                onChange={handleTypeChange}
                className="w-full rounded-radius-sm border border-brand-surface-highlight/70 bg-brand-primary px-3 py-2 text-sm text-brand-text focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/60"
              >
                <option value="">All types</option>
                {types.map(option => (
                  <option key={option.label} value={option.value ?? ''}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-brand-text">Year range</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label htmlFor="year-from" className="text-xs uppercase tracking-wide text-brand-text-secondary">
                    From
                  </label>
                  <input
                    id="year-from"
                    inputMode="numeric"
                    pattern="\\d*"
                    placeholder="e.g. 2015"
                    value={value.yearFrom ?? ''}
                    onChange={handleYearFromChange}
                    className="w-full rounded-radius-sm border border-brand-surface-highlight/70 bg-brand-primary px-3 py-2 text-sm text-brand-text focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/60"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="year-to" className="text-xs uppercase tracking-wide text-brand-text-secondary">
                    To
                  </label>
                  <input
                    id="year-to"
                    inputMode="numeric"
                    pattern="\\d*"
                    placeholder="e.g. 2024"
                    value={value.yearTo ?? ''}
                    onChange={handleYearToChange}
                    className="w-full rounded-radius-sm border border-brand-surface-highlight/70 bg-brand-primary px-3 py-2 text-sm text-brand-text focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/60"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-brand-text">Tags</p>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => {
                const isActive = value.tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    aria-pressed={isActive}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-secondary ${
                      isActive
                        ? 'border-brand-accent bg-brand-accent text-brand-on-accent'
                        : 'border-brand-surface-highlight/60 bg-brand-primary text-brand-text hover:border-brand-accent hover:text-brand-text'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProjectFilters;
