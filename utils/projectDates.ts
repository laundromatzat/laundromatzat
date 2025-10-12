const DATE_STOPWORDS = /\b(about|around|since|after|before)\b/g;

const NON_DATE_CHARACTERS = /[^0-9\/-]/g;

function normalizeDateInput(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(DATE_STOPWORDS, '')
    .replace(NON_DATE_CHARACTERS, '')
    .replace(/--+/g, '-')
    .replace(/\/+/g, '/')
    .replace(/^[-\/]+|[-\/]+$/g, '')
    .trim();
}

export function parseYearMonth(value?: string | null): number | null {
  if (!value) return null;

  const normalized = normalizeDateInput(value);
  if (!normalized) return null;

  let match = normalized.match(/^(\d{4})[-\/]?(\d{2})?$/);
  if (match) {
    const year = Number(match[1]);
    const month = match[2] ? Number(match[2]) : 1;
    if (!Number.isNaN(year) && !Number.isNaN(month) && month >= 1 && month <= 12) {
      return year * 100 + month;
    }
    return null;
  }

  match = normalized.match(/^(\d{2})[-\/]?(\d{4})$/);
  if (match) {
    const month = Number(match[1]);
    const year = Number(match[2]);
    if (!Number.isNaN(year) && !Number.isNaN(month) && month >= 1 && month <= 12) {
      return year * 100 + month;
    }
  }

  return null;
}

type Dated = {
  date?: string | null;
};

export function compareProjectsByDateDesc<T extends Dated>(a: T, b: T): number {
  const aValue = parseYearMonth(a?.date ?? null);
  const bValue = parseYearMonth(b?.date ?? null);

  if (aValue === null && bValue === null) return 0;
  if (aValue === null) return 1;
  if (bValue === null) return -1;
  return bValue - aValue;
}
