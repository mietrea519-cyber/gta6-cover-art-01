// A small local server for trying the studio in a browser.
//
// It serves only the app/ folder, only on the loopback address, and it maps
// the handful of file extensions this app actually ships to their content
// types. Paths that try to climb out of app/ are refused, directories are
// answered with their index.html, and anything missing is a plain 404.
//
// Usage: node serve.ts [--port 8123]   (the port defaults to 8080)

import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(fileURLToPath(new URL('./app', import.meta.url)));

const argv = process.argv.slice(2);
const portFlagAt = argv.indexOf('--port');
const wantedPort = portFlagAt >= 0 ? Number(argv[portFlagAt + 1]) : 8080;
const listenPort =
  Number.isInteger(wantedPort) && wantedPort > 0 && wantedPort < 65536 ? wantedPort : 8080;

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
};

function answerNotFound(response: import('node:http').ServerResponse): void {
  response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
  response.end('not found');
}

const server = createServer((request, response) => {
  let rawPath = '/';
  try {
    rawPath = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
  } catch {
    response.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('bad request');
    return;
  }
  if (rawPath.endsWith('/')) rawPath += 'index.html';

  const candidate = resolve(join(appRoot, normalize(rawPath)));
  if (candidate !== appRoot && !candidate.startsWith(appRoot + sep)) {
    response.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('forbidden');
    return;
  }

  let byteCount = 0;
  try {
    const info = statSync(candidate);
    if (!info.isFile()) {
      answerNotFound(response);
      return;
    }
    byteCount = info.size;
  } catch {
    answerNotFound(response);
    return;
  }

  response.writeHead(200, {
    'content-type': CONTENT_TYPES[extname(candidate).toLowerCase()] ?? 'application/octet-stream',
    'content-length': byteCount,
    'cache-control': 'no-store',
  });
  createReadStream(candidate).pipe(response);
});

server.listen(listenPort, '127.0.0.1', () => {
  console.log(`Vice Coast Cover Studio is serving app/ at http://localhost:${listenPort}`);
});
