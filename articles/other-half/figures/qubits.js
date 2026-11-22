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
// seconds each change plays at its marker, seen from the corner of the eye:
// state 0 is there from the start; the larger grids bring more dots; the
// box that reads it is drawn with its line
export const durations = { small: [1.3, 1.3, 1.3, 1.3, 1.3, 1.3] };
const W = 224, H = 256;
export const aspect = { wide: W / H, tall: W / H };

function build(el, ctx) {
  const C = pal(ctx), rows = ctx.data.rows;
  // Pinned in the margin rail (about 224 to 300 px) the drawing carries a
  // title and a hairline frame, and its first state shows the one qubit
  // large, so that the rail never reads as an empty box. The stills at the
  // section starts (phones, print) keep the plain look.
  const rail = !el.closest('.margin-still');
  const dy = rail ? 6 : 0;
  const byD = (d) => rows.find((r) => r.distance === d);
  const D = rows.map((r) => r.distance);                 // 3, 5, 7, 9
  const dMax = D[D.length - 1], mid = (dMax - 1) / 2;

  // what each state shows
  const K = [
    { d: 1, pitch: 84, cx: 112, cy: 100 + dy, mode: 0, box: 0, label: '1 qubit', sub: 'on its own', say: 'One qubit.' },
    { d: D[0], pitch: 36, cx: 112, cy: 100 + dy, mode: 0, box: 0 },
    { d: D[1], pitch: 27, cx: 112, cy: 100 + dy, mode: 0, box: 0 },
    { d: D[2], pitch: 21, cx: 112, cy: 100 + dy, mode: 1, box: 0 },
    { d: D[2], pitch: 15.5, cx: 84, cy: 100 + dy, mode: 1, box: 1, label: 'the other half', sub: 'the decoder' },
    { d: D[3], pitch: 13.5, cx: 84, cy: 100 + dy, mode: 1, box: 1 },
  ];
  K.forEach((k, i) => {
    const r = byD(k.d);
    if (!r) return;
    if (!k.label) k.label = `${r.total} qubits for one`;
    if (!k.sub) k.sub = `distance ${r.distance}`;
    if (i === 1) k.sub = `${r.storing} store, ${r.helpers} help`;
    if (i === 3) k.sub = `${r.helpers} checks a round`;
    k.say = `Distance ${r.distance}: ${r.storing} storing qubits and ${r.helpers} helpers, ${r.total} qubits in all.`
      + (k.box ? ' Beside the grid, joined to it by one line, the decoder: the other half.' : '');
  });

  const svg = svgRoot(el, W, H, K[0].say);
  svg.style.color = C.ink;
  // the rail's header follows the state: what one qubit takes (states 0 to
  // 3), what reads it (4), and the next step in size (5)
  const heads = [];
  if (rail) {
    const H0 = 'what one qubit takes';
    const HS = [H0, H0, H0, H0, 'and what reads it', 'one step larger'];
    [...new Set(HS)].forEach((h) => { const hg = g(svg); text(hg, 4, 15, h, { family: 'sans', size: 13.5, weight: 600 }); heads.push({ hg, at: HS.map((x, i) => (x === h ? i : -1)).filter((i) => i >= 0) }); });
    rect(svg, 2.5, 24.5, W - 5, 168, { fill: 'none', stroke: C.hairline, 'stroke-width': 1, 'data-audit': 'skip' });
  }

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
  // A dot that is not there yet is transparent, not removed, so that its
  // arrival does not rebuild the layout; and every attribute is written only
  // when its value changes (put), since set() runs on every scroll frame.
  const gDots = g(svg);
  for (const it of items) {
    it.k0 = firstState(it.d0);
    it.rad = Math.hypot(it.i, it.j);
    it.el = circle(gDots, 0, 0, 1, it.store ? { fill: C.paper, stroke: C.ink, 'stroke-width': 1.25 } : { fill: C.ink });
    it.el.setAttribute('opacity', '0');
    it.last = { o: '0' };
  }
  // writes an attribute only when its value has changed
  const put = (it, key, name, v) => { if (it.last[key] !== v) { it.last[key] = v; it.el.setAttribute(name, v); } };
  // the new dots of a state arrive from the centre outwards, storing first
  const order = new Map();
  K.forEach((k, s) => {
    const fresh = items.filter((it) => it.k0 === s).sort((a, b) => (a.rad - b.rad) || (a.store === b.store ? Math.atan2(a.i, a.j) - Math.atan2(b.i, b.j) : a.store ? -1 : 1));
    fresh.forEach((it, n) => { it.rank = n; });
    order.set(s, fresh.length);
  });

  // the box that reads the grid
  const bx = rail ? 166 : 174, by = 82 + dy, bw = 38, bh = 36;
  const gBox = g(svg);
  rect(gBox, bx, by, bw, bh, { fill: 'none', stroke: C.ink, 'stroke-width': 1.25 });
  // inside the box, what it reads: a frame of the film, two checks lit (section 4)
  rect(gBox, bx + 9, by + 8, 9, 9, { fill: C.flip }); rect(gBox, bx + 20, by + 19, 9, 9, { fill: C.flip });
  // the line from the grid to the box is the film itself: a dark strip with its perforations
  const join = g(svg);
  const joinA = line(join, 0, by + bh / 2, bx, by + bh / 2, { stroke: '#24211E', 'stroke-width': 7, 'stroke-linecap': 'butt' });
  const joinB = line(join, 0, by + bh / 2 - 2.2, bx, by + bh / 2 - 2.2, { stroke: C.paper, 'stroke-width': 1.3, 'stroke-dasharray': '1.6 2.6', 'data-audit': 'skip' });
  const joinC = line(join, 0, by + bh / 2 + 2.2, bx, by + bh / 2 + 2.2, { stroke: C.paper, 'stroke-width': 1.3, 'stroke-dasharray': '1.6 2.6', 'data-audit': 'skip' });

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
    const m = ease(clamp(u / 0.7));
    const pitch = lerp(a.pitch, b.pitch, m), cx = lerp(a.cx, b.cx, m), cy = lerp(a.cy, b.cy, m), mode = lerp(a.mode, b.mode, m);
    // state 0 is complete from the start: the one qubit never fades in
    // under its label, so the opening never shows a label over an empty box
    // the new dots begin while the grid still shrinks, so no part of the
    // change stands still
    const arrive = G <= 0 ? 1 : clamp((u - 0.3) / 0.64);
    const sw = lerp(1.25, 1, mode).toFixed(2);
    const rStore = lerp(pitch * 0.19, 2.9, mode), rHelp = lerp(pitch * 0.085, 1.5, mode);
    for (const it of items) {
      let p = it.k0 < k1 || (it.k0 === 0 && G > 0) ? 1 : 0;
      if (it.k0 === k1) {
        const n = order.get(k1), spread = Math.max(1, n * 0.3);
        p = easeOut(clamp((arrive * (n + spread) - it.rank) / spread));
      }
      const o = p <= 0.001 ? '0' : p >= 0.999 ? '1' : p.toFixed(2);
      put(it, 'o', 'opacity', o);
      if (o === '0') continue;
      put(it, 'cx', 'cx', (cx + it.j * pitch).toFixed(2));
      put(it, 'cy', 'cy', (cy + it.i * pitch).toFixed(2));
      put(it, 'r', 'r', ((it.store ? rStore : rHelp) * (0.4 + 0.6 * p)).toFixed(2));
      if (it.store) put(it, 'sw', 'stroke-width', sw);
    }
    // box and its line
    const boxP = a.box && b.box ? 1 : b.box ? ease(clamp((u - 0.5) / 0.4)) : 0;
    show(gBox, boxP);
    const reach = cx + ((b.d - 1) / 2 + 0.5) * pitch + 5;
    if (show(join, a.box && b.box ? 1 : b.box ? clamp((u - 0.45) / 0.25) : 0)) {
      const x2 = (a.box && b.box ? bx : lerp(reach, bx, ease(clamp((u - 0.45) / 0.4)))).toFixed(1);
      for (const ln of [joinA, joinB, joinC]) { ln.setAttribute('x1', reach.toFixed(1)); ln.setAttribute('x2', x2); }
    }
    // labels: the old one leaves, the new one comes last
    labels.forEach((lb, i) => {
      let p = 0;
      if (k0 === k1) p = i === k1 ? 1 : 0;
      else if (i === k0) p = 1 - ease(clamp(u / 0.25));
      else if (i === k1) p = ease(clamp((u - 0.75) / 0.25));
      show(lb, p);
    });
    // the header changes with the label, in the same fade
    const hv = (i) => heads.find((h) => h.at.includes(i));
    heads.forEach((h) => {
      let p = 0;
      if (hv(k0) === hv(k1)) p = h === hv(k1) ? 1 : 0;
      else if (h === hv(k0)) p = 1 - ease(clamp(u / 0.25));
      else if (h === hv(k1)) p = ease(clamp((u - 0.75) / 0.25));
      show(h.hg, p);
    });
    svg.setAttribute('aria-label', K[u >= 0.6 ? k1 : k0].say);
  }
  return { set };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
