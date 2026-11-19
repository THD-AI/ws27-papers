// Loop 1 of the new deck (CONCEPT.md, "the pick"): one cable through the
// whole talk, data as an engineer's drafting marks, the claim on the page
// from the first click. Four key frames first: slides 1, 3, 5 and 13.
// Every number comes from the article's data files; sources on the page.
import { h, text, textSize } from '../../lib/fig.js';

const C = { paper: '#FBFBFC', ink: '#15171C', muted: '#5C6370', hair: '#C9CDD4', faint: '#E3E6EB', accent: '#1F7A54', field: '#CDE9D9', mid: '#8A9099' };
const L = 120, R = 1800, W = R - L;
const CABLE_Y = 968;   // where the cable crosses the page edges between slides

const T = (p, x, y, s, o = {}) => text(p, x, y, s, { family: 'sans', size: 36, fill: C.ink, free: true, ...o });
const ln = (p, x1, y1, x2, y2, o = {}) => h('line', { x1, y1, x2, y2, stroke: C.ink, 'stroke-width': 3, 'stroke-linecap': 'round', ...o }, p);
const rc = (p, x, y, w, hh, o = {}) => h('rect', { x, y, width: w, height: hh, fill: 'none', stroke: C.ink, 'stroke-width': 3, ...o }, p);
const pth = (p, d, o = {}) => h('path', { d, fill: 'none', stroke: C.ink, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...o }, p);
const dot = (p, x, y, r, o = {}) => h('circle', { cx: x, cy: y, r, ...o }, p);

function svgOf(page) {
  const svg = h('svg', { viewBox: '0 0 1920 1080', width: 1920, height: 1080, role: 'img' });
  page.appendChild(svg);
  // diagonal hatch: the drafting sign for masonry cut in section
  const defs = h('defs', {}, svg);
  const pat = h('pattern', { id: 'masonry', width: 18, height: 18, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
  h('line', { x1: 0, y1: 0, x2: 0, y2: 18, stroke: C.mid, 'stroke-width': 2 }, pat);
  const gap = h('pattern', { id: 'gap', width: 14, height: 14, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(-45)' }, defs);
  h('line', { x1: 0, y1: 0, x2: 0, y2: 14, stroke: C.mid, 'stroke-width': 2.5 }, gap);
  const ink = h('filter', { id: 'ink', 'color-interpolation-filters': 'sRGB' }, defs);
  h('feColorMatrix', { type: 'matrix', values: '0 0 0 0 0.08  0 0 0 0 0.09  0 0 0 0 0.11  0 0 0 1.6 0' }, ink);
  // a soft left edge for a drawing that would otherwise end in a hard crop
  const lg = h('linearGradient', { id: 'fadeL', x1: 0, x2: 1, y1: 0, y2: 0 }, defs);
  h('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0 }, lg);
  h('stop', { offset: 0.14, 'stop-color': '#fff', 'stop-opacity': 1 }, lg);
  const mk = h('mask', { id: 'fadeLeft', maskContentUnits: 'objectBoundingBox' }, defs);
  h('rect', { x: 0, y: 0, width: 1, height: 1, fill: 'url(#fadeL)' }, mk);
  [['fadeDown', 1, 0], ['fadeUp', 0, 1]].forEach(([id, a0, a1]) => { const gr = h('linearGradient', { id, x1: 0, x2: 0, y1: 0, y2: 1 }, defs); h('stop', { offset: 0, 'stop-color': C.paper, 'stop-opacity': a0 }, gr); h('stop', { offset: 1, 'stop-color': C.paper, 'stop-opacity': a1 }, gr); });
  const tg = h('linearGradient', { id: 'fadeTBg', x1: 0, x2: 0, y1: 0, y2: 1 }, defs);
  [[0, 0], [0.12, 1], [0.88, 1], [1, 0]].forEach(([o, a]) => h('stop', { offset: o, 'stop-color': '#fff', 'stop-opacity': a }, tg));
  const mt = h('mask', { id: 'fadeTB', maskContentUnits: 'objectBoundingBox' }, defs);
  h('rect', { x: 0, y: 0, width: 1, height: 1, fill: 'url(#fadeTBg)' }, mt);
  return svg;
}

// A smooth path through points (rounded corners at each turn), the cable.
function smooth(pts, r = 60) {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
    const a = Math.min(r, Math.hypot(x1 - x0, y1 - y0) / 2), b = Math.min(r, Math.hypot(x2 - x1, y2 - y1) / 2);
    const ux = (x1 - x0) / Math.hypot(x1 - x0, y1 - y0), uy = (y1 - y0) / Math.hypot(x1 - x0, y1 - y0);
    const vx = (x2 - x1) / Math.hypot(x2 - x1, y2 - y1), vy = (y2 - y1) / Math.hypot(x2 - x1, y2 - y1);
    d += ` L${x1 - ux * a} ${y1 - uy * a} Q${x1} ${y1} ${x1 + vx * b} ${y1 + vy * b}`;
  }
  const e = pts[pts.length - 1];
  return d + ` L${e[0]} ${e[1]}`;
}
const ART = '../../articles/renovate/art/';
const img = (svg, file, x, y, w, hh, o = {}) => h('image', { href: ART + file, x, y, width: w, height: hh, preserveAspectRatio: 'xMidYMid meet', ...o }, svg);
// A drawing cropped to part of its own canvas (crop = [sx, sy, sw, sh] in the
// drawing's pixels), placed with its crop's top left at x, y and scaled by k.
function art(p, file, x, y, k, crop, W = 1536, H = 1024) {
  const [sx, sy, sw, sh] = crop;
  const v = h('svg', { x, y, width: sw * k, height: sh * k, viewBox: `${sx} ${sy} ${sw} ${sh}`, overflow: 'hidden' }, p);
  h('image', { href: ART + file, x: 0, y: 0, width: W, height: H }, v);
  return v;
}
// The drawn plug without its own thin cable stub: the grip starts at drawing
// x 520, centred on y 512; the pins end at x 1308. Placed by the grip centre.
const PLUG = [520, 280, 800, 470];
function plug(p, gx, gy, k, rot = 0) {
  const g = h('g', { transform: `translate(${gx} ${gy}) rotate(${rot})` }, p);
  art(g, 'deck-plug.png', 0, -232 * k, k, PLUG);
  return g;
}
// A socket face: a plate, a round recess and its own pattern of holes. Each
// pattern is one way to prove who you are; no two alike, as no two standards are.
const HOLES = [
  [['c', -0.22, 0], ['c', 0.22, 0]],
  [['v', -0.2, 0], ['v', 0.2, 0]],
  [['v', -0.2, 0.1], ['v', 0.2, 0.1], ['c', 0, -0.22]],
  [['h', 0, -0.2], ['v', -0.22, 0.14], ['v', 0.22, 0.14]],
  [['s', -0.18, -0.04, 30], ['s', 0.18, -0.04, -30], ['v', 0, 0.22]],
  [['c', -0.2, 0.12], ['c', 0.2, 0.12], ['c', 0, -0.2]],
  [['c', 0, 0]],
  [['c', -0.24, 0], ['c', 0, 0], ['c', 0.24, 0]],
  [['h', 0, -0.13], ['h', 0, 0.13]],
  [['q', -0.2, 0], ['q', 0.2, 0]],
  [['v', -0.2, 0], ['h', 0.16, 0]],
  [['c', -0.2, 0], ['v', 0.2, 0]],
  [['q', 0, -0.2], ['c', -0.2, 0.16], ['c', 0.2, 0.16]],
  [['v', -0.26, 0], ['v', 0, 0], ['v', 0.26, 0]],
];
function socket(p, cx, cy, size, kind, o = {}) {
  const st = { fill: o.fill || C.paper, stroke: o.stroke || C.ink, 'stroke-width': o.w || 3, ...(o.dash ? { 'stroke-dasharray': o.dash } : {}) };
  dot(p, cx, cy, size * 0.46, { ...st, 'stroke-width': (o.w || 3) * 0.8 });
  dot(p, cx, cy, size * 0.38, { ...st, fill: 'none', 'stroke-width': (o.w || 3) * 0.6 });
  const ink = { fill: o.stroke || C.ink };
  HOLES[kind].forEach(([t, dx, dy, a]) => {
    const x = cx + dx * size, y = cy + dy * size;
    if (t === 'c') dot(p, x, y, size * 0.055, ink);
    if (t === 'q') h('rect', { x: x - size * 0.045, y: y - size * 0.045, width: size * 0.09, height: size * 0.09, ...ink }, p);
    if (t === 'v' || t === 's') h('rect', { x: x - size * 0.025, y: y - size * 0.08, width: size * 0.05, height: size * 0.16, rx: size * 0.012, transform: a ? `rotate(${a} ${x} ${y})` : '', ...ink }, p);
    if (t === 'h') h('rect', { x: x - size * 0.08, y: y - size * 0.025, width: size * 0.16, height: size * 0.05, rx: size * 0.012, ...ink }, p);
  });
}
// The cable is a tube: an ink stroke with a paper stroke inside it, so it
// matches the drawn plug's cable. tw = outer width.
function cable(svg, pts, o = {}) {
  const d = smooth(pts, o.r || 60), tw = o.tw || 22, line = o.line || 3.5;
  const cap = o.cap ? { 'stroke-linecap': o.cap } : {};
  pth(svg, d, { stroke: C.ink, 'stroke-width': tw, ...cap });
  pth(svg, d, { stroke: o.fill || C.paper, 'stroke-width': tw - 2 * line, ...cap });
}

// Drafting marks: a dimension line with 45° ticks and extension lines.
function dim(svg, x1, x2, y, o = {}) {
  const col = o.col || C.ink, w = o.w || 3;
  ln(svg, x1, y, x2, y, { stroke: col, 'stroke-width': w });
  [x1, x2].forEach((x) => {
    ln(svg, x - 11, y + 11, x + 11, y - 11, { stroke: col, 'stroke-width': w + 1 });
    if (o.ext) ln(svg, x, o.ext[0], x, o.ext[1], { stroke: col, 'stroke-width': 1.5 });
  });
}

// The frame: title (the line he says, on the page from the first click), an
// optional line under it, the source, and where we are.
function frame(svg, s, o = {}) {
  if (s.title) {
    let size = o.titleSize || 60;
    const width = o.titleWidth || 1480;
    if (textSize(s.title, { family: 'sans', size, weight: 600, free: true }).w > width * 1.9) size = 52;
    const t = T(svg, L, 148, s.title, { size, weight: 600, width, lh: size * 1.14 });
    if (s.sub) T(svg, L, t.bottom + 50, s.sub, { size: 32, fill: C.muted, width });
  }
  if (s.source) T(svg, L, 1016, s.source, { size: 22, fill: C.muted, width: 1380, lh: 27 });
  if (s.n) {
    T(svg, R, 1022, `${s.n}`, { size: 28, weight: 600, fill: C.ink, anchor: 'end' });
    if (s.beat) T(svg, R - 48, 1022, s.beat, { size: 22, fill: C.muted, anchor: 'end' });
  }
}

export const SLIDES = [];
const add = (s) => { SLIDES.push(s); return s; };

// 1 ---------------------------------------------------------------------------
// An almost empty page: the cable comes in at the left and stops just short of
// a brick wall. The plug isn't in. Wall and plug are drawn in his line.
add({
  id: 'title', n: '', builds: 2, start: '0:00', clicks: ['the cable, the wall', 'the question'],
  landings: { 1: "Can Telekom copy what T-Mobile's agents did?" },
  notes: `<p>Deutsche Telekom openly takes an American result as its benchmark. On 5 October it told its investors about T-Mobile: software agents there now do a big part of customer service, and Telekom wants the same in Europe by 2030. My position: born in the United States, studying in Germany, so I may see Germany as the harder case. That's why every claim has a source. <b>Can Telekom copy what T-Mobile's agents did?</b></p>`,
  draw(page, b) {
    const svg = svgOf(page);
    // the wall, drawn: 1024 x 1536. At drawing row 1028 a brick juts out to x 173;
    // that row sits at the plug's height and starts at page x 1500.
    const wk = 1180 / 1536, cy = 740, wy = cy - 1028 * wk - 0, wx = 1500 - 173 * wk;
    img(svg, 'deck-wall.png', wx, wy, 1024 * wk, 1536 * wk);
    // the plug: pins end 50 px short of the wall
    const k = 0.5, gx = 1500 - 50 - (1308 - 520) * k;
    cable(svg, [[-30, CABLE_Y], [700, CABLE_Y], [gx - 140, cy], [gx + 3, cy]], { r: 220 });
    plug(svg, gx, cy, k);
    T(svg, L, 220, 'Innovation Management for AI', { size: 34, weight: 500, fill: C.muted });
    T(svg, L, 360, 'Renovate,', { family: 'serif', size: 132, weight: 500 });
    T(svg, L, 500, 'don’t repaint', { family: 'serif', size: 132, weight: 500 });
    if (b >= 1) T(svg, L, 630, 'Can Telekom copy what T-Mobile’s agents did?', { size: 52, weight: 600, width: 860, lh: 62 });
    T(svg, L, 826, 'Alexander Rudaev', { size: 34, weight: 600 });
    T(svg, L, 872, 'TH Deggendorf, 12 December 2026', { size: 32, fill: C.muted });
    T(svg, L, 1050, 'Drawings: generated from my own line drawing', { size: 22, fill: C.muted });
  },
});

// 3 ---------------------------------------------------------------------------
// Two counts, two bars: each on its own hundred, because nobody published
// whether one contains the other. Then: how many were finished isn't known.
add({
  id: 'number', n: 3, beat: 'The American result', builds: 3, start: '1:35',
  clicks: ['the release: 40', 'T-Mobile’s slide: 32, another count', 'finished: not published'],
  title: 'Telekom says 40 percent. T-Mobile’s own slide counts 32 percent.',
  source: 'Deutsche Telekom, press release, 5 Oct 2026; T-Mobile US, AI Investor Day deck, Q2 2026. Company figures, not audited. Two separate counts on different bases; whether the 40 include the 32 isn’t published.',
  notes: `<p>A correction to my own proposal. Telekom's release says AI agents now handle forty percent of customer contacts in the US; I used that number. In T-Mobile's own material I couldn't find it. Its slide counts something narrower: only contract customers, only contacts "served by an AI agent". Served means the customer meets the software first. Whether the software also finished the job, T-Mobile doesn't say. Company numbers, not audited. Still, one in three is a lot. <b>Telekom says forty percent. T-Mobile's own slide counts thirty-two percent.</b></p>`,
  draw(page, b, data) {
    const svg = svgOf(page);
    frame(svg, this);
    const P = data.numbers.plateA, r = P.release.value, s = P.slide.value;
    const x0 = 420, x1 = 1760, X = (v) => x0 + (v / 100) * (x1 - x0), hh = 64;
    const bar = (y, v, col, fill, head, desc, base) => {
      T(svg, x0, y - 62, head, { size: 36, weight: 600, fill: col });
      T(svg, x0, y - 20, desc, { size: 32, fill: C.muted });
      h('rect', { x: X(0), y, width: X(v) - X(0), height: hh, fill }, svg);
      rc(svg, x0, y, x1 - x0, hh);
      for (let t = 10; t < 100; t += 10) ln(svg, X(t), y + hh - 14, X(t), y + hh, { stroke: C.mid, 'stroke-width': 2 });
      ln(svg, X(v), y, X(v), y + hh, { stroke: col, 'stroke-width': 4 });
      T(svg, x0 - 40, y + hh - 2, `${v}`, { size: 96, weight: 600, fill: col, anchor: 'end' });
      T(svg, x1, y + hh + 42, base, { size: 32, fill: C.muted, anchor: 'end' });
    };
    bar(400, r, C.ink, C.faint, 'Telekom’s press release', 'of customer contacts, “handled by AI agents”; whose, it doesn’t say', 'of 100 contacts');
    if (b >= 1) bar(680, s, C.accent, C.field, 'T-Mobile’s own slide', 'of contract customers’ contacts, “served by an AI agent”: they start with the software', 'of 100 contract customers’ contacts');
    if (b >= 2) {
      const y = 680 + hh + 22;
      pth(svg, `M${X(0)} ${y} L${X(0)} ${y + 18} L${X(s)} ${y + 18} L${X(s)} ${y}`, { stroke: C.ink, 'stroke-width': 2.5, 'stroke-dasharray': '10 8' });
      T(svg, X(0), y + 76, 'how many of these the software finished: not published', { size: 38, weight: 600 });
    }
    cable(svg, [[-20, CABLE_Y], [1940, CABLE_Y]]);
  },
});

// 5 ---------------------------------------------------------------------------
// Three walls seen face on, side by side. One cable at one height crosses all
// three: hidden inside the hollow timber wall (dashed), carried across the
// brick in a duct that stands on the face, and laid into a channel cut into
// the brick and plastered over (the bricks are cut where it runs).
add({
  id: 'walls', n: 5, beat: 'The picture', builds: 4, start: '3:20',
  clicks: ['timber', 'repaint: the duct', 'renovate, on “cutting into the wall”', 'the cable is the agent'],
  title: 'The cable is the same. The wall decides the work.',
  source: 'NAHB 2026 (94% of new single-family homes completed in 2025 timber-framed); Destatis 2021 (about two in three residential buildings approved in 2020 brick or other masonry); DIN 18015-3. The walls picture conditions; they are not evidence.',
  notes: `<p>My father is a civil engineer, and this picture is his. In America almost every new family home has a timber frame: the wall is hollow, so a new cable drops down inside it. In Germany it's mostly brick, built to stand, so a new cable means opening the wall. You can screw a duct onto the wall: quick, and the wall stays as it was. Or you cut a channel, lay the cable and plaster it over: slow, and the cable becomes part of the wall. The cable is the agent. The wall is what's already there: old systems, rules, people. The duct is repainting. Cutting into the wall is renovating. <b>The cable is the same. The wall decides the work.</b></p>`,
  draw(page, b) {
    const svg = svgOf(page);
    frame(svg, this);
    const top = 330, bot = 700, ww = 470, gap = 95, cy = 515;
    const xs = [L, L + ww + gap, L + 2 * (ww + gap)];
    const brick = (x) => {
      const rh = 40, bw = 94;
      for (let r = 0; top + r * rh < bot; r++) {
        const y = top + r * rh, off = r % 2 ? bw / 2 : 0;
        ln(svg, x, y, x + ww, y, { stroke: C.hair, 'stroke-width': 2 });
        for (let bx = x + off; bx < x + ww; bx += bw) if (bx > x) ln(svg, bx, y, bx, Math.min(y + rh, bot), { stroke: C.hair, 'stroke-width': 2 });
      }
    };
    // wall 1: timber, studs seen through the board
    rc(svg, xs[0], top, ww, bot - top, { 'stroke-width': 4 });
    for (let i = 1; i < 5; i++) ln(svg, xs[0] + i * ww / 5, top, xs[0] + i * ww / 5, bot, { stroke: C.hair, 'stroke-width': 3, 'stroke-dasharray': '6 8' });
    if (b >= 1) { brick(xs[1]); rc(svg, xs[1], top, ww, bot - top, { 'stroke-width': 4 }); }
    if (b >= 2) {
      brick(xs[2]);
      // the channel: the bricks are cut where it runs, plaster fills it
      h('rect', { x: xs[2], y: cy - 26, width: ww, height: 52, fill: C.field }, svg);
      ln(svg, xs[2], cy - 26, xs[2] + ww, cy - 26, { stroke: C.accent, 'stroke-width': 3 });
      ln(svg, xs[2], cy + 26, xs[2] + ww, cy + 26, { stroke: C.accent, 'stroke-width': 3 });
      rc(svg, xs[2], top, ww, bot - top, { 'stroke-width': 4 });
    }
    // the cable: one height, the whole page
    const end = b >= 2 ? 1940 : b >= 1 ? xs[2] - 10 : xs[1] - 10;
    cable(svg, [[-20, cy], [end, cy]]);
    // inside the timber wall it is hidden: dashed outline
    const hidden = (x0, x1) => { h('rect', { x: x0, y: cy - 12, width: x1 - x0, height: 24, fill: C.paper }, svg); [cy - 9, cy + 9].forEach((yy) => ln(svg, x0, yy, x1, yy, { stroke: C.ink, 'stroke-width': 3.5, 'stroke-dasharray': '16 10', 'stroke-linecap': 'butt' })); };
    hidden(xs[0], xs[0] + ww);
    if (b >= 1) { // the duct stands on the face: a box with its shadow edge, screws into the brick
      h('rect', { x: xs[1] + 6, y: cy - 22 + 8, width: ww - 12, height: 44, fill: C.ink }, svg);
      h('rect', { x: xs[1] - 2, y: cy - 22, width: ww - 12, height: 44, fill: C.paper, stroke: C.ink, 'stroke-width': 4 }, svg);
      [0.2, 0.5, 0.8].forEach((f) => { const x = xs[1] + f * ww; h('circle', { cx: x, cy, r: 7, fill: C.paper, stroke: C.ink, 'stroke-width': 2.5 }, svg); ln(svg, x - 5, cy, x + 5, cy, { 'stroke-width': 2 }); });
    }
    if (b >= 2) { h('rect', { x: xs[2], y: cy - 12, width: ww, height: 24, fill: C.field }, svg); [cy - 9, cy + 9].forEach((yy) => ln(svg, xs[2], yy, xs[2] + ww, yy, { stroke: C.ink, 'stroke-width': 3.5, 'stroke-dasharray': '16 10', 'stroke-linecap': 'butt' })); }
    // names
    const head = (x, a, z, col) => { T(svg, x, 262, a, { size: 36, weight: 600, fill: col || C.ink }); T(svg, x, 302, z, { size: 32, fill: C.muted }); };
    head(xs[0], 'US: timber frame, hollow', '94% of new single-family homes');
    if (b >= 1) head(xs[1], 'Germany: brick', 'two in three approved in 2020');
    if (b >= 2) head(xs[2], 'Germany: the same brick', 'opened, then closed again', C.accent);
    const under = (x, a, z, col) => { T(svg, x, bot + 72, a, { size: 56, weight: 700, fill: col || C.ink }); T(svg, x, bot + 118, z, { size: 34, fill: C.muted }); };
    under(xs[0], 'pulled through', 'quick; the wall stays closed');
    if (b >= 1) under(xs[1], 'repaint', 'a duct on the face; quick');
    if (b >= 2) under(xs[2], 'renovate', 'cut in, plastered; slow', C.accent);
    if (b >= 3) {
      T(svg, L, 900, 'The cable is the agent. The wall is what’s already there: old systems, rules, people.', { family: 'serif', italic: true, size: 40 });
    }
    cable(svg, [[-20, CABLE_Y], [1940, CABLE_Y]]);
  },
});

// 7 ---------------------------------------------------------------------------
// Fourteen socket faces, no two alike: the ways a customer proves who they are.
// Then three, dashed because they are planned, and the agent's plug below them.
add({
  id: 'simplify', n: 7, beat: 'Telekom’s own slide', builds: 2, start: '5:25',
  clicks: ['14 today', '3 planned, and the plug'],
  title: 'Simplify before automating.',
  sub: 'Telekom’s own words, from its own slide.',
  source: 'Deutsche Telekom, AI Investor Day, “From AI Adoption to AI Impact”, 5 Oct 2026. Company figures; three is a target.',
  notes: `<p>Telekom isn't there yet. Across its European countries, a customer can prove who they are in fourteen different ways: fourteen sockets, and an agent would need a plug for each. Telekom wants three, and its own slide says why. <b>Simplify before automating.</b></p>`,
  draw(page, b, data) {
    const svg = svgOf(page);
    frame(svg, this, { titleSize: 72 });
    const D = data.rewire.de;
    T(svg, L, 340, `${D.now.value} ways to prove who you are, today`, { size: 38, weight: 600 });
    for (let i = 0; i < D.now.value; i++) socket(svg, L + 46 + (i % 7) * 116, 430 + Math.floor(i / 7) * 116, 92, i % HOLES.length);
    if (b >= 1) {
      pth(svg, 'M930 488 L1060 488 M1036 470 L1060 488 L1036 506', { stroke: C.mid, 'stroke-width': 4 });
      T(svg, 1130, 340, `${D.plan.value}, planned: a target`, { size: 38, weight: 600, fill: C.accent });
      const xs = [1215, 1405, 1595];
      xs.forEach((x, i) => socket(svg, x, 470, 150, [2, 0, 5][i], { fill: C.field, stroke: C.accent, w: 3.5, dash: '14 9' }));
      // the agent's plug, pointing up at the middle one
      const k = 0.3, gy = 470 + 75 + 40 + (1308 - 520) * k;
      cable(svg, [[-20, CABLE_Y], [xs[1], CABLE_Y], [xs[1], gy - 2]], { r: 90, tw: 20 });
      plug(svg, xs[1], gy, k, -90);
    } else cable(svg, [[-20, CABLE_Y], [1940, CABLE_Y]]);
  },
});

// 13 --------------------------------------------------------------------------
// The plan as a building drawn floor by floor, the way a drawing marks work:
// built in solid line, planned in dashed line. Each floor is a step and carries
// its name; what it is measured by stands beside it.
add({
  id: 'steps1', n: 13, beat: 'How to address it', builds: 3, start: '10:25',
  clicks: ['step 1', 'step 2', 'steps 3 and 4'],
  title: 'Measure first. Start beside the staff.',
  sub: 'Step 1 is this course’s business measure, not accuracy. The order of the eight is my hypothesis.',
  source: 'Step 1: the business measure from this course. Step 4: teams, never single people (2021 framework agreement). Bitkom 2025: 51% of firms with 20 or more staff strongly dependent on US digital technology.',
  notes: `<p>So how would I do it? Step one: before any agent, measure what one contact costs today and how often customers come back; then, with the agent, how many requests it finishes for good and what it costs. That's the business measure from this course, not accuracy. If it doesn't get better, the agent is the wrong tool and Telekom stops there. Step two: sign the works agreement while the system is still on paper. Steps three and four: keep the option to switch suppliers, since about half of German firms with twenty or more staff depend strongly on American technology, and train the staff before each new key, measuring teams, never single people. <b>Measure first. Start beside the staff.</b></p>`,
  draw(page, b, data) {
    const svg = svgOf(page);
    frame(svg, this);
    const st = data.plan.steps;
    const MEASURE = {
      1: [['cost per contact, repeat contacts: before and with the agent'], ['No gain: stop here.', { weight: 600, fill: C.ink }]],
      2: [['signed before the first agent acts']],
      3: [['time to switch supplier.'], ['Bitkom: 51% of firms depend strongly on US technology']],
      4: [['cases per hour and repeat contacts, per team, never per person']],
    };
    const on = b >= 2 ? [1, 2, 3, 4] : b === 1 ? [1, 2] : [1];
    const bx = 1130, bw = 670, g = CABLE_Y - 64, fh = 70;
    for (let i = 1; i <= 8; i++) {
      const y = g - i * fh, built = on.includes(i), yc = y + fh / 2;
      if (built) h('rect', { x: bx, y, width: bw, height: fh, fill: i === Math.max(...on) ? C.field : C.paper, stroke: C.ink, 'stroke-width': 4 }, svg);
      else h('rect', { x: bx, y, width: bw, height: fh, fill: 'none', stroke: C.muted, 'stroke-width': 3, 'stroke-dasharray': '12 9' }, svg);
      T(svg, bx + 30, yc + 12, `${i}  ${st[i - 1].name}`, { size: 36, weight: built ? 600 : 400, fill: built ? C.ink : C.muted });
      if (!built) continue;
      const lines = MEASURE[i], lh = 38, y0 = yc + 11 - (lines.length - 1) * lh / 2;
      let end = L;
      lines.forEach(([t, o], j) => { const r = T(svg, L, y0 + j * lh, t, { size: 32, fill: C.muted, ...o }); end = Math.max(end, L + textSize(t, { family: 'sans', size: 32, free: true, ...o }).w); });
      ln(svg, end + 18, yc, bx - 12, yc, { stroke: C.ink, 'stroke-width': 1.5 });
    }
    pth(svg, `M${bx - 20} ${g - 8 * fh} L${bx + bw / 2} ${g - 8 * fh - 80} L${bx + bw + 20} ${g - 8 * fh}`, { stroke: C.muted, 'stroke-width': 3, 'stroke-dasharray': '12 9' });
    cable(svg, [[-20, CABLE_Y], [1940, CABLE_Y]]);
  },
});

// 14 --------------------------------------------------------------------------
// The biggest job, drawn: a brick wall cut open with a channel. The deck's cable
// comes in from the left, lies in the open channel and runs on, hidden, under
// the plaster. That is what step 5 is.
add({
  id: 'step5', n: 14, beat: 'How to address it', builds: 3, start: '11:40',
  clicks: ['the cut channel', 'keys need step 5', 'the cost of getting it wrong'],
  title: 'The biggest job is one customer record.',
  sub: 'Step 5: 14 ways to prove who you are become 3. Measure: callers recognised without questions.',
  source: 'Deutsche Telekom, AI Investor Day, 5 Oct 2026 (14 ways, 3 planned: company figures, 3 a target); T-Mobile US, Form 10-K 2025 and 10-Q Q3 2026 (write-off in Q3 2025).',
  notes: `<p>Step five. Fourteen ways of proving who you are become three, and the customer data becomes usable. An agent can't act on an account it can't identify. This is the channel cut into the brick. It takes years, and it can fail: in the third quarter of 2025 T-Mobile wrote off two hundred seventy-eight million dollars on parts of a billing-system replacement it abandoned, about a tenth of its net income that quarter. <b>The biggest job is one customer record.</b></p>`,
  draw(page, b) {
    const svg = svgOf(page);
    frame(svg, this);
    // A strip of the same wall as slide 1 (deck-wall.png, three courses: drawing
    // rows 893-1193, the middle course centred on row 1040), with the channel cut
    // in code: straight sides, the cable laid in, the right half plastered flush.
    const k = 1.25, x = 1940 - 852 * k, y = 320, top = 885, rows = 307, cy = y + (1040 - top) * k, cut0 = x + 24, mid = 1450, hc = 22;
    art(svg, 'deck-wall.png', x, y, k, [172, top, 852, rows], 1024, 1536);
    // soften the crop at top and bottom with paper, so the strip doesn't end in a ruled edge
    [[y, 'fadeDown'], [y + rows * k - 46, 'fadeUp']].forEach(([yy, id]) => h('rect', { x, y: yy, width: 852 * k, height: 46, fill: `url(#${id})` }, svg));
    h('rect', { x: cut0, y: cy - hc, width: 1940 - cut0, height: 2 * hc, fill: C.paper }, svg);
    h('rect', { x: mid + 4, y: cy - hc + 3, width: 1940 - mid, height: 2 * hc - 4, fill: C.field }, svg);
    [cy - hc, cy + hc].forEach((yy) => ln(svg, cut0, yy, 1940, yy, { stroke: C.ink, 'stroke-width': 3 }));
    pth(svg, `M${cut0} ${cy - hc} L${cut0 - 6} ${cy - 10} L${cut0 + 3} ${cy + 2} L${cut0 - 4} ${cy + 13} L${cut0} ${cy + hc}`, { stroke: C.ink, 'stroke-width': 3 });
    ln(svg, mid, cy - hc, mid, cy + hc, { stroke: C.ink, 'stroke-width': 3 });
    cable(svg, [[-20, cy], [mid, cy]], { tw: 22, line: 3, cap: 'butt' });
    // under the plaster: hidden, so dashed
    [cy - 9.5, cy + 9.5].forEach((yy) => ln(svg, mid, yy, 1940, yy, { stroke: C.ink, 'stroke-width': 3, 'stroke-dasharray': '14 9', 'stroke-linecap': 'butt' }));
    const lead = (tx, ty, x1, y1, a, o = {}) => { const t = T(svg, tx, ty, a, { size: 34, weight: 600, fill: o.col || C.ink, anchor: o.anchor || 'start' }); const w = textSize(a, { family: 'sans', size: 34, weight: 600, free: true }).w; const [x0, y0] = o.anchor === 'end' ? [tx - w / 2, ty + 14] : [tx + w + 16, ty - 12]; ln(svg, x0, y0, x1, y1, { stroke: C.ink, 'stroke-width': 2 }); dot(svg, x1, y1, 6, { fill: C.ink }); };
    lead(L, 420, 1250, cy - 4, 'cut open: the old systems, 14 ways in');
    lead(R, 262, 1700, cy - 4, 'plastered: one record, 3 ways in', { col: C.accent, anchor: 'end' });
    if (b >= 1) T(svg, L, 850, 'Keys that change an account need step 5: an agent can’t act on an account it can’t identify.', { size: 36, weight: 600, width: 1680 });
    if (b >= 2) T(svg, L, 912, 'It can fail: in Q3 2025 T-Mobile wrote off $278 million on parts of a billing-system replacement it abandoned.', { size: 32, fill: C.muted, width: 1680 });
  },
});

// ---------------------------------------------------------------------------
// The rest of the deck, loop 3. Same grammar: solid = built or known, dashed =
// hidden, planned or unknown, green = the renovated or the current part. The
// cable rests in the bottom band on evidence slides and acts on device slides.
// ---------------------------------------------------------------------------
const band = (svg) => cable(svg, [[-20, CABLE_Y], [1940, CABLE_Y]]);
// A bar of 100 with its tens marked: the deck's one way to show a share.
function bar100(svg, x0, x1, y, hh, v, o = {}) {
  const X = (t) => x0 + (t / 100) * (x1 - x0);
  h('rect', { x: x0, y, width: X(v) - x0, height: hh, fill: o.fill || C.field }, svg);
  rc(svg, x0, y, x1 - x0, hh);
  for (let t = 10; t < 100; t += 10) ln(svg, X(t), y + hh - 12, X(t), y + hh, { stroke: C.mid, 'stroke-width': 2 });
  ln(svg, X(v), y, X(v), y + hh, { stroke: o.col || C.accent, 'stroke-width': 4 });
  return X;
}
// The drawn key (1536 x 1024, ink x 103-1433, y 283-755): a permission.
function key(svg, x, yBase, k) {
  img(svg, 'deck-key.png', x - 103 * k, yBase - 755 * k, 1536 * k, 1024 * k, { filter: 'url(#ink)' });
  return (1433 - 103) * k;
}
// The plug in a socket set into the wall: the closing picture (slides 16, end).
function pluggedIn(svg, cy = 740) {
  const wk = 1180 / 1536, wx = 1500 - 173 * wk;
  h('rect', { x: 1488, y: cy - 110, width: 150, height: 220, rx: 22, fill: C.field }, svg);
  img(svg, 'deck-wall.png', wx, cy - 1028 * wk, 1024 * wk, 1536 * wk);
  const k = 0.5, gx = 1497 - (1062 - 520) * k;
  cable(svg, [[-30, CABLE_Y], [700, CABLE_Y], [gx - 140, cy], [gx + 3, cy]], { r: 220 });
  art(svg, 'deck-plug.png', gx, cy - 232 * k, k, [520, 280, 542, 470]);   // the pins are inside the socket
  // the socket plate on the wall face, seen edge on; the pins disappear into it
  h('rect', { x: 1497, y: cy - 100, width: 24, height: 200, rx: 10, fill: 'none', stroke: C.ink, 'stroke-width': 2 }, svg);
}

// 2 ---------------------------------------------------------------------------
add({
  id: 'agent', n: 2, beat: 'Why this case', builds: 2, start: '0:55',
  clicks: ['request and chatbot', 'the agent and its keys'],
  title: 'An agent doesn’t just answer. It acts.',
  sub: 'In this course’s terms: a transformation, not a change.',
  notes: `<p>Two reasons for this case: both sides publish numbers, and this software does something a chatbot doesn't. A customer writes, "Please move me to a cheaper tariff." A chatbot answers, "Here's how." An agent just does it. For that it needs keys: permission to see and change your account. In this course's terms, a transformation, not a change. <b>An agent doesn't just answer. It acts.</b></p>`,
  draw(page, b) {
    const svg = svgOf(page);
    frame(svg, this);
    T(svg, L, 300, 'A customer writes:', { size: 34, fill: C.muted });
    T(svg, L, 370, '“Please move me to a cheaper tariff.”', { family: 'serif', size: 60 });
    ln(svg, L, 440, R, 440, { stroke: C.hair, 'stroke-width': 2 });
    T(svg, L, 530, 'A chatbot', { size: 44, weight: 600 });
    T(svg, 540, 530, 'answers: “Here’s how.”', { size: 44, fill: C.muted });
    T(svg, 540, 580, 'The customer still does it.', { size: 34, fill: C.muted });
    if (b >= 1) {
      T(svg, L, 680, 'An agent', { size: 44, weight: 600 });
      T(svg, 540, 680, 'does it: the tariff in the account changes.', { size: 44 });
      T(svg, 540, 728, 'For that it needs keys, permissions given by the company:', { size: 34, fill: C.muted });
      const w = key(svg, 540, 832, 0.17);
      T(svg, 540 + w + 30, 818, 'a key to see the account', { size: 38 });
      key(svg, 540, 930, 0.17);
      T(svg, 540 + w + 30, 916, 'a key to change it', { size: 38, weight: 600, fill: C.accent });
    }
    band(svg);
  },
});

// 4 ---------------------------------------------------------------------------
// Two measured columns and, between them, a dashed field: nothing published.
add({
  id: 'contacts', n: 4, beat: 'The American result', builds: 2, start: '2:45',
  clicks: ['7.0, 3.1, nothing in between', 'September 2024'],
  title: 'Nobody outside can tell how much was the agents.',
  source: 'T-Mobile US, AI Investor Day deck (contacts per account, Q4 2021 and Q2 2026; T-Mobile reports the fall as 55%); T-Mobile US, press release, 18 Sep 2024. Company figures.',
  notes: `<p>The second number: at the end of 2021 a customer account got in touch about seven times a year. By the middle of this year, about three. Less than half. But the agents were only announced in September 2024, and nothing in between is published. <b>Nobody outside can tell how much was the agents.</b></p>`,
  draw(page, b, data) {
    const svg = svgOf(page);
    frame(svg, this);
    const B = data.numbers.plateB, [p0, p1] = B.points;
    const q0 = 2021 * 4 + 3, q1 = 2026 * 4 + 1, ax0 = 360, ax1 = 1600, ay = 830, u = 64;
    const X = (y, q) => ax0 + ((y * 4 + q - 1) - q0) / (q1 - q0) * (ax1 - ax0);
    T(svg, L, 270, 'Contacts per customer account in a year, T-Mobile', { size: 36, weight: 600 });
    ln(svg, ax0 - 60, ay, ax1 + 80, ay, { stroke: C.ink, 'stroke-width': 3 });
    for (let y = 2022; y <= 2026; y++) { const x = X(y, 1); ln(svg, x, ay, x, ay + 14, { stroke: C.ink, 'stroke-width': 2 }); T(svg, x, ay + 52, String(y), { size: 32, fill: C.muted, anchor: 'middle' }); }
    const col = (p, fill, stroke) => {
      const x = X(p.year, p.quarter), top = ay - p.value * u;
      h('rect', { x: x - 40, y: top, width: 80, height: ay - top, fill, stroke, 'stroke-width': 3 }, svg);
      for (let i = 1; i < p.value; i++) ln(svg, x - 40, ay - i * u, x - 28, ay - i * u, { stroke, 'stroke-width': 2 });
      return { x, top };
    };
    const a = col(p0, C.faint, C.ink), z = col(p1, C.field, C.accent);
    T(svg, a.x, a.top - 24, '7.0', { size: 64, weight: 600, anchor: 'middle' });
    T(svg, a.x + 60, a.top + 40, 'end of 2021', { size: 32, fill: C.muted });
    T(svg, z.x, z.top - 70, '3.1', { size: 64, weight: 600, fill: C.accent, anchor: 'middle' });
    T(svg, R, z.top - 22, 'mid-2026, less than half', { size: 32, weight: 600, fill: C.accent, anchor: 'end' });
    const xe = X(2024, 3) + 20;
    {
      h('rect', { x: a.x + 70, y: z.top + 10, width: z.x - a.x - 140, height: ay - z.top - 16, fill: 'url(#gap)', opacity: 0.35 }, svg);
      rc(svg, a.x + 70, z.top + 10, z.x - a.x - 140, ay - z.top - 16, { stroke: C.muted, 'stroke-width': 3, 'stroke-dasharray': '14 10' });
      T(svg, (a.x + xe) / 2 + 20, ay - 70, 'nothing published in between', { size: 34, weight: 600, fill: C.muted, anchor: 'middle' });
    }
    if (b >= 1) {
      ln(svg, xe, a.top - 10, xe, ay, { stroke: C.ink, 'stroke-width': 4 });
      T(svg, xe + 18, a.top + 20, 'agents announced,', { size: 34, weight: 600 });
      T(svg, xe + 18, a.top + 62, 'September 2024', { size: 34, weight: 600 });
    }
    band(svg);
  },
});

// 6 ---------------------------------------------------------------------------
// Before: other people's systems, dashed. Now: one system, solid, and the
// agents' cable plugged into it from below. Then the share it reached.
add({
  id: 'rebuilt', n: 6, beat: 'What T-Mobile actually did', builds: 3, start: '4:40',
  clicks: ['before and now', 'the agents plugged in', '78%'],
  title: 'T-Mobile rebuilt alongside its agents.',
  source: "Deutsche Telekom, AI Investor Day transcript, 5 Oct 2026 (T-Mobile's head of IT); T-Mobile US, AI Investor Day deck; Form 10-K 2025. Share of chats: company figure.",
  notes: `<p>T-Mobile didn't just repaint. Their head of IT described it to investors. Before, outside contractors worked on other companies' systems. Now T-Mobile's own engineers work on T-Mobile's own systems. They built one system that knows each customer, and the agents read from it. On that base, almost eight in ten chats never reached a person. A real result. <b>T-Mobile rebuilt alongside its agents.</b></p>`,
  draw(page, b, data) {
    const svg = svgOf(page);
    frame(svg, this);
    const R6 = data.rewire.us;
    T(svg, L, 290, 'Before', { size: 40, weight: 600, fill: C.muted });
    T(svg, L, 336, 'outside contractors on suppliers’ systems', { size: 32, fill: C.muted });
    [[0, 0], [190, 30], [380, -6], [570, 22]].forEach(([dx, dy]) => rc(svg, L + dx, 380 + dy, 160, 100, { stroke: C.muted, 'stroke-width': 3 }));
    T(svg, L, 560, 'separate systems, worked on by others', { size: 32, fill: C.muted });
    const x = 1000, bx = 1400;
    T(svg, x, 290, 'Now', { size: 40, weight: 600 });
    T(svg, x, 336, 'its own engineers on its own systems', { size: 32 });
    h('rect', { x, y: 380, width: 800, height: 130, fill: C.paper, stroke: C.ink, 'stroke-width': 5 }, svg);
    T(svg, x + 400, 458, 'one system that knows each customer', { size: 38, weight: 600, anchor: 'middle' });
    if (b >= 1) {
      const k = 0.22, gy = 512 + (1308 - 520) * k;
      cable(svg, [[-20, CABLE_Y], [bx, CABLE_Y], [bx, gy - 2]], { r: 90, tw: 20 });
      plug(svg, bx, gy, k, -90);
      T(svg, bx + 70, 640, 'the agents read from it', { size: 34 });
    } else band(svg);
    if (b >= 2) {
      const v = R6.points[1].value, was = R6.points[0].value, x0 = 380, x1 = 1220, y = 760;
      T(svg, x0, 720, 'chats that never reached a person, mid-2026', { size: 36, weight: 600 });
      const X = bar100(svg, x0, x1, y, 56, v);
      T(svg, x0 - 30, y + 54, `${v}%`, { size: 80, weight: 600, fill: C.accent, anchor: 'end' });
      ln(svg, X(was), y - 14, X(was), y + 70, { stroke: C.ink, 'stroke-width': 3, 'stroke-dasharray': '8 6' });
      T(svg, X(was), y + 104, 'mid-2024: about a quarter', { size: 32, fill: C.muted, anchor: 'middle' });
      T(svg, x0, 920, 'Company figure. Not reaching a person isn’t the same as resolved.', { size: 32, fill: C.muted });
    }
  },
});

// 8 ---------------------------------------------------------------------------
add({
  id: 'walkback', n: 8, beat: 'Repainting, twice', builds: 2, start: '5:45',
  clicks: ['Klarna', 'Commonwealth Bank, about a month later'],
  title: 'Both had to walk it back.',
  source: 'Klarna, press release, 27 Feb 2024 (700: company estimate); Entrepreneur, 9 May 2025; Information Age, Aug 2025 (Commonwealth Bank).',
  notes: `<p>From the street, repainting looks the same for a while, and it's cheaper. But if nothing changes behind the agent, the saving usually comes from the staff. In February 2024 Klarna had stopped hiring and said its assistant did the work of seven hundred service agents, by its own estimate. In 2025 it was hiring people again. Commonwealth Bank went the same way faster: forty-five roles declared redundant for a voice bot, the decision withdrawn within weeks. <b>Both had to walk it back.</b></p>`,
  draw(page, b, data) {
    const svg = svgOf(page);
    frame(svg, this);
    const ax0 = 640, ax1 = 1800, ay = 830;
    const M = (s) => { const [y, m] = s.split('-').map(Number); return ax0 + ((y - 2024) * 12 + (m - 1) + 0.5) / 24 * (ax1 - ax0); };
    ln(svg, ax0, ay, ax1, ay, { stroke: C.ink, 'stroke-width': 3 });
    for (let k = 0; k <= 24; k += 3) { const x = ax0 + k / 24 * (ax1 - ax0); ln(svg, x, ay, x, ay + (k % 12 ? 8 : 18), { stroke: C.ink, 'stroke-width': 2 }); }
    [2024, 2025].forEach((yy) => T(svg, ax0 + (yy - 2024) * (ax1 - ax0) / 2 + 8, ay + 54, String(yy), { size: 34, fill: C.muted }));
    const lane = (c, y, name, gap) => {
      const x0 = M(c.cut.month), x1 = M(c.back.month);
      T(svg, L, y + 14, name, { size: 42, weight: 600 });
      T(svg, L, y + 62, gap, { size: 34, fill: C.muted });
      ln(svg, x0, y, x1, y, { stroke: C.ink, 'stroke-width': 6 });
      dot(svg, x0, y, 16, { fill: C.ink });
      dot(svg, x1, y, 16, { fill: C.paper, stroke: C.ink, 'stroke-width': 5 });
      [x0, x1].forEach((xx) => ln(svg, xx, y + 18, xx, ay, { stroke: C.hair, 'stroke-width': 2, 'stroke-dasharray': '6 6' }));
      return { x0, x1 };
    };
    const [kl, cba] = data.repaint.cases;
    const a = lane(kl, 430, 'Klarna', 'after 15 months');
    T(svg, a.x0 - 16, 386, 'Feb 2024: the work of 700 agents, by Klarna’s estimate', { size: 36 });
    T(svg, a.x1 + 16, 494, 'May 2025: hiring again', { size: 36, anchor: 'end' });
    if (b >= 1) {
      const c = lane(cba, 660, 'Commonwealth Bank', 'after about a month');
      T(svg, c.x1 + 16, 616, 'Jul 2025: 45 roles redundant for a voice bot', { size: 36, anchor: 'end' });
      T(svg, c.x0 - 30, 724, 'Aug 2025: withdrawn, “did not adequately consider…”', { size: 36, anchor: 'end' });
    }
    band(svg);
  },
});

// 9 ---------------------------------------------------------------------------
add({
  id: 'staff', n: 9, beat: 'First brick: the staff', builds: 1, start: '6:40',
  clicks: ['no dismissals to 2028; about 4,000 a year'],
  title: 'First brick: the staff stay.',
  source: 'Deutsche Telekom and ver.di, agreement of May 2026 (about 60,000 employees under its collective agreements); Deutsche Telekom, HR Factbook 2025, company figures (totals added by me).',
  notes: `<p>The harder question is what the wall looks like in Germany. Three bricks matter. The first is the staff. This May, Telekom and ver.di agreed: no dismissals for business reasons until the end of 2028. People still go by agreed routes: partial retirement, early retirement, severance. From 2021 to 2025 that was about four thousand full-time positions a year, across Telekom in Germany. Sixteen every working day. Any saving has to fit into that. I think that helps more than it hurts: the people who stay are the first ones to train. <b>First brick: the staff stay.</b></p>`,
  draw(page, b, data) {
    const svg = svgOf(page);
    frame(svg, this);
    const E = data.exits;
    T(svg, L, 290, 'No dismissals for business reasons until 31 December 2028', { size: 44, weight: 600 });
    T(svg, L, 338, 'Telekom and ver.di, May 2026; about 60,000 employees under its collective agreements', { size: 32, fill: C.muted });
    {
      ln(svg, L, 386, R, 386, { stroke: C.hair, 'stroke-width': 2 });
      T(svg, L, 450, 'Still, positions leave Telekom in Germany by agreed routes', { size: 36, weight: 600 });
      const base = 880, k = 0.075, x0 = 760, pitch = 210, bw = 120, Y = (v) => base - v * k;
      E.years.forEach((yr, i) => {
        const v = E.totals.values[i], x = x0 + i * pitch;
        h('rect', { x, y: Y(v), width: bw, height: v * k, fill: C.paper, stroke: C.ink, 'stroke-width': 3 }, svg);
        T(svg, x + bw / 2, Y(v) + 52, v.toLocaleString('en-US'), { size: 32, fill: C.muted, anchor: 'middle' });
        T(svg, x + bw / 2, base + 44, String(yr), { size: 32, fill: C.muted, anchor: 'middle' });
      });
      ln(svg, x0 - 40, base, x0 + 4 * pitch + bw + 40, base, { stroke: C.ink, 'stroke-width': 3 });
      ln(svg, x0 - 40, Y(4000), x0 + 4 * pitch + bw + 40, Y(4000), { stroke: C.accent, 'stroke-width': 3, 'stroke-dasharray': '14 9' });
      T(svg, L, 574, 'about', { size: 40, fill: C.accent, weight: 600 });
      T(svg, L, 726, '4,000', { size: 130, weight: 600, fill: C.accent });
      T(svg, L, 790, 'a year, 2021 to 2025', { size: 36, fill: C.accent, weight: 600 });
      T(svg, L, 838, '20,223 in five years;', { size: 32, fill: C.muted });
      T(svg, L, 878, 'full-time positions', { size: 32, fill: C.muted });
    }
    band(svg);
  },
});

// 10 --------------------------------------------------------------------------
add({
  id: 'monitoring', n: 10, beat: 'Second brick: the checks', builds: 1, start: '7:45',
  clicks: ['79%'],
  title: 'Nearly four in five Germans see monitoring at work as bad.',
  source: 'European Commission, Special Eurobarometer 554, Artificial Intelligence and the future of work (asked in the EU only).',
  notes: `<p>The second brick starts with a worry. The EU asked people about digital monitoring at work. In Germany nearly four in five see it as a bad thing. On AI and jobs, Germans are no more pessimistic than Americans; on monitoring at work they are. Any new system here has to answer that first. <b>Nearly four in five Germans see monitoring at work as bad.</b></p>`,
  draw(page, b, data) {
    const svg = svgOf(page);
    frame(svg, this);
    const v = data.attitudes.panels.find((p) => p.standsOut).rows[0].value;
    T(svg, L, 330, 'Digital monitoring of workers, Germany: seen as negative', { size: 36, weight: 600 });
    const x0 = L, x1 = R, y = 470, X = bar100(svg, x0, x1, y, 90, v);
    dim(svg, x0, X(v), y + 150, { ext: [y + 90, y + 170], col: C.accent, w: 4 });
    T(svg, X(v) - 20, y + 300, `${v}%`, { size: 150, weight: 600, fill: C.accent, anchor: 'end' });
    ln(svg, X(80), y - 40, X(80), y + 90, { stroke: C.ink, 'stroke-width': 3, 'stroke-dasharray': '8 6' });
    T(svg, X(80) - 14, y - 22, 'Sweden 80%, the only higher one in the EU', { size: 32, fill: C.muted, anchor: 'end' });
    T(svg, L, y + 240, 'On AI and jobs, Germans are no more', { size: 34 });
    T(svg, L, y + 284, 'pessimistic than Americans.', { size: 34 });
    band(svg);
  },
});

// 11 --------------------------------------------------------------------------
add({
  id: 'checks', n: 11, beat: 'Second brick: the checks', builds: 3, start: '8:10',
  clicks: ['United States', 'Germany: the two rules', 'since 2021'],
  title: 'Second brick: here the checks come first.',
  source: 'BetrVG § 87(1) no. 6; AI Act Art. 50 (Regulation (EU) 2024/1689, as amended by 2026/1744); Telekom group framework agreement on IT systems, March 2021 (Bargmann 2022); T-Mobile US, press release, Sep 2024. Lengths schematic, not measured.',
  notes: `<p>German law makes it answer before launch. At T-Mobile I found no say for the staff before launch. Here, two rules matter most. One: a system that can watch the staff needs the works council to agree before it runs. Two: since August, the AI Act says customers must be told when they talk to an AI system. And here Telekom is ahead. In 2021 it agreed the rules with its works council once: nobody gets watched as a person, and results are only looked at in groups of more than five, without names. A system inside those rules needs no new decision. <b>Second brick: here the checks come first.</b></p>`,
  draw(page, b, data) {
    const svg = svgOf(page);
    frame(svg, this);
    const S = data.permits.schedule;
    const x0 = 560, x1 = 1800, X = (u) => x0 + u / S.span * (x1 - x0);
    const lane = (y, label, sub, segs) => {
      T(svg, L, y + 12, label, { size: 40, weight: 600 });
      if (sub) T(svg, L, y + 56, sub, { size: 32, fill: C.muted });
      segs.forEach(([a, z, kind, word]) => {
        const st = kind === 'review' ? { fill: C.field, stroke: C.accent, 'stroke-width': 3 } : kind === 'build' ? { fill: C.paper, stroke: C.ink, 'stroke-width': 4 } : { fill: 'none', stroke: C.mid, 'stroke-width': 2 };
        h('rect', { x: X(a), y: y - 32, width: X(z) - X(a) - 8, height: 64, ...st }, svg);
        T(svg, X(a) + 16, y + 12, word, { size: 34, fill: kind === 'launch' ? C.muted : C.ink, weight: kind === 'review' ? 600 : 400 });
      });
    };
    lane(330, 'United States', 'T-Mobile', [[0, S.us.build[1], 'build', 'build'], [S.us.launch[0], S.us.launch[1], 'launch', 'running']]);
    S.us.checks.forEach((u) => dot(svg, X(u), 394, 9, { fill: C.ink }));
    T(svg, R, 440, 'no staff say before launch found; checks come later', { size: 32, fill: C.muted, anchor: 'end' });
    if (b >= 1) {
      lane(550, 'Germany', 'Telekom', [[S.de.review[0], S.de.review[1], 'review', 'checks first'], [S.de.build[0], S.de.build[1], 'build', 'build'], [S.de.launch[0], S.de.launch[1], 'launch', 'running']]);
      T(svg, X(0), 636, '1  works council agrees before it runs (§ 87(1) no. 6)', { size: 34 });
      T(svg, X(0), 680, '2  customers told they talk to an AI system (AI Act Art. 50, since Aug 2026)', { size: 34 });
    }
    if (b >= 2) {
      const F = S.de.framework;
      lane(800, 'Since 2021', 'framework agreement', [[F.review[0], F.review[1], 'review', 'short check'], [F.build[0], F.build[1], 'build', 'build'], [F.launch[0], F.launch[1], 'launch', 'running']]);
      T(svg, X(0), 886, 'nobody watched as a person; results only for groups of more than five', { size: 32, fill: C.muted });
    }
    band(svg);
  },
});

// 12 --------------------------------------------------------------------------
add({
  id: 'knowhow', n: 12, beat: 'Third brick: know-how', builds: 2, start: '9:35',
  clicks: ['missing knowledge', 'law, data protection'],
  title: 'Third brick: missing knowledge first. The law after.',
  source: 'Federal Statistical Office (Destatis), 2025: firms with ten or more employees that considered AI and do not use it; several answers possible.',
  notes: `<p>The third brick is know-how. Destatis went to the firms that had looked at these tools and didn't use them, and asked: why not? More than seven in ten said they were missing the knowledge. Legal uncertainty and data protection came after, each about six in ten. Without your own people who understand your systems, you can buy a language model. You can screw it onto the wall. You can't cut it in. <b>Third brick: missing knowledge first. The law after.</b></p>`,
  draw(page, b, data) {
    const svg = svgOf(page);
    frame(svg, this);
    const rows = data.obstacles.rows.slice(0, 3);
    T(svg, L, 300, 'Why firms in Germany that considered these tools don’t use them', { size: 36, weight: 600 });
    T(svg, L, 344, 'firms with ten or more employees; several answers possible', { size: 32, fill: C.muted });
    rows.forEach((r, i) => {
      if (i > 0 && b < 1) return;
      const y = 440 + i * 130, first = i === 0;
      T(svg, L, y + 42, r.label, { size: 38, weight: first ? 600 : 400, fill: first ? C.accent : C.ink, width: 600 });
      bar100(svg, 800, 1600, y, 60, r.value, { fill: first ? C.field : C.faint, col: first ? C.accent : C.ink });
      T(svg, R, y + 50, `${r.value}%`, { size: first ? 64 : 48, weight: 600, fill: first ? C.accent : C.ink, anchor: 'end' });
    });
    if (b >= 1) T(svg, L, 890, 'You can buy a language model and screw it onto the wall. Without your own people, you can’t cut it in.', { family: 'serif', italic: true, size: 38, width: 1680 });
    band(svg);
  },
});

// 15 --------------------------------------------------------------------------
// The building again, five floors built, then the keys: one drawn key per
// stage, in the order they are handed over.
add({
  id: 'steps68', n: 15, beat: 'How to address it', builds: 3, start: '12:20',
  clicks: ['step 6: keys in stages', 'steps 7 and 8', 'process model'],
  title: 'Then the keys: read first, risky changes last.',
  sub: 'Reading doesn’t have to wait for step 5. The order is my hypothesis.',
  source: 'Every new key: an annex to the works agreement (step 7).',
  notes: `<p>But reading doesn't have to wait. Step six: first the agent only reads, for customers already logged in: show a bill, check an order. Then actions you can undo. Last, the changes a fraudster could use, like a new bank account; the customer confirms those in the app. Each key is enforced by the systems, not by the model: the model can ask, the system decides. Steps seven and eight: each new key is an annex to the works agreement, staff and works council sign off before the agent works alone, and a named team runs it. As a process model, it's a project life cycle with a works-council gate and a stop point added. The order is my hypothesis. <b>Then the keys: read first, risky changes last.</b></p>`,
  draw(page, b, data) {
    const svg = svgOf(page);
    frame(svg, this);
    const st = data.plan.steps, top = 6;
    const bx = 1250, bw = 550, g = CABLE_Y - 64, fh = 70;
    for (let i = 1; i <= 8; i++) {
      const y = g - i * fh, built = i <= top;
      if (built) h('rect', { x: bx, y, width: bw, height: fh, fill: i === top ? C.field : C.paper, stroke: C.ink, 'stroke-width': 4 }, svg);
      else h('rect', { x: bx, y, width: bw, height: fh, fill: 'none', stroke: C.muted, 'stroke-width': 3, 'stroke-dasharray': '12 9' }, svg);
      T(svg, bx + 26, y + fh / 2 + 12, `${i}  ${st[i - 1].name}`, { size: 34, weight: built && i >= 6 ? 600 : 400, fill: built ? C.ink : C.muted });
    }
    pth(svg, `M${bx - 20} ${g - 8 * fh} L${bx + bw / 2} ${g - 8 * fh - 70} L${bx + bw + 20} ${g - 8 * fh}`, { stroke: C.muted, 'stroke-width': 3, 'stroke-dasharray': '12 9' });
    T(svg, L, 330, 'Step 6, permissions in stages: the keys', { size: 38, weight: 600 });
    const stages = [['read', 'logged-in customers: a bill, an order'], ['undoable', 'actions that can be undone'], ['fraud-prone', 'confirmed by the customer in the app']];
    stages.forEach(([w, d], i) => {
      const y = 430 + i * 100;
      key(svg, L, y + 8, 0.12);
      T(svg, L + 190, y, w, { size: 40, weight: 600, fill: i === 0 ? C.accent : C.ink });
      T(svg, L + 450, y, d, { size: 32, fill: C.muted });
    });
    T(svg, L, 720, 'The model can ask; the system decides.', { size: 36, weight: 600 });
    if (b >= 1) {
      T(svg, L, 790, '7  staff and works council sign off before it works alone', { size: 32 });
      T(svg, L, 832, '8  a named team runs it; cost per finished request', { size: 32 });
    }
    if (b >= 2) T(svg, L, 878, 'Process model: a life cycle with a works-council gate and a stop point.', { size: 32, weight: 600, width: 1100, lh: 38 });
    band(svg);
  },
});

// 16 --------------------------------------------------------------------------
// Three ways to be wrong, then the closing picture: the plug finally in.
add({
  id: 'close', n: 16, beat: 'Where this could be wrong', builds: 4, start: '13:40',
  clicks: ['first', 'second', 'third', 'the plug in, the closing line'],
  landings: { 2: 'Three things would prove me wrong.', 3: "Telekom can't import the 32%. It can copy the slow work behind it." },
  title: 'Three things would prove me wrong.',
  notes: `<p>If Telekom reports a German number like the thirty-two percent before its customer data is fixed, the record matters less than I think. If the service teams shrink faster than the agreed routes allow, the staff are leaving after all. If a works agreement comes months late, the law weighs more than I said. <b>Three things would prove me wrong.</b></p><p>(last build) People often say Germany is slow, and mean it as a weakness. Hall and Soskice argue the other way: economies like Germany's are better at step-by-step innovation than at radical innovation. Renovating is step-by-step work. <b>Telekom can't import the 32%. It can copy the slow work behind it.</b> Thank you.</p>`,
  draw(page, b) {
    const svg = svgOf(page);
    if (b < 3) {
      frame(svg, this);
      const items = [
        ['Telekom reports a German number like the 32%', 'before its customer data is fixed: the record matters less'],
        ['The service teams shrink faster', 'than the agreed routes allow: the staff are leaving after all'],
        ['A works agreement comes months late', 'the law weighs more than I said'],
      ];
      items.forEach(([a, z], i) => {
        const y = 360 + i * 180, on = i <= b;
        if (!on) return;
        rc(svg, L, y - 46, 64, 64, { stroke: on ? C.ink : C.mid, 'stroke-width': 3, ...(on ? {} : { 'stroke-dasharray': '8 6' }) });
        T(svg, L + 32, y + 2, String(i + 1), { size: 40, weight: 600, anchor: 'middle', fill: on ? C.ink : C.mid });
        if (!on) return;
        T(svg, L + 110, y, a, { size: 46, weight: 600 });
        T(svg, L + 110, y + 54, z, { size: 36, fill: C.muted });
      });
      band(svg);
      return;
    }
    pluggedIn(svg);
    T(svg, L, 330, 'Telekom can’t import the 32%.', { family: 'serif', size: 72, weight: 500, width: 1500, lh: 86 });
    T(svg, L, 446, 'It can copy the slow work behind it.', { family: 'serif', size: 72, weight: 500, width: 1500, lh: 86, fill: C.accent });
    T(svg, L, 560, 'Hall and Soskice: coordinated economies like Germany’s are better at incremental innovation. Renovating is incremental work.', { size: 32, fill: C.muted, width: 1100 });
  },
});

// End ---------------------------------------------------------------------------
add({
  id: 'end', end: true, builds: 1, clicks: ['questions'],
  notes: '<p>Questions. The backups follow; their page numbers are on the cue sheet.</p>',
  draw(page) {
    const svg = svgOf(page);
    pluggedIn(svg);
    T(svg, L, 220, 'Innovation Management for AI', { size: 34, weight: 500, fill: C.muted });
    T(svg, L, 340, 'Renovate, don’t repaint', { family: 'serif', size: 96, weight: 500 });
    T(svg, L, 460, 'Thank you. Questions?', { size: 56, weight: 600 });
    T(svg, L, 580, 'The article, with every source:', { size: 32, fill: C.muted });
    T(svg, L, 626, 'thd-ai.github.io/ws27-papers/renovate', { size: 36 });
    T(svg, L, 826, 'Alexander Rudaev', { size: 34, weight: 600 });
    T(svg, L, 872, 'TH Deggendorf, 12 December 2026', { size: 32, fill: C.muted });
  },
});

// Backups -----------------------------------------------------------------------
add({
  id: 'b1', backup: 'B1', n: 'B1', beat: 'Backup', builds: 1, clicks: ['table'], title: 'The ten pairs: none compares fully.',
  source: 'Sources per row in the article, appendix. Company figures; targets and outlooks marked.',
  notes: '<p>Q3: why not compare the numbers directly?</p>',
  draw(page, b, data) {
    const svg = svgOf(page);
    frame(svg, this);
    const cx = [L, L + 420, L + 680, L + 960], y0 = 260;
    ['What is counted', 'T-Mobile US', 'Telekom, Germany', 'Why they do not compare'].forEach((t, i) => T(svg, cx[i], y0, t, { size: 26, weight: 600, fill: C.muted }));
    ln(svg, L, y0 + 18, R, y0 + 18, { stroke: C.ink, 'stroke-width': 2 });
    const what = { 'Share handled by AI': 'Share started by an AI agent' };
    data.pairs.rows.forEach((r, i) => {
      const y = y0 + 64 + i * 66;
      T(svg, cx[0], y, `${r.n}. ${what[r.what] || r.what}`, { size: 26, weight: 600, width: 400 });
      T(svg, cx[1], y, (r.us.show || r.us.absent || '').replace(/\[\[|\]\]/g, ''), { size: 26, width: 250 });
      const tag = r.de.status === 'target' ? ' (target)' : r.de.status === 'ahead' ? ' (outlook)' : '';
      T(svg, cx[2], y, (r.de.show || r.de.absent || '').replace(/\[\[|\]\]/g, '') + tag, { size: 26, width: 270 });
      T(svg, cx[3], y, r.why, { size: 24, fill: C.muted, width: 840 });
      ln(svg, L, y + 26, R, y + 26, { stroke: C.hair, 'stroke-width': 1.5 });
    });
  },
});

add({
  id: 'b2', backup: 'B2', n: 'B2', beat: 'Backup', builds: 1, clicks: ['table'], title: 'Which rule bites, and when.',
  source: 'BetrVG §§ 76, 87, 90; GDPR Art. 35; AI Act (Regulation (EU) 2024/1689) as amended by Regulation (EU) 2026/1744.',
  notes: '<p>Q8–Q11: the law in detail.</p>',
  draw(page) {
    const svg = svgOf(page);
    frame(svg, this);
    [
      ['BetrVG § 90', 'the works council is told while the system is planned'],
      ['BetrVG § 87(1) no. 6', 'its agreement for any system suited to monitoring staff; if none, the conciliation board decides (§ 87(2), § 76)'],
      ['GDPR Art. 35', 'a data protection impact assessment before risky processing'],
      ['AI Act Art. 50', 'customers told they talk to an AI system, since 2 August 2026'],
      ['AI Act, high risk', 'a tool that monitors or evaluates employees can count as high risk; those duties from 2 December 2027'],
    ].forEach(([a, z], i) => {
      const y = 320 + i * 124;
      T(svg, L, y, a, { size: 38, weight: 600 });
      T(svg, L + 520, y, z, { size: 32, width: 1160, lh: 40 });
    });
  },
});

add({
  id: 'b3', backup: 'B3', n: 'B3', beat: 'Backup', builds: 1, clicks: ['list'], title: 'Keys enforced by the systems, not the model.',
  notes: '<p>Q12, Q13: prompt injection, fraud.</p>',
  draw(page) {
    const svg = svgOf(page);
    frame(svg, this);
    [
      ['read → undoable → fraud-prone', 'keys handed over in that order, each stage measured'],
      ['The model can ask, the system decides', 'permissions checked by the systems the agent calls'],
      ['A test set with hidden instructions', 'before each new key goes live'],
      ['Confirmation in the app', 'for changes a fraudster could use, like a new bank account'],
    ].forEach(([a, z], i) => {
      const y = 330 + i * 140;
      key(svg, L, y + 4, 0.09);
      T(svg, L + 160, y, a, { size: 42, weight: 600 });
      T(svg, L + 160, y + 50, z, { size: 32, fill: C.muted });
    });
  },
});

add({
  id: 'b4', backup: 'B4', n: 'B4', beat: 'Backup', builds: 1, clicks: ['bars'], title: 'On AI and jobs, not more hostile. On monitoring, yes.',
  source: 'Ipsos for Google 2025 and Ipsos AI Monitor 2025, in Stanford HAI AI Index 2026; Special Eurobarometer 554 (EU only).',
  notes: '<p>Q16: are Germans just against AI?</p>',
  draw(page, b, data) {
    const svg = svgOf(page);
    frame(svg, this);
    const ys = [330, 560, 790];
    data.attitudes.panels.forEach((p, i) => {
      const y = ys[i];
      T(svg, L, y, p.question.replace(/[“”]/g, '"'), { size: 32, weight: 600 });
      p.rows.forEach((r, k) => {
        const yy = y + 30 + k * 64;
        T(svg, L, yy + 34, r.country, { size: 30, fill: C.muted });
        bar100(svg, 460, 1600, yy, 44, r.value, { fill: p.standsOut ? C.field : C.faint, col: p.standsOut ? C.accent : C.ink });
        T(svg, R, yy + 38, `${r.value}%`, { size: 34, weight: 600, anchor: 'end' });
      });
    });
  },
});

const SOURCES = [
  ['Deutsche Telekom, 2026', 'press release, 5 Oct; AI Investor Day slides and transcript'],
  ['T-Mobile US, 2026', 'AI Investor Day deck; Form 10-Q, Q3'],
  ['T-Mobile US, 2024–25', 'release with OpenAI, 18 Sep 2024; Form 10-K 2025'],
  ['NAHB, 2026', 'wood framing in new single-family homes'],
  ['Destatis, 2021', 'building approvals 2020 by main material'],
  ['DIN 18015-3', 'installation zones for cables (Baunetz Wissen)'],
  ['Klarna, 2024', 'press release on the assistant, 27 Feb'],
  ['Entrepreneur, 2025', 'Klarna hires service agents again, 9 May'],
  ['Information Age, 2025', 'Commonwealth Bank reverses job cuts'],
  ['Deutsche Telekom, 2025', 'HR Factbook: staff reduction by agreed routes'],
  ['Telekom and ver.di, 2026', 'collective agreement; DGB summary'],
  ['European Commission, 2024', 'Special Eurobarometer 554, AI and work'],
  ['Stanford HAI, 2026', 'AI Index, public opinion (Ipsos surveys)'],
  ['BetrVG §§ 76, 87, 90', 'Works Constitution Act'],
  ['Bargmann, 2022', 'Telekom group framework agreement, 2021'],
  ['AI Act, 2024 and 2026', 'Regulation (EU) 2024/1689; 2026/1744'],
  ['GDPR', 'Regulation (EU) 2016/679, Art. 35'],
  ['Destatis, 2025', 'reasons firms do not use AI'],
  ['Bitkom, 2025', 'Europe’s path to digital sovereignty'],
  ['Hall and Soskice, 2001', 'Varieties of Capitalism, Oxford UP'],
];
add({
  id: 'b5', backup: 'B5', n: 'B5', beat: 'Backup', builds: 1, clicks: ['list'], title: 'Sources.',
  source: 'Full list with links: the article, thd-ai.github.io/ws27-papers/renovate (sources).',
  notes: '<p>Any "where is that from?"</p>',
  draw(page) {
    const svg = svgOf(page);
    frame(svg, this);
    SOURCES.forEach(([a, z], i) => {
      const col = i < 10 ? 0 : 1, row = i % 10, x = L + col * 860, y = 260 + row * 70;
      T(svg, x, y, a, { size: 28, weight: 600 });
      T(svg, x, y + 30, z, { size: 24, fill: C.muted });
    });
  },
});

add({
  id: 'b6', backup: 'B6', n: 'B6', beat: 'Backup', builds: 1, clicks: ['text'], title: 'How this was made.',
  notes: '<p>Q31: did you use AI?</p>',
  draw(page) {
    const svg = svgOf(page);
    frame(svg, this);
    [
      'Generative AI helped find and open sources, draft from my notes, and check every claim against its source. I decided what stays.',
      'The drawings of the wall, plug, channel and key were generated with an image model from my own line drawing and real photographs.',
      'The charts are drawn in code from the article’s data files; every number on these slides has its source on the slide and in B5.',
    ].forEach((r, i) => T(svg, L, 340 + i * 180, r, { size: 40, width: 1600, lh: 52 }));
  },
});

// The order of the talk; the file is written in the order the loops built it.
const ORDER = ['title', 'agent', 'number', 'contacts', 'walls', 'rebuilt', 'simplify', 'walkback', 'staff', 'monitoring', 'checks', 'knowhow', 'steps1', 'step5', 'steps68', 'close', 'end', 'b1', 'b2', 'b3', 'b4', 'b5', 'b6'];
SLIDES.sort((a, z) => ORDER.indexOf(a.id) - ORDER.indexOf(z.id));
