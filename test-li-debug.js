// Debug script — dumps full extracted text + section breakdown
const http = require('http');
const fs = require('fs');

const filePath = 'C:/Users/ZAIN-/Desktop/zain linkedin.pdf';
const fileData = fs.readFileSync(filePath);
const boundary = '----Boundary' + Math.random().toString(36).slice(2);

const header = Buffer.from(
  '--' + boundary + '\r\n' +
  'Content-Disposition: form-data; name="file"; filename="zain linkedin.pdf"\r\n' +
  'Content-Type: application/pdf\r\n\r\n'
);
const body = Buffer.concat([header, fileData, Buffer.from('\r\n--' + boundary + '--\r\n')]);

const req = http.request({
  hostname: 'localhost', port: 3000, path: '/api/linkedin/pdf',
  method: 'POST',
  headers: { 'Content-Type': 'multipart/form-data; boundary=' + boundary, 'Content-Length': body.length }
}, res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const j = JSON.parse(data);
    console.log('=== RAW TEXT (FIRST 3000 CHARS) ===');
    console.log(j.rawPreview || '(no rawPreview)');
    console.log('\n=== EXPERIENCE DATES ===');
    (j.data?.experience || []).forEach((e, i) => {
      console.log(`[${i}] "${e.title}" @ "${e.company}" | start="${e.startDate}" end="${e.endDate}" current=${e.current}`);
    });
    console.log('\n=== SUMMARY ===');
    console.log(JSON.stringify(j.data?.summary));
  });
});
req.on('error', e => console.log('Error:', e.message));
req.write(body);
req.end();
