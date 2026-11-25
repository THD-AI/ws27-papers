// ROUGH frames for "The other half of a quantum computer", v4. Each slide is
// a pure drawing of its build: draw(page, build, data, ctx), as in the
// Renovate deck. Words, numbers, layout and build order are meant to be real;
// the seven talk-only drawings (long desk, reader, rulebook, flashcards, drop,
// metronome, three film frames) are quick placeholder sketches in one hand
// (rough.js strokes, Excalifont labels), not finished art. Numbers come from
// articles/other-half (data/*.json, text.md). Plan: dotUni
// docs/papers/talks/quantum/v4 (PLAN.md, STORYBOARD.md).
import { h, text, textSize } from '../../lib/fig.js';
import rough from '../../lib/vendor/rough.esm.js';

const C = { paper: '#FBFBFC', ink: '#15171C', muted: '#5C6370', hair: '#DADDE3', accent: '#4254C5', field: '#DDE1F5', mid: '#9AA0AA', tile: '#EEF0F3', lit: '#D3D7DE' };
const L = 96, R = 1824, W = R - L;

// ---------------------------------------------------------------------------
// Drawing helpers
// ---------------------------------------------------------------------------
function svgOf(page) {
  const svg = h('svg', { viewBox: '0 0 1920 1080', width: 1920, height: 1080, role: 'img' });
  page.appendChild(svg);
  svg.__rc = rough.svg(svg);
  svg.__seed = 7;
  return svg;
}
const T = (p, x, y, s, o = {}) => text(p, x, y, s, { family: 'sans', size: 36, fill: C.ink, free: true, ...o });
const HAND = (p, x, y, s, o = {}) => T(p, x, y, s, { family: 'hand', size: 34, fill: C.muted, ...o });
const MONO = (p, x, y, s, o = {}) => T(p, x, y, s, { family: 'mono', size: 32, fill: C.muted, ...o });
const ln = (p, x1, y1, x2, y2, o = {}) => h('line', { x1, y1, x2, y2, stroke: C.ink, 'stroke-width': 3, 'stroke-linecap': 'round', ...o }, p);
const rc = (p, x, y, w, hh, o = {}) => h('rect', { x, y, width: w, height: hh, fill: 'none', stroke: C.ink, 'stroke-width': 3, ...o }, p);
const dot = (p, x, y, r, o = {}) => h('circle', { cx: x, cy: y, r, ...o }, p);
const pth = (p, d, o = {}) => h('path', { d, fill: 'none', stroke: C.ink, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...o }, p);

// rough.js strokes: one hand for every talk-only drawing
const ro = (svg, o = {}) => ({ roughness: 1.1, bowing: 0.8, stroke: o.stroke || C.ink, strokeWidth: o.w || 3, seed: (svg.__seed = (svg.__seed * 31 + 7) % 9973) + 1, fill: o.fill, fillStyle: o.fillStyle || 'solid', ...o.ro });
const RL = (svg, x1, y1, x2, y2, o = {}) => svg.appendChild(svg.__rc.line(x1, y1, x2, y2, ro(svg, o)));
const RR = (svg, x, y, w, hh, o = {}) => svg.appendChild(svg.__rc.rectangle(x, y, w, hh, ro(svg, o)));
const RC = (svg, x, y, d, o = {}) => svg.appendChild(svg.__rc.circle(x, y, d, ro(svg, o)));
const RE = (svg, x, y, w, hh, o = {}) => svg.appendChild(svg.__rc.ellipse(x, y, w, hh, ro(svg, o)));
const RP = (svg, d, o = {}) => svg.appendChild(svg.__rc.path(d, ro(svg, o)));
const RPOLY = (svg, pts, o = {}) => svg.appendChild(svg.__rc.polygon(pts, ro(svg, o)));
const RLIN = (svg, pts, o = {}) => svg.appendChild(svg.__rc.linearPath(pts, ro(svg, o)));

// A row of counted dots (Renovate's dotRow): n of total filled, then rings.
function dotRow(p, x, y, total, filled, o = {}) {
  const cols = o.cols || total, pitch = o.pitch || 28, r = o.r || 10.5, gap = o.group ? (o.groupGap || pitch * 0.6) : 0;
  for (let i = 0; i < total; i++) {
    const col = i % cols, row = Math.floor(i / cols);
    const cx = x + col * pitch + (o.group ? Math.floor(col / o.group) * gap : 0) + r;
    const cy = y + row * (o.rowPitch || pitch) + r;
    if (i < filled) dot(p, cx, cy, r, { fill: o.fill || C.ink });
    else dot(p, cx, cy, r - 1.25, { fill: 'none', stroke: o.empty || C.mid, 'stroke-width': 2.5 });
  }
  const rows = Math.ceil(total / cols);
  return { w: cols * pitch + (o.group ? Math.floor((cols - 1) / o.group) * gap : 0), h: rows * (o.rowPitch || pitch) };
}

// ---------------------------------------------------------------------------
// The seven talk-only drawings, as rough placeholders
// ---------------------------------------------------------------------------
// Three film frames: the chapter mark. n = 1..3 lit in the accent, 'all' = all lit.
function frames3(svg, x, y, n) {
  for (let i = 0; i < 3; i++) {
    const on = n === 'all' || i === n - 1;
    RR(svg, x + i * 40, y, 32, 26, { stroke: on ? C.accent : C.mid, w: 2.5, fill: on ? C.accent : undefined });
  }
  return 3 * 40 + 6;
}

// The cryostat: plates on rods, narrowing to the chip.
function cryostat(svg, x, y, s = 1) {
  const cx = x + 110 * s;
  RR(svg, x, y, 220 * s, 26 * s, { w: 3 });
  const plates = [[200, 120], [160, 230], [120, 330]];
  let py = y + 26 * s;
  for (const [w, yy] of plates) {
    RL(svg, cx - w * s / 2 + 14 * s, py, cx - w * s / 2 + 14 * s, y + yy * s, { w: 2.5 });
    RL(svg, cx + w * s / 2 - 14 * s, py, cx + w * s / 2 - 14 * s, y + yy * s, { w: 2.5 });
    RE(svg, cx, y + yy * s, w * s, 22 * s, { w: 3, fill: C.paper });
    py = y + yy * s;
  }
  RL(svg, cx, py, cx, y + 400 * s, { w: 2.5 });
  RR(svg, cx - 22 * s, y + 400 * s, 44 * s, 30 * s, { w: 3, fill: C.paper });
  return { chipX: cx, chipY: y + 430 * s };
}

// Film: a strip with sprocket holes; each frame shows the lit points of one
// simulated round (film.json).
function film(svg, data, x1, x2, y, o = {}) {
  const hh = o.h || 70, fw = o.fw || 84, fr = data.film.runs[0];
  RL(svg, x1, y, x2, y, { w: 2.5 });
  RL(svg, x1, y + hh, x2, y + hh, { w: 2.5 });
  let k = o.start || 0;
  for (let x = x1; x + fw <= x2; x += fw, k++) {
    RL(svg, x, y + 8, x, y + hh - 8, { w: 2 });
    const lit = fr.frames[k % fr.frames.length];
    if (o.dots !== false) for (const ci of lit) {
      const c = fr.checks[ci];
      dot(svg, x + 10 + (c.x / 14) * (fw - 20), y + 12 + (c.y / 14) * (hh - 24), 3.5, { fill: C.ink });
    }
  }
}

// The enlarged frame: distance-7 checks, the lit ones as large dots.
function bigFrame(svg, data, x, y, size, k) {
  const fr = data.film.runs[0];
  RR(svg, x, y, size, size, { w: 3, fill: C.paper });
  const lit = new Set(fr.frames[k]);
  fr.checks.forEach((c, i) => {
    const cx = x + 24 + (c.x / 14) * (size - 48), cy = y + 24 + (c.y / 14) * (size - 48);
    if (lit.has(i)) { dot(svg, cx, cy, 15, { fill: C.lit }); dot(svg, cx, cy, 9, { fill: C.ink }); }
    else dot(svg, cx, cy, 6, { fill: C.tile, stroke: C.hair, 'stroke-width': 1.5 });
  });
}

// The metronome: a trapezoid, a pendulum, a weight.
function metronome(svg, x, y, s = 1, o = {}) {
  RPOLY(svg, [[x - 40 * s, y], [x + 40 * s, y], [x + 18 * s, y - 130 * s], [x - 18 * s, y - 130 * s]], { w: 3, fill: C.paper });
  const a = (o.angle ?? 14) * Math.PI / 180;
  const tx = x + Math.sin(a) * 140 * s, ty = y - 20 * s - Math.cos(a) * 140 * s;
  RL(svg, x, y - 20 * s, tx, ty, { w: 3 });
  RR(svg, x + Math.sin(a) * 90 * s - 9 * s, y - 20 * s - Math.cos(a) * 90 * s - 7 * s, 18 * s, 14 * s, { w: 2.5, fill: C.ink });
}

// The rulebook: one thin book, open; o.clip adds a second page clipped in.
function rulebook(svg, x, y, s = 1, o = {}) {
  const st = { w: 3, stroke: o.stroke || C.ink };
  RPOLY(svg, [[x, y + 10 * s], [x + 90 * s, y], [x + 90 * s, y + 90 * s], [x, y + 100 * s]], { ...st, fill: C.paper });
  RPOLY(svg, [[x + 90 * s, y], [x + 180 * s, y + 10 * s], [x + 180 * s, y + 100 * s], [x + 90 * s, y + 90 * s]], { ...st, fill: C.paper });
  for (let i = 0; i < 3; i++) RL(svg, x + 104 * s, y + (30 + i * 18) * s, x + 166 * s, y + (32 + i * 18) * s, { w: 2, stroke: C.mid });
  RL(svg, x + 14 * s, y + 36 * s, x + 76 * s, y + 30 * s, { w: 2.5 });
  if (o.clip) {
    RPOLY(svg, [[x + 120 * s, y - 34 * s], [x + 200 * s, y - 24 * s], [x + 196 * s, y + 52 * s], [x + 116 * s, y + 42 * s]], { w: 2.5, fill: C.paper });
    RR(svg, x + 140 * s, y - 46 * s, 14 * s, 34 * s, { w: 2.5 });
    for (let i = 0; i < 2; i++) RL(svg, x + 128 * s, y + (-8 + i * 16) * s, x + 186 * s, y + (-2 + i * 16) * s, { w: 2, stroke: C.mid });
  }
  return 180 * s;
}

// The flashcards: a stack in the accent; height = number of cards drawn.
function cards(svg, x, y, s = 1, n = 5, o = {}) {
  for (let i = n - 1; i >= 0; i--) RR(svg, x + i * 5 * s, y - i * 7 * s, 130 * s, 90 * s, { stroke: C.accent, w: 2.5, fill: C.paper });
  if (o.face !== false) for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) dot(svg, x + (24 + i * 27) * s, y + (22 + j * 23) * s, (i + j) % 3 === 0 ? 5 * s : 3 * s, { fill: (i + j) % 3 === 0 ? C.accent : C.mid });
  return 130 * s + n * 5 * s;
}

// The drop: a drop above still water, rings; smear = the rings blur.
function drop(svg, x, y, s = 1, smear = 0) {
  RP(svg, `M ${x} ${y - 150 * s} C ${x + 30 * s} ${y - 100 * s} ${x + 26 * s} ${y - 70 * s} ${x} ${y - 66 * s} C ${x - 26 * s} ${y - 70 * s} ${x - 30 * s} ${y - 100 * s} ${x} ${y - 150 * s} Z`, { w: 3, fill: C.paper });
  RL(svg, x - 260 * s, y, x + 260 * s, y, { w: 2, stroke: C.mid });
  for (let i = 1; i <= 3; i++) {
    const w = (60 + i * 60) * s;
    RE(svg, x, y, w * (1 + smear * 0.4), (18 + i * 10) * s, { w: smear ? 2 : 3, stroke: smear ? C.mid : C.ink, ro: { roughness: 1 + smear * 2.2 } });
  }
}

// The desk: a tabletop with legs; parts switched on by o.
function desk(svg, x, y, s = 1, o = {}) {
  const w = 460 * s;
  RL(svg, x, y, x + w, y, { w: 3.5 });
  RL(svg, x + 30 * s, y, x + 30 * s, y + 170 * s, { w: 3 });
  RL(svg, x + w - 30 * s, y, x + w - 30 * s, y + 170 * s, { w: 3 });
  if (o.lamp !== false) {
    RL(svg, x + 70 * s, y, x + 70 * s, y - 10 * s, { w: 3 });
    RLIN(svg, [[x + 70 * s, y - 10 * s], [x + 40 * s, y - 130 * s], [x + 130 * s, y - 200 * s]], { w: 3 });
    RP(svg, `M ${x + 100 * s} ${y - 220 * s} L ${x + 170 * s} ${y - 190 * s} L ${x + 140 * s} ${y - 150 * s} Z`, { w: 3, fill: C.paper });
  }
  if (o.metronome) metronome(svg, x + 250 * s, y, 0.6 * s, { angle: o.angle });
  if (o.cards) cards(svg, x + 300 * s, y - 64 * s, 0.6 * s, o.cards);
  if (o.book) rulebook(svg, x + 150 * s, y - 70 * s, 0.5 * s);
  // the chair, right of the desk, facing left
  const cx = x + w + 40 * s;
  RL(svg, cx, y + 50 * s, cx + 110 * s, y + 50 * s, { w: 3 });
  RL(svg, cx + 110 * s, y - 90 * s, cx + 110 * s, y + 170 * s, { w: 3 });
  RL(svg, cx + 10 * s, y + 50 * s, cx + 10 * s, y + 170 * s, { w: 3 });
  if (o.reader) {
    RC(svg, cx + 60 * s, y - 120 * s, 64 * s, { w: 3, fill: C.paper });
    RLIN(svg, [[cx + 64 * s, y - 88 * s], [cx + 74 * s, y + 46 * s], [cx - 20 * s, y + 52 * s], [cx - 34 * s, y + 170 * s]], { w: 3 });
    RLIN(svg, [[cx + 66 * s, y - 50 * s], [cx - 10 * s, y - 20 * s], [cx - 70 * s, y - 6 * s]], { w: 3 });
    HAND(svg, cx + 130 * s, y - 130 * s, 'a program', { size: Math.max(32, 40 * s) });
  }
  return { w, chairX: cx };
}

// ---------------------------------------------------------------------------
// The surface-code grid: storing qubits at (row, col); checks between them.
// A check lights when an odd number of the errors it watches sit on it.
// ---------------------------------------------------------------------------
function gridChecks(d) {
  const out = [];
  const q = (r, c) => r * d + c;
  for (let r = 0; r < d - 1; r++) for (let c = 0; c < d - 1; c++) {
    out.push({ kind: (r + c) % 2 === 0 ? 'phase' : 'flip', qubits: [q(r, c), q(r, c + 1), q(r + 1, c), q(r + 1, c + 1)], r: r + 0.5, c: c + 0.5 });
  }
  for (let c = 0; c < d - 1; c++) {
    if (c % 2 === 1) out.push({ kind: 'phase', edge: 'top', qubits: [q(0, c), q(0, c + 1)], r: -0.5, c: c + 0.5 });
    if (c % 2 === 0) out.push({ kind: 'phase', edge: 'bottom', qubits: [q(d - 1, c), q(d - 1, c + 1)], r: d - 0.5, c: c + 0.5 });
  }
  for (let r = 0; r < d - 1; r++) {
    if (r % 2 === 0) out.push({ kind: 'flip', edge: 'left', qubits: [q(r, 0), q(r + 1, 0)], r: r + 0.5, c: -0.5 });
    if (r % 2 === 1) out.push({ kind: 'flip', edge: 'right', qubits: [q(r, d - 1), q(r + 1, d - 1)], r: r + 0.5, c: d - 0.5 });
  }
  return out;
}
const sees = (kind, e) => (kind === 'flip' ? e === 'X' || e === 'Y' : e === 'Z' || e === 'Y');
function litOf(d, errs) {
  return gridChecks(d).map((ch) => ch.qubits.filter((qq) => errs[qq] && sees(ch.kind, errs[qq])).length % 2 === 1);
}

// grid(svg, x, y, d, pitch, o): x, y = top-left storing qubit.
//   o.errs {q: 'X'|'Z'|'Y'} solid; o.guess {q: letter} dashed; o.grey {q:letter}
//   o.lit: array of booleans (default: from errs); o.noLight; o.only 'flip'|'phase'
function grid(svg, x, y, d, p, o = {}) {
  const P = (r, c) => [x + c * p, y + r * p];
  const checks = gridChecks(d);
  const lit = o.lit || (o.noLight ? checks.map(() => false) : litOf(d, { ...(o.errs || {}), ...(o.litFrom || {}) }));
  checks.forEach((ch, i) => {
    const [cx, cy] = P(ch.r, ch.c);
    const on = lit[i];
    const fill = on ? C.lit : C.tile;
    if (!ch.edge) h('rect', { x: cx - p / 2 + 2, y: cy - p / 2 + 2, width: p - 4, height: p - 4, rx: 4, fill, stroke: ch.kind === 'flip' ? C.hair : 'none', 'stroke-width': 1.5 }, svg);
    else {
      const [ax, ay] = ch.edge === 'top' || ch.edge === 'bottom' ? [cx, ch.edge === 'top' ? cy + p / 2 : cy - p / 2] : [ch.edge === 'left' ? cx + p / 2 : cx - p / 2, cy];
      const sweep = { top: [ax - p / 2 + 2, ay, ax + p / 2 - 2, ay, 1], bottom: [ax + p / 2 - 2, ay, ax - p / 2 + 2, ay, 1], left: [ax, ay + p / 2 - 2, ax, ay - p / 2 + 2, 1], right: [ax, ay - p / 2 + 2, ax, ay + p / 2 - 2, 1] }[ch.edge];
      h('path', { d: `M ${sweep[0]} ${sweep[1]} A ${p / 2 - 2} ${p / 2 - 2} 0 0 ${sweep[4]} ${sweep[2]} ${sweep[3]} Z`, fill, stroke: ch.kind === 'flip' ? C.hair : 'none', 'stroke-width': 1.5 }, svg);
    }
    if (on) dot(svg, ch.edge ? cx + (ch.edge === 'left' ? p * 0.18 : ch.edge === 'right' ? -p * 0.18 : 0) : cx, ch.edge ? cy + (ch.edge === 'top' ? p * 0.18 : ch.edge === 'bottom' ? -p * 0.18 : 0) : cy, Math.max(9, p * 0.16), { fill: C.ink });
  });
  for (let r = 0; r < d; r++) for (let c = 0; c < d; c++) {
    const [qx, qy] = P(r, c);
    const k = r * d + c;
    const e = (o.errs || {})[k], gu = (o.guess || {})[k], gr = (o.grey || {})[k];
    if (!e && !gu && !gr) dot(svg, qx, qy, Math.max(5, p * 0.09), { fill: C.paper, stroke: C.mid, 'stroke-width': 2.5 });
    const fs = Math.max(34, p * 0.62);
    if (gr) T(svg, qx, qy + fs * 0.36, gr, { size: fs, weight: 700, fill: C.hair, anchor: 'middle' });
    if (e) T(svg, qx, qy + fs * 0.36, e, { size: fs, weight: 700, fill: o.errFill || C.ink, anchor: 'middle' });
    if (gu) {
      const t = T(svg, qx, qy + fs * 0.36, gu, { size: fs, weight: 700, fill: 'none', anchor: 'middle' });
      t.el.querySelectorAll('text').forEach((el) => { el.setAttribute('stroke', o.guessFill || C.ink); el.setAttribute('stroke-width', 2.2); el.setAttribute('stroke-dasharray', '5 4'); });
    }
  }
  return { w: (d - 1) * p, h: (d - 1) * p, P };
}

// ---------------------------------------------------------------------------
// The frame every slide shares (Renovate's chrome): chapter mark, grey label,
// the title (the line said, arriving with the last build), source, n / 13.
// ---------------------------------------------------------------------------
function chrome(svg, s, build, ctx, o = {}) {
  let lx = L;
  if (s.chapter) lx += frames3(svg, L, 82, s.chapter) + 18;
  if (s.label) T(svg, lx, 104, s.label, { size: 32, weight: 500, fill: C.muted });
  if (s.title && (ctx.last || o.titleAlways)) {
    let size = o.titleSize || 58;
    if (textSize(s.title, { family: 'sans', size, weight: 600, free: true }).w > W) size = 48;
    T(svg, L, 190, s.title, { size, weight: 600, width: W, lh: size * 1.16 });
  }
  if (s.source) T(svg, L, 1040, s.source, { size: 22, fill: C.muted, width: 1500, lh: 28 });
  const num = s.backup ? s.backup : s.end ? '' : `${s.n} / ${ctx.main}`;
  if (num) T(svg, R, 1040, num, { size: 22, weight: 500, fill: C.muted, anchor: 'end' });
}

const pct = (x, k = 2) => (x * 100).toFixed(k) + '%';

// ---------------------------------------------------------------------------
// The slides
// ---------------------------------------------------------------------------
export const SLIDES = [];
const add = (s) => { s.n = SLIDES.filter((x) => !x.backup && !x.end).length + (s.backup || s.end ? 0 : 1); SLIDES.push(s); return s; };

// 1 Title ----------------------------------------------------------------------
add({
  id: 'title', builds: 2, landing: 'Does it matter which program reads a quantum chip?',
  draw(page, b, data, ctx) {
    const svg = svgOf(page);
    T(svg, L, 104, 'Alexander Rudaev · Quantum Computing seminar, TH Deggendorf, 9 January 2027', { size: 32, weight: 500, fill: C.muted });
    T(svg, L, 250, 'The other half', { family: 'serif', size: 104, weight: 500 });
    T(svg, L, 360, 'of a quantum computer', { family: 'serif', size: 104, weight: 500 });
    if (b >= 1) T(svg, L, 460, this.landing, { size: 48, weight: 600, fill: C.ink });
    const cr = cryostat(svg, 170, 520, 1);
    RP(svg, `M ${cr.chipX} ${cr.chipY} C ${cr.chipX} ${cr.chipY + 60} ${cr.chipX + 80} ${905} ${cr.chipX + 180} ${905}`, { w: 2.5 });
    film(svg, data, cr.chipX + 180, 1330, 870, { h: 70, fw: 84 });
    desk(svg, 1290, 860, 0.8, { lamp: true });
    HAND(svg, 1450, 990, 'an empty chair', { size: 32 });
  },
});

// 2 The reader -----------------------------------------------------------------
add({
  id: 'reader', builds: 3, label: 'The recording and its reader',
  title: 'The chip records. A program reads the recording.',
  source: 'Frames: a seeded simulation of rounds at distance 7, not Google’s recording. Article, sections 4 and 5.',
  draw(page, b, data, ctx) {
    const svg = svgOf(page);
    chrome(svg, this, b, ctx);
    film(svg, data, L, 1180, 760, { h: 84, fw: 96, start: 6 });
    bigFrame(svg, data, 520, 300, 360, 14);
    RL(svg, 520 + 180, 660, 96 + 96 * 8 + 48, 760, { w: 2, stroke: C.mid });
    T(svg, 920, 360, 'one frame = one round of checks', { size: 36 });
    T(svg, 920, 412, 'a dot = a check that lit', { size: 36, fill: C.muted });
    const dk = desk(svg, 1200, 820, 0.72, { metronome: true, angle: 18, reader: b >= 1 });
    HAND(svg, 1220, 980, 'a frame every 1.1 µs', { size: 34 });
    if (b >= 1) T(svg, 920, 500, 'A program on an ordinary computer decides which errors happened.', { size: 36, weight: 600, width: 780, lh: 46 });
  },
});

// 3 Hook -----------------------------------------------------------------------
add({
  id: 'hook', builds: 3, label: 'Google’s chip, 2024',
  title: 'Same recording, two readers: about one error in six fewer.',
  source: 'Google Quantum AI, Nature 638 (2025): distance 7, logical errors per round. Article, section 7.',
  draw(page, b, data, ctx) {
    const svg = svgOf(page);
    chrome(svg, this, b, ctx);
    const S = data.suppression.decoders;
    const m = S[0].points[2].per_100000_rounds, nn = S[1].points[2].per_100000_rounds;
    const opt = { cols: 50, pitch: 22, r: 8, group: 10, groupGap: 12 };
    const x0 = 640;
    const ya = 290;
    rulebook(svg, L, ya, 0.8);
    T(svg, L, ya + 130, 'The standard reader follows one rule', { size: 34, weight: 600, width: 480, lh: 42 });
    dotRow(svg, x0, ya, m, m, opt);
    T(svg, x0, ya + 120, `${m}`, { size: 56, weight: 700 });
    T(svg, x0 + 110, ya + 116, 'times the stored value was lost, per 100,000 rounds', { size: 32, fill: C.muted });
    if (b >= 1) {
      const yb = 600;
      cards(svg, L + 20, yb + 40, 0.8, 4);
      T(svg, L, yb + 140, 'A learning reader learned from examples', { size: 34, weight: 600, width: 480, lh: 42, fill: C.accent });
      dotRow(svg, x0, yb, m, nn, { ...opt, fill: C.accent, empty: C.ink });
      T(svg, x0, yb + 120, `${nn}`, { size: 56, weight: 700, fill: C.accent });
      T(svg, x0 + 110, yb + 116, `${m - nn} fewer: the ink rings`, { size: 32, fill: C.ink });
      T(svg, x0, yb + 200, 'Google’s chip, distance 7, same recording, both read afterwards', { size: 32, fill: C.muted });
    }
  },
});

// 4 Why correct at all ----------------------------------------------------------
add({
  id: 'why', builds: 3, label: 'Why correct at all',
  title: 'Unaided, such hardware can’t finish the calculation.',
  source: 'Article, section 1: qubit lifetime on Google’s largest grid; the calculation from Gidney and Ekerå (2021).',
  draw(page, b, data, ctx) {
    const svg = svgOf(page);
    chrome(svg, this, b, ctx);
    drop(svg, 330, 560, 1, 1);
    T(svg, L, 720, 'A qubit lasts a median 85 µs:', { size: 36, weight: 600 });
    T(svg, L, 768, 'a thousandth of a blink.', { size: 36 });
    if (b >= 1) {
      dotRow(svg, 720, 300, 1000, 1, { cols: 50, pitch: 15, r: 5 });
      T(svg, 720, 650, 'It slips once in a thousand operations.', { size: 36, weight: 600 });
    }
    if (b >= 2) {
      T(svg, 720, 760, 'The calculation needs two to three billion costly steps:', { size: 36, width: 1050, lh: 46 });
      T(svg, 720, 812, 'millions of slips where one is enough.', { size: 36, weight: 600 });
    }
  },
});

// 5 What a frame shows ------------------------------------------------------------
add({
  id: 'frame', builds: 6, chapter: 1, label: 'What the reader must do',
  title: 'A frame shows lit checks, never the errors.',
  source: 'Article, section 3. Distance d needs 2d² − 1 qubits: 17, 49, 97.',
  draw(page, b, data, ctx) {
    const svg = svgOf(page);
    chrome(svg, this, b, ctx);
    const gx = 260, gy = 380, p = 170;
    let errs = {}, grey = {};
    if (b === 1) { errs = { 4: 'X' }; }
    if (b === 2) { grey = { 4: 'X' }; errs = {}; }
    if (b === 2) errs = {};
    const show = { 1: { 4: 'X' }, 2: { 4: 'X', 2: 'Z' }, 3: { 1: 'X', 4: 'X' } }[b] || {};
    if (b === 4) {
      // a check that reports wrongly lights in two frames in a row
      const checks = gridChecks(3), i = checks.findIndex((c) => c.kind === 'flip' && !c.edge);
      for (let f = 0; f < 2; f++) {
        const lit = checks.map((_, j) => j === i);
        grid(svg, 180 + f * 470, 420, 3, 130, { lit });
        HAND(svg, 180 + f * 470 + 60, 750, `frame ${f + 1}`, { size: 34 });
      }
      T(svg, 1160, 480, 'A check that reports wrongly', { size: 38, weight: 600 });
      T(svg, 1160, 530, 'lights two frames in a row,', { size: 38 });
      T(svg, 1160, 600, 'so frames are read in sequence.', { size: 38, weight: 600 });
      return;
    }
    if (b === 0) grid(svg, gx, gy, 3, p, {});
    else if (b === 1) {
      grid(svg, gx, gy, 3, p, { grey: { 4: 'X' }, litFrom: { 4: 'X' } });
      drop(svg, gx + 3 * p, gy - 20, 0.35, 0);
    } else grid(svg, gx, gy, 3, p, { grey: show, litFrom: show });
    const tx = 1000;
    T(svg, tx, 360, 'Each check asks: even or odd?', { size: 38, weight: 600 });
    T(svg, tx, 412, 'even: quiet, odd: lit', { size: 38 });
    MONO(svg, tx, 470, 'distance 3: 17 qubits (5: 49, 7: 97)', { size: 32 });
    const say = {
      1: ['The drop lands: a flip (X).', 'The two flip-checks beside it light.', 'The X itself is never seen.'],
      2: ['A phase error (Z)', 'lights the other kind of check.'],
      3: ['Two flips in a column:', 'only the end lights;', 'the edge lights nothing.'],
    }[b];
    if (say) say.forEach((s2, i) => T(svg, tx, 580 + i * 50, s2, { size: 36, weight: i === 0 ? 600 : 400 }));
  },
});

// 6 The silent error -------------------------------------------------------------
add({
  id: 'silent', builds: 6, chapter: 1, label: 'What the reader must do',
  title: 'A silent error crosses the grid and lights nothing.',
  source: 'Article, sections 5 and 6: distance 5, three real flips in one column.',
  draw(page, b, data, ctx) {
    const svg = svgOf(page);
    chrome(svg, this, b, ctx);
    const Ld = data.line, gx = 330, gy = 290, p = 128;
    const real = Object.fromEntries(Ld.real_errors.map((q) => [q, 'X']));
    const corr = Object.fromEntries(Ld.decoder_correction.map((q) => [q, 'X']));
    const tx = 1060;
    if (b === 0) { grid(svg, gx, gy, 5, p, { errs: real, noLight: true }); T(svg, tx, 400, 'Three real flips in a column.', { size: 38, weight: 600 }); }
    if (b === 1) { grid(svg, gx, gy, 5, p, { litFrom: real }); T(svg, tx, 400, 'The reader sees only this:', { size: 38, weight: 600 }); T(svg, tx, 450, 'one lit check.', { size: 38 }); }
    if (b === 2) {
      grid(svg, gx, gy, 5, p, { guess: real, litFrom: real });
      T(svg, tx, 400, 'One explanation: three flips', { size: 38, weight: 600 }); T(svg, tx, 450, 'up to the top edge.', { size: 38 });
    }
    if (b >= 3) {
      if (b === 3) grid(svg, gx, gy, 5, p, { guess: corr, litFrom: real });
      else grid(svg, gx, gy, 5, p, { errs: real, guess: corr, noLight: true });
      rulebook(svg, tx, 300, 0.6);
      HAND(svg, tx + 130, 300, 'shortest', { size: 34 });
      T(svg, tx, 450, 'The rulebook picks the shortest:', { size: 38, weight: 600 });
      T(svg, tx, 500, 'two flips down to the bottom edge.', { size: 38 });
    }
    if (b >= 4) {
      const [x1] = [gx + 2 * p];
      RL(svg, x1 + 40, gy - 70, x1 + 40, gy + 4 * p + 70, { w: 3, stroke: C.ink });
      T(svg, tx, 600, 'With the real three: one line', { size: 38, weight: 600 });
      T(svg, tx, 650, 'edge to edge, nothing lit.', { size: 38 });
      MONO(svg, tx, 730, '3 real + 2 added = 5 = the distance', { size: 32, fill: C.ink });
    }
  },
});

// 7 The hinge ------------------------------------------------------------------
add({
  id: 'hinge', builds: 6, chapter: 2, label: 'Why a network might read better',
  title: 'Plain matching misses a reading that can happen two ways.',
  source: 'Article, section 6: a toy count at distance 3, 5% error per storing qubit, one round, checks never wrong. Section 9: correlated matching.',
  draw(page, b, data, ctx) {
    const svg = svgOf(page);
    chrome(svg, this, b, ctx);
    const ex = data.lattice.example;
    T(svg, L, 290, 'Toy count: distance 3, 5% error per storing qubit, one round, checks never wrong', { size: 32, fill: C.muted });
    const lit = { 0: 'Y', 8: 'Z' };
    const p = 120, gy = 400;
    const gxs = [150, 720, 1290];
    grid(svg, gxs[0], gy, 3, p, { litFrom: lit });
    T(svg, gxs[0] - 40, gy + 2 * p + 110, 'Three lit checks: which errors?', { size: 34, weight: 600 });
    const right1 = ex.plain_matching.chance_right, right2 = ex.read_together.chance_right;
    if (b >= 1 && b <= 3) {
      grid(svg, gxs[1], gy, 3, p, { guess: { 0: 'X', 4: 'Z' }, litFrom: lit });
      rulebook(svg, gxs[1] + 2 * p + 60, gy + 60, 0.4);
      T(svg, gxs[1] - 40, gy + 2 * p + 110, 'Rulebook, flips and phases apart:', { size: 32 });
      T(svg, gxs[1] - 40, gy + 2 * p + 155, 'right 1 time in 3', { size: 34, weight: 600 });
      dotRow(svg, gxs[1] - 40, gy + 2 * p + 185, 30, Math.round(right1 * 30), { cols: 15, pitch: 26, r: 9 });
    }
    if (b >= 2 && b <= 3) {
      const g2 = b === 2 ? { 0: 'Y', 8: 'Z' } : { 0: 'Y', 5: 'Z' };
      grid(svg, gxs[2], gy, 3, p, { guess: g2, litFrom: lit });
      T(svg, gxs[2] - 40, gy + 2 * p + 110, b === 2 ? 'Y, first way' : 'Y, second way: Z one above', { size: 32 });
      if (b === 3) {
        T(svg, gxs[2] - 40, gy + 2 * p + 155, 'together about 6 in 10', { size: 34, weight: 600 });
        dotRow(svg, gxs[2] - 40, gy + 2 * p + 185, 30, Math.round(right2 * 30), { cols: 15, pitch: 26, r: 9 });
      }
    }
    if (b >= 4) {
      rulebook(svg, gxs[1], gy, 0.9, { clip: true });
      T(svg, gxs[1] - 20, gy + 180, 'Correlated matching: a second page', { size: 34, weight: 600 });
      T(svg, gxs[1] - 20, gy + 225, 'links flips and phases in two passes.', { size: 34 });
      cards(svg, gxs[2] + 40, gy + 40, 0.9, 5);
      T(svg, gxs[2], gy + 180, 'A network gets no rule;', { size: 34, weight: 600, fill: C.accent });
      T(svg, gxs[2], gy + 225, 'it learns patterns like this', { size: 34, fill: C.accent });
      T(svg, gxs[2], gy + 270, 'from examples.', { size: 34, fill: C.accent });
    }
  },
});

// 8 Payoff ------------------------------------------------------------------
add({
  id: 'payoff', builds: 5, chapter: 2, label: 'Why a network might read better',
  title: 'One in six fewer, in the number that sets the machine’s size.',
  source: 'Google Quantum AI, Nature 638 (2025): errors per 100,000 rounds, Table S1 and section II. Article, sections 7 and 10.',
  draw(page, b, data, ctx) {
    const svg = svgOf(page);
    chrome(svg, this, b, ctx);
    const [M, N] = data.suppression.decoders;
    const opt = { cols: 50, pitch: 14, r: 5, group: 10, groupGap: 8 };
    // slide 3's rows, small
    rulebook(svg, L, 290, 0.45, { clip: true });
    dotRow(svg, 300, 300, 171, 171, opt);
    T(svg, 1080, 330, '171', { size: 40, weight: 700 });
    cards(svg, L + 10, 400, 0.45, 4);
    dotRow(svg, 300, 390, 171, 143, { ...opt, fill: C.accent, empty: C.ink });
    T(svg, 1080, 420, '143', { size: 40, weight: 700, fill: C.accent });
    T(svg, 1180, 330, 'Google’s matcher already links', { size: 32, fill: C.muted });
    T(svg, 1180, 372, 'flips and phases, in a limited way', { size: 32, fill: C.muted });
    if (b >= 1) {
      const xs = [L + 40, 560, 1080];
      M.points.forEach((pt, i) => {
        const d = pt.distance, ps = [64, 40, 28][i];
        grid(svg, xs[i], 560, d, ps, { noLight: true });
        T(svg, xs[i] - 20, 560 + (d - 1) * ps + 70, `${pt.qubits} qubits`, { size: 34, weight: 600 });
        T(svg, xs[i] - 20, 560 + (d - 1) * ps + 115, `${pt.per_100000_rounds}`, { size: 34 });
        T(svg, xs[i] + 90, 560 + (d - 1) * ps + 115, `${N.points[i].per_100000_rounds}`, { size: 34, fill: C.accent, weight: 600 });
      });
      T(svg, 1460, 600, 'each step roughly', { size: 34 });
      T(svg, 1460, 645, 'halves the errors', { size: 34 });
      T(svg, 1460, 720, `Λ ${M.lambda.toFixed(2)}`, { size: 40, weight: 600 });
      T(svg, 1460, 770, `Λ ${N.lambda.toFixed(2)}`, { size: 40, weight: 600, fill: C.accent });
    }
    if (b >= 2) T(svg, L, 930, `One more halving: ${M.points[2].qubits} to ${data.qubits.rows[3].total} qubits.`, { size: 36, weight: 600 });
    if (b >= 3) T(svg, 900, 930, 'Modest at this size, but Λ decides how big a useful machine must be.', { size: 32, width: 920, lh: 40 });
  },
});

// 9 Reading late ---------------------------------------------------------------
add({
  id: 'late', builds: 5, chapter: 3, label: 'What it costs',
  title: 'It reads one frame while the chip records twenty-two.',
  source: 'Google Quantum AI, Nature 638 (2025), section V; the 24 µs is quoted there from earlier work. Article, section 8.',
  draw(page, b, data, ctx) {
    const svg = svgOf(page);
    chrome(svg, this, b, ctx);
    const ck = data.clock, round = ck.round.value;
    const net = ck.decoders.find((d) => d.id === 'network-2024').value;
    const x0 = 420, x1 = 1780, us = 80, X = (t) => x0 + (t / us) * (x1 - x0);
    metronome(svg, 230, 560, 1, { angle: -16 });
    HAND(svg, 120, 760, 'a frame every 1.1 µs', { size: 32 });
    // ticks: a frame lands every 1.1 µs
    RL(svg, x0, 470, x1, 470, { w: 2, stroke: C.mid });
    const tEnd = [26, 26, 73, 73, 73][b];
    for (let t = round, k = 1; t <= tEnd; t += round, k++) ln(svg, X(t), 450, X(t), 490, { stroke: C.ink, 'stroke-width': 2 });
    MONO(svg, x0, 430, 'frames from the chip', { size: 32 });
    if (b >= 1) {
      for (let k = 0; k < (b >= 2 ? 3 : 1); k++) {
        rc(svg, X(k * net), 560, X(net) - X(0) - 6, 44, { fill: C.field, stroke: C.accent });
      }
      T(svg, X(0), 650, `the learning reader: ${net} µs for one frame, quoted from earlier work`, { size: 32, fill: C.accent });
      T(svg, X(0), 700, `${Math.round(net / round)} frames land meanwhile`, { size: 34, weight: 600 });
    }
    if (b >= 2) {
      T(svg, X(0), 780, 'At 73 µs the chip is at frame 66: 62 unread frames lie in a pile.', { size: 34, weight: 600 });
      for (let i = 0; i < 62; i++) rc(svg, 1520 + (i % 10) * 26, 770 - Math.floor(i / 10) * 18 + 100, 22, 14, { 'stroke-width': 1.5, stroke: C.ink, fill: C.paper });
    }
    if (b >= 3) {
      const lv = ck.accuracy_on_the_same_recording;
      T(svg, X(0), 900, 'The standard reader, live, keeps the beat.', { size: 34, weight: 600 });
      T(svg, X(0), 945, `On a smaller, ${lv.chip.split(',')[0]} chip at distance 5: ${lv.live_matching.per_100000_rounds} live against ${lv.network_afterwards.per_100000_rounds} afterwards; part of that gap is live against afterwards.`, { size: 26, fill: C.muted, width: 1080, lh: 32 });
    }
  },
});

// 10 Teaching our reader ---------------------------------------------------------
add({
  id: 'teach', builds: 4, chapter: 3, label: 'Our runs',
  title: 'We wrote down first when we would drop it.',
  source: 'Article, section 9, “What we ran”, and its last paragraph.',
  draw(page, b, data, ctx) {
    const svg = svgOf(page);
    chrome(svg, this, b, ctx);
    const dm = data.lattice; // only for the frame look
    grid(svg, 200, 360, 3, 70, { litFrom: { 0: 'Y', 8: 'Z' } });
    HAND(svg, 150, 560, 'front: a simulated frame', { size: 32 });
    RL(svg, 400, 420, 520, 420, { w: 3 });
    grid(svg, 560, 360, 3, 70, { errs: { 0: 'Y', 8: 'Z' }, litFrom: { 0: 'Y', 8: 'Z' } });
    HAND(svg, 530, 560, 'back: the answer', { size: 32 });
    cards(svg, 900, 400, 1.2, 8);
    T(svg, 1180, 340, '4,096 fresh cards a step', { size: 36, weight: 600, fill: C.accent });
    T(svg, 1180, 390, 'three layers of 256 units', { size: 36, fill: C.accent });
    T(svg, 1180, 440, 'sees only lit checks', { size: 36, fill: C.accent });
    if (b >= 1) {
      rulebook(svg, 150, 660, 0.6); rulebook(svg, 300, 660, 0.6, { clip: true });
      T(svg, 150, 790, 'The two rulebook readers need no cards:', { size: 34, weight: 600 });
      T(svg, 150, 835, 'given the exact error model.', { size: 34 });
    }
    if (b >= 2) {
      RR(svg, 1000, 640, 780, 250, { w: 3, fill: C.paper });
      HAND(svg, 1030, 690, 'written before the runs', { size: 32 });
      T(svg, 1030, 750, 'Drop it if a laptop can’t train it at distance 5,', { size: 32, width: 720, lh: 40 });
      T(svg, 1030, 800, 'or if it loses on real recordings.', { size: 32, width: 720, lh: 40 });
    }
  },
});

// 11 What it learned -------------------------------------------------------------
add({
  id: 'learned', builds: 5, chapter: 3, label: 'Our runs',
  title: 'Ours passed plain matching. Correlated, untaught, stayed about a fifth ahead.',
  source: 'Our simulations at noise level 0.5%: share of runs read wrong. Article, section 9; Google Quantum AI, Nature 638 (2025).',
  draw(page, b, data, ctx) {
    const svg = svgOf(page);
    chrome(svg, this, b, ctx, { titleSize: 46 });
    const P = Object.fromEntries(data.learning.panels.map((p) => [p.id, p]));
    const panel = (x, y, w, hh, yr, pan, opt) => {
      const lx = Math.log10(1e5), hx = Math.log10(2.6e8);
      const X = (n) => x + ((Math.log10(n) - lx) / (hx - lx)) * w;
      const Y = (r) => y + hh - ((r * 100 - yr[0]) / (yr[1] - yr[0])) * hh;
      RL(svg, x, y + hh, x + w, y + hh, { w: 2.5 }); RL(svg, x, y, x, y + hh, { w: 2.5 });
      [1e6, 1e7].forEach((n) => T(svg, X(n), y + hh + 40, n >= 1e6 ? `${n / 1e6}m` : '', { size: 28, fill: C.muted, anchor: 'middle' }));
      T(svg, x + w, y + hh + 40, '250m', { size: 28, fill: C.muted, anchor: 'end' });
      for (let v = yr[0]; v <= yr[1] + 1e-9; v += 0.5) T(svg, x - 12, Y(v / 100) + 10, `${v.toFixed(1)}%`, { size: 28, fill: C.muted, anchor: 'end' });
      return { X, Y };
    };
    const curve = (A, c, maxN, yr) => {
      const pts = c.points.filter((pt) => pt.training_shots <= maxN).map((pt) => [A.X(pt.training_shots), A.Y(Math.min(pt.rate, yr[1] / 100))]);
      pth(svg, 'M ' + pts.map((p) => p.join(' ')).join(' L '), { stroke: C.accent, 'stroke-width': 2.5, opacity: 0.85 });
    };
    // panel 1, distance 3
    const yr1 = [1.0, 2.5];
    const A = panel(240, 330, 620, 480, yr1, P.d3);
    T(svg, 240, 300, 'distance 3', { size: 34, weight: 600 });
    const lv = P.d3.levels;
    ln(svg, 240, A.Y(lv.plain.rate), 860, A.Y(lv.plain.rate), { 'stroke-width': 4 });
    T(svg, 870, A.Y(lv.plain.rate) + 10, `plain ${pct(lv.plain.rate)}`, { size: 28 });
    ln(svg, 240, A.Y(lv.correlated.rate), 860, A.Y(lv.correlated.rate), { 'stroke-width': 3, stroke: C.mid });
    T(svg, 870, A.Y(lv.correlated.rate) + 34, `correlated ${pct(lv.correlated.rate)}, not counted`, { size: 26, fill: C.muted });
    ln(svg, 240, A.Y(lv.table.rate), 860, A.Y(lv.table.rate), { 'stroke-width': 3, 'stroke-dasharray': '3 7', stroke: C.ink });
    T(svg, 870, A.Y(lv.table.rate) + 34, `table ${pct(lv.table.rate)}`, { size: 26, fill: C.muted });
    P.d3.curves.forEach((c) => curve(A, c, 1e9, yr1));
    const f3 = P.d3.final_network.per_seed.map((s) => s.rate);
    T(svg, 240, 900, `eight seeds end at ${pct(Math.min(...f3))}–${pct(Math.max(...f3))}`, { size: 30, fill: C.accent, weight: 600 });
    if (b >= 1) {
      const yr2 = [0.5, 2.5];
      const B = panel(1180, 330, 560, 480, yr2, null);
      T(svg, 1180, 300, 'distance 5', { size: 34, weight: 600 });
      const l5 = P['d5-250m'].levels;
      ln(svg, 1180, B.Y(l5.plain.rate), 1740, B.Y(l5.plain.rate), { 'stroke-width': 4 });
      T(svg, 1750, B.Y(l5.plain.rate) + 10, pct(l5.plain.rate), { size: 28 });
      ln(svg, 1180, B.Y(l5.correlated.rate), 1740, B.Y(l5.correlated.rate), { 'stroke-width': 3, stroke: C.mid });
      T(svg, 1750, B.Y(l5.correlated.rate) + 10, pct(l5.correlated.rate), { size: 28, fill: C.muted });
      const pan = b >= 2 && b !== 1 ? P['d5-250m'] : P['d5-66m'];
      const maxN = b >= 2 ? 3e8 : 6.6e7;
      (b >= 2 ? P['d5-250m'] : P['d5-66m']).curves.forEach((c) => curve(B, c, maxN, yr2));
      const nStack = b >= 2 ? 15 : 4;
      cards(svg, B.X(maxN > 1e8 ? 2.4e8 : 6.6e7) - 40, 930, 0.35, nStack, { face: false });
      const f = (b >= 2 ? P['d5-250m'] : P['d5-66m']).final_network.per_seed.map((s) => s.rate);
      T(svg, 1180, 900, b >= 2 ? `five long runs cross plain at 210–250m; end at ${pct(Math.min(...f))}–${pct(Math.max(...f))}` : `at 66m: still above both, ${pct(Math.min(...f))}–${pct(Math.max(...f))}`, { size: 28, fill: C.accent, weight: 600, width: 640, lh: 34 });
    }
    if (b >= 3) {
      T(svg, L, 990, 'Google’s network, larger and trained on chip data, beat its best matcher. Ours, small and simulated, passed only plain.', { size: 26, fill: C.muted, width: 1700, lh: 30 });
    }
  },
});

// 12 Honesty ---------------------------------------------------------------------
add({
  id: 'honesty', builds: 4, chapter: 3, label: 'What would prove us wrong',
  title: 'Three results would change our answer.',
  source: 'Article, sections 8 and 9, and “What we could not show”.',
  draw(page, b, data, ctx) {
    const svg = svgOf(page);
    chrome(svg, this, b, ctx);
    const items = [
      'Our reader loses on Google’s public recordings: the open half of our rule.',
      'The December 2025 preprint holds up under review: a reader that keeps the beat, under 1 µs per round.',
      'A larger network passes correlated matching at distance 5. A separate script’s, twenty times larger, came close: 1.15% against 1.09%, not past it.',
    ];
    items.forEach((s, i) => {
      if (b < i) return;
      const y = 340 + i * 200;
      T(svg, L, y, String(i + 1), { size: 72, weight: 700, fill: C.muted });
      T(svg, L + 90, y - 18, s, { size: 38, width: 1300, lh: 48 });
    });
    if (b >= 1) metronome(svg, 1660, 600, 0.7, { angle: 10 });
  },
});

// 13 Close -----------------------------------------------------------------------
add({
  id: 'close', builds: 2, chapter: 'all', label: 'The other half',
  title: 'The reader is the other half of a quantum computer.',
  draw(page, b, data, ctx) {
    const svg = svgOf(page);
    chrome(svg, this, b, ctx, { titleSize: 58 });
    const cr = cryostat(svg, 170, 400, 1.05);
    RP(svg, `M ${cr.chipX} ${cr.chipY} C ${cr.chipX} ${cr.chipY + 50} ${cr.chipX + 80} 860 ${cr.chipX + 180} 860`, { w: 2.5 });
    film(svg, data, cr.chipX + 180, 1240, 825, { h: 70, fw: 84 });
    desk(svg, 1200, 830, 0.8, { reader: true, metronome: true, cards: 6 });
    if (b >= 1) T(svg, L, 260, 'A learning one can read better, if it is taught enough and keeps time.', { size: 44, weight: 600, fill: C.accent });
  },
  landing: 'The reader is the other half of a quantum computer. A learning one can read better, if it is taught enough and keeps time.',
});

// End ----------------------------------------------------------------------------
add({
  id: 'end', end: true, builds: 1, landing: 'Thank you. Questions?',
  draw(page, b, data, ctx) {
    const svg = svgOf(page);
    const a = h('a', { href: '../../other-half/' }, svg);
    T(a, L, 380, 'The other half of a quantum computer', { family: 'serif', size: 88, weight: 500 });
    T(svg, L, 560, 'Thank you. Questions?', { size: 64, weight: 600 });
    MONO(svg, L, 680, 'thd-ai.github.io/ws27-papers/other-half/', { size: 36, fill: C.ink });
  },
});

// Backups ------------------------------------------------------------------------
const back = (id, title, draw, source) => add({ id, backup: id.toUpperCase(), builds: 1, title, source, draw(page, b, data, ctx) { const svg = svgOf(page); chrome(svg, this, b, ctx); draw(svg, data); } });

back('b1', 'A helper is measured each round and gives one bit: even or odd.', (svg) => {
  grid(svg, 700, 420, 2, 300, { lit: [false, false, false, false, false] });
  HAND(svg, 1100, 560, 'one helper between four storing qubits', { size: 34 });
}, 'Article, section 3.');

back('b2', 'On 24 of 256 patterns plain matching picks the less likely answer: under 1 case in 100.', (svg, data) => {
  const cells = data.syndromes.cells;
  cells.forEach((c) => {
    const fill = c.state === 'differs' ? C.ink : c.state === 'tie_best' ? C.lit : C.paper;
    rc(svg, 560 + c.col * 46, 300 + c.row * 40, 40, 34, { fill, stroke: C.hair, 'stroke-width': 1.5 });
  });
  T(svg, 1340, 400, `${data.syndromes.counts.differs} filled: the less likely answer`, { size: 32 });
  T(svg, 1340, 450, `${data.syndromes.counts.tie_best} grey: ties`, { size: 32, fill: C.muted });
}, 'Article, section 6: all 256 check patterns at distance 3, 5% error per storing qubit.');

back('b3', 'In our setup correlated matching gets 6 of 219 single errors wrong.', (svg) => {
  dotRow(svg, L, 320, 219, 6, { cols: 40, pitch: 34, r: 12 });
  T(svg, L, 640, 'At noise level 0.1% at distance 3: correlated 0.113% against plain 0.075%.', { size: 36 });
}, 'Article, section 9, “A finding we didn’t plan for”.');

back('b4', 'Level with correlated matching at 0.1%, behind it from 0.2%, behind both from 0.8%.', (svg, data) => {
  data.noise.rows.forEach((r, i) => {
    const x = L + 60 + i * 210;
    const marks = [['network', r.network.pooled.rate, C.accent]];
    T(svg, x, 860, `${(r.p * 100).toFixed(1)}%`, { size: 32, fill: C.muted });
    T(svg, x, 420, r.network_vs_correlated, { size: 30, fill: C.accent });
    T(svg, x, 470, `vs plain: ${r.network_vs_plain}`, { size: 26, fill: C.muted });
    for (let k = 0; k < 3; k++) dot(svg, x + 40, 560 + k * 80, 18, { fill: k === 0 ? C.accent : k === 1 ? C.mid : C.ink });
  });
  HAND(svg, L, 960, 'rough: real column order to be drawn from noise levels', { size: 32 });
}, 'Our simulations at distance 5, about 250 million training runs, five seeds. Article, section 9.');

back('b5', 'A separate script found the same order at distance 5.', (svg) => {
  const X = (v) => 300 + (v - 1.0) * 3000;
  RL(svg, X(1.0), 600, X(1.5), 600, { w: 3 });
  [[1.09, 'correlated', C.mid], [1.155, 'separate script, 1.15–1.16', C.accent], [1.41, 'plain', C.ink]].forEach(([v, l, c], i) => {
    dot(svg, X(v), 600, 16, { fill: c });
    T(svg, X(v), 540 - i * 60, `${l} ${v === 1.155 ? '' : v.toFixed(2) + '%'}`, { size: 32, anchor: 'middle', fill: c === C.mid ? C.muted : c });
  });
  T(svg, L, 780, 'Its network: twenty times larger than ours.', { size: 36 });
}, 'Article, section 9, “A second implementation”.');

back('b6', 'A preprint claims under 1 µs per round. Nobody has reviewed it yet.', (svg) => {
  metronome(svg, 500, 760, 1.5);
  desk(svg, 900, 760, 0.9, { lamp: false });
  HAND(svg, 1300, 560, 'claimed', { size: 44 });
}, 'Article, section 8, step 4: preprint of December 2025, not peer-reviewed.');

back('b7', 'Our noise is the same on every operation; a chip’s is not.', (svg) => {
  for (let i = 0; i < 3; i++) drop(svg, 300 + i * 300, 600, 0.45, 0);
  T(svg, 1150, 460, 'On a chip: some qubits worse than others,', { size: 34 });
  T(svg, 1150, 510, 'and errors that come in bursts.', { size: 34 });
}, 'Article, section 9, “What we ran”; section 6; “What we could not show”.');

back('b8', 'No copy, so the value lives in how qubits relate. Below the threshold, bigger wins.', (svg, data) => {
  T(svg, L, 420, '000  or  111', { family: 'mono', size: 72, fill: C.ink });
  const pts = data.suppression.decoders[0].points;
  pts.forEach((p, i) => { dotRow(svg, 760, 320 + i * 150, 100, Math.min(100, Math.round(p.per_100000_rounds / 10)), { cols: 50, pitch: 16, r: 6 }); T(svg, 1620, 350 + i * 150, `${p.per_100000_rounds}`, { size: 36, weight: 600 }); });
  HAND(svg, 760, 790, 'one dot = 10 per 100,000 rounds (rough)', { size: 30 });
  T(svg, L, 860, '2023: the first step in which bigger won, as one line of text.', { size: 32, fill: C.muted });
}, 'Google Quantum AI, Nature 638 (2025): matching, distances 3, 5, 7. Article, sections 2 and 7.');

back('b9', 'Sources.', (svg, data) => {
  Object.values(data.sources).slice(0, 9).forEach((s, i) => T(svg, L, 300 + i * 66, `${s.title}`, { size: 30, width: 1700 }));
  T(svg, L, 920, 'How this was made: in the article.', { size: 32, fill: C.muted });
}, '');

export const MAIN_COUNT = SLIDES.filter((s) => !s.backup && !s.end).length;
