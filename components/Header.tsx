
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import MenuIcon from './icons/MenuIcon';
import { CloseIcon } from './icons/CloseIcon';


const NavItem: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => {
  return (
    <NavLink
      to={to}
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

function Header(): React.ReactNode {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-brand-primary/80 backdrop-blur-sm sticky top-0 z-50">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <NavLink to="/" className="flex-shrink-0 flex items-center gap-2 text-white font-bold text-xl">
              <img src="/laundromatzat-icon.png" alt="Laundromatzat Icon" className="h-6 w-6" />
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
            <NavItem to="/">home</NavItem>
            <NavItem to="/images">images</NavItem>
            <NavItem to="/videos">videos</NavItem>
            <NavItem to="/cinemagraphs">cinemagraphs</NavItem>
            <NavItem to="/tools">tools</NavItem>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;