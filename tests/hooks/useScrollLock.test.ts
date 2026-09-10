import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useScrollLock } from "@/hooks/useScrollLock";

describe("useScrollLock", () => {
  afterEach(() => {
    document.body.removeAttribute("style");
    vi.restoreAllMocks();
  });

  it("pins the body so iOS cannot scroll the page behind the overlay", () => {
    Object.defineProperty(window, "scrollY", { value: 420, configurable: true });
    Object.defineProperty(window, "scrollTo", { value: vi.fn(), configurable: true });

    renderHook(() => useScrollLock(true));

    expect(document.body.style.position).toBe("fixed");
    expect(document.body.style.top).toBe("-420px");
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("restores the scroll position on unlock", () => {
    Object.defineProperty(window, "scrollY", { value: 420, configurable: true });
    const scrollTo = vi.fn();
    Object.defineProperty(window, "scrollTo", { value: scrollTo, configurable: true });

    const { unmount } = renderHook(() => useScrollLock(true));
    unmount();

    expect(document.body.style.position).toBe("");
    expect(scrollTo).toHaveBeenCalledWith(0, 420);
  });

  it("pads out the scrollbar so the page does not jump sideways", () => {
    Object.defineProperty(window, "innerWidth", { value: 1015, configurable: true });
    Object.defineProperty(document.documentElement, "clientWidth", {
      value: 1000,
      configurable: true,
    });

    renderHook(() => useScrollLock(true));

    expect(document.body.style.paddingRight).toBe("15px");
  });

  it("does nothing when inactive", () => {
    renderHook(() => useScrollLock(false));
    expect(document.body.style.position).toBe("");
  });
});
