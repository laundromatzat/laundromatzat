import { useState, useEffect } from 'react';
import { PortfolioItemData, parseCSVToPortfolioItems, parsePortfolioDate } from '../utils/parseCSV';

const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQTTlqDzuJCj-vRQiSNTtdSlaeb4VhJEVzia25ETVWaG1TC7UViLUrPFWKKK9PFdBiumGNSxX2fUKUa/pub?gid=0&single=true&output=csv';
const ALL_POSSIBLE_TYPES = ['image', 'video', 'cinemagraph'];

export function usePortfolioLogic() {
  const [allPortfolioItems, setAllPortfolioItems] = useState<PortfolioItemData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [availableTypesInSheet, setAvailableTypesInSheet] = useState<string[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (!GOOGLE_SHEET_CSV_URL || GOOGLE_SHEET_CSV_URL.includes('YOUR_UNIQUE_ID') || GOOGLE_SHEET_CSV_URL.includes('YOUR_ACTUAL_PUBLISHED_GOOGLE_SHEET_CSV_URL')) {
        setError("Configuration needed: Please update GOOGLE_SHEET_CSV_URL in index.tsx with your actual published Google Sheet CSV link.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await fetch(GOOGLE_SHEET_CSV_URL);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}. Failed to fetch from Google Sheet. Ensure the URL is correct, the sheet is published as CSV, and accessible.`);
        }
        const csvText = await response.text();
        if (!csvText.trim()) {
            throw new Error("Fetched CSV data is empty. Check your Google Sheet content and publishing settings.");
        }
        
        const data = parseCSVToPortfolioItems(csvText);
        setAllPortfolioItems(data);
        
        const typesFromData = new Set<string>();
        data.forEach(item => {
          if (item.type) typesFromData.add(item.type.toLowerCase());
        });
        
        const sortedTypes = ALL_POSSIBLE_TYPES.filter(t => typesFromData.has(t));
        setAvailableTypesInSheet(sortedTypes);

      } catch (e: any) {
        console.error("Failed to fetch or parse portfolio data:", e);
        setError(`Failed to load portfolio: ${e.message}. Check browser console for more details and ensure CSV format is correct.`);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return { allPortfolioItems, loading, error, availableTypesInSheet };
}
