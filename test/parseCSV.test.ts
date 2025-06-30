import { describe, it, expect } from 'vitest';
import { parseCSVToPortfolioItems } from '../utils/parseCSV';

describe('parseCSVToPortfolioItems', () => {
  it('parses basic CSV data', () => {
    const csv = `id,title,type,coverImage\n1,Test,image,foo.jpg`;
    const result = parseCSVToPortfolioItems(csv);
    expect(result.length).toBe(1);
    expect(result[0]).toEqual({
      id: 1,
      title: 'Test',
      type: 'image',
      coverImage: 'foo.jpg',
      sourceUrl: undefined,
      date: undefined,
      location: undefined,
      gpsCoords: undefined,
      feat: undefined,
      description: undefined,
      easterEgg: undefined,
    });
  });

  it('throws on missing required headers', () => {
    const csv = `wrong,title,type,coverImage\n1,Test,image,foo.jpg`;
    expect(() => parseCSVToPortfolioItems(csv)).toThrow();
  });
});
