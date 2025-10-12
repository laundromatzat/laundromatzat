import React, { useState } from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import ProjectFilters, { Filters, ProjectFiltersProps } from '../ProjectFilters';

const DEFAULT_PROPS: ProjectFiltersProps = {
  value: { type: [], yearRange: null, tags: [] },
  onChange: () => {},
  available: { types: ['video', 'photo'], years: [2020, 2024], tags: ['travel', 'friends'] },
};

describe('ProjectFilters', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('debounces onChange calls by 200ms', () => {
    const handleChange = vi.fn();
    render(<ProjectFilters {...DEFAULT_PROPS} onChange={handleChange} />);

    fireEvent.click(screen.getByRole('button', { name: /video/i }));

    expect(handleChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(199);
    expect(handleChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith({ type: ['video'], yearRange: null, tags: undefined });
  });

  it('invokes onReset when the reset button is clicked', () => {
    const handleChange = vi.fn();
    const handleReset = vi.fn();
    const value: Filters = { type: ['video'], yearRange: [2020, 2024], tags: ['travel'] };

    function Wrapper(): React.ReactElement {
      const [filters, setFilters] = useState<Filters>(value);
      return (
        <ProjectFilters
          {...DEFAULT_PROPS}
          value={filters}
          onChange={next => {
            handleChange(next);
            setFilters(next);
          }}
          onReset={() => {
            handleReset();
            setFilters(DEFAULT_PROPS.value);
          }}
        />
      );
    }

    render(<Wrapper />);

    const resetButtons = screen.getAllByRole('button', { name: /reset filters/i });
    resetButtons.forEach(button => fireEvent.click(button));

    expect(handleReset).toHaveBeenCalled();
    vi.advanceTimersByTime(250);
    expect(handleChange).not.toHaveBeenCalledWith(value);
  });
});
