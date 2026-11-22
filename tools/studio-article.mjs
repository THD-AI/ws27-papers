// Builds studio/article.html: the article's own text (articles/other-half/text.md)
// with the v2 figures, from studio/article-map.json, which pairs every
// paragraph of a section with a step, a rest, a held step or a ghost gap.
//
//   node tools/studio-article.mjs
//
// Map: { sections: [{ h: "heading text as in text.md", blocks: [
//   { fig: "id", kinds: ["step", "rest", "held:6", ...] }   one figure chapter
//   { gap: n }      n paragraphs of text inside the run (the last figure as a ghost)
//   { text: n }     n paragraphs of text outside any run (ends the run)
//   { todo: "id", n }  n paragraphs whose figure is not built yet (plain text, marked)
// ] }] }. Paragraphs are taken in order; a section's leftover paragraphs are text.
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const md = await readFile(join(ROOT, 'articles/other-half/text.md'), 'utf8');
const map = JSON.parse(await readFile(join(ROOT, 'studio/article-map.json'), 'utf8'));
const built = new Set((await readdir(join(ROOT, 'studio/figures'))).map((f) => f.replace(/\.js$/, '')));

const inline = (s) => s
  .replace(/\s*\{\{[^}]*\}\}/g, '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/\*(.+?)\*/g, '<em>$1</em>')
  .trim();

// sections: heading -> paragraphs (scene @step paragraphs included, captions,
// figures, details and margins left out)
const sections = new Map();
let cur = null, skip = null;
for (const block of md.split(/\r?\n\r?\n/)) {
  const b = block.trim();
  if (!b) continue;
  if (b.startsWith('## ')) { cur = b.slice(3).split('\n')[0].trim(); sections.set(cur, []); continue; }
  if (!cur) continue;
  if (skip) { if (/^:::\s*$/m.test(b)) skip = null; continue; }
  if (/^:::(figure|details)/.test(b)) { if (!/^:::\s*$/m.test(b.split('\n').slice(1).join('\n'))) skip = true; continue; }
  if (/^:::(margin|scene)/.test(b) || /^:::\s*$/.test(b) || b.startsWith('@caption')) continue;
  const text = b.replace(/^@step \d+\s*\n?/, '');
  if (!text || text.startsWith(':::')) continue;
  sections.get(cur).push(text.replace(/\n/g, ' '));
}

const out = [];
let inRun = false;
const openRun = () => { if (!inRun) { out.push('  <section class="run">\n    <div class="stage" aria-hidden="true"></div>\n    <div class="flow">'); inRun = true; } };
const closeRun = () => { if (inRun) { out.push('    </div>\n  </section>'); inRun = false; } };
const P = (t, attrs = '') => `<p${attrs}>${inline(t)}</p>`;

for (const sec of map.sections) {
  const paras = sections.get(sec.h);
  if (!paras) throw new Error('no section: ' + sec.h);
  let i = 0;
  const slug = sec.h.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const heading = `<h2 id="${slug}">${inline(sec.h)}</h2>`;
  const firstBlock = sec.blocks?.[0];
  if (firstBlock && (firstBlock.fig && built.has(firstBlock.fig) || firstBlock.gap)) { openRun(); out.push('      ' + heading); }
  else { closeRun(); out.push('  ' + heading); }
  for (const bl of sec.blocks || []) {
    if (bl.fig && built.has(bl.fig)) {
      openRun();
      out.push(`      <div class="chapter" data-fig="${bl.fig}">`);
      if (bl.name) out.push(`        <p class="sr-only">${inline(bl.name)}</p>`);
      for (const k of bl.kinds) {
        const t = paras[i++];
        if (k.startsWith('held')) out.push(`        <div class="held" data-frames="${k.split(':')[1]}">${P(t)}</div>`);
        else out.push('        ' + P(t, ` data-k="${k}"`));
      }
      out.push('      </div>');
    } else if (bl.gap) {
      openRun();
      out.push('      <div class="gap">');
      for (let n = 0; n < bl.gap; n++) out.push('        ' + P(paras[i++]));
      out.push('      </div>');
    } else {
      closeRun();
      const n = bl.text ?? bl.n ?? bl.kinds?.length ?? 0;
      const id = bl.todo || bl.fig;
      if (id) out.push(`  <p class="todo"><em>[figure ${id}: not built yet]</em></p>`);
      for (let k = 0; k < n; k++) out.push('  ' + P(paras[i++]));
    }
  }
  // leftover paragraphs: text (inside the run's flow if a run is open; the figure holds)
  for (; i < paras.length; i++) out.push((inRun ? '      ' : '  ') + P(paras[i]));
}
closeRun();

const head = (await readFile(join(ROOT, 'studio/run.html'), 'utf8')).split('<main class="tell">')[0].replace('Studio: system test', 'Studio: the article, v2');
await writeFile(join(ROOT, 'studio/article.html'), `${head}<main class="tell">
  <h1>The other half of a quantum computer</h1>
  <p class="text" style="color:var(--muted)">Studio copy: the article's text with the v2 figures, built one by one. Figures not built yet are marked. Built from studio/article-map.json by tools/studio-article.mjs.</p>
${out.join('\n')}
  <div style="height: 70vh"></div>
</main>
<script type="module" src="tell.js"></script>
</body>
</html>
`);
console.log('studio/article.html:', map.sections.length, 'sections');

// prerender the stills into the file, so readers without JavaScript (or with a
// failed or slow script) and print get every figure
const puppeteer = (await import('puppeteer-core')).default;
const { startServer } = await import('./serve.mjs');
const { server, port } = await startServer(join(ROOT, 'studio'), 0);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 900, height: 900 });
await page.goto(`http://127.0.0.1:${port}/article.html?prerender`, { waitUntil: 'networkidle0' });
await page.waitForSelector('html.prerender-done', { timeout: 20000 });
const main = await page.evaluate(() => document.querySelector('main.tell').outerHTML);
await browser.close(); server.close();
const file = join(ROOT, 'studio/article.html');
const html = await readFile(file, 'utf8');
await writeFile(file, html.replace(/<main class="tell">[\s\S]*<\/main>/, main));
console.log('stills prerendered');
