// Spike (v3.1, block 2): trace a raster sprite to a centreline SVG path.
// threshold -> Zhang–Suen skeleton -> spur prune (< 8 px) -> Douglas–Peucker
// -> Catmull–Rom cubic path, drawn at one fixed screen stroke.
// Runs inside headless Chrome (canvas does the PNG decode, so no sharp needed).
//
//   node tools/centreline.mjs <sprite.png> <out-dir>
// Writes centreline-<zoom>.png for overview, A and B, plus centreline.svg.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [src, out = join(ROOT, 'talks/quantum/v31/board/out')] = process.argv.slice(2);
if (!src) { console.error('usage: node tools/centreline.mjs <sprite.png> [out-dir]'); process.exit(1); }
mkdirSync(out, { recursive: true });
const png = 'data:image/png;base64,' + readFileSync(src).toString('base64');
const rough = readFileSync(join(ROOT, 'node_modules/roughjs/bundled/rough.js'), 'utf8');

// Everything below runs in the page.
function trace(img, opts) {
  const { thr = 128, spur = 8, eps = 1.0 } = opts;
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const W = c.width, H = c.height, d = g.getImageData(0, 0, W, H).data;
  const B = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const a = d[i * 4 + 3], l = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
    B[i] = a >= 128 && l < thr ? 1 : 0;
  }
  const ink = B.reduce((s, v) => s + v, 0);
  // Zhang–Suen
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : B[y * W + x]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const step of [0, 1]) {
      const kill = [];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (!B[y * W + x]) continue;
        const p = [at(x, y - 1), at(x + 1, y - 1), at(x + 1, y), at(x + 1, y + 1), at(x, y + 1), at(x - 1, y + 1), at(x - 1, y), at(x - 1, y - 1)];
        const b = p.reduce((s, v) => s + v, 0);
        if (b < 2 || b > 6) continue;
        let a = 0; for (let k = 0; k < 8; k++) if (!p[k] && p[(k + 1) % 8]) a++;
        if (a !== 1) continue;
        if (step === 0 ? (p[0] * p[2] * p[4] || p[2] * p[4] * p[6]) : (p[0] * p[2] * p[6] || p[0] * p[4] * p[6])) continue;
        kill.push(y * W + x);
      }
      for (const i of kill) B[i] = 0;
      if (kill.length) changed = true;
    }
  }
  const N8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];
  const nb = (i) => { const x = i % W, y = (i / W) | 0, r = []; for (const [dx, dy] of N8) if (at(x + dx, y + dy)) r.push((y + dy) * W + x + dx); return r; };
  // spur prune: walk from each endpoint to a junction; drop the walk if shorter than spur
  let pruned = 0;
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < W * H; i++) {
      if (!B[i] || nb(i).length !== 1) continue;
      const walk = [i]; let prev = -1, cur = i;
      while (walk.length <= spur) {
        const n = nb(cur).filter((j) => j !== prev && !walk.includes(j));
        if (n.length !== 1) break;
        if (nb(n[0]).length > 2) { walk.junction = true; break; }
        prev = cur; cur = n[0]; walk.push(cur);
      }
      if (walk.junction && walk.length < spur) { for (const j of walk) B[j] = 0; pruned++; }
    }
  }
  // polylines: start at endpoints, then at leftovers (loops)
  const seen = new Uint8Array(W * H), lines = [];
  const follow = (s) => {
    const pts = [s]; seen[s] = 1; let cur = s;
    for (;;) { const n = nb(cur).filter((j) => !seen[j]); if (!n.length) break; cur = n[0]; seen[cur] = 1; pts.push(cur); }
    return pts.map((i) => [i % W, (i / W) | 0]);
  };
  for (let i = 0; i < W * H; i++) if (B[i] && !seen[i] && nb(i).length !== 2) lines.push(follow(i));
  for (let i = 0; i < W * H; i++) if (B[i] && !seen[i]) lines.push(follow(i));
  const dp = (p) => {
    if (p.length < 3) return p;
    const [a, b] = [p[0], p[p.length - 1]]; let m = 0, k = 0;
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    for (let i = 1; i < p.length - 1; i++) { const dd = Math.abs((b[0] - a[0]) * (a[1] - p[i][1]) - (a[0] - p[i][0]) * (b[1] - a[1])) / L; if (dd > m) { m = dd; k = i; } }
    return m > eps ? [...dp(p.slice(0, k + 1)).slice(0, -1), ...dp(p.slice(k))] : [a, b];
  };
  const kept = lines.filter((l) => l.length >= 3).map(dp);
  const cr = (p) => {
    let s = `M${p[0][0]},${p[0][1]}`;
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
      s += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0]},${p2[1]}`;
    }
    return s;
  };
  return { W, H, ink, skel: B.reduce((s, v) => s + v, 0), pruned, paths: kept.map(cr), nodes: kept.reduce((s, l) => s + l.length, 0) };
}

const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#FBFBFC;font:20px 'Libre Franklin',sans-serif;color:#15171C}
.cell{display:inline-block;vertical-align:top;margin:16px;text-align:center}svg{display:block;background:#FBFBFC;outline:1px solid #DADDE3}
path{fill:none;stroke:#15171C;stroke-width:3;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}</style>
<div id="root"></div><script>${rough}</script><script>const trace=${trace.toString()};</script>`;

const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await b.newPage();
await p.setContent(html);
const res = await p.evaluate(async (png) => {
  const img = new Image(); img.src = png; await img.decode();
  const r = trace(img, { thr: 190, spur: 8, eps: 1.0 });
  window.R = r; window.PNG = png;
  return { W: r.W, H: r.H, ink: r.ink, skel: r.skel, pruned: r.pruned, paths: r.paths.length, nodes: r.nodes, d: r.paths };
}, png);
writeFileSync(join(out, 'centreline.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${res.W} ${res.H}"><g fill="none" stroke="#15171C" stroke-width="3" vector-effect="non-scaling-stroke">${res.d.map((d) => `<path d="${d}"/>`).join('')}</g></svg>`);

// Zooms: sprite height on screen in px, from the v3.1 camera table.
// overview (width 9600) ~0.2x, A (2400) ~0.8x, B (1800) ~1.07x – shown at 0.25, 1 and 3 (B close-up).
const ZOOMS = { overview: 0.25, A: 1, B: 3 };
for (const [name, z] of Object.entries(ZOOMS)) {
  await p.evaluate((z, name) => {
    const r = window.R, w = Math.round(r.W * z), h = Math.round(r.H * z);
    const root = document.getElementById('root'); root.innerHTML = '';
    const cell = (title, el) => { const d = document.createElement('div'); d.className = 'cell'; d.append(el); const t = document.createElement('div'); t.textContent = title; d.append(t); root.append(d); };
    const im = new Image(); im.src = window.PNG; im.width = w; im.height = h; im.style.imageRendering = 'auto'; cell('source raster', im);
    const ns = 'http://www.w3.org/2000/svg', s = document.createElementNS(ns, 'svg');
    s.setAttribute('width', w); s.setAttribute('height', h); s.setAttribute('viewBox', `0 0 ${r.W} ${r.H}`);
    s.innerHTML = r.paths.map((d) => `<path d="${d}"/>`).join(''); cell('centreline, 3 px', s);
    const s2 = document.createElementNS(ns, 'svg'); s2.setAttribute('width', w); s2.setAttribute('height', h); s2.setAttribute('viewBox', `0 0 ${r.W} ${r.H}`);
    const rc = rough.svg(s2); s2.append(rc.line(r.W * 0.1, r.H * 0.5, r.W * 0.9, r.H * 0.5, { roughness: 0.3, bowing: 0, stroke: '#15171C', strokeWidth: 3 }));
    s2.querySelectorAll('path').forEach((q) => q.setAttribute('vector-effect', 'non-scaling-stroke'));
    cell('rough.js line, 0.3', s2);
    const t = document.createElement('div'); t.style.margin = '0 16px'; t.textContent = 'zoom ' + name + ' (' + z + 'x)'; root.prepend(t);
  }, z, name);
  const el = await p.$('#root');
  await el.screenshot({ path: join(out, `centreline-${name}.png`) });
}
await b.close();
console.log(JSON.stringify({ W: res.W, H: res.H, inkPx: res.ink, skeletonPx: res.skel, spursPruned: res.pruned, paths: res.paths, nodes: res.nodes, out }, null, 1));
