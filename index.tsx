import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { PortfolioItemData, parsePortfolioDate } from './utils/parseCSV';
import NavigationBar from './components/NavigationBar';
import PortfolioGrid from './components/PortfolioGrid';
import Modal from './components/Modal';
import MapSection from './components/MapSection';
import SpecialPage from './components/SpecialPage';
import { usePortfolioLogic } from './hooks/usePortfolioLogic';
import { useUrlSync } from './hooks/useUrlSync';

function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="app-footer">
      <p>&copy; {currentYear} laundromatzat.com</p>
    </footer>
  );
}

function App() {
  const { allPortfolioItems, loading, error, availableTypesInSheet } = usePortfolioLogic();
  const [displayedItems, setDisplayedItems] = useState<Record<string, PortfolioItemData[]>>({});
  
  const [activeType, setActiveType] = useState<string | null>(null);
  const [dateSortOrder, setDateSortOrder] = useState<'new' | 'old'>('new');
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedModalItem, setSelectedModalItem] = useState<PortfolioItemData | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [lastFocusedElement, setLastFocusedElement] = useState<HTMLElement | null>(null);
  const [initialUrlParamsProcessed, setInitialUrlParamsProcessed] = useState(false);

  useUrlSync(activeType, dateSortOrder, searchQuery, isModalOpen, selectedModalItem, initialUrlParamsProcessed);

  useEffect(() => {
    if (allPortfolioItems.length > 0 && !initialUrlParamsProcessed) {
      const params = new URLSearchParams(window.location.search);
      const type = params.get('type');
      const sort = params.get('sort');
      const q = params.get('q');
      const id = params.get('id');

      if (type) {
        setActiveType(type);
      } else if (availableTypesInSheet.includes('video')) {
        setActiveType('video');
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
        const item = allPortfolioItems.find(i => i.id.toString() === id);
        if (item) {
          setSelectedModalItem(item);
          setIsModalOpen(true);
        }
      }
      setInitialUrlParamsProcessed(true);
    }
  }, [allPortfolioItems, initialUrlParamsProcessed, availableTypesInSheet]);

  useEffect(() => {
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

    const groupedItems = itemsToProcess.reduce((acc, item) => {
      const dateObj = parsePortfolioDate(item.date);
      const year = dateObj ? dateObj.getFullYear().toString() : 'Undated';
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(item);
      return acc;
    }, {} as Record<string, PortfolioItemData[]>);
    
    setDisplayedItems(groupedItems);
  }, [allPortfolioItems, activeType, dateSortOrder, searchQuery, availableTypesInSheet]);

  const handleOpenModal = (item: PortfolioItemData, targetElement: HTMLElement) => {
    setLastFocusedElement(targetElement || document.activeElement as HTMLElement);
    const allItems = Object.values(displayedItems).flat();
    const index = allItems.findIndex(i => i.id === item.id);
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
    const allItems = Object.values(displayedItems).flat();
    if (allItems.length === 0) return;
    const nextIndex = (currentIndex + 1) % allItems.length;
    setCurrentIndex(nextIndex);
    setSelectedModalItem(allItems[nextIndex]);
  };

  const handlePrevModalItem = () => {
    const allItems = Object.values(displayedItems).flat();
    if (allItems.length === 0) return;
    const prevIndex = (currentIndex - 1 + allItems.length) % allItems.length;
    setCurrentIndex(prevIndex);
    setSelectedModalItem(allItems[prevIndex]);
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
        dateSortOrder={dateSortOrder}
        onDateSortToggle={handleDateSortToggle}
      />
      <div className="search-bar-container">
        <div className="search-wrapper">
          <span className="search-icon" aria-hidden="true">🔍</span>
          <input
            type="search"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="search-input"
            aria-label="Search portfolio"
          />
        </div>
      </div>
      <main id="main-content-area" aria-live="polite">
        {loading && <p className="status-message">loading portfolio...</p>}
        {error && <p className="status-message error-message">{error}</p>}
        
        {!loading && !error && (
          <div className="portfolio-grid-wrapper">
            <PortfolioGrid items={displayedItems} onItemClick={handleOpenModal} />
          </div>
        )}

      </main>
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        item={selectedModalItem}
        onPrev={handlePrevModalItem}
        onNext={handleNextModalItem}
      />
      <MapSection items={allPortfolioItems} />
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