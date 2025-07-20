import React from 'react';
import siteIcon from '../images/laundromatzat-icon.png';

export interface NavigationBarProps {
  availableTypes: string[];
  activeType: string | null;
  onSetActiveType: (type: string) => void;
  dateSortOrder: 'new' | 'old';
  onDateSortToggle: () => void;
}

export default function NavigationBar({
  availableTypes,
  activeType,
  onSetActiveType,
  dateSortOrder,
  onDateSortToggle
}: NavigationBarProps) {
  const typeIcons: Record<string, string> = {
    wash: '🧺',
    dry: '🔥',
    fold: '📦',
    video: '📹',
    image: '🖼️',
    cinemagraph: '🎞️'
  };
  return (
    <nav className="navigation-bar" aria-label="Main navigation">
      <div className="nav-container">
        <a href="/" className="site-title" aria-label="Homepage">
          <img src={siteIcon} alt="laundromatzat.com logo" className="site-icon" />
          <span className="site-title-text">laundromatzat.com</span>
        </a>
        <a href="/gallery" className="gallery-link">Gallery</a>
        <div className="menu-links" role="menubar" aria-label="Filter by content type">
          {availableTypes.map(type => (
            <button
              key={type}
              role="menuitemradio"
              aria-checked={activeType === type}
              onClick={() => onSetActiveType(type)}
              className={`nav-type-link ${activeType === type ? 'active' : ''}`}
            >
              <span className="type-icon" aria-hidden="true">{typeIcons[type] || '◻︎'}</span>
              <span className="type-label">{(type + 's').toLowerCase()}</span>
            </button>
          ))}
        </div>
        <div className="nav-action-controls">
          <button
            onClick={onDateSortToggle}
            className="date-sort-button"
            aria-label={`Sort by date. Currently ${dateSortOrder === 'new' ? 'newest first' : 'oldest first'}. Press to toggle.`}
            title={`Current sort: ${dateSortOrder === 'new' ? 'Newest First' : 'Oldest First'}. Click to change.`}
          >
            <span>date</span>
            <span className="sort-arrow" aria-hidden="true">
              {dateSortOrder === 'new' ? '▼' : '▲'}
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}
