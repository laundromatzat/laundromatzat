import { useEffect, RefObject } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "video[controls]",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function focusableWithin(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (element) =>
      !element.hasAttribute("aria-hidden") &&
      // A control faded out with opacity is still focusable, but one that is
      // display:none or visibility:hidden has no layout box at all.
      (element.offsetWidth > 0 || element.offsetHeight > 0 || element === document.activeElement),
  );
}

/**
 * Keeps keyboard focus inside an open dialog and puts it back afterwards.
 *
 * Without this a Tab from the last button walks out into the page behind the
 * overlay, where a keyboard or screen-reader user cannot see what they are on,
 * and closing the dialog drops focus onto <body> instead of the card they came
 * from.
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  isActive: boolean,
): void {
  useEffect(() => {
    const container = containerRef.current;
    if (!isActive || !container) {
      return;
    }

    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Focus the dialog itself rather than its first button, so a screen reader
    // announces the title before the visitor starts tabbing.
    container.focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") {
        return;
      }

      const focusable = focusableWithin(container);
      if (focusable.length === 0) {
        event.preventDefault();
        container.focus({ preventScroll: true });
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === container)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [containerRef, isActive]);
}
