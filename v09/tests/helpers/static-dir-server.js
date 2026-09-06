'use strict';
const http = require('http');
const fs   = require('fs');
const path = require('path');

const MIME = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.json':'application/json' };

function createStaticDirServer(dir, port) {
  const server = http.createServer((req, res) => {
    let urlPath = req.url.split('?')[0];
    if (urlPath === '/') urlPath = '/index.html';
    const filePath = path.join(dir, urlPath);
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      // Favicon and other benign missing static assets are expected in this
      // bridge context; treat as ordinary 404 rather than an app error.
      res.writeHead(404); res.end('not found'); return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(fs.readFileSync(filePath));
  });
  return new Promise(resolve => server.listen(port, '127.0.0.1', () => resolve(server)));
}
module.exports = { createStaticDirServer };
