import assert from 'node:assert/strict';
import { generateProjectImages, generateSewingGuide } from '../services/nylonFabricDesignerService';

async function run() {
  const maliciousGuide = `<h3>Overview</h3><script>alert('xss')</script><p>Step by step</p>`;
  const sanitizedGuide = await generateSewingGuide('desc', undefined, {
    contentFetcher: async () => maliciousGuide,
  });

  assert.ok(!sanitizedGuide.includes('<script'), 'Guide sanitizer should strip script tags');
  assert.ok(sanitizedGuide.includes('<h3>Overview</h3>'), 'Guide sanitizer should preserve safe tags');

  const maliciousVisuals = JSON.stringify([
    {
      stage: 'Cutting',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><script>alert('xss')</script><rect width="100" height="100" fill="purple" /></svg>`,
    },
  ]);

  const sanitizedVisuals = await generateProjectImages('desc', undefined, {
    contentFetcher: async () => maliciousVisuals,
  });

  assert.equal(sanitizedVisuals.length, 1, 'Visual sanitizer should return parsed visuals');
  assert.ok(!sanitizedVisuals[0].svg.includes('<script'), 'Visual sanitizer should strip script tags');
  assert.ok(sanitizedVisuals[0].svg.includes('<rect'), 'Visual sanitizer should keep structural SVG elements');

  console.log('nylonFabricDesignerService integration test passed');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
