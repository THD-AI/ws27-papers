// qubits: the margin scene. The grid of one logical qubit, growing from its
// centre: 1 qubit, then distance 3, 5 and 7; then the box that reads it
// (the other half), and distance 9. Storing qubits are open circles, helpers
// smaller filled dots between them; from distance 7 on all are dots of one
// size and the count carries the number. Every count is from data/qubits.json.
import {
  mountFigure, svgRoot, g, circle, rect, line, text, clamp, lerp, ease, easeOut,
} from '../../../lib/fig.js';
import { pal, surface, show } from './shared.js';

export const steps = 6;
const W = 224, H = 256;
export const aspect = { wide: W / H, tall: W / H };

function build(el, ctx) {
  const C = pal(ctx), rows = ctx.data.rows;
  const byD = (d) => rows.find((r) => r.distance === d);
  const D = rows.map((r) => r.distance);                 // 3, 5, 7, 9
  const dMax = D[D.length - 1], mid = (dMax - 1) / 2;

  // what each state shows
  const K = [
    { d: 1, pitch: 36, cx: 112, cy: 100, mode: 0, box: 0, label: '1 qubit', sub: '', say: 'One qubit.' },
    { d: D[0], pitch: 36, cx: 112, cy: 100, mode: 0, box: 0 },
    { d: D[1], pitch: 27, cx: 112, cy: 100, mode: 0, box: 0 },
    { d: D[2], pitch: 21, cx: 112, cy: 100, mode: 1, box: 0 },
    { d: D[2], pitch: 15.5, cx: 84, cy: 100, mode: 1, box: 1, label: 'the other half', sub: 'the decoder' },
    { d: D[3], pitch: 13.5, cx: 84, cy: 100, mode: 1, box: 1 },
  ];
  K.forEach((k, i) => {
    const r = byD(k.d);
    if (!r) return;
    if (!k.label) k.label = `${r.total} · distance ${r.distance}`;
    if (i === 1) k.sub = `${r.storing} store, ${r.helpers} help`;
    if (i === 3) k.sub = `${r.helpers} checks a round`;
    k.say = `Distance ${r.distance}: ${r.storing} storing qubits and ${r.helpers} helpers, ${r.total} qubits in all.`
      + (k.box ? ' Beside the grid, joined to it by one line, the decoder: the other half.' : '');
  });

  const svg = svgRoot(el, W, H, K[0].say);
  svg.style.color = C.ink;

  // every dot of the largest grid, with the first state that has it
  const firstState = (d0) => K.findIndex((k) => k.d >= d0);
  const items = [];
  for (let i = -mid; i <= mid; i++) for (let j = -mid; j <= mid; j++) {
    items.push({ i, j, store: true, d0: 2 * Math.max(Math.abs(i), Math.abs(j)) + 1 });
  }
  const seen = new Map();
  for (const d of D) {
    const checks = surface(d);
    if (checks.length !== byD(d).helpers) console.warn(`qubits: ${checks.length} checks drawn at distance ${d}, data says ${byD(d).helpers}`);
    for (const c of checks) {
      const i = c.row + 0.5 - (d - 1) / 2, j = c.col + 0.5 - (d - 1) / 2, key = `${i}|${j}`;
      if (!seen.has(key)) { seen.set(key, d); items.push({ i, j, store: false, d0: d }); }
    }
  }
  const gDots = g(svg);
  for (const it of items) {
    it.k0 = firstState(it.d0);
    it.rad = Math.hypot(it.i, it.j);
    it.el = circle(gDots, 0, 0, 1, it.store ? { fill: C.paper, stroke: C.ink, 'stroke-width': 1.25 } : { fill: C.ink });
  }
  // the new dots of a state arrive from the centre outwards, storing first
  const order = new Map();
  K.forEach((k, s) => {
    const fresh = items.filter((it) => it.k0 === s).sort((a, b) => (a.rad - b.rad) || (a.store === b.store ? Math.atan2(a.i, a.j) - Math.atan2(b.i, b.j) : a.store ? -1 : 1));
    fresh.forEach((it, n) => { it.rank = n; });
    order.set(s, fresh.length);
  });

  // the box that reads the grid
  const bx = 174, by = 82, bw = 38, bh = 36;
  const gBox = g(svg);
  rect(gBox, bx - 5, by + 7, bw + 12, bh + 6, { fill: C.field, 'data-audit': 'skip' });
  rect(gBox, bx, by, bw, bh, { fill: 'none', stroke: C.ink, 'stroke-width': 1.25 });
  const join = line(svg, 0, by + bh / 2, bx, by + bh / 2, { stroke: C.ink, 'stroke-width': 1.25, 'stroke-linecap': 'round' });

  // labels, one pair per state
  const labels = K.map((k) => {
    const grp = g(svg);
    text(grp, W / 2, 214, k.label, { family: 'mono', size: 15, weight: 500, anchor: 'middle' });
    if (k.sub) text(grp, W / 2, 236, k.sub, { family: 'mono', size: 13.5, anchor: 'middle', fill: C.muted });
    return grp;
  });

  function set(step, t) {
    const G = clamp(step, 0, K.length - 1) + clamp(t) - 1;   // G = k: state k complete
    const k1 = Math.max(0, Math.ceil(G - 1e-9)), k0 = Math.max(0, k1 - 1);
    const u = G <= 0 ? 1 : G - (k1 - 1);                       // progress into state k1
    const a = K[k0], b = K[k1];
    const m = ease(clamp(u / 0.55));
    const pitch = lerp(a.pitch, b.pitch, m), cx = lerp(a.cx, b.cx, m), cy = lerp(a.cy, b.cy, m), mode = lerp(a.mode, b.mode, m);
    const arrive = G <= 0 ? clamp(G + 1) : clamp((u - 0.38) / 0.62);
    for (const it of items) {
      let p = it.k0 < k1 || (it.k0 === 0 && G > 0) ? 1 : 0;
      if (it.k0 === k1) {
        const n = order.get(k1), spread = Math.max(1, n * 0.3);
        p = easeOut(clamp((arrive * (n + spread) - it.rank) / spread));
      }
      if (!show(it.el, p)) continue;
      const r = it.store ? lerp(pitch * 0.19, 2.9, mode) : lerp(pitch * 0.085, 1.5, mode);
      it.el.setAttribute('cx', (cx + it.j * pitch).toFixed(2));
      it.el.setAttribute('cy', (cy + it.i * pitch).toFixed(2));
      it.el.setAttribute('r', (r * (0.4 + 0.6 * p)).toFixed(2));
      if (it.store) {
        it.el.setAttribute('stroke-width', lerp(1.25, 1, mode).toFixed(2));
      }
    }
    // box and its line
    const boxP = a.box && b.box ? 1 : b.box ? ease(clamp((u - 0.5) / 0.4)) : 0;
    show(gBox, boxP);
    const reach = cx + ((b.d - 1) / 2 + 0.5) * pitch + 5;
    if (show(join, a.box && b.box ? 1 : b.box ? clamp((u - 0.45) / 0.1) : 0)) {
      join.setAttribute('x1', reach.toFixed(1));
      join.setAttribute('x2', (a.box && b.box ? bx : lerp(reach, bx, ease(clamp((u - 0.45) / 0.4)))).toFixed(1));
    }
    // labels: the old one leaves, the new one comes last
    labels.forEach((lb, i) => {
      let p = 0;
      if (k0 === k1) p = i === k1 ? 1 : 0;
      else if (i === k0) p = 1 - ease(clamp(u / 0.2));
      else if (i === k1) p = ease(clamp((u - 0.8) / 0.2));
      show(lb, p);
    });
    svg.setAttribute('aria-label', K[u >= 0.6 ? k1 : k0].say);
  }
  return { set };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
