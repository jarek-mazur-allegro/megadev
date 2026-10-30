import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('rendered');
http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400).end(); return; }
  if (pathname === '/') pathname = '/kb/incidents/4471-review/';
  let filename = path.resolve(root, `.${pathname}`);
  if (filename !== root && !filename.startsWith(root + path.sep)) {
    res.writeHead(403).end(); return;
  }
  try {
    if (fs.statSync(filename).isDirectory()) filename = path.join(filename, 'index.html');
    res.setHeader('Content-Type', filename.endsWith('.json') ? 'application/json' : 'text/html; charset=utf-8');
    res.end(fs.readFileSync(filename));
  } catch { res.writeHead(404).end('Not found'); }
}).listen(4833, '127.0.0.1', () => console.log('KB preview: http://127.0.0.1:4833/kb/incidents/4471-review/'));
