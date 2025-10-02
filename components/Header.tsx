import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import FocusTrap from 'focus-trap-react';
import clsx from 'clsx';
import MenuIcon from './icons/MenuIcon';
import { CloseIcon } from './icons/CloseIcon';

const NAV_ITEMS = [
  { to: '/', label: 'Home' },
  { to: '/images', label: 'Images' },
  { to: '/videos', label: 'Videos' },
  { to: '/cinemagraphs', label: 'Cinemagraphs' },
  { to: '/tools', label: 'Tools' },
  { to: '/links', label: 'Links' },
];

function Header(): React.ReactNode {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const location = useLocation();

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  useEffect(() => {
    if (!isMenuOpen) {
      menuButtonRef.current?.focus();
    }
  }, [isMenuOpen]);

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = event => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      setIsMenuOpen(false);
    }
  };

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-nav border-b border-brand-surface-highlight/60 bg-brand-primary/90 backdrop-blur-md">
      <nav aria-label="Primary" className="container px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <NavLink
            to="/"
            className="flex items-center gap-3 text-lg font-semibold text-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary"
          >
            <img
              src={`${import.meta.env.BASE_URL}laundromatzat-icon.png`}
              alt="Laundromatzat logo"
              className="h-7 w-7"
              width={28}
              height={28}
            />
            laundromatzat
          </NavLink>

          <ul className="hidden items-center gap-2 md:flex" role="list">
            {NAV_ITEMS.map(item => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    clsx(
                      'rounded-radius-md px-3 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary',
                      isActive
                        ? 'bg-brand-accent text-brand-on-accent'
                        : 'text-brand-text-secondary hover:bg-brand-secondary/70 hover:text-brand-text',
                    )
                  }
                  end={item.to === '/'}
                  onClick={handleLinkClick}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <button
            ref={menuButtonRef}
            type="button"
            className="inline-flex items-center justify-center rounded-radius-md border border-brand-surface-highlight/60 bg-brand-secondary px-3 py-2 text-brand-text md:hidden"
            aria-controls="mobile-navigation"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen(prev => !prev)}
          >
            <span className="sr-only">Toggle navigation</span>
            {isMenuOpen ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {isMenuOpen ? (
        <FocusTrap
          focusTrapOptions={{
            clickOutsideDeactivates: true,
            escapeDeactivates: true,
            fallbackFocus: '#mobile-navigation',
            onDeactivate: () => setIsMenuOpen(false),
          }}
        >
          <div className="md:hidden" role="presentation">
            <div className="fixed inset-0 z-nav bg-black/60" aria-hidden="true" onClick={() => setIsMenuOpen(false)} />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-navigation-title"
              className="fixed inset-y-0 right-0 z-modal flex w-full max-w-xs flex-col overflow-y-auto border-l border-brand-surface-highlight/60 bg-brand-secondary px-4 py-6 shadow-layer-1"
              id="mobile-navigation"
              tabIndex={-1}
              onKeyDown={handleKeyDown}
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 id="mobile-navigation-title" className="text-lg font-semibold text-brand-text">
                  Navigation
                </h2>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-radius-md p-2 text-brand-text-secondary transition hover:text-brand-text"
                >
                  <span className="sr-only">Close menu</span>
                  <CloseIcon className="h-6 w-6" />
                </button>
              </div>
              <ul className="space-y-2" role="list">
                {NAV_ITEMS.map(item => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === '/'}
                      className={({ isActive }) =>
                        clsx(
                          'block rounded-radius-md px-3 py-2 text-base font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-secondary',
                          isActive
                            ? 'bg-brand-accent text-brand-on-accent'
                            : 'text-brand-text-secondary hover:bg-brand-primary/40 hover:text-brand-text',
                        )
                      }
                      onClick={handleLinkClick}
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </FocusTrap>
      ) : null}
    </header>
  );
}

export default Header;
