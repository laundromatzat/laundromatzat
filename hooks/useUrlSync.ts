import { useEffect } from 'react';

export function useUrlSync(activeType: string | null, dateSortOrder: 'new' | 'old', searchQuery: string, isModalOpen: boolean, selectedModalItem: any, initialUrlParamsProcessed: boolean) {
  useEffect(() => {
    if (!initialUrlParamsProcessed) {
      return;
    }

    const params = new URLSearchParams();

    const isDefaultView = activeType === 'video' && dateSortOrder === 'new' && !searchQuery && !isModalOpen;

    if (!isDefaultView) {
      if (activeType) {
        params.set('type', activeType);
      }
      if (dateSortOrder) {
        params.set('sort', dateSortOrder);
      }
      if (searchQuery) {
        params.set('q', searchQuery);
      }
    }

    if (isModalOpen && selectedModalItem) {
      params.set('id', selectedModalItem.id.toString());
    }
    
    const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
    window.history.replaceState({}, '', newUrl);

  }, [activeType, dateSortOrder, searchQuery, isModalOpen, selectedModalItem, initialUrlParamsProcessed]);
}
