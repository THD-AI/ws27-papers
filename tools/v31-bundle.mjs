// Bundles the v3.1 player into one HTML file (JSON inlined, no fetch):
//   node tools/v31-bundle.mjs  ->  dist/v31/talk.html
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..'), V = join(ROOT, 'talks/quantum/v31');
const out = await build({ entryPoints: [join(V, 'offline.js')], bundle: true, format: 'iife', minify: true, write: false, loader: { '.json': 'json' } });
const js = out.outputFiles[0].text, css = readFileSync(join(V, 'player.css'), 'utf8');
const html = readFileSync(join(V, 'index.html'), 'utf8')
  .replace('<link rel="stylesheet" href="player.css">', `<style>${css}</style>`)
  .replace(/<script type="module">[\s\S]*?<\/script>/, () => `<script>${js}</script>`);
mkdirSync(join(ROOT, 'dist/v31'), { recursive: true });
writeFileSync(join(ROOT, 'dist/v31/talk.html'), html);
console.log('dist/v31/talk.html', (html.length / 1024).toFixed(1) + ' KB');
