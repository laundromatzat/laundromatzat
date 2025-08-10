/// <reference types="vite/client" />

export type PortfolioItem = { id: number; title: string; type: string };

const BASE = import.meta.env.VITE_API_BASE_URL;

if (!BASE) {
  // In production builds this should be provided by Actions as a variable.
  // We keep a console.warn (not throw) so local dev can still boot.
  // eslint-disable-next-line no-console
  console.warn('VITE_API_BASE_URL is not set. Check your .env or GitHub Actions variables.');
}

export const apiUrl = (path: string) => `${BASE}${path.startsWith('/') ? path : `/${path}`}`;

export async function fetchPortfolio(): Promise<PortfolioItem[]> {
  const res = await fetch(apiUrl('/api/portfolio'));
  if (!res.ok) {
    throw new Error(`fetchPortfolio failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}