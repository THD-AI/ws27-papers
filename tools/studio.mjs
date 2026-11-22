// Serves the studio (studio/) for workshopping scroll-telling figures.
//
//   node tools/studio.mjs [port]      http://localhost:8823/  (devices) and /run.html
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from './serve.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const port = +(process.argv[2] || 8823);
await startServer(resolve(ROOT, 'studio'), port);
console.log(`studio on http://localhost:${port}/`);
