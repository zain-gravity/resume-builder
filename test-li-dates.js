// Extended debug — checks education dates + simulates formatDate
const http = require('http');
const fs = require('fs');

const filePath = 'C:/Users/ZAIN-/Desktop/zain linkedin.pdf';
const fileData = fs.readFileSync(filePath);
const boundary = '----Boundary' + Math.random().toString(36).slice(2);
const header = Buffer.from('--' + boundary + '\r\nContent-Disposition: form-data; name="file"; filename="zain linkedin.pdf"\r\nContent-Type: application/pdf\r\n\r\n');
const body = Buffer.concat([header, fileData, Buffer.from('\r\n--' + boundary + '--\r\n')]);

// Simulate the fixed formatDate function
function formatDate(s) {
  if (!s || s.trim() === '') return '';
  s = s.trim();
  if (/^\d{4}-\d{2}$/.test(s)) {
    const [y, m] = s.split('-');
    const d = new Date(parseInt(y), parseInt(m) - 1);
    return isNaN(d.getTime()) ? 'INVALID' : d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
  const mm = s.match(/^(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})$/i);
  if (mm) {
    const d = new Date(`${mm[1]} 1, ${mm[2]}`);
    return isNaN(d.getTime()) ? 'INVALID' : d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
  if (/^\d{4}$/.test(s)) return s;
  if (/[a-zA-Z]/.test(s)) return s;
  return '';
}

const req = http.request({
  hostname: 'localhost', port: 3000, path: '/api/linkedin/pdf', method: 'POST',
  headers: { 'Content-Type': 'multipart/form-data; boundary=' + boundary, 'Content-Length': body.length }
}, res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const j = JSON.parse(data);
    console.log('=== EXPERIENCE (with formatted dates) ===');
    (j.data?.experience || []).forEach((e, i) => {
      const start = formatDate(e.startDate);
      const end = e.current ? 'Present' : formatDate(e.endDate);
      console.log(`[${i}] ${e.title} @ ${e.company}`);
      console.log(`     raw: "${e.startDate}" – "${e.endDate}" | formatted: "${start}" – "${end}"`);
    });
    console.log('\n=== EDUCATION (with formatted dates) ===');
    (j.data?.education || []).forEach((e, i) => {
      const start = formatDate(e.startDate);
      const end = formatDate(e.endDate);
      console.log(`[${i}] ${e.school}`);
      console.log(`     degree: "${e.degree}"`);
      console.log(`     raw: "${e.startDate}" – "${e.endDate}" | formatted: "${start}" – "${end}"`);
    });
  });
});
req.on('error', e => console.log('Error:', e.message));
req.write(body);
req.end();
