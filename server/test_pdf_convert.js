const fs = require('fs');
const pdfImgConvert = require('pdf-img-convert');

async function test() {
    try {
        console.log("Testing pdf-img-convert...");
        // Create a dummy PDF buffer (minimal valid PDF)
        const pdfData = Buffer.from('%PDF-1.7\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << >> >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF');
        
        console.log("Converting dummy PDF...");
        const outputImages = await pdfImgConvert.convert(pdfData, {
            page_numbers: [1],
            base64: true
        });
        
        console.log("Conversion successful!");
        console.log("Output length:", outputImages.length);
        if (outputImages.length > 0) {
            console.log("First image base64 length:", outputImages[0].length);
        }
    } catch (error) {
        console.error("Test failed:", error);
    }
}

test();
