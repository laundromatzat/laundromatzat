
import React from 'react';
import { NavLink } from 'react-router-dom';


const NavItem: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${
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
        </div>
      </nav>
    </header>
  );
}

export default Header;