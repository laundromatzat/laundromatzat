import React from 'react';

export interface NavigationBarProps {
  availableTypes: string[];
  activeType: string | null;
  onSetActiveType: (type: string) => void;
}

export default function NavigationBar({
  availableTypes,
  activeType,
  onSetActiveType
}: NavigationBarProps) {
  return (
    <nav className="navigation-bar" aria-label="Main navigation">
      <div className="nav-container">
        <a href="/" className="site-title" aria-label="Homepage">
          <img src="/images/laundromatzat-icon.png" alt="laundromatzat.com logo" className="site-icon" />
          <span className="site-title-text">laundromatzat.com</span>
        </a>
        <div className="menu-links" role="menubar" aria-label="Filter by content type">
          {availableTypes.map(type => (
            <button
              key={type}
              role="menuitemradio"
              aria-checked={activeType === type}
              onClick={() => onSetActiveType(type)}
              className={`nav-type-link ${activeType === type ? 'active' : ''}`}
            >
              <span className="type-label">{(type + 's').toLowerCase()}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
