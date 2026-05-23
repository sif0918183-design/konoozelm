const http = require('http');

async function testProxy(params) {
  return new Promise((resolve) => {
    const url = `http://localhost:3000/api/pdf-proxy?${params}`;
    console.log(`Testing: ${url}`);
    http.get(url, (res) => {
      console.log(`Status: ${res.statusCode}`);
      console.log(`Headers: `, res.headers);
      let data = '';
      res.on('data', (chunk) => {
        if (data.length < 100) data += chunk.toString();
      });
      res.on('end', () => {
        console.log(`First 100 bytes of data: ${data.substring(0, 100)}`);
        resolve();
      });
    }).on('error', (e) => {
      console.error(`Error: ${e.message}`);
      resolve();
    });
  });
}

async function run() {
  // Wait for dev server to be ready
  await new Promise(r => setTimeout(r, 5000));

  await testProxy('archiveId=sharh-al-aqidah-al-wasitiyyah');
  console.log('---');
  await testProxy('url=' + encodeURIComponent('https://archive.org/download/sharh-al-aqidah-al-wasitiyyah/sharh-al-aqidah-al-wasitiyyah.pdf'));
}

run();
