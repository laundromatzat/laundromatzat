import React, { useRef } from 'react';
import { PortfolioItemData } from '../utils/parseCSV';

export interface PortfolioItemProps {
  item: PortfolioItemData;
  onItemClick: (item: PortfolioItemData, targetElement: HTMLElement) => void;
}

function PortfolioItem({ item, onItemClick }: PortfolioItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    if (itemRef.current) {
      onItemClick(item, itemRef.current);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      ref={itemRef}
      className="portfolio-item"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="group"
      aria-labelledby={`item-title-${item.id}`}
      tabIndex={0}
    >
      <div
        className="item-cover-image"
        style={{ backgroundImage: `url(${item.coverImage})` }}
        aria-hidden="true"
      ></div>
      <div className="item-overlay" aria-hidden="true">
        <h3 id={`item-title-${item.id}-hover`} className="item-title">{item.title}</h3>
        {item.date && <p className="item-detail item-date">{item.date}</p>}
        {item.location && <p className="item-detail item-location">{item.location}</p>}
      </div>
      <span id={`item-title-${item.id}`} className="sr-only">{item.title}</span>
    </div>
  );
}

export interface PortfolioGridProps {
  items: PortfolioItemData[];
  onItemClick: (item: PortfolioItemData, targetElement: HTMLElement) => void;
}

export default function PortfolioGrid({ items, onItemClick }: PortfolioGridProps) {
  if (!items || items.length === 0) {
    return <p className="status-message">No portfolio items match your criteria. Try adjusting filters or ensure your Google Sheet is set up correctly.</p>;
  }
  return (
    <div className="portfolio-grid" role="list">
      {items.map(item => (
        <PortfolioItem key={item.id} item={item} onItemClick={onItemClick} />
      ))}
    </div>
  );
}
