'use strict';
const http = require('http');
const fs   = require('fs');

function createServer(htmlPath, port) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const server = http.createServer((req, res) => {
    // Intercept Google Fonts — abort with 204 (same policy both artifacts)
    if (req.headers.host && (req.headers.host.includes('fonts.googleapis') || req.headers.host.includes('fonts.gstatic'))) {
      res.writeHead(204); res.end(); return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  });
  return new Promise(resolve => server.listen(port, '127.0.0.1', () => resolve(server)));
}
module.exports = { createServer };
