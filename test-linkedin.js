const http = require('http');
const fs = require('fs');

const filePath = 'C:/Users/ZAIN-/Desktop/zain linkedin.pdf';
const fileData = fs.readFileSync(filePath);
const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);

const header = Buffer.from(
  '--' + boundary + '\r\n' +
  'Content-Disposition: form-data; name="file"; filename="zain linkedin.pdf"\r\n' +
  'Content-Type: application/pdf\r\n\r\n'
);
const footer = Buffer.from('\r\n--' + boundary + '--\r\n');
const body = Buffer.concat([header, fileData, footer]);

console.log('Testing LinkedIn PDF API with:', filePath, '(' + fileData.length + ' bytes)');

const req = http.request({
  hostname: 'localhost', port: 3000, path: '/api/linkedin/pdf',
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data; boundary=' + boundary,
    'Content-Length': body.length
  }
}, res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const j = JSON.parse(data);
    console.log('\n=== LINKEDIN PARSE RESULT ===');
    console.log('textLength:', j.meta?.textLength);
    console.log('accuracy:', j.data?.parseAccuracy, '%');
    console.log('name:', j.data?.personal?.name);
    console.log('headline:', j.data?.personal?.jobTitle?.substring(0, 60));
    console.log('linkedin:', j.data?.personal?.linkedin);
    console.log('email:', j.data?.personal?.email);
    console.log('location:', j.data?.personal?.location);
    console.log('experience:', j.data?.experience?.length, 'jobs');
    j.data?.experience?.slice(0,3).forEach((e, i) => console.log(`  [${i+1}] ${e.title} @ ${e.company} (${e.startDate}–${e.current?'Present':e.endDate})`));
    console.log('education:', j.data?.education?.length);
    console.log('skills:', j.data?.skills?.slice(0,8).join(', '));
    console.log('warnings:', j.data?.warnings?.length, j.data?.warnings);
    console.log('\nRaw preview (200 chars):', (j.rawPreview||'').substring(0,200));
  });
});
req.on('error', e => console.log('Error:', e.message));
req.write(body);
req.end();
