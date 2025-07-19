/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { PortfolioItemData, parseCSVToPortfolioItems, parsePortfolioDate } from './utils/parseCSV';
import NavigationBar from './components/NavigationBar';
import PortfolioGrid from './components/PortfolioGrid';
import Modal from './components/Modal';
import SpecialPage from './components/SpecialPage';

// !!! IMPORTANT: REPLACE WITH YOUR ACTUAL PUBLISHED GOOGLE SHEET CSV URL !!!
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQTTlqDzuJCj-vRQiSNTtdSlaeb4VhJEVzia25ETVWaG1TC7UViLUrPFWKKK9PFdBiumGNSxX2fUKUa/pub?gid=0&single=true&output=csv';


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

const ALL_POSSIBLE_TYPES = ['image', 'video', 'cinemagraph'];


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
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [lastFocusedElement, setLastFocusedElement] = useState<HTMLElement | null>(null);

  const [availableTypesInSheet, setAvailableTypesInSheet] = useState<string[]>([]);
  const [activeType, setActiveType] = useState<string | null>(null); 
  const [dateSortOrder, setDateSortOrder] = useState<'new' | 'old'>('new');
  const [searchQuery, setSearchQuery] = useState<string>("");
  // viewMode and hasAnyGpsData state removed


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
        // let foundGps = false; // Removed
        data.forEach(item => {
          if (item.type) typesFromData.add(item.type.toLowerCase());
          // if (item.gpsCoords && item.gpsCoords.includes(',')) foundGps = true; // Removed
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
        // setHasAnyGpsData(foundGps); // Removed

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
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    const sort = params.get('sort');
    const q = params.get('q');
    const id = params.get('id');

    if (type) {
      setActiveType(type);
    }
    if (sort === 'old' || sort === 'new') {
      setDateSortOrder(sort);
    }
    if (q) {
      setSearchQuery(q);
    }

    if (id && allPortfolioItems.length > 0) {
      const item = allPortfolioItems.find(i => i.id.toString() === id);
      if (item) {
        setSelectedModalItem(item);
        setIsModalOpen(true);
      }
    }
  }, [allPortfolioItems]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (activeType) {
      params.set('type', activeType);
    }
    if (dateSortOrder) {
      params.set('sort', dateSortOrder);
    }
    if (searchQuery) {
      params.set('q', searchQuery);
    }
    if (isModalOpen && selectedModalItem) {
      params.set('id', selectedModalItem.id.toString());
    }
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);

    let itemsToProcess = [...allPortfolioItems];

    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      itemsToProcess = itemsToProcess.filter(item => 
        item.title.toLowerCase().includes(lowercasedQuery) ||
        item.description?.toLowerCase().includes(lowercasedQuery) ||
        item.feat?.toLowerCase().includes(lowercasedQuery) ||
        item.location?.toLowerCase().includes(lowercasedQuery)
      );
    }

    if (activeType) {
      itemsToProcess = itemsToProcess.filter(item => item.type.toLowerCase() === activeType);
    } else if (availableTypesInSheet.length > 0 && !searchQuery) { 
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
  }, [allPortfolioItems, activeType, dateSortOrder, searchQuery, isModalOpen, selectedModalItem, availableTypesInSheet]);


  const handleOpenModal = (item: PortfolioItemData, targetElement: HTMLElement) => {
    setLastFocusedElement(targetElement || document.activeElement as HTMLElement);
    const index = displayedItems.findIndex(i => i.id === item.id);
    setCurrentIndex(index);
    setSelectedModalItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedModalItem(null);
    setCurrentIndex(-1);
    lastFocusedElement?.focus();
  };

  const handleNextModalItem = () => {
    if (displayedItems.length === 0) return;
    const nextIndex = (currentIndex + 1) % displayedItems.length;
    setCurrentIndex(nextIndex);
    setSelectedModalItem(displayedItems[nextIndex]);
  };

  const handlePrevModalItem = () => {
    if (displayedItems.length === 0) return;
    const prevIndex = (currentIndex - 1 + displayedItems.length) % displayedItems.length;
    setCurrentIndex(prevIndex);
    setSelectedModalItem(displayedItems[prevIndex]);
  };

  const handleSetActiveType = (typeToSet: string) => {
    setActiveType(typeToSet);
  };
  
  const handleDateSortToggle = () => {
    setDateSortOrder(prevOrder => prevOrder === 'new' ? 'old' : 'new');
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  // handleViewModeToggle function removed

  return (
    <div className="app-container">
      <NavigationBar 
        availableTypes={availableTypesInSheet}
        activeType={activeType}
        onSetActiveType={handleSetActiveType}
        dateSortOrder={dateSortOrder}
        onDateSortToggle={handleDateSortToggle}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        // viewMode, onViewModeToggle, and hasGpsData props removed
      />
      <main id="main-content-area" aria-live="polite">
        {loading && <p className="status-message">loading portfolio...</p>}
        {error && <p className="status-message error-message">{error}</p>}
        
        {!loading && !error && ( // Always render PortfolioGrid if not loading and no error
          <PortfolioGrid items={displayedItems} onItemClick={handleOpenModal} />
        )}
        {/* PortfolioMap and related conditional rendering removed */}

      </main>
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        item={selectedModalItem}
        onPrev={handlePrevModalItem}
        onNext={handleNextModalItem}
      />
      <Footer />
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  if (window.location.pathname === '/special') {
    root.render(<SpecialPage />);
  } else {
    root.render(<App />);
  }
} else {
  console.error("Root element not found");
}