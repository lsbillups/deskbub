// Upload installer to Supabase Storage
// Usage: node upload-release.js <filePath> <destFileName>
const fs = require('fs');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const filePath = process.argv[2];
const destName = process.argv[3];
const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!filePath || !destName || !supabaseUrl || !serviceKey) {
  console.error('Missing required arguments or env vars');
  process.exit(1);
}

const data = fs.readFileSync(filePath);
const url = new URL(`${supabaseUrl}/storage/v1/object/pet-photos/releases/${destName}`);
const client = url.protocol === 'https:' ? https : http;

const options = {
  method: 'PUT',
  hostname: url.hostname,
  path: url.pathname,
  headers: {
    apikey: serviceKey,
    'Content-Type': 'application/octet-stream',
    'Content-Length': data.length,
  },
};

const req = client.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log(`✅ Uploaded ${destName} (${data.length} bytes)`);
    } else {
      console.error(`❌ Upload failed: ${res.statusCode} ${body}`);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.error(`❌ Upload error: ${err.message}`);
  process.exit(1);
});

req.write(data);
req.end();
