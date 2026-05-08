// Show lines 60-160 of raw text to find date format
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
pdfjsLib.GlobalWorkerOptions.workerSrc = '';
const fs = require('fs');

async function run() {
  const buf = fs.readFileSync('C:/Users/ZAIN-/Desktop/zain linkedin.pdf');
  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buf), disableFontFace: true, verbosity: 0 }).promise;
  
  const lines = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const byY = new Map();
    for (const item of content.items) {
      if (!item.str) continue;
      const y = Math.round(item.transform[5]);
      const x = Math.round(item.transform[4]);
      if (!byY.has(y)) byY.set(y, []);
      byY.get(y).push({ x, str: item.str, fontSize: item.transform[0] });
    }
    for (const y of Array.from(byY.keys()).sort((a, b) => b - a)) {
      const row = byY.get(y).sort((a, b) => a.x - b.x);
      // Show x positions to understand columns
      const parts = row.map(r => `[x=${r.x} f=${Math.round(r.fontSize)}] "${r.str}"`);
      lines.push(`Y=${y}: ${parts.join(' | ')}`);
    }
  }
  
  // Search for date-like lines
  const dateLines = lines.filter(l => /\d{4}/.test(l) && /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)/i.test(l));
  console.log('=== DATE-LIKE LINES (with X positions) ===');
  dateLines.slice(0, 20).forEach(l => console.log(l));
  
  console.log('\n=== ALL LINES 50-120 ===');
  lines.slice(50, 120).forEach(l => console.log(l));
}

run().catch(e => console.error(e.message));
