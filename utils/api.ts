const BASE = import.meta.env.VITE_API_BASE_URL;

if (!BASE) {
  // Fail fast in prod; you can soften to console.warn if you prefer
  throw new Error('VITE_API_BASE_URL is not set. Check your .env or Actions vars.');
}

const url = (path: string) => `${BASE}${path.startsWith('/') ? path : `/${path}`}`;

export async function fetchPortfolio() {
  const res = await fetch(url('/api/portfolio'));
  if (!res.ok) {
    throw new Error(`fetchPortfolio failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<Array<{id:number; title:string; type:string}>>;
}