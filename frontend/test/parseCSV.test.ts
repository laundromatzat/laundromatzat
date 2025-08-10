import { describe, it, expect } from 'vitest';
import { parseCSVToPortfolioItems } from '../utils/parseCSV';

describe('parseCSVToPortfolioItems', () => {
  it('parses basic CSV data', () => {
    const csv = `id,title,type,coverImage\n1,Test,image,foo.jpg`;
    const result = parseCSVToPortfolioItems(csv);
    // A blank item is added to the beginning of the array by the parser
    expect(result.length).toBe(2);
    expect(result[0]).toEqual({
      id: 0,
      title: ' ',
      type: 'video',
      coverImage: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      sourceUrl: undefined,
      date: undefined,
      location: undefined,
      gpsCoords: undefined,
      feat: undefined,
      description: undefined,
      easterEgg: undefined,
    });
    expect(result[1]).toEqual({
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
