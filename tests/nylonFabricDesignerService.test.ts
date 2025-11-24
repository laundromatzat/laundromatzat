import { describe, it, expect } from 'vitest';
import { generateProjectImages, generateSewingGuide } from '../services/nylonFabricDesignerService';

describe('nylonFabricDesignerService', () => {
  it('sanitizes sewing guide content', async () => {
    const maliciousGuide = `<h3>Overview</h3><script>alert('xss')</script><p>Step by step</p>`;
    const sanitizedGuide = await generateSewingGuide('desc', undefined, {
      contentFetcher: async () => maliciousGuide,
    });

    expect(sanitizedGuide).not.toContain('<script');
    expect(sanitizedGuide).toContain('<h3>Overview</h3>');
  });

  it('sanitizes project visuals', async () => {
    const maliciousVisuals = JSON.stringify([
      {
        stage: 'Cutting',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><script>alert('xss')</script><rect width="100" height="100" fill="purple" /></svg>`,
      },
    ]);

    const sanitizedVisuals = await generateProjectImages('desc', undefined, {
      contentFetcher: async () => maliciousVisuals,
    });

    expect(sanitizedVisuals).toHaveLength(1);
    expect(sanitizedVisuals[0].svg).not.toContain('<script');
    expect(sanitizedVisuals[0].svg).toContain('<rect');
  });
});
