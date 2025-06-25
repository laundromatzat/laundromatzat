/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';

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

const ListIconSVG = ({ width = "20", height = "20", style }: { width?: string, height?: string, style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" width={width} height={height} fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', ...style }} aria-hidden="true">
    <rect x="3" y="6.5" width="3" height="3" rx="0.5"/>
    <rect x="3" y="10.5" width="3" height="3" rx="0.5"/>
    <rect x="3" y="14.5" width="3" height="3" rx="0.5"/>
    <rect x="8" y="7" width="13" height="2" rx="1"/>
    <rect x="8" y="11" width="13" height="2" rx="1"/>
    <rect x="8" y="15" width="13" height="2" rx="1"/>
  </svg>
);

const MapIconSVG = ({ width = "20", height = "20", style }: { width?: string, height?: string, style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" width={width} height={height} xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', ...style }} aria-hidden="true">
    <path d="M4 4C3.44772 4 3 4.44772 3 5V19C3 19.5523 3.44772 20 4 20H8V4H4Z" stroke="currentColor" strokeWidth="1" fill="transparent"/>
    <path d="M8 4L9.57735 3H14.4226L16 4V20L14.4226 21H9.57735L8 20V4Z" stroke="currentColor" strokeWidth="1" fill="transparent"/>
    <path d="M16 4H20C20.5523 4 21 4.44772 21 5V19C21 19.5523 20.5523 20 20 20H16V4Z" stroke="currentColor" strokeWidth="1" fill="transparent"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M18 7C16.8954 7 16 7.89543 16 9C16 10.9306 18 14 18 14C18 14 20 10.9306 20 9C20 7.89543 19.1046 7 18 7ZM18 10.5C17.1716 10.5 16.5 9.82843 16.5 9C16.5 8.17157 17.1716 7.5 18 7.5C18.8284 7.5 19.5 8.17157 19.5 9C19.5 9.82843 18.8284 10.5 18 10.5Z" fill="currentColor"/>
  </svg>
);


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
             <div className="view-mode-toggle-group" role="group" aria-label="View mode">
              <button
                onClick={() => { if (viewMode !== 'grid') onViewModeToggle(); }}
                className={`view-mode-button ${viewMode === 'grid' ? 'active' : ''}`}
                aria-pressed={viewMode === 'grid'}
                aria-label="Switch to List View"
                title="Switch to List View"
              >
                <ListIconSVG />
              </button>
              <button
                onClick={() => { if (viewMode !== 'map') onViewModeToggle(); }}
                className={`view-mode-button ${viewMode === 'map' ? 'active' : ''}`}
                aria-pressed={viewMode === 'map'}
                aria-label="Switch to Map View"
                title="Switch to Map View"
              >
                <MapIconSVG />
              </button>
            </div>
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

interface ItemWithParsedGps extends PortfolioItemData {
  lat: number;
  lon: number;
}

// Helper component to change map view based on bounds
function ChangeView({ bounds }: { bounds: L.LatLngBounds | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (!bounds) { // No items, reset to world view
      map.setView([20, 0], 2); // Or your preferred default view
    }
  }, [bounds, map]);
  return null;
}

function PortfolioMap({ items, onItemClick }: PortfolioMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  const itemsWithGps = useMemo((): ItemWithParsedGps[] => {
    return items.filter(item => {
      if (!item.gpsCoords) return false;
      const parts = item.gpsCoords.split(',');
      return parts.length === 2 && !isNaN(parseFloat(parts[0])) && !isNaN(parseFloat(parts[1]));
    }).map(item => {
      const parts = item.gpsCoords!.split(',');
      return { ...item, lat: parseFloat(parts[0]), lon: parseFloat(parts[1]) };
    });
  }, [items]);

  const leafletBounds = useMemo(() => {
    if (itemsWithGps.length === 0) return null;
    const lBounds = L.latLngBounds(itemsWithGps.map(item => [item.lat, item.lon]));
    return lBounds.isValid() ? lBounds : null;
  }, [itemsWithGps]);

  if (itemsWithGps.length === 0 && items.length > 0) { // Items exist, but none have GPS for current filter
    return <p className="status-message">No items with GPS coordinates to display on the map for the current filters. Try adjusting filters or adding GPS data to your sheet.</p>;
  }
   if (items.length === 0 && itemsWithGps.length === 0) { // No items at all for current filter
     return <p className="status-message">No portfolio items match your criteria.</p>;
   }


  return (
    <div ref={mapRef} className="portfolio-map-container" role="application" aria-label="Portfolio items map">
      <MapContainer
        center={itemsWithGps.length > 0 ? [itemsWithGps[0].lat, itemsWithGps[0].lon] : [20, 0]}
        zoom={itemsWithGps.length > 0 ? 5 : 2}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ChangeView bounds={leafletBounds} />
        {itemsWithGps.map((item) => (
          <Marker
            key={item.id}
            position={[item.lat, item.lon]}
            eventHandlers={{
              click: (e) => {
                onItemClick(item, e.originalEvent.target as HTMLElement);
              },
            }}
          >
            <Popup autoPan={false}> 
              <div style={{textAlign: 'center'}}>
                <strong>{item.title}</strong>
                {item.location && <><br/><em>{item.location}</em></>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
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
  
  // Restructured details
  let infoLineText = '';
  if (item.location) infoLineText += item.location;
  if (item.date) infoLineText += (infoLineText ? ' ' : '') + item.date;
  if (item.feat) {
    infoLineText += (infoLineText ? '. feat ' : 'feat ') + item.feat;
  } else if (infoLineText) {
    infoLineText += '.';
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
            {infoLineText && <p className="modal-info-line">{infoLineText}</p>}
            {item.description && <p className="modal-description-reformatted">{item.description}</p>}
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