import { useEffect, useState } from 'react';
import { fetchPortfolio } from '../utils/api'; // adjust relative path if needed

export function usePortfolioLogic() {
  const [items, setItems] = useState<Array<{id:number; title:string; type:string}>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchPortfolio();
        setItems(data);
      } catch (e:any) {
        setError(e?.message ?? 'Failed to load portfolio');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { items, loading, error };
}