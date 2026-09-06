'use strict';
const http = require('http');
const fs   = require('fs');

function createServer(htmlPath, port) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  });
  return new Promise(resolve => server.listen(port, '127.0.0.1', () => resolve(server)));
}
module.exports = { createServer };
