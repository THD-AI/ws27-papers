// Loop 1 of the new deck (CONCEPT.md, "the pick"): one cable through the
// whole talk, data as an engineer's drafting marks, the claim on the page
// from the first click. Four key frames first: slides 1, 3, 5 and 13.
// Every number comes from the article's data files; sources on the page.
import { h, text, textSize } from '../../lib/fig.js';

const C = { paper: '#FBFBFC', ink: '#15171C', muted: '#5C6370', hair: '#C9CDD4', faint: '#E3E6EB', accent: '#1F7A54', field: '#CDE9D9', mid: '#8A9099' };
const L = 120, R = 1800, W = R - L;
const LINE = '#505055';   // the ink of the cable, the sockets and (through the ink filter) the drawn plug and keys
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
const ARTICLE = 'https://thd-ai.github.io/ws27-papers/renovate/';
// Text that links to the article in the HTML deck; it looks like the rest.
const toArticle = (svg) => h('a', { href: ARTICLE, target: '_blank', rel: 'noopener', class: 'to-article' }, svg);
const img = (svg, file, x, y, w, hh, o = {}) => h('image', { href: ART + file, x, y, width: w, height: hh, preserveAspectRatio: 'xMidYMid meet', ...o }, svg);
// A drawing cropped to part of its own canvas (crop = [sx, sy, sw, sh] in the
// drawing's pixels), placed with its crop's top left at x, y and scaled by k.
function art(p, file, x, y, k, crop, W = 1536, H = 1024, o = {}) {
  const [sx, sy, sw, sh] = crop;
  const v = h('svg', { x, y, width: sw * k, height: sh * k, viewBox: `${sx} ${sy} ${sw} ${sh}`, overflow: 'hidden' }, p);
  h('image', { href: ART + file, x: 0, y: 0, width: W, height: H, ...o }, v);
  return v;
}
// The plug drawn WITH its cord (deck-plug-side.png, 1536 x 1024): the cord, two
// lines 53 px apart, leaves the left edge centred on y 541; the plug's face is
// at x 1072, the pin tips at x 1294. At k = 22/53 its cord is the deck's tube.
const SIDE = { w: 1536, h: 1024, cordY: 541, cordW: 53, face: 1072, tip: 1294 };
// scaled so the drawn cord's line centres (49.5 px apart) sit on the code tube's (22 - 1.6)
const KSIDE = (22 - 1.6) / 49.5;
// x0 = where the drawing (and its cord) begins; the code cable ends there.
function plugSide(p, x0, cy, o = {}) {
  const k = KSIDE, crop = [0, 0, o.noPins ? SIDE.face - 34 : SIDE.w, SIDE.h];
  art(p, 'deck-plug-side.png', x0, cy - SIDE.cordY * k, k, crop);
  return { tip: x0 + SIDE.tip * k, face: x0 + SIDE.face * k };
}
// The same plug drawn upright (deck-plug-up.png, 1024 x 1536): pin tips at y 254,
// cord 51 px wide centred on x 502, straight down. Cropped at row 900; the code
// cable rises to meet it there.
const UP = { w: 1024, cut: 1100, cordX: 502.1, cordW: 57, pinTop: 268 };
// the drawn cord's line centres are 53.75 px apart; the code tube's are 20 - 1.6
const KUP = (20 - 1.6) / 53.75;
// tipY = where the pin tips are; returns the y where the code cable must end
// upEnd: where the drawing's cut edge is, for the cable drawn first; plugUp then
// draws the plug over the cable's last 30 px.
const upEnd = (tipY) => tipY - UP.pinTop * KUP + UP.cut * KUP;
function plugUp(p, cx, tipY) {
  const k = KUP, x = cx - UP.cordX * k, y = tipY - UP.pinTop * k;
  art(p, 'deck-plug-up.png', x, y, k, [0, 0, UP.w, UP.cut], 1024, 1536);
}
// A socket face: a plate, a round recess and its own pattern of holes. Each
// pattern is one way to prove who you are; no two alike, as no two standards are.
const HOLES = [
  [['v', -0.2, 0], ['v', 0.2, 0]],                                            // A
  [['v', -0.2, -0.08], ['v', 0.2, -0.08], ['c', 0, 0.22]],                    // B
  [['c', -0.2, 0], ['c', 0.2, 0]],                                            // C
  [['c', -0.22, 0.12], ['c', 0.22, 0.12], ['c', 0, -0.2]],                    // D
  [['c', -0.22, 0], ['c', 0.22, 0], ['c', 0, -0.25]],                         // E
  [['c', -0.22, 0], ['c', 0.22, 0], ['h', 0, -0.33], ['h', 0, 0.33]],         // F
  [['h', -0.18, 0.14], ['h', 0.18, 0.14], ['v', 0, -0.17]],                   // G
  [['s', -0.17, -0.06, 30], ['s', 0.17, -0.06, -30], ['v', 0, 0.2]],          // H
  [['s', -0.17, -0.05, -30], ['s', 0.17, -0.05, 30], ['v', 0, 0.23]],         // I
  [['c', -0.22, -0.04], ['c', 0.22, -0.04], ['c', 0.05, 0.2]],                // J
  [['c', -0.22, -0.04], ['c', 0.22, -0.04], ['q', 0, 0.2]],                   // K
  [['c', -0.25, 0], ['c', 0, 0], ['c', 0.25, 0]],                             // L
  [['c', -0.2, 0.06], ['c', 0.2, 0.06], ['c', 0, -0.17]],                     // N
  [['c', -0.2, -0.09], ['c', 0.2, -0.09], ['c', 0, 0.17]],                    // O
];
function socket(p, cx, cy, size, kind, o = {}) {
  const st = { fill: o.fill || C.paper, stroke: o.stroke || LINE, 'stroke-width': o.w || 2, ...(o.dash ? { 'stroke-dasharray': o.dash } : {}) };
  dot(p, cx, cy, size * 0.46, { ...st, 'stroke-width': (o.w || 3) * 0.8 });
  dot(p, cx, cy, size * 0.38, { ...st, fill: 'none', 'stroke-width': (o.w || 3) * 0.6 });
  const ink = { fill: o.stroke || LINE };
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
  const d = smooth(pts, o.r || 60), tw = o.tw || 22, line = o.line || 1.6;
  const cap = o.cap ? { 'stroke-linecap': o.cap } : {};
  pth(svg, d, { stroke: LINE, 'stroke-width': tw, ...cap });
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
  if (s.source) { const n = textSize(s.source, { family: 'sans', size: 22, free: true, width: 1300, lh: 27 }).lines || 1; T(svg, L, 1016 - Math.max(0, n - 2) * 27, s.source, { size: 22, fill: C.muted, width: 1300, lh: 27 }); }
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
  notes: `<p>In October, Telekom stood in front of its investors and pointed at America. At T-Mobile, software agents now do a big part of customer service, and Telekom wants the same in Europe by 2030. Where I stand: I was born in the US, and I study in Germany. So I may see Germany as the harder case. That's why every claim has a source. <b>Can Telekom copy what T-Mobile's agents did?</b></p>`,
  draw(page, b) {
    const svg = svgOf(page);
    // the wall, drawn: 1024 x 1536. At drawing row 1028 a brick juts out to x 173;
    // that row sits at the plug's height and starts at page x 1500.
    const wk = 1180 / 1536, cy = 740, wy = cy - 1028 * wk - 0, wx = 1500 - 173 * wk;
    img(svg, 'deck-wall.png', wx, wy, 1024 * wk, 1536 * wk);
    // the plug: pins end 50 px short of the wall
    const x0 = 1450 - SIDE.tip * KSIDE;
    cable(svg, [[-30, CABLE_Y], [700, CABLE_Y], [x0 - 120, cy], [x0 + 30, cy]], { r: 220, cap: 'butt' });
    plugSide(svg, x0, cy);
    T(svg, L, 220, 'Innovation Management for AI', { size: 34, weight: 500, fill: C.muted });
    const a = toArticle(svg);
    T(a, L, 360, 'Renovate,', { family: 'serif', size: 132, weight: 500 });
    T(a, L, 500, 'don’t repaint', { family: 'serif', size: 132, weight: 500 });
    if (b >= 1) T(svg, L, 630, 'Can Telekom copy what T-Mobile’s agents did?', { size: 52, weight: 600, width: 860, lh: 62 });
    T(svg, L, 826, 'Alexander Rudaev', { size: 34, weight: 600 });
    T(svg, L, 872, 'TH Deggendorf, 12 December 2026', { size: 32, fill: C.muted });
    T(svg, L, 1050, 'Drawings: generated from my own line drawing', { size: 22, fill: C.muted });
  },
});

// 3 ---------------------------------------------------------------------------
// The release is a reported claim. Draw the share only for the defined group.
add({
  id: 'number', n: 3, beat: 'The American result', builds: 3, start: '1:15',
  clicks: ['the contract-customer start rate', 'completion rate unpublished', 'the separate press release claim'],
  title: '32% of contract-customer contacts started with software.',
  landings: { 2: 'About one in three contacts from contract customers started with software.' },
  source: 'Company figures. Deutsche Telekom, press release and AI Investor Day transcript, 5 Oct 2026. T-Mobile US, AI Investor Day deck, Q2 2026.',
  notes: `<p>T-Mobile's own slide shows thirty-two percent. It counts contacts from contract customers, and "served" means they meet the software first. Whether it finished the job, T-Mobile doesn't say. A correction to my proposal: I used Telekom's press release, which says AI agents now handle forty percent of customer contacts in the US. I couldn't find which customers that release counted. Company numbers, not audited. One in three is still a lot. <b>About one in three contacts from contract customers started with software.</b></p>`,
  draw(page, b, data) {
    const svg = svgOf(page);
    frame(svg, this, { titleWidth: 1680 });
    const { release, slide } = data.numbers.plateA;
    T(svg, L, 336, 'T-Mobile’s investor slide · Q2 2026', { size: 42, weight: 600 });
    T(svg, L, 530, `${slide.value}%`, { size: 108, weight: 600, fill: C.accent });
    bar100(svg, 400, R, 455, 74, slide.value);
    if (b >= 1) T(svg, 400, 628, 'T-Mobile leaves the completion rate unpublished.', { size: 40, weight: 600 });
    if (b >= 2) {
      ln(svg, L, 714, R, 714, { stroke: C.hair, 'stroke-width': 2 });
      T(svg, L, 794, `The press release says AI handled ${release.value}% of contacts.`, { size: 42, weight: 600 });
      T(svg, L, 851, release.scope, { size: 36, fill: C.muted });
    }
    band(svg);
  },
});

// 5 ---------------------------------------------------------------------------
// Three walls seen face on, side by side. One cable at one height crosses all
// three: hidden inside the hollow timber wall (dashed), carried across the
// brick in a duct that stands on the face, and laid into a channel cut into
// the brick and plastered over (the bricks are cut where it runs).
add({
  id: 'walls', n: 5, beat: 'The picture', builds: 4, start: '2:36',
  clicks: ['timber', 'repaint: the duct', 'renovate, on “cutting into the wall”', 'the cable is the agent'],
  title: 'The cable is the same. The wall decides the work.',
  source: 'NAHB 2026 (94% of new single-family homes completed in 2025 timber-framed); Destatis 2021 (about two in three residential buildings approved in 2020 brick or other masonry); DIN 18015-3. The walls picture conditions; they are not evidence.',
  notes: `<p>My father is a civil engineer, and this picture is his. In America almost every new family home has a timber frame: the wall is hollow, so a new cable drops down inside it. In Germany it's mostly masonry, brick and block, built to stand, so a new cable means opening the wall. You can screw a duct onto the wall: quick, and the wall stays as it was. Or you cut a channel, lay the cable and plaster it over. That's slow and dusty, and afterwards the cable is part of the wall. The cable is the agent. The wall is everything already there: old systems, rules, people. The duct is repainting. Cutting in is renovating. <b>The cable is the same. The wall decides the work.</b></p>`,
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
    under(xs[0], 'pulled through', 'quick, the wall stays closed');
    if (b >= 1) under(xs[1], 'repaint', 'a duct on the face, quick');
    if (b >= 2) under(xs[2], 'renovate', 'cut in and plastered, slow', C.accent);
    if (b >= 3) {
      T(svg, L, 900, 'The cable is the agent. The wall is what’s already there: old systems, rules, people.', { size: 36, fill: C.muted });
    }
  },
});

// 7 ---------------------------------------------------------------------------
// Fourteen socket faces, no two alike: the ways a customer proves who they are.
// Then three, dashed because they are planned, and the agent's plug below them.
add({
  id: 'simplify', n: 7, beat: 'Telekom’s own slide', builds: 2, start: '4:34',
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
      xs.forEach((x, i) => socket(svg, x, 470, 150, [2, 5, 4][i], { fill: C.field, stroke: C.accent, w: 3.5, dash: '14 9' }));
      // the agent's plug, pointing up at the middle one
      const tip = 470 + 75 + 46;
      cable(svg, [[-20, CABLE_Y], [xs[1], CABLE_Y], [xs[1], upEnd(tip) - 30]], { r: 90, tw: 20, cap: 'butt' });
      plugUp(svg, xs[1], tip);
      ln(svg, xs[1], 470 + 75, xs[1], tip - 8, { stroke: C.accent, 'stroke-width': 2, 'stroke-dasharray': '5 6' });
    } else cable(svg, [[-20, CABLE_Y], [1940, CABLE_Y]]);
  },
});

// 13 --------------------------------------------------------------------------
// The plan as a building drawn floor by floor, the way a drawing marks work:
// built in solid line, planned in dashed line. Each floor is a step and carries
// its name; what it is measured by stands beside it.
add({
  id: 'steps1', n: 13, beat: 'How to address it', builds: 3, start: '9:21',
  clicks: ['step 1', 'step 2', 'steps 3 and 4'],
  title: 'Measure first. Start beside the staff.',
  sub: 'Step 1 is this course’s business measure, not accuracy. The order of the eight is my hypothesis.',
  source: 'Step 1: the business measure from this course. Step 4: teams, never single people (2021 framework agreement). Bitkom 2025: 51% of firms with 20 or more staff strongly dependent on US digital technology.',
  notes: `<p>So how would I do it? Step one: compare the same kinds of requests before and with the agent. Count a request as finished if it was resolved and the customer doesn't come back about it within seven days. Measure what each finished request costs and how many the agent finishes without a person. That's the business measure from this course. If it doesn't get better, the agent is the wrong tool, and Telekom stops there. Step two: sign the works agreement while the system is still on paper. Step three: keep the option to switch suppliers. About half of German firms say they depend strongly on the US. Step four: train the staff before each new key. Measure teams, never single people, and watch the load on the people who stay: they get the hardest calls. <b>Measure first. Start beside the staff.</b></p>`,
  draw(page, b, data) {
    const svg = svgOf(page);
    frame(svg, this);
    const st = data.plan.steps;
    const MEASURE = {
      1: [['cost per finished request; share finished without a person'], ['Resolved, with no same-issue return within seven days.']],
      2: [['signed before the first agent acts']],
      3: [['time to switch supplier'], ['Bitkom: 51% of firms say they depend strongly on the US']],
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
  id: 'step5', n: 14, beat: 'How to address it', builds: 3, start: '10:26',
  clicks: ['the cut channel', 'keys need step 5', 'the cost of getting it wrong'],
  title: 'The biggest job is one customer record.',
  sub: 'Step 5: from 14 ways to prove who you are to a target of 3. Measure: callers recognised without questions.',
  source: 'Deutsche Telekom, AI Investor Day, 5 Oct 2026 (14 ways, 3 planned: company figures, 3 a target); T-Mobile US, Form 10-K 2025 and 10-Q Q3 2026 (write-off in Q3 2025).',
  notes: `<p>Step five. Telekom wants to go from fourteen ways of proving who you are to three, and to make the customer data usable. That's the one customer record T-Mobile built. An agent can't act on an account it can't identify. This is the channel cut into the brick. It takes years, and it can fail. In 2025 T-Mobile gave up part of a new billing system. It wrote off two hundred seventy-eight million dollars, before tax. <b>The biggest job is one customer record.</b></p>`,
  draw(page, b) {
    const svg = svgOf(page);
    frame(svg, this);
    // A strip of the same wall as slide 1 (deck-wall.png, three courses: drawing
    // rows 893-1193, the middle course centred on row 1040), with the channel cut
    // in code: straight sides, the cable laid in, the right half plastered flush.
    const k = 1.25, x = 1940 - 852 * k, y = 320, top = 885, rows = 307, cy = y + (1040 - top) * k, cut0 = x + 24, mid = 1450, hc = 22;
    // the ink filter: a washed-out projector lost this wall's thin grey lines (loop 11)
    art(svg, 'deck-wall.png', x, y, k, [172, top, 852, rows], 1024, 1536, { filter: 'url(#ink)' });
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
    lead(R, 262, 1700, cy - 4, 'the target: one record, 3 ways in', { col: C.accent, anchor: 'end' });
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
// Three drawn keys with rings (deck-key-1..3.png), short, medium and deep bitting:
// read, undoable, fraud-prone. Placed by width; yBase = the bottom of the drawing.
const KEYS = { 1: [1331, 269], 2: [1321, 277], 3: [1423, 280] };
function key(svg, x, yBase, w, i = 1) {
  const [kw, kh] = KEYS[i], k = w / kw;
  img(svg, `deck-key-${i}.png`, x, yBase - kh * k, w, kh * k, { filter: 'url(#ink)' });
  return w;
}
// The plug in a socket set into the wall: the closing picture (slides 16, end).
function pluggedIn(svg, cy = 740, route) {
  const wk = 1180 / 1536, wx = 1500 - 173 * wk;
  img(svg, 'deck-wall.png', wx, cy - 1028 * wk, 1024 * wk, 1536 * wk);
  const x0 = 1486 + 34 * KSIDE - SIDE.face * KSIDE + 1;
  cable(svg, route ? route(x0) : [[-30, CABLE_Y], [700, CABLE_Y], [x0 - 120, cy], [x0 + 30, cy]], { r: route ? 160 : 220, cap: 'butt' });
  // the plug, its pins inside the socket: the drawing cropped at its face
  plugSide(svg, x0, cy, { noPins: true });
  // the socket's cover plate seen edge on, standing proud of the plaster: the
  // renovated part, so green; opaque, so the bricks stop at it
  h('rect', { x: 1486, y: cy - 140, width: 30, height: 280, rx: 3, fill: C.field, stroke: LINE, 'stroke-width': 1.6 }, svg);
}

// 2 ---------------------------------------------------------------------------
add({
  id: 'agent', n: 2, beat: 'Why this case', builds: 2, start: '0:38',
  clicks: ['request and chatbot', 'the agent and its keys'],
  title: 'An agent doesn’t just answer. It acts.',
  sub: 'In this course’s terms, a transformation.',
  notes: `<p>My short answer: Telekom should copy the slow work behind the number. Two reasons for this case: both sides publish numbers, and this software does something a chatbot doesn't. A customer writes, "Please move me to a cheaper tariff." A chatbot answers, "Here's how." An agent just does it. For that it needs keys: permission to see and change your account. <b>An agent doesn't just answer. It acts.</b></p>`,
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
      const w = key(svg, 540, 832, 330, 1);
      T(svg, 540 + w + 30, 818, 'a key to see the account', { size: 38 });
      key(svg, 540, 930, 330, 2);
      T(svg, 540 + w + 30, 916, 'a key to change it', { size: 38, weight: 600 });
    }
    band(svg);
  },
});

// 4 ---------------------------------------------------------------------------
// Two measured columns and, between them, a dashed field: nothing published.
add({
  id: 'contacts', n: 4, beat: 'The American result', builds: 2, start: '2:05',
  clicks: ['7.0, 3.1, nothing in between', 'September 2024'],
  title: 'Nobody outside can tell how much was the agents.',
  source: 'T-Mobile US, AI Investor Day deck (contacts per account, Q4 2021 and Q2 2026; T-Mobile reports a fall of more than 55%); T-Mobile US, press release, 18 Sep 2024. Company figures.',
  notes: `<p>The second number: at the end of 2021, there were about seven contacts a year for each customer account. By the middle of this year, about three. Less than half. But the agents were only announced in September 2024, and I found nothing published in between. <b>Nobody outside can tell how much was the agents.</b></p>`,
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
      T(svg, (a.x + xe) / 2 + 20, ay - 70, 'nothing published that I found', { size: 34, weight: 600, fill: C.muted, anchor: 'middle' });
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
  id: 'rebuilt', n: 6, beat: 'What T-Mobile actually did', builds: 3, start: '3:43',
  clicks: ['before and now', 'the agents plugged in', '78%'],
  title: 'T-Mobile rebuilt alongside its agents.',
  source: "Deutsche Telekom, AI Investor Day transcript, 5 Oct 2026 (T-Mobile's head of IT); T-Mobile US, AI Investor Day deck; Form 10-K 2025. Share of chats: company figure.",
  notes: `<p>Look at what T-Mobile did. Their head of IT described it to investors. Before, outside contractors worked on the suppliers' systems. Now T-Mobile's own engineers work on T-Mobile's own systems. They built one customer record, one system that knows each customer, and the agents read from it. T-Mobile reports that almost eight in ten chats never reached a person. That's not the same as solved. Still, a real result. And the staff got help too: in about three of four conversations, the staff see the system's recommendations. Company figures again. <b>T-Mobile rebuilt alongside its agents.</b></p>`,
  draw(page, b, data) {
    const svg = svgOf(page);
    frame(svg, this);
    const R6 = data.rewire.us;
    T(svg, L, 290, 'Before', { size: 40, weight: 600, fill: C.muted });
    T(svg, L, 336, 'outside contractors on suppliers’ systems', { size: 32, fill: C.muted });
    [[0, 0], [190, 30], [380, -6], [570, 22]].forEach(([dx, dy]) => rc(svg, L + dx, 380 + dy, 160, 100, { stroke: C.muted, 'stroke-width': 3 }));
    T(svg, L, 560, 'separate systems, worked on by others', { size: 32, fill: C.muted });
    const x = 1000, bx = 1480;
    T(svg, x, 290, 'Now', { size: 40, weight: 600 });
    T(svg, x, 336, 'its own engineers on its own systems', { size: 32 });
    const box = () => { h('rect', { x, y: 380, width: 800, height: 130, fill: C.paper, stroke: C.ink, 'stroke-width': 3 }, svg); T(svg, x + 400, 458, 'one system that knows each customer', { size: 38, weight: 600, anchor: 'middle' }); };
    if (b < 1) box();
    if (b >= 1) {
      const tip = 500;
      cable(svg, [[-20, CABLE_Y], [bx, CABLE_Y], [bx, upEnd(tip) - 30]], { r: 90, tw: 20, cap: 'butt' });
      plugUp(svg, bx, tip);
      box();   // over the pin tips: they are in it
      T(svg, bx - 110, 640, 'the agents read from it', { size: 34, anchor: 'end' });
    } else band(svg);
    if (b >= 2) {
      const v = R6.points[1].value, was = R6.points[0].value, x0 = 380, x1 = 1220, y = 760;
      T(svg, x0, 720, 'chats that never reached a person, mid-2026', { size: 36, weight: 600 });
      const X = bar100(svg, x0, x1, y, 56, v);
      T(svg, x0 - 30, y + 54, `${v}%`, { size: 80, weight: 600, fill: C.accent, anchor: 'end' });
      ln(svg, X(was), y - 14, X(was), y + 70, { stroke: C.ink, 'stroke-width': 3, 'stroke-dasharray': '8 6' });
      T(svg, X(was), y + 104, 'mid-2024: about a quarter', { size: 32, fill: C.muted, anchor: 'middle' });
      T(svg, x0, 920, 'Company figure. No resolution rate for these chats.', { size: 36, weight: 600 });
    }
  },
});

// 8 ---------------------------------------------------------------------------
add({
  id: 'walkback', n: 8, beat: 'Repainting, twice', builds: 2, start: '4:59',
  clicks: ['Klarna', 'Commonwealth Bank, about a month later'],
  title: 'Both took part of it back.',
  source: 'Klarna, press release, 27 Feb 2024 (700: company estimate); Entrepreneur, 9 May 2025; Information Age, Aug 2025 (Commonwealth Bank).',
  notes: `<p>From the street, repainting looks the same for a while, and it's cheaper. The risk here is counting the staff saving before the tool has carried the work. By February 2024 Klarna had stopped hiring and said its assistant did the work of seven hundred people in customer service, by its own estimate. In 2025 it was hiring people again, and it kept the assistant. Commonwealth Bank went the same way, faster. It declared forty-five jobs redundant for a voice bot, and took that back within weeks. Those are two staffing decisions. I couldn't tell what either company changed behind its assistant. <b>Both took part of it back.</b></p>`,
  draw(page, b, data) {
    const svg = svgOf(page);
    frame(svg, this);
    const ax0 = 640, ax1 = 1800, ay = 830;
    const M = (s) => { const [y, m] = s.split('-').map(Number); return ax0 + ((y - 2024) * 12 + (m - 1) + 0.5) / 24 * (ax1 - ax0); };
    ln(svg, ax0, ay, ax1, ay, { stroke: C.ink, 'stroke-width': 3 });
    for (let k = 0; k <= 24; k += 3) { const x = ax0 + k / 24 * (ax1 - ax0); ln(svg, x, ay, x, ay + (k % 12 || k === 24 ? 8 : 18), { stroke: C.ink, 'stroke-width': 2 }); }
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
    const lab = (x, y, t, anchor) => { const w = textSize(t, { family: 'sans', size: 36, free: true }).w; h('rect', { x: (anchor === 'end' ? x - w : x) - 8, y: y - 32, width: w + 16, height: 44, fill: C.paper }, svg); T(svg, x, y, t, { size: 36, anchor: anchor || 'start' }); };
    const a = lane(kl, 430, 'Klarna', 'after 15 months');
    lab(a.x0 - 16, 386, 'Feb 2024: the work of 700 service staff, by Klarna’s estimate');
    lab(a.x1 + 16, 494, 'May 2025: hiring again', 'end');
    if (b >= 1) {
      const c = lane(cba, 660, 'Commonwealth Bank', 'after about a month');
      // each date over or under its own dot: July (filled) above, August (open) below
      lab(c.x0 + 16, 616, 'Jul 2025: 45 roles redundant for a voice bot', 'end');
      lab(c.x1 + 16, 724, 'Aug 2025: withdrawn, “did not adequately consider…”', 'end');
    }
    band(svg);
  },
});

// 9 ---------------------------------------------------------------------------
add({
  id: 'staff', n: 9, beat: 'First brick: the staff', builds: 1, start: '5:52',
  clicks: ['no dismissals to 2028; about 4,000 a year'],
  title: 'First brick: no dismissals, but positions go.',
  sub: 'In adoption terms: organisation (staff, know-how), environment (rules), technology (the 14 ways in).',
  source: 'Deutsche Telekom and ver.di, agreement of May 2026 (about 60,000 employees under its collective agreements); Deutsche Telekom, HR Factbook 2025, company figures (totals added by me).',
  notes: `<p>The harder question is what the wall looks like in Germany. Three bricks matter: the staff, the rules and the know-how. The first is the staff. This May, Telekom and the union ver.di agreed: no dismissals for business reasons until the end of 2028. People still leave, but only by agreed routes: partial retirement, early retirement, severance. From 2021 to 2025 that was about four thousand full-time positions a year, across Telekom in Germany. Sixteen every working day. <i>(pause)</i> <b>So, first brick: no dismissals, but positions go.</b> Any saving has to fit into that. I think that helps more than it hurts: the people who stay are the first ones to train. That's what renovating means to me: the agent works with them, not instead of them.</p>`,
  draw(page, b, data) {
    const svg = svgOf(page);
    frame(svg, this);
    const E = data.exits;
    T(svg, L, 290, 'No dismissals for business reasons until 31 December 2028', { size: 44, weight: 600 });
    T(svg, L, 338, 'Telekom and ver.di, May 2026; about 60,000 employees under its collective agreements', { size: 32, fill: C.muted });
    {
      ln(svg, L, 386, R, 386, { stroke: C.hair, 'stroke-width': 2 });
      T(svg, L, 450, 'Positions leave Telekom in Germany by agreed routes', { size: 36, weight: 600 });
      const base = 880, k = 0.075, x0 = 760, pitch = 210, bw = 120, Y = (v) => base - v * k;
      E.years.forEach((yr, i) => {
        const v = E.totals.values[i], x = x0 + i * pitch;
        h('rect', { x, y: Y(v), width: bw, height: v * k, fill: C.paper, stroke: C.ink, 'stroke-width': 3 }, svg);
        T(svg, x + bw / 2, base - 24, v.toLocaleString('en-US'), { size: 32, fill: C.muted, anchor: 'middle' });
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
  id: 'monitoring', n: 10, beat: 'Second brick: the checks', builds: 1, start: '6:58',
  clicks: ['79%'],
  title: 'Nearly four in five Germans see monitoring at work as bad.',
  source: 'European Commission, Special Eurobarometer 554, Artificial Intelligence and the future of work (asked in the EU only).',
  notes: `<p>The second brick starts with a worry. The EU asked people about digital monitoring at work. On being watched at work, they stand out even within the EU: only Sweden is higher. Any new system here has to answer that first. <b>Nearly four in five Germans see monitoring at work as bad.</b></p>`,
  draw(page, b, data) {
    const svg = svgOf(page);
    frame(svg, this, { titleWidth: 1700 });
    const v = data.attitudes.panels.find((p) => p.standsOut).rows[0].value;
    T(svg, L, 330, 'Digital monitoring of workers, Germany: seen as negative', { size: 36, weight: 600 });
    const x0 = L, x1 = R, y = 470, X = bar100(svg, x0, x1, y, 90, v);
    dim(svg, x0, X(v), y + 150, { ext: [y + 90, y + 170], col: C.accent, w: 4 });
    T(svg, X(v) - 20, y + 300, `${v}%`, { size: 150, weight: 600, fill: C.accent, anchor: 'end' });
    ln(svg, X(80), y - 40, X(80), y + 90, { stroke: C.ink, 'stroke-width': 3, 'stroke-dasharray': '8 6' });
    T(svg, X(80) - 14, y - 22, 'Sweden 80%, the only higher one in the EU', { size: 32, fill: C.muted, anchor: 'end' });
    band(svg);
  },
});

// 11 --------------------------------------------------------------------------
add({
  id: 'checks', n: 11, beat: 'Second brick: the checks', builds: 3, start: '7:31',
  clicks: ['what T-Mobile disclosed', 'when the German rules apply', 'Telekom’s 2021 framework'],
  title: 'Second brick: which checks apply, and when?',
  source: 'BetrVG §§ 87 and 90. EU AI Act Art. 50. Telekom group framework agreement on IT systems, March 2021 (Bargmann 2022). T-Mobile US, Sep 2024.',
  notes: `<p>I couldn't find a public record of staff input before T-Mobile launched. Here, the works council gets a say while you plan. If a system can watch the staff, the council has to agree before it runs. The rule for customers comes at the first conversation: tell them it's AI unless it's obvious. In 2021 Telekom agreed a framework with its works council. Nobody is watched as a person. Results only in groups of more than five, with no names. A system inside those rules needs no separate decision. I couldn't find how long the checks take for the agents. <b>Second brick: which checks apply, and when?</b></p>`,
  draw(page, b, data) {
    const svg = svgOf(page);
    frame(svg, this);
    const [us, de, framework] = data.permits.stages;
    const title = (y, stage) => T(svg, L, y, stage.label, { size: 36, weight: 600, fill: C.accent });
    const row = (y, [label, detail]) => {
      T(svg, L + 490, y, label, { size: 36, weight: 600 });
      T(svg, L + 942, y, detail, { size: 36 });
    };
    title(335, us);
    T(svg, L + 490, 335, us.items[0][0], { size: 36 });
    T(svg, L + 490, 390, us.items[0][1], { size: 39, weight: 600 });
    if (b >= 1) {
      ln(svg, L, 462, R, 462, { stroke: C.hair, 'stroke-width': 2 });
      title(522, de);
      de.items.forEach((item, i) => row(522 + 56 * i, item));
    }
    if (b >= 2) {
      ln(svg, L, 694, R, 694, { stroke: C.hair, 'stroke-width': 2 });
      title(754, framework);
      framework.items.forEach((item, i) => row(754 + 56 * i, item));
      T(svg, L + 490, 888, data.permits.boundary, { size: 34, fill: C.muted });
    }
    band(svg);
  },
});

// 12 --------------------------------------------------------------------------
add({
  id: 'knowhow', n: 12, beat: 'Third brick: know-how', builds: 2, start: '8:30',
  clicks: ['missing knowledge', 'law, data protection'],
  title: 'Third brick: missing knowledge first. The law after.',
  source: 'Federal Statistical Office (Destatis), 2025: firms with ten or more employees that considered AI and do not use it; several answers possible.',
  notes: `<p>The third brick is know-how. The Federal Statistical Office went to the firms that had looked at these tools and didn't use them, and asked: why not? More than seven in ten said they were missing the knowledge. Legal uncertainty and data protection came after, each about six in ten. Most of those firms are much smaller than Telekom. But the order is clear. <b>Third brick: missing knowledge first. The law after.</b> You can buy a language model. You can screw it onto the wall. Without your own people who understand your systems, you can't cut it in.</p>`,
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
    if (b >= 1) T(svg, L, 890, 'You can buy a language model and screw it onto the wall. Without your own people, you can’t cut it in.', { size: 36, fill: C.muted, width: 1680 });
    band(svg);
  },
});

// 15 --------------------------------------------------------------------------
// The building again, five floors built, then the keys: one drawn key per
// stage, in the order they are handed over.
add({
  id: 'steps68', n: 15, beat: 'How to address it', builds: 3, start: '11:12',
  clicks: ['step 6: keys in stages', 'steps 7 and 8', 'process model'],
  title: 'Then the keys: read first, risky changes last.',
  sub: 'Logged-in reads can start before the shared record. The order is my hypothesis.',
  source: 'Every new key: an annex to the works agreement from step 2.',
  notes: `<p>But reading doesn't have to wait. Step six: first the agent only reads, for customers already logged in: show a bill, check an order. Then actions you can undo. Last, the changes a fraudster could use, like a new bank account. The customer confirms those in the app. My requirement: if the agent gets a tariff wrong, the customer undoes it in one tap, and there's always a way to a person. The system enforces each key: the model can ask, the system decides. It's how I'd give any new program access to real data: read first, then we see. Step seven: each new key becomes an annex to the works agreement, and staff and works council sign off before the agent works alone. Step eight: a named team runs it. If cost per finished request doesn't fall, or errors or reversals rise, we hold the next key. So: <b>Then the keys: read first, risky changes last.</b></p>`,
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
      key(svg, L, y + 10, 230, i + 1);
      T(svg, L + 260, y, w, { size: 40, weight: 600, fill: i === 0 ? C.accent : C.ink });
      T(svg, L + 520, y, d, { size: 32, fill: C.muted });
    });
    T(svg, L, 720, 'The model can ask; the system decides.', { size: 36, weight: 600 });
    if (b >= 1) {
      T(svg, L, 790, '7  staff and works council sign off before it works alone', { size: 32 });
      T(svg, L, 832, '8  a named team runs it', { size: 32 });
    }
    if (b >= 2) {
      T(svg, L, 882, 'Next key only if cost per finished request falls', { size: 36, weight: 600 });
      T(svg, L, 928, 'with no rise in errors or reversals.', { size: 36, weight: 600 });
    }
    band(svg);
  },
});

// 16 --------------------------------------------------------------------------
// Three ways to be wrong, then the closing picture: the plug finally in.
add({
  id: 'close', n: 16, beat: 'Where this could be wrong', builds: 4, start: '12:24',
  clicks: ['first', 'second', 'third', 'the plug in, the closing line'],
  landings: { 2: 'Three things would prove me wrong.', 3: "Telekom can't import the 32%. It can copy the slow work behind it." },
  title: 'Three things would prove me wrong.',
  notes: `<p>Three things would prove me wrong. One: An agent finishes comparable account changes safely and at comparable cost before Telekom unifies its records. Then the shared record matters less than I think. Two: the service teams shrink faster than the agreed routes allow. Then the staff are leaving after all. Three: a works agreement comes months late. Then the law weighs more than I said.</p><p>(last build) I can't prove the rebuild caused T-Mobile's result. I argue it from need: an agent can't act on an account it can't identify. People often say Germany is slow. Two economists, Hall and Soskice, argue the other way: economies like Germany's are better at step-by-step innovation than at radical innovation. The agent is the transformation. The way in is step by step, with the staff. I started out thinking Germany was the harder case, and I still do. <b>Telekom can't import the 32%. It can copy the slow work behind it.</b> Thank you.</p>`,
  draw(page, b) {
    const svg = svgOf(page);
    if (b < 3) {
      frame(svg, this);
      const items = [
        ['An agent safely finishes comparable account changes', 'before the shared record, at comparable cost: the record matters less'],
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
    const a = toArticle(svg);
    T(svg, L, 220, 'Innovation Management for AI', { size: 34, weight: 500, fill: C.muted });
    T(a, L, 340, 'Renovate, don’t repaint', { family: 'serif', size: 96, weight: 500 });
    T(svg, L, 460, 'Thank you. Questions?', { size: 56, weight: 600 });
    T(svg, L, 580, 'The article, with every source:', { size: 32, fill: C.muted });
    T(a, L, 626, 'thd-ai.github.io/ws27-papers/renovate', { size: 36 });
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
      T(svg, cx[1], y, (r.us.show || r.us.absent || '').replace(/\[\[|\]\]/g, '').replace('≈ ', 'about '), { size: 26, width: 250 });
      const tag = r.de.status === 'target' ? ' (target)' : r.de.status === 'ahead' ? ' (outlook)' : '';
      T(svg, cx[2], y, (r.de.show || r.de.absent || '').replace(/\[\[|\]\]/g, '').replace('≈ ', 'about ') + tag, { size: 26, width: 270 });
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
      ['AI Act Art. 50', 'disclose AI at first contact unless the interaction with AI is already obvious'],
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
      ['read, then undoable, then fraud-prone', 'keys handed over in that order, each stage measured'],
      ['The model can ask, the system decides', 'permissions checked by the systems the agent calls'],
      ['A test set with hidden instructions', 'before each new key goes live'],
      ['Confirmation in the app', 'for changes a fraudster could use, like a new bank account'],
    ].forEach(([a, z], i) => {
      const y = 330 + i * 140;
      T(svg, L, y, a, { size: 42, weight: 600 });
      T(svg, L, y + 50, z, { size: 32, fill: C.muted });
    });
  },
});

add({
  id: 'b4', backup: 'B4', n: 'B4', beat: 'Backup', builds: 1, clicks: ['bars'], title: 'On AI and jobs, no more worried. On monitoring, near the top of the EU.',
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
  source: 'The full list with links, and how this was made: the article, thd-ai.github.io/ws27-papers/renovate (Sources; How this was made).',
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

// The order of the talk; the file is written in the order the loops built it.
const ORDER = ['title', 'agent', 'number', 'contacts', 'walls', 'rebuilt', 'simplify', 'walkback', 'staff', 'monitoring', 'checks', 'knowhow', 'steps1', 'step5', 'steps68', 'close', 'end', 'b1', 'b2', 'b3', 'b4', 'b5'];
SLIDES.sort((a, z) => ORDER.indexOf(a.id) - ORDER.indexOf(z.id));
