import React, { useEffect, useRef } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import Header from './components/Header';

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
    <div className="min-h-screen bg-brand-primary text-brand-text">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <Header />
      <main
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
        className="container px-4 sm:px-6 lg:px-8 py-space-6 lg:py-space-8"
      >
        <Outlet />
      </main>
      <ScrollRestoration />
    </div>
  );
}

export default App;
