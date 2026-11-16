// house-b: the opening drawing. One pen line, thin and a little uneven,
// draws the same house twice as the reader arrives.
//   step 0: the line draws the old house; a crack runs up from its shallow
//           footing into the wall, and a paint roller paints over the crack
//           on the wall, where a hairline of it shows through: repaint.
//   step 1: the same line runs on along the ground and draws the second
//           house from the foundations up; a second pass in the accent
//           renews the foundations before the walls rise: renovate.
// The last state holds both houses side by side and reads on its own.
import {
  mountFigure, svgRoot, colors, g, path, rect, text, stage, span, ease, rng, spline, lerp,
} from '../../../lib/fig.js';

export const steps = 2;
export const aspect = { wide: 552 / 256, tall: 360 / 200 };

// Geometry in the units of the wide drawing (552 across); the tall drawing
// is the same picture scaled about the middle.
const GY = 166;                 // ground
const E = GY - 81;              // top of the walls
const PEAK = 28;
const FOOT_OLD = 20, FOOT_NEW = 26;
const CRACK = [[131, GY + FOOT_OLD], [137, GY + 10], [126, GY - 2], [137, GY - 16], [127, GY - 32], [136, GY - 48], [128, GY - 58], [132, GY - 66]];
const BAND = { x: 131, y0: GY - 4, y1: GY - 74, w: 38 };

function house(x0, x1, cx) {
  return [[x0, E], [x0 - 12, E + 6], [cx, PEAK], [x1 + 12, E + 6], [x1, E]];
}

// The one line, as corner points. The split is where step 0 ends.
function route() {
  const old = [
    [14, GY], [70, GY],                                   // ground into the first house
    ...house(70, 220, 145),                               // left wall up, roof, right wall top
    [220, GY], [224, GY], [224, GY + FOOT_OLD],           // right wall down, the shallow footing
    [133.4, GY + FOOT_OLD],
    ...CRACK.slice(1, -1).map((p) => [p[0] + 2.4, p[1]]), // the crack: up one side ...
    CRACK[CRACK.length - 1],
    ...CRACK.slice(1, -1).reverse().map((p) => [p[0] - 2.4, p[1]]),
    [128.6, GY + FOOT_OLD],                               // ... and down the other
    [66, GY + FOOT_OLD], [66, GY], [70, GY],
    [172, GY], [172, GY - 42], [190, GY - 42], [190, GY], [224, GY], // the door
  ];
  const fresh = [
    [326, GY], [326, GY + FOOT_NEW], [484, GY + FOOT_NEW], [484, GY], // foundations first
    [480, GY], [480, E], [492, E + 6], [405, PEAK], [318, E + 6], [330, E], // walls and roof, right to left
    [330, GY], [432, GY], [432, GY - 42], [450, GY - 42], [450, GY], [538, GY],
  ];
  return { old, fresh };
}

// Dense points along the corners with a slow, seeded wobble: a hand that
// moves at one speed and drifts a little, never a jitter.
function pen(points, seed, amp, map) {
  const r = rng(seed);
  const ph = [r(), r(), r(), r()].map((v) => v * Math.PI * 2);
  const out = [];
  let s = 0;
  for (let i = 0; i < points.length; i++) {
    const [ax, ay] = points[i];
    if (i === 0) { out.push({ x: ax, y: ay, s: 0 }); continue; }
    const [px, py] = points[i - 1];
    const len = Math.hypot(ax - px, ay - py);
    const n = Math.max(1, Math.round(len / 5));
    for (let k = 1; k <= n; k++) {
      const u = k / n;
      out.push({ x: lerp(px, ax, u), y: lerp(py, ay, u), s: s + len * u });
    }
    s += len;
  }
  const pts = out.map((p) => {
    const dx = amp * (0.65 * Math.sin(p.s * 0.031 + ph[0]) + 0.35 * Math.sin(p.s * 0.083 + ph[1]));
    const dy = amp * (0.65 * Math.sin(p.s * 0.027 + ph[2]) + 0.35 * Math.sin(p.s * 0.071 + ph[3]));
    return map(p.x + dx, p.y + dy);
  });
  return { d: spline(pts), length: s };
}

function build(el, ctx) {
  const C = colors(ctx), d = ctx.data, tall = ctx.layout === 'tall';
  const W = tall ? 360 : 552, H = tall ? 200 : 256;
  const S = tall ? 0.64 : 1;
  const map = (x, y) => (tall ? [180 + (x - 276) * S, y * S - 1] : [x, y]);
  const X = (x) => map(x, 0)[0], Y = (y) => map(0, y)[1];
  const svg = svgRoot(el, W, H, d.reading);
  svg.style.color = C.ink;
  const st = stage();

  const { old, fresh } = route();
  const all = [...old, ...fresh];
  let lenOld = 0;
  for (let i = 1; i < old.length; i++) lenOld += Math.hypot(old[i][0] - old[i - 1][0], old[i][1] - old[i - 1][1]);

  // the renewed foundations: the one field, under the ink
  const fx0 = X(326), fx1 = X(484), fy0 = Y(GY), fy1 = Y(GY + FOOT_NEW);
  const field = rect(svg, fx0, fy0, fx1 - fx0, fy1 - fy0, { fill: C.field, 'data-audit': 'skip' });

  // the line, in two passes of one hand: a main stroke and a thinner one
  // that lies partly beside it, so the weight changes along the way
  const main = pen(all, 11, 0.9, map);
  const split = lenOld / main.length;
  // where the new foundations are complete: after the four corners that follow the old house
  let lenFound = lenOld;
  const fp = [old[old.length - 1], ...fresh.slice(0, 4)];
  for (let i = 1; i < fp.length; i++) lenFound += Math.hypot(fp[i][0] - fp[i - 1][0], fp[i][1] - fp[i - 1][1]);
  const gFound = 1.0 + 0.66 * ((lenFound / main.length - split) / (1 - split));
  const passes = [
    path(svg, main.d, { stroke: C.ink, 'stroke-width': 1.35, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
    path(svg, pen(all, 29, 1.25, map).d, { stroke: C.ink, 'stroke-width': 0.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.75 }),
  ];
  // how much of the line is down at g: step 0 draws the old house, step 1
  // runs on into the new one
  const drawn = (gg) => (gg < 1
    ? split * span(gg, 0.02, 0.7)
    : split + (1 - split) * span(gg, 1.0, 1.66));
  for (const p of passes) {
    p.setAttribute('pathLength', '1');
    st.on((gg) => {
      const f = drawn(gg);
      p.style.display = f <= 0.0005 ? 'none' : '';
      if (f >= 0.9995) { p.removeAttribute('stroke-dasharray'); p.removeAttribute('stroke-dashoffset'); return; }
      p.setAttribute('stroke-dasharray', '1 1');
      p.setAttribute('stroke-dashoffset', (1 - f).toFixed(4));
    });
  }

  // paint: a roller band over the crack, on the wall only. Two passes of
  // the roller, a little apart, so the edges are not straight.
  const [bx, by0] = map(BAND.x, BAND.y0), by1 = Y(BAND.y1);
  const ym = (by0 + by1) / 2;
  const bands = [
    [0, BAND.w * S, 1],
    [3.5 * S, BAND.w * 0.8 * S, 0.85],
  ].map(([dx, w, op]) => path(svg, `M${(bx + dx).toFixed(1)} ${by0.toFixed(1)}L${(bx + dx + 0.8 * S).toFixed(1)} ${ym.toFixed(1)}L${(bx + dx - 0.4 * S).toFixed(1)} ${by1.toFixed(1)}`, {
    stroke: C.hairline, 'stroke-width': w, 'stroke-linecap': 'butt', opacity: op, 'data-audit': 'skip',
  }));
  bands.forEach((b) => st.draw(b, 0.72, 0.94));
  // the crack still shows through the paint as a hairline
  const through = CRACK.filter((p) => p[1] <= GY - 2).map((p) => map(p[0], p[1]));
  const hair = path(svg, through.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(''), { stroke: C.ink, 'stroke-width': 0.85, 'stroke-linecap': 'round', 'stroke-linejoin': 'miter', opacity: 0.6, 'data-audit': 'skip' });
  st.draw(hair, 0.8, 0.98);
  // the roller rides the top of the band: a sleeve, its frame, a handle
  const roller = g(svg);
  const rw = 46 * S, rh = 12 * S, k = S;
  rect(roller, -rw / 2, -rh / 2, rw, rh, { rx: 3 * k, fill: C.paper, stroke: C.ink, 'stroke-width': 1.35 });
  path(roller, `M${-rw / 2 + 5 * k} ${-rh / 2}L${-rw / 2 + 5 * k} ${rh / 2}M${rw / 2 - 5 * k} ${-rh / 2}L${rw / 2 - 5 * k} ${rh / 2}`, { stroke: C.ink, 'stroke-width': 0.8 });
  path(roller, `M${rw / 2} 0L${rw / 2 + 6 * k} 0L${rw / 2 + 6 * k} ${-12 * k}L${rw / 2 + 13 * k} ${-24 * k}`, { stroke: C.ink, 'stroke-width': 1.35, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  path(roller, `M${rw / 2 + 13 * k} ${-24 * k}L${rw / 2 + 18 * k} ${-36 * k}`, { stroke: C.ink, 'stroke-width': 4.2 * Math.max(S, 0.75), 'stroke-linecap': 'round' });
  st.on((gg) => {
    const p = ease(span(gg, 0.72, 0.94));
    const y = lerp(by0, by1, p);
    roller.setAttribute('transform', `translate(${bx.toFixed(1)} ${y.toFixed(1)})`);
  });
  st.fade(roller, 0.68, 0.72);

  // the second pass: the foundations drawn again in the accent, as soon as
  // the line has laid them and before the walls rise on them
  const re = pen([[326, GY], [326, GY + FOOT_NEW], [484, GY + FOOT_NEW], [484, GY]], 5, 0.7, map);
  const renew = path(svg, re.d, { stroke: C.accent, 'stroke-width': 1.9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  st.draw(renew, gFound, gFound + 0.12);
  st.fade(field, gFound + 0.04, gFound + 0.16);

  // the two names under the houses
  const lab = tall
    ? { y: 148, size: 12, note: 12.5, width: 128, lh: 15 }
    : { y: 224, size: 12.5, note: 14, width: 250, lh: 17 };
  const names = [
    { cx: X(145), item: d.repaint, color: C.ink, at: 0.66 },
    { cx: X(405), item: d.renovate, color: C.accent, at: 1.6 },
  ];
  for (const n of names) {
    const grp = g(svg);
    text(grp, n.cx, lab.y, n.item.label, { family: 'mono', size: lab.size, weight: 500, caps: true, spacing: 1.2, fill: n.color, anchor: 'middle' });
    text(grp, n.cx, lab.y + lab.size + 7, n.item.note, { italic: true, size: lab.note, fill: C.muted, anchor: 'middle', width: lab.width, lh: lab.lh });
    st.fade(grp, n.at, n.at + 0.06);
  }

  return { set: (s, t) => st.set(s, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
