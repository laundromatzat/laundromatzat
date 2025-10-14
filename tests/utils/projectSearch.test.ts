import { describe, expect, it } from 'vitest';
import { normalize, searchProjects } from '../../utils/projectSearch';

describe('normalize', () => {
  it('strips diacritics, punctuation, and normalises whitespace', () => {
    expect(normalize('  Hawa\u00ed!!  ')).toBe('hawai');
    expect(normalize('São   Paulo')).toBe('sao paulo');
  });
});

describe('searchProjects', () => {
  it('returns an empty array when no query or filters are provided', () => {
    expect(searchProjects('')).toEqual([]);
  });

  it('matches projects using geographic synonyms', () => {
    const results = searchProjects('Hawaii');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(project => (project.location ?? '').toLowerCase().includes('maui'))).toBe(true);
  });

  it('applies tag and date filters', () => {
    const results = searchProjects('glacier', {
      type: 'Video',
      dateFrom: '05/2025',
      dateTo: '07/2025',
      includeTags: ['Michael'],
    });

    expect(results.length).toBeGreaterThan(0);
    for (const project of results) {
      expect(project.type).toBe('video');
      const tags = (project.tags ?? []).map(tag => tag.toLowerCase());
      expect(tags).toContain('michael');
      expect(project.date.slice(-4)).toBe('2025');
    }
  });
});
