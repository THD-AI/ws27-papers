// house-c: two pen drawings, no diagram. Left, repaint: the house drawn in
// one line, a crack from the foundation up into the wall, a roller paints
// an agent over the wall and the crack below stays. Right, renovate: the
// same house, a new foundation, one line from it to a screen, a person at
// work. Steps: 0 the old house with its crack, 1 the roller paints it over,
// 2 the renovated house. The last state holds both drawings.
import {
  mountFigure, svgRoot, colors, g, h, path, text, stage, spline, rng, span, ease,
} from '../../../lib/fig.js';

export const steps = 3;
export const aspect = { wide: 552 / 246, tall: 360 / 182 };

let clipN = 0;

// A pen line through the corners: every edge is cut into short pieces, each
// point moves a little off the straight line (seeded), and a spline joins
// them, so corners round slightly and edges are never ruler-straight.
function pen(pts, seed, map, wob = 0.9, sharp = true) {
  const rnd = rng(seed);
  const out = [];
  const near = (p, q, dd) => { const l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1; return [p[0] + ((q[0] - p[0]) / l) * Math.min(dd, l / 3), p[1] + ((q[1] - p[1]) / l) * Math.min(dd, l / 3)]; };
  for (let i = 0; i < pts.length; i++) {
    const [x, y] = pts[i];
    // a point just before and after each corner keeps the corner crisp
    if (sharp && i > 0) out.push(near(pts[i], pts[i - 1], 2.2));
    out.push([x + (rnd() - 0.5) * wob, y + (rnd() - 0.5) * wob]);
    if (sharp && i < pts.length - 1) out.push(near(pts[i], pts[i + 1], 2.2));
    if (i === pts.length - 1) break;
    const [x2, y2] = pts[i + 1];
    const len = Math.hypot(x2 - x, y2 - y);
    const n = Math.floor(len / 16);
    const nx = -(y2 - y) / (len || 1), ny = (x2 - x) / (len || 1);
    for (let k = 1; k < n; k++) {
      const u = k / n, off = (rnd() - 0.5) * wob * 1.4;
      out.push([x + (x2 - x) * u + nx * off, y + (y2 - y) * u + ny * off]);
    }
  }
  return spline(out.map(([x, y]) => map(x, y)));
}

// The house, in its own 240 x 200 box: ground at 168, walls 40 to 200,
// ridge at 44, a chimney on the left slope, the old footing under the
// ground. One stroke from the left end of the ground. No door: the room
// belongs to the person at work.
const HOUSE = [
  [6, 168], [40, 168], [40, 186], [200, 186], [200, 104], [120, 44],
  [83, 71.75], [83, 58], [70, 58], [70, 81.5], [40, 104], [40, 168], [234, 168],
];
// the crack runs up the left wall from the old footing
const CRACK_LOW = [[49, 184], [46, 176], [51, 168], [47, 157], [52, 147], [48, 138]];
const CRACK_TOP = [[48, 138], [52, 128], [48, 120], [51, 113]];
const BAND = { x0: 44, x1: 172, y0: 110, y1: 138 };
const SLAB = [[34, 170], [206, 170], [206, 198], [34, 198], [34, 170]];
// the person at work, the same in both houses: chair, body, head, desk, screen
const CHAIR = [[69, 168], [69, 140], [66, 104], [69, 140], [87, 140], [87, 168]];
const BODY = [[114, 137], [93, 129], [80, 111], [78, 136], [100, 137], [100, 166], [109, 166]];
const HEAD = { x: 79, y: 96, r: 8.5 };
const DESK = [[108, 168], [108, 140], [102, 140], [182, 140], [176, 140], [176, 168]];
const SCREEN = [[148, 140], [148, 128], [130, 128], [130, 104], [166, 104], [166, 128], [148, 128]];

function build(el, ctx) {
  const C = colors(ctx), d = ctx.data;
  const tall = ctx.layout === 'tall';
  const W = tall ? 360 : 552, H = tall ? 182 : 246;
  const s = tall ? 0.7 : 1;
  const P = tall ? [4, 188] : [16, 296];      // left edge of each drawing's box
  const OY = tall ? -4 : -12;      // the ridge (y 44) sits just under the heading
  const svg = svgRoot(el, W, H, d.reading);
  svg.style.color = C.ink;
  const st = stage();
  const ink = (w = 1.35) => ({ stroke: C.ink, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const acc = (w = 1.6) => ({ stroke: C.accent, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const mapper = (ox) => (x, y) => [ox + x * s, OY + y * s];

  // a pen line with a thinner second pass beside it, drawn on over [a, b]
  const stroke = (parent, pts, seed, map, attrs, a, b, sharp = true) => {
    const main = path(parent, pen(pts, seed, map, 0.9, sharp), attrs);
    const ghost = path(parent, pen(pts, seed + 101, map, 1.6, sharp), { ...attrs, 'stroke-width': attrs['stroke-width'] * 0.45, opacity: 0.7 });
    st.draw(main, a, b).draw(ghost, a + (b - a) * 0.12, b + (b - a) * 0.06);
    return main;
  };

  // the person at work: chair, body, head, desk, screen, one after another
  const person = (parent, map, a, b) => {
    const k = (b - a) / 5;
    stroke(parent, DESK, 73, map, ink(1.25), a, a + k * 1.4);
    stroke(parent, SCREEN, 75, map, ink(1.25), a + k, a + k * 2.2);
    stroke(parent, CHAIR, 77, map, ink(1.25), a + k * 2, a + k * 3.2);
    stroke(parent, BODY, 79, map, ink(1.4), a + k * 3, a + k * 4.4);
    const hd = [];
    for (let i = 0; i <= 16; i++) { const t = -1.9 + (i / 16) * (Math.PI * 2 + 0.35); hd.push([HEAD.x + Math.cos(t) * HEAD.r, HEAD.y + Math.sin(t) * HEAD.r * 1.04]); }
    stroke(parent, hd, 81, map, ink(1.4), a + k * 4, b, false);
  };

  // headings over each drawing, notes under it
  const headSize = tall ? 11.5 : 12;
  const noteSize = tall ? 12.5 : 13.5;
  const noteY = OY + 206 * s + (tall ? 14 : 18);
  const noteW = 236 * s;
  const label = (ox, part, color, a) => {
    const grp = g(svg);
    text(grp, ox + 6 * s, tall ? 12 : 14, part.head, { family: 'mono', size: headSize, weight: 500, caps: true, spacing: 1.2, fill: color });
    st.fade(grp, a, a + 0.15);
    const note = g(svg);
    text(note, ox + 6 * s, noteY, part.note, { italic: true, size: noteSize, width: noteW, fill: C.ink });
    return note;
  };

  // ---- left: repaint --------------------------------------------------------
  const L = mapper(P[0]);
  const left = g(svg);
  stroke(left, HOUSE, 11, L, ink(), 0.04, 0.6);
  // the person at work; the paint later lies over its middle (the band is
  // opaque, so the audit is told to look past these strokes)
  const pl = g(left, { 'data-audit': 'skip' });
  person(pl, L, 0.5, 0.9);
  stroke(left, CRACK_LOW, 23, L, ink(1.2), 0.74, 0.88);
  const top = path(left, pen(CRACK_TOP, 29, L, 0.5), ink(1.2));
  st.draw(top, 0.86, 0.96, [1.2, 1.24]);

  // the paint: a band that grows behind the roller, with the roller's
  // streaks in it and drips under its lower edge, the agent written on it
  const id = `house-c-band-${++clipN}`;
  const defs = h('defs', null, left);
  const clip = h('clipPath', { id }, defs);
  const [bx0, by0] = L(BAND.x0, BAND.y0 - 4), [, by1] = L(BAND.x1, BAND.y1 + 14);
  const clipRect = h('rect', { x: bx0 - 2, y: by0, width: 0, height: by1 - by0 }, clip);
  const bandPts = [[BAND.x0, BAND.y0 + 1], [BAND.x1, BAND.y0 - 1], [BAND.x1, BAND.y1], [BAND.x0 + 1, BAND.y1 + 1], [BAND.x0, BAND.y0 + 1]];
  const band = g(left, { 'clip-path': `url(#${id})`, 'data-audit': 'skip' });
  path(band, `${pen(bandPts, 41, L, 2.2)}Z`, { fill: C.hairline, stroke: C.hairline, 'stroke-width': 2.5, 'stroke-linejoin': 'round' });
  const rs = rng(43);
  [115, 121, 131, 135].forEach((y, k) => {
    const x0 = BAND.x0 + 4 + rs() * 10, x1 = BAND.x1 - 6 - rs() * 18;
    path(band, pen([[x0, y], [x1, y + (rs() - 0.5) * 2]], 44 + k, L, 0.8), { stroke: C.muted, 'stroke-width': 0.7, opacity: 0.45, 'stroke-linecap': 'round' });
  });
  [[58, 7], [97, 11], [131, 6], [160, 9]].forEach(([x, len], k) => {
    path(band, pen([[x, BAND.y1], [x + 0.6, BAND.y1 + len]], 48 + k, L, 0.4), { stroke: C.hairline, 'stroke-width': 3 * s + 0.6, 'stroke-linecap': 'round' });
  });
  const [tx, ty] = L(92, (BAND.y0 + BAND.y1) / 2);
  const word = g(left);
  text(word, tx, ty + headSize * 0.36, d.repaint.paint, { family: 'mono', size: headSize, weight: 500, anchor: 'middle', fill: C.ink });
  st.fade(word, 1.62, 1.8);

  // the roller: a cylinder with its handle reaching down, rolled from left
  // to right; it stays where it stopped, at the wet end of the paint
  const roller = g(left);
  const RX0 = 38, RX1 = BAND.x1 - 2;
  path(roller, pen([[0, 107], [8, 107], [8, 141], [0, 141], [0, 107]], 51, L, 0.5), { ...ink(1.3), fill: C.paper });
  path(roller, pen([[8, 124], [14, 124], [14, 150], [16.5, 157]], 53, L, 0.5), ink(1.3));
  path(roller, pen([[15.6, 154], [18, 163]], 57, L, 0.3), { ...ink(3), 'stroke-linecap': 'round' });
  st.fade(roller, 1.04, 1.14);
  st.on((gg) => {
    const p = ease(span(gg, 1.14, 1.72));
    const x = RX0 + (RX1 - RX0) * p;
    roller.setAttribute('transform', `translate(${(x * s).toFixed(2)} 0)`);
    const w = Math.max(0, (x - BAND.x0 + 2) * s);
    clipRect.setAttribute('width', w.toFixed(2));
    band.style.display = w <= 0.01 ? 'none' : '';
  });
  st.fade(label(P[0], d.repaint, C.ink, 0), 1.72, 1.92);

  // ---- right: renovate ------------------------------------------------------
  const Rm = mapper(P[1]);
  const right = g(svg);
  const slab = path(right, `${pen(SLAB, 61, Rm, 1)}Z`, { fill: C.field, 'data-audit': 'skip' });
  st.fade(slab, 2.42, 2.58);
  stroke(right, HOUSE, 11, Rm, ink(), 2.04, 2.46);
  // the new foundation is laid over the old footing
  const slabLine = path(right, pen(SLAB, 63, Rm, 1), acc(1.6));
  st.draw(slabLine, 2.44, 2.62);
  person(right, Rm, 2.6, 2.92);
  st.fade(label(P[1], d.renovate, C.accent, 2), 2.86, 3);
  return { set: (step, t) => st.set(step, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
