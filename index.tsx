import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { parsePortfolioDate } from './utils/parseCSV';
import NavigationBar from './components/NavigationBar';
import PortfolioGrid from './components/PortfolioGrid';
import Modal from './components/Modal';
import MapSection from './components/MapSection';
import SpecialPage from './components/SpecialPage';
import { usePortfolioLogic } from './hooks/usePortfolioLogic';
import { useUrlSync } from './hooks/useUrlSync';

// Minimal item shape used by the UI; optional fields allow both API and CSV-driven data
type UIItem = {
  id: number;
  title: string;
  type: string;
  date?: string;
  description?: string;
  feat?: string;
  location?: string;
};

function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="app-footer">
      <p>&copy; {currentYear} laundromatzat.com</p>
    </footer>
  );
}

function App() {
  const { items, loading, error, availableTypesInSheet } = usePortfolioLogic();
  const [displayedItems, setDisplayedItems] = useState<UIItem[]>([]);

  const [activeType, setActiveType] = useState<string | null>(null);
  const [dateSortOrder, setDateSortOrder] = useState<'new' | 'old'>('new');
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid'); // New state for view mode
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedModalItem, setSelectedModalItem] = useState<UIItem | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [lastFocusedElement, setLastFocusedElement] = useState<HTMLElement | null>(null);
  const [initialUrlParamsProcessed, setInitialUrlParamsProcessed] = useState(false);

  useUrlSync(activeType, dateSortOrder, searchQuery, isModalOpen, selectedModalItem, initialUrlParamsProcessed);

  useEffect(() => {
    if (items.length > 0 && !initialUrlParamsProcessed) {
      const params = new URLSearchParams(window.location.search);
      const type = params.get('type');
      const sort = params.get('sort');
      const q = params.get('q');
      const id = params.get('id');

      if (type) {
        setActiveType(type);
      } else if (availableTypesInSheet.includes('video')) {
        setActiveType('video'); // Default to 'videos'
      } else if (availableTypesInSheet.length > 0) {
        setActiveType(availableTypesInSheet[0]);
      }

      if (sort === 'old' || sort === 'new') {
        setDateSortOrder(sort);
      }
      if (q) {
        setSearchQuery(q);
      }

      if (id) {
        const item = items.find(i => i.id.toString() === id);
        if (item) {
          setSelectedModalItem(item);
          setIsModalOpen(true);
        }
      }
      setInitialUrlParamsProcessed(true);
    }
  }, [items, initialUrlParamsProcessed, availableTypesInSheet]);

  useEffect(() => {
    let itemsToProcess = [...items];

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
    }

    itemsToProcess.sort((a, b) => {
        const dateObjA = parsePortfolioDate(a?.date || '');
        const dateObjB = parsePortfolioDate(b?.date || '');

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

    setDisplayedItems(itemsToProcess); // No longer grouping by year
  }, [items, activeType, dateSortOrder, searchQuery, availableTypesInSheet]);

  const handleOpenModal = (item: UIItem, targetElement: HTMLElement) => {
    setLastFocusedElement(targetElement || document.activeElement as HTMLElement);
    const index = displayedItems.findIndex(i => i.id === item.id); // Use displayedItems directly
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

  return (
    <div className="app-container">
      <NavigationBar 
        availableTypes={availableTypesInSheet}
        activeType={activeType}
        onSetActiveType={handleSetActiveType}
      />
      <div className="search-bar-container">
        <div className="search-wrapper">
          <input
            type="search"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="search-input"
            aria-label="Search portfolio"
          />
        </div>
        <div className="search-wrapper">
          <input
            type="search"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="search-input"
            aria-label="Search portfolio"
          />
        </div>
        <div className="nav-action-controls">
          <button
              onClick={handleDateSortToggle}
              className="date-sort-button"
              aria-label={`Sort by date. Currently ${dateSortOrder === 'new' ? 'newest first' : 'oldest first'}. Press to toggle.`}
              title={`Current sort: ${dateSortOrder === 'new' ? 'Newest First' : 'Oldest First'}. Click to change.`}
            >
              <span>date</span>
              <span className="sort-arrow" aria-hidden="true">
                {dateSortOrder === 'new' ? (
                  <img src="/images/arrowtriangledown-symbol.png" alt="Sort descending" style={{ height: '0.8em' }} />
                ) : (
                  <img src="/images/arrowtriangleup-symbol.png" alt="Sort ascending" style={{ height: '0.8em' }} />
                )}
              </span>
            </button>
          <div className="view-mode-toggle-group">
            <button 
              onClick={() => setViewMode('grid')} 
              className={`view-mode-button ${viewMode === 'grid' ? 'active' : ''}`}
              aria-label="Grid view"
            >
              <img src="/images/grid-symbol.png" alt="Grid View" style={{ height: '1em' }} />
            </button>
            <button 
              onClick={() => setViewMode('map')} 
              className={`view-mode-button ${viewMode === 'map' ? 'active' : ''}`}
              aria-label="Map view"
            >
              <img src="/images/map-symbol.png" alt="Map View" style={{ height: '1em' }} />
            </button>
          </div>
        </div>
      </div>
      <main id="main-content-area" aria-live="polite">
        {loading && <p className="status-message">loading portfolio...</p>}
        {error && <p className="status-message error-message">{error}</p>}
        
        {!loading && !error && (
          viewMode === 'grid' ? (
            <div className="portfolio-grid-wrapper">
              <PortfolioGrid items={displayedItems} onItemClick={handleOpenModal} />
            </div>
          ) : (
            <div className="map-view-area">
              <MapSection items={items} onItemClick={handleOpenModal} />
            </div>
          )
        )}

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

// Global keydown listener for modal navigation
document.addEventListener('keydown', (e) => {
  const modalOpen = document.body.classList.contains('body-modal-open');
  if (modalOpen) {
    if (e.key === 'ArrowRight') {
      document.querySelector('.modal-nav.next')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    } else if (e.key === 'ArrowLeft') {
      document.querySelector('.modal-nav.prev')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }
  }
});