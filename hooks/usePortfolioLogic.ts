import { useEffect, useMemo, useState } from 'react';
import { fetchPortfolio, type PortfolioItem } from '../utils/api';

export function usePortfolioLogic() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchPortfolio();
        setItems(data);
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load portfolio');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const availableTypesInSheet = useMemo(() => {
    const s = new Set<string>();
    for (const it of items) if (it.type) s.add(it.type.toLowerCase());
    return Array.from(s);
  }, [items]);

  // Preserve previous API for callers that expect these names
  return { items, loading, error, allPortfolioItems: items, availableTypesInSheet };
}