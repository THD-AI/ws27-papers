// A small static file server for dist/. No dependency.
//
//   node tools/serve.mjs [port]      serves dist/ on http://localhost:8822
//
// tools/shots.mjs imports startServer() and adds extra folders to it.

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, resolve, dirname, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.woff2': 'font/woff2',
};

// mounts: { '/prefix/': 'folder' } in addition to the root folder.
export function startServer(dir, port = 0, mounts = {}) {
  const server = createServer(async (req, res) => {
    try {
      let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      let base = dir;
      for (const [prefix, folder] of Object.entries(mounts)) {
        if (path.startsWith(prefix)) { base = folder; path = path.slice(prefix.length - 1); }
      }
      let file = resolve(join(base, path));
      // Nothing outside the served folder.
      if (file !== resolve(base) && !file.startsWith(resolve(base) + sep)) { res.writeHead(403).end(); return; }
      if ((await stat(file)).isDirectory()) {
        if (!path.endsWith('/')) { res.writeHead(302, { location: `${path}/` }).end(); return; }
        file = join(file, 'index.html');
      }
      const body = await readFile(file);
      res.writeHead(200, {
        'content-type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream',
        'cache-control': 'no-store',
      });
      res.end(body);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain' }).end('not found');
    }
  });
  return new Promise((ok) => {
    server.listen(port, '127.0.0.1', () => ok({ server, port: server.address().port }));
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { port } = await startServer(join(ROOT, 'dist'), Number(process.argv[2]) || 8822);
  console.log(`serving dist/ on http://localhost:${port}/`);
}
