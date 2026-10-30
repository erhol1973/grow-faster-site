'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..', 'dist');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon', '.pdf': 'application/pdf', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml' };
function createServer(options={}) {
  return http.createServer((req, res) => {
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }); return res.end(); }
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400); return res.end(); }
    if (pathname.includes('\0') || pathname.includes('\\')) { res.writeHead(400); return res.end(); }
    const target = path.resolve(root, '.' + pathname + (pathname.endsWith('/') ? 'index.html' : ''));
    if (!target.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
    fs.stat(target, (error, stat) => {
      if (error || !stat.isFile()) { res.writeHead(404); return res.end('Not found'); }
      const compress=options.compress&&/gzip/.test(req.headers['accept-encoding']||'')&&/\.(html|css|js|json|svg|txt|xml)$/i.test(target);
      res.writeHead(200, { 'Content-Type': types[path.extname(target).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',...(compress?{'Content-Encoding':'gzip','Vary':'Accept-Encoding'}:{}) });
      if (req.method === 'HEAD') return res.end();
      const stream = fs.createReadStream(target); stream.on('error', () => res.destroy());if(compress)stream.pipe(require('node:zlib').createGzip()).pipe(res);else stream.pipe(res);
    });
  });
}
module.exports = { createServer, root };
if (require.main === module) {
  const port = Number(process.env.PORT || 4173);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
  createServer().listen(port, '127.0.0.1', () => console.log(`Preview: http://127.0.0.1:${port}`));
}
