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
  h('rect', { x: cx - size / 2, y: cy - size / 2, width: size, height: size, rx: size * 0.16, ...st }, p);
  dot(p, cx, cy, size * 0.38, { ...st, fill: 'none' });
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
    bar(400, r, C.ink, C.faint, 'Telekom’s press release', 'of all contacts in the US, “handled by AI agents”', 'of 100 contacts in the US');
    if (b >= 1) bar(680, s, C.accent, C.field, 'T-Mobile’s own slide', 'of contract customers’ contacts, “served by an AI agent”', 'of 100 contract customers’ contacts');
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
    if (b >= 1) head(xs[1], 'Germany: brick', 'two in three new residential buildings');
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
  id: 'simplify', n: 7, beat: 'What T-Mobile actually did', builds: 2, start: '5:25',
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
  sub: 'Eight steps. The order is my hypothesis.',
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
    const bx = 1130, bw = 670, g = CABLE_Y - 24, fh = 72;
    for (let i = 1; i <= 8; i++) {
      const y = g - i * fh, built = on.includes(i), yc = y + fh / 2;
      if (built) h('rect', { x: bx, y, width: bw, height: fh, fill: i === Math.max(...on) ? C.field : C.paper, stroke: C.ink, 'stroke-width': 4 }, svg);
      else h('rect', { x: bx, y, width: bw, height: fh, fill: 'none', stroke: C.muted, 'stroke-width': 3, 'stroke-dasharray': '12 9' }, svg);
      T(svg, bx + 30, yc + 12, `${i}  ${st[i - 1].name}`, { size: 36, weight: built ? 600 : 400, fill: built ? C.ink : C.muted });
      if (!built) continue;
      const lines = MEASURE[i], lh = 38, y0 = yc + 11 - (lines.length - 1) * lh / 2;
      let end = L;
      lines.forEach(([t, o], j) => { const r = T(svg, L, y0 + j * lh, t, { size: 32, fill: C.muted, ...o }); end = Math.max(end, L + textSize(t, { family: 'sans', size: 32, free: true, ...o }).w); });
      ln(svg, end + 18, yc, bx - 12, yc, { stroke: C.mid, 'stroke-width': 2, 'stroke-dasharray': '3 7' });
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
    // the drawing: 1536 x 1024; its cable (a tube 27 px wide, centred on y 579.5)
    // enters at the left edge; the plaster runs from x 775 to the right edge
    const s = 0.74, x = 1920 + 40 - 1536 * s, y = 106, cy = y + 579.5 * s;
    img(svg, 'deck-chase.png', x, y, 1536 * s, 1024 * s);
    const tw = 27 * s;
    cable(svg, [[-20, cy], [x + 40, cy]], { tw, line: 2.5, cap: 'butt' });
    // under the plaster: hidden, so dashed
    [cy - tw / 2 + 1.25, cy + tw / 2 - 1.25].forEach((yy) => ln(svg, x + 790 * s, yy, 1940, yy, { stroke: C.ink, 'stroke-width': 2.5, 'stroke-dasharray': '14 9', 'stroke-linecap': 'butt' }));
    const lead = (tx, ty, x1, y1, a, col) => { T(svg, tx, ty, a, { size: 34, weight: 600, fill: col || C.ink, width: 680 }); ln(svg, tx + 640, ty - 12, x1, y1, { stroke: C.ink, 'stroke-width': 2 }); dot(svg, x1, y1, 6, { fill: C.ink }); };
    lead(L, 410, x + 400 * s, cy - 30, 'cut open: the old systems, 14 ways in');
    T(svg, R, y + 860 * s, 'plastered: one record, 3 ways in', { size: 34, weight: 600, fill: C.accent, anchor: 'end' });
    ln(svg, x + 1150 * s, y + 815 * s, x + 1150 * s, y + 600 * s, { stroke: C.ink, 'stroke-width': 2 }); dot(svg, x + 1150 * s, y + 600 * s, 6, { fill: C.ink });
    if (b >= 1) T(svg, L, 850, 'Keys that change an account need step 5: an agent can’t act on an account it can’t identify.', { size: 36, weight: 600, width: 1680 });
    if (b >= 2) T(svg, L, 912, 'It can fail: in Q3 2025 T-Mobile wrote off $278 million on parts of a billing-system replacement it abandoned.', { size: 32, fill: C.muted, width: 1680 });
  },
});
