/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom/client';

// !!! IMPORTANT: REPLACE WITH YOUR ACTUAL PUBLISHED GOOGLE SHEET CSV URL !!!
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQTTlqDzuJCj-vRQiSNTtdSlaeb4VhJEVzia25ETVWaG1TC7UViLUrPFWKKK9PFdBiumGNSxX2fUKUa/pub?gid=0&single=true&output=csv';

interface PortfolioItemData {
  id: number;
  title: string;
  type: string;
  coverImage: string;
  sourceUrl?: string;
  date?: string;
  location?: string;
  gpsCoords?: string; // Expected "latitude,longitude"
  feat?: string;
  description?: string;
  easterEgg?: string;
}

// Helper function to parse CSV text to PortfolioItemData array
function parseCSVToPortfolioItems(csvText: string): PortfolioItemData[] {
  console.log("Attempting to parse CSV data. Raw CSV text received (first 500 chars):", csvText.substring(0, 500));
  const lines = csvText.trim().split(/\r\n|\n/);
  
  if (lines.length === 0) {
    console.error("CSV Parsing Error: No lines found in CSV data.");
    throw new Error("CSV data is empty or malformed (no lines).");
  }
  if (lines.length === 1) {
    console.warn("CSV Parsing Warning: Only one line found in CSV data. A header row and at least one data row are expected. Line content:", lines[0]);
    if (lines[0].includes(',') && lines[0].trim() !== "") {
        console.error("CSV Parsing Error: Only one line found, and it appears to be a data row. A header row is required.");
        throw new Error("CSV data must contain a header row. Only a single data-like line was found.");
    } else {
        console.warn("CSV Parsing Warning: Single line found does not appear to be a valid data row, and no header is present. Effectively no data.");
        return [];
    }
  }

  const headers = lines[0].split(',').map(header => header.trim().replace(/^"|"$/g, ''));
  console.log("Parsed CSV Headers:", headers);
  const portfolioItems: PortfolioItemData[] = [];

  const idIndex = headers.indexOf('id');
  const titleIndex = headers.indexOf('title');
  const typeIndex = headers.indexOf('type');
  const coverImageIndex = headers.indexOf('coverImage');
  const sourceUrlIndex = headers.indexOf('sourceUrl'); 
  const dateIndex = headers.indexOf('date');
  const locationIndex = headers.indexOf('location');
  const gpsCoordsIndex = headers.indexOf('gpsCoords');
  const featIndex = headers.indexOf('feat');
  const descriptionIndex = headers.indexOf('description');
  const easterEggIndex = headers.indexOf('easterEgg');

  if (idIndex === -1 || titleIndex === -1 || typeIndex === -1 || coverImageIndex === -1) {
    console.error(`CSV Header Error: Missing one or more required columns. Found headers: [${headers.join(', ')}]. Required: id, title, type, coverImage.`);
    throw new Error('CSV headers are missing one or more required columns: id, title, type, coverImage. Check console for found headers.');
  }

  for (let lineIdx = 1; lineIdx < lines.length; lineIdx++) {
    const originalLineContent = lines[lineIdx]; 
    const lineContent = originalLineContent.trim();
    if (!lineContent) { 
        console.warn(`Skipping empty CSV line at sheet row ${lineIdx + 1}.`);
        continue;
    }
    
    const values: string[] = [];
    let currentPosition = 0;
    while (currentPosition < lineContent.length) {
        let value = "";
        let inQuotes = false;

        if (lineContent[currentPosition] === '"') {
            inQuotes = true;
            currentPosition++; 
            let charBuffer = "";
            while (currentPosition < lineContent.length) {
                if (lineContent[currentPosition] === '"') {
                    if (currentPosition + 1 < lineContent.length && lineContent[currentPosition + 1] === '"') {
                        charBuffer += '"';
                        currentPosition += 2; 
                    } else {
                        currentPosition++; 
                        inQuotes = false; 
                        break; 
                    }
                } else {
                    charBuffer += lineContent[currentPosition];
                    currentPosition++;
                }
            }
            value = charBuffer;
            if (inQuotes) { 
                console.warn(`Malformed CSV: Unclosed quoted field on line ${lineIdx + 1}. Original line: "${originalLineContent}". Partial value: "${value}"`);
            }
        } else { 
            let charBuffer = "";
            const commaIndex = lineContent.indexOf(',', currentPosition);
            if (commaIndex === -1) { 
                charBuffer = lineContent.substring(currentPosition);
                currentPosition = lineContent.length;
            } else {
                charBuffer = lineContent.substring(currentPosition, commaIndex);
                currentPosition = commaIndex;
            }
            value = charBuffer;
        }
        
        values.push(value.trim());

        if (currentPosition < lineContent.length && lineContent[currentPosition] === ',') {
            currentPosition++; 
            if (currentPosition === lineContent.length) {
                values.push('');
            }
        } else if (currentPosition === lineContent.length) {
            break;
        }
    }
    const processedValues = values;

    if (processedValues.length === 0 && lineContent.length > 0) {
      console.warn(`Skipping line at sheet row ${lineIdx + 1} as it was parsed into zero values despite having content. Original line: "${originalLineContent}"`);
      continue;
    }
    
    const idString = idIndex < processedValues.length ? processedValues[idIndex] : undefined;
     if (idString === undefined || idString === null || idString.trim() === "") {
        console.warn(`Skipping line at sheet row ${lineIdx + 1} due to missing or empty ID. Processed values: [${processedValues.map(v => `"${v}"`).join(', ')}]. Original line: "${originalLineContent}"`);
        continue;
    }
    const id = parseInt(idString, 10);

    if (isNaN(id)) {
        console.warn(`Skipping line at sheet row ${lineIdx + 1} due to invalid or non-numeric ID. Attempted to parse: "${idString}". Processed values: [${processedValues.map(v => `"${v}"`).join(', ')}]. Original line: "${originalLineContent}"`);
        continue;
    }
    
    const title = titleIndex < processedValues.length && processedValues[titleIndex] ? processedValues[titleIndex] : 'Untitled';
    const type = typeIndex < processedValues.length && processedValues[typeIndex] ? processedValues[typeIndex].toLowerCase() : 'image';
    
    let actualCoverImage = coverImageIndex < processedValues.length ? (processedValues[coverImageIndex]?.trim() || '') : '';
    const sourceUrl = sourceUrlIndex !== -1 && sourceUrlIndex < processedValues.length ? (processedValues[sourceUrlIndex]?.trim() || undefined) : undefined;

    if (!actualCoverImage && sourceUrl) {
        console.log(`Row ${lineIdx + 1} (ID: ${id}): coverImage is empty, using sourceUrl ("${sourceUrl}") as fallback for cover image.`);
        actualCoverImage = sourceUrl;
    }
    
    if (!actualCoverImage) {
        console.warn(`Skipping line at sheet row ${lineIdx + 1} (ID: ${id}) due to missing or empty coverImage (and no usable sourceUrl fallback). Processed values: [${processedValues.map(v => `"${v}"`).join(', ')}]. Original line: "${originalLineContent}"`);
        continue;
    }

    if (!title.trim() && title !== 'Untitled') { 
        console.warn(`Item with ID ${id} (sheet row ${lineIdx + 1}) has an empty or whitespace-only title. It will be displayed as 'Untitled'. Original line: "${originalLineContent}"`);
    }

    const itemData: PortfolioItemData = {
      id: id,
      title: title,
      type: type,
      coverImage: actualCoverImage, 
      sourceUrl: sourceUrl, 
      date: dateIndex !== -1 && dateIndex < processedValues.length ? (processedValues[dateIndex]?.trim() || undefined) : undefined,
      location: locationIndex !== -1 && locationIndex < processedValues.length ? (processedValues[locationIndex]?.trim() || undefined) : undefined,
      gpsCoords: gpsCoordsIndex !== -1 && gpsCoordsIndex < processedValues.length ? (processedValues[gpsCoordsIndex]?.trim() || undefined) : undefined,
      feat: featIndex !== -1 && featIndex < processedValues.length ? (processedValues[featIndex] || undefined) : undefined,
      description: descriptionIndex !== -1 && descriptionIndex < processedValues.length ? (processedValues[descriptionIndex] || undefined) : undefined,
      easterEgg: easterEggIndex !== -1 && easterEggIndex < processedValues.length ? (processedValues[easterEggIndex] || undefined) : undefined,
    };
    portfolioItems.push(itemData);
  }
  console.log("Successfully parsed portfolio items:", portfolioItems);
  return portfolioItems;
}

// Helper function to parse dates, prioritizing MM/YYYY
function parsePortfolioDate(dateString?: string): Date | null {
  if (!dateString) return null;

  // Try MM/YYYY format
  const parts = dateString.split('/');
  if (parts.length === 2) {
    const month = parseInt(parts[0], 10);
    const year = parseInt(parts[1], 10);
    // Basic validation for MM/YYYY
    if (!isNaN(month) && !isNaN(year) && month >= 1 && month <= 12 && year > 1000 && year < 3000) { // Assuming year is reasonable
      return new Date(year, month - 1, 1); // month is 0-indexed in JS Date
    }
  }

  // Fallback to standard Date parsing for other formats (e.g., YYYY-MM-DD, full date strings)
  const standardDate = new Date(dateString);
  if (!isNaN(standardDate.getTime())) {
    return standardDate;
  }

  return null; // Could not parse
}

interface NavigationBarProps {
  availableTypes: string[];
  activeType: string | null;
  onSetActiveType: (type: string) => void;
  dateSortOrder: 'new' | 'old';
  onDateSortToggle: () => void;
  viewMode: 'grid' | 'map';
  onViewModeToggle: () => void;
  hasGpsData: boolean;
}

function NavigationBar({
  availableTypes,
  activeType,
  onSetActiveType,
  dateSortOrder,
  onDateSortToggle,
  viewMode,
  onViewModeToggle,
  hasGpsData
}: NavigationBarProps) {
  return (
    <nav className="navigation-bar" aria-label="Main navigation">
      <div className="nav-container">
        <a href="/" className="site-title" aria-label="Homepage">laundromatzat.com</a>
        <div className="menu-links" role="menubar" aria-label="Filter by content type">
          {availableTypes.map(type => (
            <button
              key={type}
              role="menuitemradio"
              aria-checked={activeType === type}
              onClick={() => onSetActiveType(type)}
              className={`nav-type-link ${activeType === type ? 'active' : ''}`}
            >
              {(type + 's').toLowerCase()}
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
          {hasGpsData && (
            <button 
              onClick={onViewModeToggle} 
              className="view-mode-toggle-button"
              aria-label={viewMode === 'grid' ? "Switch to Map View" : "Switch to Grid View"}
              title={viewMode === 'grid' ? "Switch to Map View" : "Switch to Grid View"}
            >
              <span aria-hidden="true" className="map-icon">🗺️</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

interface PortfolioItemProps {
  item: PortfolioItemData;
  onItemClick: (item: PortfolioItemData, targetElement: HTMLElement) => void;
}

function PortfolioItem({ item, onItemClick }: PortfolioItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => {
    if (itemRef.current) {
        onItemClick(item, itemRef.current);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e);
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

const ALL_POSSIBLE_TYPES = ['image', 'video', 'cinemagraph']; 

interface PortfolioGridProps {
  items: PortfolioItemData[];
  onItemClick: (item: PortfolioItemData, targetElement: HTMLElement) => void;
}

function PortfolioGrid({ items, onItemClick }: PortfolioGridProps) {
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

interface PortfolioMapProps {
  items: PortfolioItemData[];
  onItemClick: (item: PortfolioItemData, targetElement: HTMLElement) => void;
}

function PortfolioMap({ items, onItemClick }: PortfolioMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  const itemsWithGps = useMemo(() => {
    return items.filter(item => {
      if (!item.gpsCoords) return false;
      const parts = item.gpsCoords.split(',');
      return parts.length === 2 && !isNaN(parseFloat(parts[0])) && !isNaN(parseFloat(parts[1]));
    }).map(item => {
      const parts = item.gpsCoords!.split(',');
      return { ...item, lat: parseFloat(parts[0]), lon: parseFloat(parts[1]) };
    });
  }, [items]);

  const bounds = useMemo(() => {
    if (itemsWithGps.length === 0) return null;
    let minLat = itemsWithGps[0].lat, maxLat = itemsWithGps[0].lat;
    let minLon = itemsWithGps[0].lon, maxLon = itemsWithGps[0].lon;
    itemsWithGps.forEach(item => {
      minLat = Math.min(minLat, item.lat);
      maxLat = Math.max(maxLat, item.lat);
      minLon = Math.min(minLon, item.lon);
      maxLon = Math.max(maxLon, item.lon);
    });
    return { minLat, maxLat, minLon, maxLon };
  }, [itemsWithGps]);

  if (itemsWithGps.length === 0) {
    return <p className="status-message">No items with GPS coordinates to display on the map for the current filters. Try adjusting filters or adding GPS data to your sheet.</p>;
  }
  
  const getPosition = (lat: number, lon: number, mapWidth: number, mapHeight: number) => {
    if (!bounds) return { x: 0, y: 0 };
    const lonRange = bounds.maxLon - bounds.minLon;
    let x = lonRange === 0 ? 0.5 : (lon - bounds.minLon) / lonRange;
    
    const latRange = bounds.maxLat - bounds.minLat;
    let y = latRange === 0 ? 0.5 : (bounds.maxLat - lat) / latRange;

    const padding = 0.05; 
    x = padding + x * (1 - 2 * padding);
    y = padding + y * (1 - 2 * padding);

    return {
      x: x * mapWidth,
      y: y * mapHeight,
    };
  };


  return (
    <div ref={mapRef} className="portfolio-map-container" role="application" aria-label="Portfolio items map">
      <p className="sr-only">Map of portfolio items. Use tab to navigate through items.</p>
      {itemsWithGps.map((item, index) => {
        const mapWidth = mapRef.current?.clientWidth || 600; 
        const mapHeight = mapRef.current?.clientHeight || 400; 
        const { x, y } = getPosition(item.lat, item.lon, mapWidth, mapHeight);
        
        const markerRef = React.createRef<HTMLButtonElement>();

        return (
          <button
            key={item.id}
            ref={markerRef}
            className="map-marker"
            style={{ 
              left: `${x}px`, 
              top: `${y}px`,
              backgroundImage: `url(${item.coverImage})` 
            }}
            onClick={() => {
              if (markerRef.current) {
                onItemClick(item, markerRef.current);
              }
            }}
            aria-label={`View details for ${item.title} located at ${item.location || 'unknown location'}`}
            title={`${item.title}${item.location ? ` - ${item.location}` : ''}`}
          >
            <span className="sr-only">{item.title}</span>
          </button>
        );
      })}
       <div className="map-attribution">Simplified map view. Not to scale.</div>
    </div>
  );
}


interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: PortfolioItemData | null;
}

function Modal({ isOpen, onClose, item }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.classList.add('body-modal-open');
      closeButtonRef.current?.focus(); 
    } else {
      document.body.classList.remove('body-modal-open');
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('body-modal-open');
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) { 
          if (document.activeElement === firstElement) {
            lastElement.focus();
            event.preventDefault();
          }
        } else { 
          if (document.activeElement === lastElement) {
            firstElement.focus();
            event.preventDefault();
          }
        }
      }
    };
    const currentModalRef = modalRef.current;
    currentModalRef.addEventListener('keydown', handleTabKeyPress);
    return () => {
      currentModalRef?.removeEventListener('keydown', handleTabKeyPress);
    };
  }, [isOpen]);


  if (!isOpen || !item) {
    return null;
  }

  const contentId = `modal-content-${item.id}`;
  const titleId = `modal-title-${item.id}`;

  let mediaElement;

  if (item.type === 'video' && item.sourceUrl) { 
    mediaElement = <video src={item.sourceUrl} controls autoPlay muted playsInline aria-describedby={titleId} key={`${item.id}-video`}></video>;
  } else if (item.type === 'cinemagraph') {
    const sourceToUse = item.sourceUrl || item.coverImage; 
    const isVideoFormat = /\.(mp4|webm|ogv)$/i.test(sourceToUse);
    if (isVideoFormat) {
      mediaElement = <video src={sourceToUse} autoPlay loop muted playsInline aria-label={`${item.title} (cinemagraph)`} aria-describedby={titleId} key={`${item.id}-cinemagraph-video`}></video>;
    } else { 
      mediaElement = <img src={sourceToUse} alt={`${item.title} (cinemagraph)`} aria-describedby={titleId} key={`${item.id}-cinemagraph-img`}/>;
    }
  } else if (item.coverImage) { 
    mediaElement = <img src={item.coverImage} alt={item.title} aria-describedby={titleId} key={`${item.id}-image`}/>;
  } else {
    mediaElement = <p>Media not available.</p>;
  }

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="presentation" 
    >
      <div
        ref={modalRef}
        className="modal-dialog"
        onClick={e => e.stopPropagation()} 
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={contentId} 
      >
        <button
          id={`modal-close-button-${item.id}`}
          ref={closeButtonRef}
          className="modal-close-button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          &times;
        </button>
        <div className="modal-content" id={contentId}>
          <h2 id={titleId} className="modal-title">{item.title}</h2>
          <div className="modal-media-container">
            {mediaElement}
          </div>
          <div className="modal-details">
            {item.description && <p className="modal-description"><strong>Description:</strong> {item.description}</p>}
            {item.date && <p className="modal-date"><strong>Date:</strong> {item.date}</p>}
            {item.location && <p className="modal-location"><strong>Location:</strong> {item.location}</p>}
            {item.feat && <p className="modal-feat"><strong>Featuring:</strong> {item.feat}</p>}
            {item.gpsCoords && <p className="modal-gps"><strong>GPS:</strong> {item.gpsCoords}</p>}
            {item.easterEgg && <p className="modal-easter-egg">🤫: {item.easterEgg}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="app-footer">
      <p>&copy; {currentYear} laundromatzat.com</p>
    </footer>
  );
}

function App() {
  const [allPortfolioItems, setAllPortfolioItems] = useState<PortfolioItemData[]>([]);
  const [displayedItems, setDisplayedItems] = useState<PortfolioItemData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedModalItem, setSelectedModalItem] = useState<PortfolioItemData | null>(null);
  const [lastFocusedElement, setLastFocusedElement] = useState<HTMLElement | null>(null);

  const [availableTypesInSheet, setAvailableTypesInSheet] = useState<string[]>([]);
  const [activeType, setActiveType] = useState<string | null>(null); 
  const [dateSortOrder, setDateSortOrder] = useState<'new' | 'old'>('new');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [hasAnyGpsData, setHasAnyGpsData] = useState<boolean>(false);


  useEffect(() => {
    async function fetchData() {
      if (!GOOGLE_SHEET_CSV_URL || GOOGLE_SHEET_CSV_URL.includes('YOUR_UNIQUE_ID') || GOOGLE_SHEET_CSV_URL.includes('YOUR_ACTUAL_PUBLISHED_GOOGLE_SHEET_CSV_URL')) {
        setError("Configuration needed: Please update GOOGLE_SHEET_CSV_URL in index.tsx with your actual published Google Sheet CSV link.");
        setLoading(false);
        console.error("GOOGLE_SHEET_CSV_URL is not configured correctly or is using a placeholder.");
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const cacheBustUrl = `${GOOGLE_SHEET_CSV_URL}${GOOGLE_SHEET_CSV_URL.includes('?') ? '&' : '?'}cb=${new Date().getTime()}`;
        console.log("Fetching data from (with cache-busting):", cacheBustUrl);
        
        const response = await fetch(cacheBustUrl);
        console.log("Fetch response status:", response.status);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}. Failed to fetch from Google Sheet. Ensure the URL is correct, the sheet is published as CSV, and accessible.`);
        }
        const csvText = await response.text();
        if (!csvText.trim()) {
            console.error("Fetched CSV data is empty.");
            throw new Error("Fetched CSV data is empty. Check your Google Sheet content and publishing settings.");
        }
        
        const data = parseCSVToPortfolioItems(csvText);
        setAllPortfolioItems(data);
        
        const typesFromData = new Set<string>();
        let foundGps = false;
        data.forEach(item => {
          if (item.type) typesFromData.add(item.type.toLowerCase());
          if (item.gpsCoords && item.gpsCoords.includes(',')) foundGps = true;
        });
        
        const sortedTypes = ALL_POSSIBLE_TYPES.filter(t => typesFromData.has(t));
        setAvailableTypesInSheet(sortedTypes);
        
        if (sortedTypes.includes('video')) {
          setActiveType('video');
        } else if (sortedTypes.length > 0) {
          setActiveType(sortedTypes[0]);
        } else {
          setActiveType(null);
        }
        setHasAnyGpsData(foundGps);

      } catch (e: any) {
        console.error("Failed to fetch or parse portfolio data:", e);
        setError(`Failed to load portfolio: ${e.message}. Check browser console for more details and ensure CSV format is correct.`);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    let itemsToProcess = [...allPortfolioItems];

    if (activeType) {
      itemsToProcess = itemsToProcess.filter(item => item.type.toLowerCase() === activeType);
    } else if (availableTypesInSheet.length > 0) { 
      itemsToProcess = [];
    }
        
    itemsToProcess.sort((a, b) => {
        const dateObjA = parsePortfolioDate(a.date);
        const dateObjB = parsePortfolioDate(b.date);

        const timeA = dateObjA ? dateObjA.getTime() : NaN;
        const timeB = dateObjB ? dateObjB.getTime() : NaN;
        
        const isValidA = !isNaN(timeA);
        const isValidB = !isNaN(timeB);

        if (isValidA && isValidB) {
            return dateSortOrder === 'new' ? timeB - timeA : timeA - timeB;
        }
        if (isValidA) return dateSortOrder === 'new' ? -1 : 1;
        if (isValidB) return dateSortOrder === 'new' ? 1 : -1;
        return 0;
    });
    
    setDisplayedItems(itemsToProcess);
  }, [allPortfolioItems, activeType, dateSortOrder, availableTypesInSheet]);


  const handleOpenModal = (item: PortfolioItemData, targetElement: HTMLElement) => {
    setLastFocusedElement(targetElement || document.activeElement as HTMLElement);
    setSelectedModalItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedModalItem(null); 
    lastFocusedElement?.focus();
  };

  const handleSetActiveType = (typeToSet: string) => {
    setActiveType(typeToSet);
  };
  
  const handleDateSortToggle = () => {
    setDateSortOrder(prevOrder => prevOrder === 'new' ? 'old' : 'new');
  };

  const handleViewModeToggle = () => {
    setViewMode(prevMode => prevMode === 'grid' ? 'map' : 'grid');
  };

  return (
    <div className="app-container">
      <NavigationBar 
        availableTypes={availableTypesInSheet}
        activeType={activeType}
        onSetActiveType={handleSetActiveType}
        dateSortOrder={dateSortOrder}
        onDateSortToggle={handleDateSortToggle}
        viewMode={viewMode}
        onViewModeToggle={handleViewModeToggle}
        hasGpsData={hasAnyGpsData}
      />
      <main id="main-content-area" aria-live="polite">
        {loading && <p className="status-message">Loading portfolio from Google Sheet...</p>}
        {error && <p className="status-message error-message">{error}</p>}
        
        {!loading && !error && viewMode === 'grid' && (
          <PortfolioGrid items={displayedItems} onItemClick={handleOpenModal} />
        )}
        {!loading && !error && viewMode === 'map' && hasAnyGpsData && (
          <PortfolioMap items={displayedItems} onItemClick={handleOpenModal} />
        )}
         {!loading && !error && viewMode === 'map' && !hasAnyGpsData && (
          <p className="status-message">Map view is selected, but no items in your sheet have GPS data. Add GPS coordinates to use the map.</p>
        )}

      </main>
      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        item={selectedModalItem} 
      />
      <Footer />
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
} else {
  console.error("Root element not found");
}
