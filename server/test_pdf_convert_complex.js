const canvas = require('canvas');
// Polyfill for pdfjs-dist
global.Canvas = canvas.Canvas;
global.Image = canvas.Image;
global.ImageData = canvas.ImageData;

const pdfImgConvert = require('pdf-img-convert');

async function test() {
    try {
        console.log("Testing pdf-img-convert with complex PDF...");
        
        // A PDF with an image (XObject) - minimal example
        // This is a base64 encoded PDF that contains a small red dot image
        const pdfBase64 = "JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmogICUgcGFnZXMKPDwKICAvVHlwZSAvUGFnZXwKICAvTWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqICAlIHBhZ2UKPDwKICAvVHlwZSAvUGFnZQogIC9QYXJlbnQgMiAwIFIKICAvUmVzb3VyY2VzIDw8CiAgICAvWE9iamVjdCA8PAogICAgICAvSW0xIDQgMCBSCj4+CiAgPj4KICAvQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCgo0IDAgb2JqICAlIGltYWdlCjw8CiAgL1R5cGUgL1hPYmplY3QKICAvU3VidHlwZSAvSW1hZ2UKICAvV2lkdGggMTAKICAvSGVpZ2h0IDEwCiAgL0NvbG9yU3BhY2UgL0RldmljZVJHQgogIC9CaXRzUGVyQ29tcG9uZW50IDgKICAvRmlsdGVyIC9BU0NJSTg1RGVjb2RlCiAgL0xlbmd0aCAzMAo+PgpzdHJlYW0KHixRP3JeLD1AXixRP3JeLD1AXixRP3J+PjplbmRzdHJlYW0KZW5kb2JqCgo1IDAgb2JqICAlIGNvbnRlbnRzCjw8IC9MZW5ndGggMjIgPj4Kc3RyZWFtCnEKMTAwIDAgMCAxMDAgNTAgNTAgY20KL0ltMSBEbwpRCmVuZHN0cmVhbQplbmRvYmoKCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxMCAwMDAwMCBuIAowMDAwMDAwMDYwIDAwMDAwIG4gCjAwMDAwMDAxNTcgMDAwMDAgbiAKMDAwMDAwMDI2NiAwMDAwMCBuIAowMDAwMDAwNDY3IDAwMDAwIG4gCnRyYWlsZXIKPDwKICAvU2l6ZSA2CiAgL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjUzOQolJUVPRgo=";
        
        const pdfData = Buffer.from(pdfBase64, 'base64');
        
        console.log("Converting PDF with image...");
        const outputImages = await pdfImgConvert.convert(pdfData, {
            page_numbers: [1],
            base64: true
        });
        
        console.log("Conversion successful!");
        console.log("Output length:", outputImages.length);
    } catch (error) {
        console.error("Test failed:", error);
    }
}

test();
