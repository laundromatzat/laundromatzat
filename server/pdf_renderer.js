const canvas = require('canvas');
const assert = require('assert');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

// Polyfill for pdfjs-dist environment
global.Canvas = canvas.Canvas;
global.Image = canvas.Image;
global.ImageData = canvas.ImageData;
global.DOMMatrix = canvas.DOMMatrix;

function NodeCanvasFactory() {}
NodeCanvasFactory.prototype = {
  create: function NodeCanvasFactory_create(width, height) {
    assert(width > 0 && height > 0, 'Invalid canvas size');
    var canvasInstance = canvas.createCanvas(width, height);
    var context = canvasInstance.getContext('2d');
    return {
      canvas: canvasInstance,
      context: context,
    };
  },
  reset: function NodeCanvasFactory_reset(canvasAndContext, width, height) {
    assert(canvasAndContext.canvas, 'Canvas is not specified');
    assert(width > 0 && height > 0, 'Invalid canvas size');
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  },
  destroy: function NodeCanvasFactory_destroy(canvasAndContext) {
    assert(canvasAndContext.canvas, 'Canvas is not specified');
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  },
};

/**
 * Converts a PDF buffer to an array of Base64 image strings (PNG).
 * @param {Buffer|Uint8Array} dataBuffer - The PDF data.
 * @param {Object} options - Options { page_numbers: number[] }.
 * @returns {Promise<string[]>} - Array of base64 strings (without prefix).
 */
async function convertPdfToImages(dataBuffer, options = {}) {
  // Convert Buffer to Uint8Array if needed
  const data = new Uint8Array(dataBuffer);

  const loadingTask = pdfjsLib.getDocument({
    data: data,
    cMapUrl: `node_modules/pdfjs-dist/cmaps/`,
    cMapPacked: true,
    canvasFactory: new NodeCanvasFactory(),
    standardFontDataUrl: `node_modules/pdfjs-dist/standard_fonts/`
  });

  const pdfDocument = await loadingTask.promise;
  const pageNumbers = options.page_numbers || [1];
  const images = [];

  for (const pageNum of pageNumbers) {
    if (pageNum > pdfDocument.numPages) continue;

    const page = await pdfDocument.getPage(pageNum);
    const viewport = page.getViewport({ scale: 3.0 }); // Scale 3.0 for better quality
    const canvasFactory = new NodeCanvasFactory();
    const canvasAndContext = canvasFactory.create(viewport.width, viewport.height);
    const renderContext = {
      canvasContext: canvasAndContext.context,
      viewport: viewport,
      canvasFactory: canvasFactory,
    };

    await page.render(renderContext).promise;

    // Convert to base64
    const base64 = canvasAndContext.canvas.toBuffer('image/png').toString('base64');
    images.push(base64);
    
    // Cleanup
    page.cleanup();
  }

  return images;
}

module.exports = { convertPdfToImages };
