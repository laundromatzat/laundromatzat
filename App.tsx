import React, { useEffect, useRef } from "react";
import { Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import Header from "./components/Header";
import { GlobalLoadingCursor } from "./components/GlobalLoadingCursor";

function App(): React.ReactNode {
  const mainRef = useRef<HTMLElement | null>(null);
  const location = useLocation();

  useEffect(() => {
    const mainElement = mainRef.current;
    if (!mainElement) {
      return;
    }

    const focusTimer = window.requestAnimationFrame(() => {
      mainElement.focus();
    });

    return () => window.cancelAnimationFrame(focusTimer);
  }, [location]);

  return (
    <div className="min-h-screen bg-aura-bg font-sans text-aura-text-primary selection:bg-aura-accent selection:text-aura-text-primary">
      <GlobalLoadingCursor />
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <Header />
      <main
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
        className="container px-4 sm:px-6 lg:px-8 pt-16 pb-space-6 lg:pb-space-8"
      >
        <Outlet />
      </main>
      <ScrollRestoration />
    </div>
  );
}

export default App;
