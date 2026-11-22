// Shared pen parts for the article's figures, so a thing is always the same
// drawing: the cryostat (after the hero's line drawing), the reader (a film
// editor-viewer, after a photograph of a Kalart EV-8 by Joe Haupt, CC BY-SA 2.0),
// and the film strip (a row of the grid's own check frames, never sprockets).
//
// STAND-IN: these strokes are clean geometry drawn with a plain pen width.
// They are replaced by his captured takes (three per shape, neighbours from
// different takes) before the figures are final.
import { el, penPath } from '../verbs.js';

const pen = (g, d, C, w = 1.6) => el('path', { d, stroke: C.ink, 'stroke-width': w, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
const ell = (cx, cy, rx, ry) => `M${cx - rx},${cy} a${rx},${ry} 0 1,0 ${2 * rx},0 a${rx},${ry} 0 1,0 ${-2 * rx},0`;

// The cryostat: three plates, rods, a coil, the cold cylinder at the bottom.
// Box: x, y top-left, w wide; returns { strokes, bottom: [x, y] }.
export function cryostat(g, C, x, y, w) {
  const s = w / 160, S = [];
  const P = (px, py) => [x + px * s, y + py * s];
  const plateY = [40, 130, 205];
  S.push(pen(g, penPath([P(40, 0), P(40, 38)]), C), pen(g, penPath([P(62, 0), P(62, 38)]), C), pen(g, penPath([P(118, 0), P(118, 38)]), C));
  plateY.forEach((py, i) => { const [cx, cy] = P(80, py); S.push(pen(g, ell(cx, cy, (78 - i * 2) * s, 9 * s), C)); });
  for (const px of [14, 34, 118, 146]) S.push(pen(g, penPath([P(px, 44), P(px, 126)]), C));
  for (const px of [22, 50, 112, 138]) S.push(pen(g, penPath([P(px, 134), P(px, 201)]), C));
  S.push(pen(g, penPath([P(80, 44), P(80, 201)]), C, 2.2));
  for (let k = 0; k < 4; k++) { const [cx, cy] = P(80, 78 + k * 9); S.push(pen(g, ell(cx, cy, 14 * s, 4 * s), C)); }
  const [bx, by] = P(66, 209);
  S.push(pen(g, `M${bx},${by} v${44 * s} h${28 * s} v${-44 * s}`, C));
  return { strokes: S, bottom: P(80, 253) };
}

// The reader: a film editor-viewer. Box: x, y top-left, w wide. The strip
// enters at the left at height inY and leaves at the right; the screen is the
// hooded window on the right of the body.
export function gate(g, C, x, y, w) {
  const s = w / 120, S = [];
  const P = (px, py) => [x + px * s, y + py * s];
  S.push(pen(g, penPath([P(0, 60), P(6, 12), P(114, 8), P(120, 60), P(0, 60)]), C));   // sloped body
  S.push(pen(g, penPath([P(66, 22), P(110, 20), P(112, 52), P(66, 54), P(66, 22)]), C));  // screen hood
  const screen = el('path', { d: 'M' + [P(72, 28), P(104, 27), P(105, 47), P(72, 48)].map((p) => p.join(',')).join(' L') + ' Z', fill: C.paper, stroke: C.ink, 'stroke-width': 1.2 }, g);
  S.push(screen);
  for (const px of [16, 50]) { const [cx, cy] = P(px, 40); S.push(pen(g, ell(cx, cy, 5 * s, 5 * s), C)); }   // rollers
  S.push(pen(g, penPath([P(120, 30), P(130, 30), P(130, 22)]), C));                        // crank
  return { strokes: S, screen, inAt: P(0, 40), outAt: P(120, 40), width: 120 * s };
}

// A film strip along a polyline: frames of the grid's eight checks (four
// squares, the flip-checks, and four small diamonds, the phase-checks), a few
// lit. lit(i) -> indices lit in frame i. Returns { parts: [{ edges, frames }] }
// in drawing order, one per segment.
// A corner turns square: each segment after the first starts half a frame
// back, so the film reads as one bent strip, not two overlapping ones.
export function strip(g, C, pts, fw, h, lit = () => []) {
  const parts = [];
  let idx = 0;
  for (let s = 0; s < pts.length - 1; s++) {
    let [x0, y0] = pts[s], [x1, y1] = pts[s + 1];
    const ux = Math.sign(x1 - x0), uy = Math.sign(y1 - y0);
    if (s > 0) { x0 -= ux * h / 2; y0 -= uy * h / 2; }
    if (s < pts.length - 2) { x1 -= ux * h / 2; y1 -= uy * h / 2; }
    const len = Math.hypot(x1 - x0, y1 - y0), ang = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI;
    const wrap = el('g', { transform: `translate(${x0} ${y0}) rotate(${ang})` }, g);
    const edges = [pen(wrap, `M0,${-h / 2} H${len}`, C, 1.3), pen(wrap, `M0,${h / 2} H${len}`, C, 1.3)];
    const n = Math.max(1, Math.round(len / fw)), w = len / n, frames = [];
    for (let i = 0; i < n; i++, idx++) {
      const fg = el('g', { transform: `translate(${i * w} 0) rotate(${-ang} ${w / 2} 0)` }, wrap);
      if (i) pen(fg, `M0,${-h / 2} V${h / 2}`, C, 0.9);
      const on = new Set(lit(idx));
      const r = Math.max(1.6, h * 0.08);
      const sq = [[0.32, 0.32], [0.68, 0.32], [0.32, 0.68], [0.68, 0.68]];
      const di = [[0.5, 0.14], [0.5, 0.86], [0.14, 0.5], [0.86, 0.5]];
      const ox = (w - h) / 2;   // frames stay square, centred in their cell
      sq.forEach(([u, v], k) => el('rect', { x: ox + h * u - r, y: -h / 2 + h * v - r, width: 2 * r, height: 2 * r, fill: on.has(k) ? C.accent : C.paper, stroke: on.has(k) ? C.accent : C.muted, 'stroke-width': 0.7 }, fg));
      di.forEach(([u, v], k) => el('path', { d: `M${ox + h * u},${-h / 2 + h * v - r * 1.2} l${r * 1.2},${r * 1.2} l${-r * 1.2},${r * 1.2} l${-r * 1.2},${-r * 1.2} Z`, fill: on.has(k + 4) ? C.accent : C.paper, stroke: on.has(k + 4) ? C.accent : C.muted, 'stroke-width': 0.7 }, fg));
      frames.push(fg);
    }
    parts.push({ edges, frames, len });
  }
  return parts;
}
