import React, { useEffect, useRef } from "react";
import { Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import Header from "@/components/Header";

function App(): React.ReactNode {
  const mainRef = useRef<HTMLElement | null>(null);
  const location = useLocation();

  useEffect(() => {
    const mainElement = mainRef.current;
    if (!mainElement) {
      return;
    }

    const focusTimer = window.requestAnimationFrame(() => {
      // Moving focus to <main> announces the new page to a screen reader, but
      // an open modal owns focus for as long as it is up. The player changes
      // the URL on every paging step, so without this check each Next press
      // would drag focus out of the dialog and behind the overlay.
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) {
        return;
      }

      mainElement.focus();
    });

    return () => window.cancelAnimationFrame(focusTimer);
  }, [location]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-aura-bg font-sans text-aura-text-primary selection:bg-aura-accent selection:text-aura-text-primary">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <Header />
      <main
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
        className="pt-16 min-h-screen flex flex-col"
      >
        <Outlet />
      </main>
      <ScrollRestoration />
    </div>
  );
}

export default App;
