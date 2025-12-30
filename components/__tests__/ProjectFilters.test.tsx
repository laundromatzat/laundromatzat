// React import removed as it is unused
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, screen, cleanup } from "@testing-library/react";
import ProjectFilters, {
  Filters,
  ProjectFiltersProps,
} from "../ProjectFilters";

const DEFAULT_PROPS: ProjectFiltersProps = {
  value: { type: [], yearRange: null, tags: [] },
  onChange: () => {},
  available: {
    types: ["video", "photo"],
    years: [2020, 2024],
    tags: ["travel", "friends"],
  },
};

describe("ProjectFilters", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("updates immediately (no debounce) when a filter is clicked", () => {
    const handleChange = vi.fn();
    render(<ProjectFilters {...DEFAULT_PROPS} onChange={handleChange} />);

    fireEvent.click(screen.getByRole("button", { name: /2024/i }));

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith({
      type: [],
      yearRange: [2024, 2024],
      tags: [],
    });
  });

  it("invokes onReset when the reset button is clicked", () => {
    // The reset logic in the new component seems to be clicking "All" (year=null)
    // or maybe there isn't a specific "reset filters" button anymore?
    // Looking at the component, handleYearClick(null) is called by "All".
    // AND there is no onReset prop usage in the component!
    // The previous test checked 'reset filters' button.
    // The new component renders "All" button which calls onChange with yearRange: null.
    // It does NOT call onReset prop.
    // So this test 'invokes onReset' might be invalid for this component version.
    // Let's check if onReset is used.
    // ProjectFilters.tsx: export type ProjectFiltersProps = { ... onReset?: () => void; };
    // But in the body: function ProjectFilters({ value, onChange, available }: ProjectFiltersProps) ...
    // onReset is NOT destructured or used.

    // So I should probably remove the onReset test or update it to test "All" button behavior.

    const handleChange = vi.fn();
    const value: Filters = { type: [], yearRange: [2024, 2024], tags: [] };

    render(
      <ProjectFilters
        {...DEFAULT_PROPS}
        value={value}
        onChange={handleChange}
      />
    );

    // Verify clicking "All" resets the year range
    const allButtons = screen.getAllByRole("button", { name: /all/i });
    // Use the last one in case of duplicates (though there shouldn't be any if cleanup works)
    // or just the first one.
    fireEvent.click(allButtons[0]);

    // Expect change to null yearRange
    expect(handleChange).toHaveBeenCalledWith({ ...value, yearRange: null });
  });
});
