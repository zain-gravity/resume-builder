/**
 * Quick test: parse a real PDF using both pdf-parse and pdfjs-dist
 * Run: node test-extraction.js path/to/resume.pdf
 */
const fs = require("fs");
const path = require("path");

async function testExtraction(filePath) {
  const buffer = fs.readFileSync(filePath);
  console.log(`\n📄 File: ${path.basename(filePath)} (${buffer.length} bytes)`);

  // Method 1: pdf-parse (most reliable)
  try {
    const pdfParse = require("pdf-parse");
    const result = await pdfParse(buffer);
    console.log(`\n✅ pdf-parse: ${result.text.length} chars, ${result.numpages} pages`);
    console.log("--- First 500 chars ---");
    console.log(result.text.slice(0, 500));
  } catch (e) {
    console.log(`\n❌ pdf-parse failed: ${e.message}`);
  }

  // Method 2: pdfjs-dist
  try {
    const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");
    pdfjsLib.GlobalWorkerOptions.workerSrc = "";
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer), verbosity: 0 }).promise;
    const lines = [];
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      for (const item of content.items) {
        if ("str" in item && item.str) lines.push(item.str);
      }
    }
    const text = lines.join(" ");
    console.log(`\n✅ pdfjs-dist: ${text.length} chars`);
    console.log("--- First 500 chars ---");
    console.log(text.slice(0, 500));
  } catch (e) {
    console.log(`\n❌ pdfjs-dist failed: ${e.message}`);
  }
}

const file = process.argv[2];
if (!file) {
  console.log("Usage: node test-extraction.js path/to/resume.pdf");
  process.exit(1);
}
testExtraction(file).catch(console.error);
