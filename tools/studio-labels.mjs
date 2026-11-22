// The label gate: every figure, every step (held frames included), at every
// design size the stages produce: fails any visible text that leaves the
// drawing, overlaps other visible text, or renders under 11.5 px.
//   node tools/studio-labels.mjs [fig,fig]     -> exit 1 on any failure
import { readdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { startServer } from './serve.mjs';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const only = process.argv[2]?.split(',');
const figs = (await readdir(resolve(ROOT, 'studio/figures'))).map((f) => f.replace('.js', ''))
  .filter((f) => !['parts', 'dummy-grid', 'dummy-reels'].includes(f) && (!only || only.includes(f)));
// stage sizes (CSS px) that the device table produces, one per design and a few edges
const STAGES = [[360, 352], [375, 293], [390, 371], [430, 410], [768, 410], [820, 472], [440, 560], [740, 700], [860, 720]];
const { server, port } = await startServer(resolve(ROOT, 'studio'), 0);
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await b.newPage();
await p.setViewport({ width: 1000, height: 900 });
await p.goto(`http://127.0.0.1:${port}/lab.html?fig=dummy-reels&pos=1`, { waitUntil: 'networkidle0' });
let fails = 0;
for (const fig of figs) {
  for (const [w, h] of STAGES) {
    const res = await p.evaluate(async (fig, w, h) => {
      const mod = (await import(`./figures/${fig}.js`)).default;
      const out = [];
      const n = mod.steps.length;
      const positions = [];
      for (let k = 1; k <= n; k++) { const hd = mod.steps[k - 1].held; if (hd) for (let f = 1; f <= hd; f++) positions.push(k - 1 + f / hd); else positions.push(k); }
      const box = document.createElement('div'); box.style.cssText = `width:${w}px;height:${h}px;position:relative`;
      document.body.replaceChildren(box);
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); box.appendChild(svg);
      const layout = w >= 600 ? 'wide' : w / h < 1.05 ? 'tall' : w / h < 1.45 ? 'mid' : 'wide';
      const api = mod.mount(svg, { layout, k: 1, reduced: true });
      const vb = svg.viewBox.baseVal, s = Math.min(w / vb.width, h / vb.height, 1.3);
      Object.assign(svg.style, { width: vb.width * s + 'px', height: vb.height * s + 'px', position: 'absolute', inset: '0', margin: 'auto' });
      for (const pos of positions) {
        api.render(pos);
        const R = svg.getBoundingClientRect();
        const texts = [...svg.querySelectorAll('text')].filter((t) => t.textContent.trim() && t.checkVisibility({ opacityProperty: true }) && +getComputedStyle(t).opacity > 0.05 && ![...svg.querySelectorAll('g')].some((g) => g.contains(t) && +getComputedStyle(g).opacity < 0.05));
        const rects = texts.map((t) => ({ t: t.textContent.trim().slice(0, 24), r: t.getBoundingClientRect(), px: parseFloat(t.getAttribute('font-size') || 14) * (t.getScreenCTM()?.a || 1) }));
        for (const a of rects) {
          if (a.r.left < R.left - 1 || a.r.right > R.right + 1 || a.r.top < R.top - 1 || a.r.bottom > R.bottom + 1) out.push(`pos ${pos.toFixed(2)}: "${a.t}" leaves the drawing`);
          if (a.px < 11.5) out.push(`pos ${pos.toFixed(2)}: "${a.t}" is ${a.px.toFixed(1)} px`);
        }
        for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
          const A = rects[i].r, B = rects[j].r;
          const ox = Math.min(A.right, B.right) - Math.max(A.left, B.left), oy = Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top);
          if (ox > 2 && oy > 2) out.push(`pos ${pos.toFixed(2)}: "${rects[i].t}" overlaps "${rects[j].t}"`);
        }
      }
      return { layout, issues: [...new Set(out)] };
    }, fig, w, h);
    if (res.issues.length) { fails += res.issues.length; console.log(`${fig} ${w}x${h} (${res.layout}):\n  ` + res.issues.slice(0, 8).join('\n  ') + (res.issues.length > 8 ? `\n  … ${res.issues.length - 8} more` : '')); }
  }
}
console.log(fails ? `${fails} label failures` : 'labels: all pass');
await b.close(); server.close();
process.exit(fails ? 1 : 0);
