const http = require('http');
const fs = require('fs');

const filePath = 'C:/Users/ZAIN-/Desktop/Zain Mirza Resume.pdf';
const fileData = fs.readFileSync(filePath);
const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);

const header = Buffer.from(
  '--' + boundary + '\r\n' +
  'Content-Disposition: form-data; name="file"; filename="Zain Mirza Resume.pdf"\r\n' +
  'Content-Type: application/pdf\r\n\r\n'
);
const footer = Buffer.from('\r\n--' + boundary + '--\r\n');
const body = Buffer.concat([header, fileData, footer]);

console.log('Sending', filePath, '(' + fileData.length + ' bytes)...');

const req = http.request({
  hostname: 'localhost', port: 3000, path: '/api/parse-resume',
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data; boundary=' + boundary,
    'Content-Length': body.length
  }
}, res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    try {
      const j = JSON.parse(data);
      console.log('\n=== PARSE RESULT ===');
      console.log('textLength:', j.meta?.textLength);
      console.log('quality:', j.meta?.quality);
      console.log('accuracy:', j.data?.parseAccuracy, '%');
      console.log('name:', j.data?.personal?.name);
      console.log('email:', j.data?.personal?.email);
      console.log('phone:', j.data?.personal?.phone);
      console.log('location:', j.data?.personal?.location);
      console.log('jobTitle:', j.data?.personal?.jobTitle);
      console.log('experience jobs:', j.data?.experience?.length);
      console.log('education:', j.data?.education?.length);
      console.log('skills:', j.data?.skills?.join(', '));
      console.log('\nrawPreview (first 300):');
      console.log((j.rawPreview || '').substring(0, 300));
      console.log('\nwarnings:', j.data?.warnings);
    } catch(e) {
      console.log('Response parse error:', e.message);
      console.log('Raw:', data.substring(0, 500));
    }
  });
});
req.on('error', e => console.log('Request error:', e.message));
req.write(body);
req.end();
