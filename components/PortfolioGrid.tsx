import React, { useRef, useState, useEffect } from 'react';
import { PortfolioItemData } from '../utils/parseCSV';

export interface PortfolioItemProps {
  item: PortfolioItemData;
  onItemClick: (item: PortfolioItemData, targetElement: HTMLElement) => void;
}

function PortfolioItem({ item, onItemClick }: PortfolioItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '0px 0px 200px 0px', // Pre-load images 200px below the viewport
      }
    );

    if (itemRef.current) {
      observer.observe(itemRef.current);
    }

    return () => {
      if (itemRef.current) {
        observer.unobserve(itemRef.current);
      }
    };
  }, [itemRef]);

  useEffect(() => {
    if (isVisible) {
      const img = new Image();
      img.src = item.coverImage;
      img.onload = () => {
        setIsLoaded(true);
      };
    }
  }, [isVisible, item.coverImage]);

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

  const typeIcons: Record<string, string> = {
    wash: '🧺',
    dry: '🔥',
    fold: '📦',
    video: '📹',
    image: '🖼️',
    cinemagraph: '🎞️'
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
        className={`item-cover-image ${isLoaded ? 'loaded' : ''}`}
        style={{ backgroundImage: isLoaded ? `url(${item.coverImage})` : 'none' }}
        aria-hidden="true"
      ></div>
      <div className="item-overlay" aria-hidden="true">
        <span className="item-type-icon" aria-hidden="true">{typeIcons[item.type] || '◻︎'}</span>
        <h3 id={`item-title-${item.id}-hover`} className="item-title">{item.title}</h3>
        {item.date && <p className="item-detail item-date">{item.date}</p>}
        {item.location && <p className="item-detail item-location">{item.location}</p>}
      </div>
      <span id={`item-title-${item.id}`} className="sr-only">{item.title}</span>
    </div>
  );
}

export interface PortfolioGridProps {
  items: Record<string, PortfolioItemData[]>;
  onItemClick: (item: PortfolioItemData, targetElement: HTMLElement) => void;
}

export default function PortfolioGrid({ items, onItemClick }: PortfolioGridProps) {
  const years = Object.keys(items).sort((a, b) => parseInt(b) - parseInt(a));

  if (years.length === 0) {
    return <p className="status-message">No portfolio items match your criteria. Try adjusting filters or ensure your Google Sheet is set up correctly.</p>;
  }
  return (
    <>
      {years.map(year => (
        <div key={year} className="year-group">
          <h2 className="year-subheader">{year}</h2>
          <div className="portfolio-grid" role="list">
            {items[year].map(item => (
              <PortfolioItem key={item.id} item={item} onItemClick={onItemClick} />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
