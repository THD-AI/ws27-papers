// Bundles the v3.1 talk into ONE offline HTML file: JS (esbuild), JSON, CSS, the cryostat
// raster and the three typefaces (latin + latin-ext woff2) as data URIs. No fetch, no network.
//   node tools/v31-bundle.mjs  ->  dist/v31/talk.html
// The fonts are fetched once from Google Fonts at build time (the same request index.html makes).
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..'), V = join(ROOT, 'talks/quantum/v31');
const html0 = readFileSync(join(V, 'index.html'), 'utf8');
const cssUrl = html0.match(/href="(https:\/\/fonts\.googleapis\.com\/css2[^"]+)"/)[1].replace(/&amp;/g, '&');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const gcss = await (await fetch(cssUrl, { headers: { 'user-agent': UA } })).text();
let fontCss = '';
for (const b of gcss.split('/* ').slice(1).filter((b) => /^(latin|latin-ext) \*\//.test(b))) {
  const url = b.match(/url\((https:[^)]+)\)/)[1];
  const data = Buffer.from(await (await fetch(url)).arrayBuffer()).toString('base64');
  fontCss += b.slice(b.indexOf('@font-face')).replace(url, `data:font/woff2;base64,${data}`);
}
const png = 'data:image/png;base64,' + readFileSync(join(V, 'art/cryostat-world.png')).toString('base64');
const out = await build({
  entryPoints: [join(V, 'offline.js')], bundle: true, format: 'iife', minify: true, write: false, loader: { '.json': 'json' },
  plugins: [{ name: 'inline-cryostat', setup(b) { b.onLoad({ filter: /world\.js$/ }, (a) => ({ contents: readFileSync(a.path, 'utf8').replace("new URL('./art/cryostat-world.png', import.meta.url).href", JSON.stringify(png)), loader: 'js' })); } }],
});
const js = out.outputFiles[0].text, css = readFileSync(join(V, 'player.css'), 'utf8');
const html = html0
  .replace(/<link rel="stylesheet" href="https:\/\/fonts[^>]+>/, `<style>${fontCss}</style>`)
  .replace('<link rel="stylesheet" href="player.css">', `<style>${css}</style>`)
  .replace(/<script type="module">[\s\S]*?<\/script>/, () => `<script>${js.replace(/<\/script/g, '<\\/script')}</script>`);
mkdirSync(join(ROOT, 'dist/v31'), { recursive: true });
writeFileSync(join(ROOT, 'dist/v31/talk.html'), html);
console.log('dist/v31/talk.html', (Buffer.byteLength(html) / 1024 / 1024).toFixed(2) + ' MB');
