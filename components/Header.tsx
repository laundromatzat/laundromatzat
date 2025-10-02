import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import FocusTrap from 'focus-trap-react';
import clsx from 'clsx';
import MenuIcon from './icons/MenuIcon';
import { CloseIcon } from './icons/CloseIcon';

<<<<<<< Updated upstream
const NAV_ITEMS = [
  { to: '/', label: 'Home' },
  { to: '/images', label: 'Images' },
  { to: '/videos', label: 'Videos' },
  { to: '/cinemagraphs', label: 'Cinemagraphs' },
  { to: '/tools', label: 'Tools' },
  { to: '/links', label: 'Links' },
];
=======

const NavItem: React.FC<{ to: string; children: React.ReactNode; onClick?: () => void }> = ({ to, children, onClick }) => {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `block px-3 py-2 rounded-md text-base font-medium transition-colors duration-300 ${
          isActive
            ? 'bg-brand-accent text-brand-primary'
            : 'text-brand-text-secondary hover:bg-brand-secondary hover:text-brand-text'
        }`
      }
    >
      {children}
    </NavLink>
  );
};
>>>>>>> Stashed changes

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

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  return (
<<<<<<< Updated upstream
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
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
=======
    <header className="bg-brand-primary/80 backdrop-blur-sm sticky top-0 z-50">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <NavLink to="/" onClick={handleLinkClick} className="flex-shrink-0 flex items-center gap-2 text-white font-bold text-xl">
              <img src={`${import.meta.env.BASE_URL}laundromatzat-icon.png`} alt="Laundromatzat Icon" className="h-6 w-6" />
              <span>laundromatzat</span>
            </NavLink>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <NavItem to="/">home</NavItem>
              <NavItem to="/images">images</NavItem>
              <NavItem to="/videos">videos</NavItem>
              <NavItem to="/cinemagraphs">cinemagraphs</NavItem>
              <NavItem to="/tools">tools</NavItem>
              <NavItem to="/links">☻</NavItem>
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              type="button"
              className="bg-brand-secondary inline-flex items-center justify-center p-2 rounded-md text-brand-text-secondary hover:text-brand-text hover:bg-brand-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-primary focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </nav>

      {isMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <NavItem to="/" onClick={handleLinkClick}>home</NavItem>
            <NavItem to="/images" onClick={handleLinkClick}>images</NavItem>
            <NavItem to="/videos" onClick={handleLinkClick}>videos</NavItem>
            <NavItem to="/cinemagraphs" onClick={handleLinkClick}>cinemagraphs</NavItem>
            <NavItem to="/tools" onClick={handleLinkClick}>tools</NavItem>
            <NavItem to="/links" onClick={handleLinkClick}>☻</NavItem>
<<<<<<< Updated upstream
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
          </div>
        </FocusTrap>
      ) : null}
    </header>
  );
}

export default Header;
