// A tiny static file server for previewing app/ locally: node serve.ts, then open the address it
// prints. Standard library only; it serves nothing outside app/.

import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, normalize, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = join(fileURLToPath(new URL('.', import.meta.url)), 'app');
const port = Number(process.env.PORT ?? 8080);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
};

createServer((request, response) => {
  const path = normalize(join(appDir, decodeURIComponent(new URL(request.url, 'http://x').pathname)));
  const file = path.startsWith(appDir) && existsSync(path) && statSync(path).isFile()
    ? path
    : join(appDir, 'index.html');
  response.writeHead(200, { 'content-type': MIME_TYPES[extname(file)] ?? 'application/octet-stream' });
  response.end(readFileSync(file));
}).listen(port, () => {
  console.log(`Vice Coast Cover Studio at http://localhost:${port}`);
});
