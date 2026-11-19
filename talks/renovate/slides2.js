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
// The cable is a tube: an ink stroke with a paper stroke inside it, so it
// matches the drawn plug's cable. tw = outer width.
function cable(svg, pts, o = {}) {
  const d = smooth(pts, o.r || 60), tw = o.tw || 22, line = o.line || 3.5;
  pth(svg, d, { stroke: C.ink, 'stroke-width': tw });
  pth(svg, d, { stroke: o.fill || C.paper, 'stroke-width': tw - 2 * line });
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
    // the wall, drawn: 1024 x 1536, its ink from x 219; placed so it runs off the right edge
    const wh = 1180, ws = wh / 1536, ww = 1024 * ws;
    const wallInk = 1500, wx = wallInk - 219 * ws;          // the drawing's ink starts at x 219
    img(svg, 'deck-wall.png', wx, -50, ww, wh);
    // the plug, drawn: 1536 x 1024, cable stub centred at y 560.5, tube 107 px wide at the left edge,
    // pins ending at x 1311: placed so the pins stop 60 px short of the wall
    const s = 0.40, pw = 1536 * s, ph = 1024 * s, tw = 107 * s;
    const cy = 800, plugX = wallInk - 60 - 1311 * s, plugY = cy - 560.5 * s;
    cable(svg, [[-30, CABLE_Y], [700, CABLE_Y], [plugX - 120, cy + 6], [plugX + 2, cy]], { r: 200, tw, line: 3.5 });
    img(svg, 'deck-plug-proj.png', plugX, plugY, pw, ph);
    T(svg, L, 220, 'Innovation Management for AI', { size: 34, weight: 500, fill: C.muted });
    T(svg, L, 360, 'Renovate,', { family: 'serif', size: 132, weight: 500 });
    T(svg, L, 500, 'don’t repaint', { family: 'serif', size: 132, weight: 500 });
    if (b >= 1) T(svg, L, 640, 'Can Telekom copy what T-Mobile’s agents did?', { size: 52, weight: 600, width: 860, lh: 62 });
    T(svg, L, 880, 'Alexander Rudaev', { size: 34, weight: 600 });
    T(svg, L, 926, 'TH Deggendorf, 12 December 2026', { size: 32, fill: C.muted });
    T(svg, L, 1050, 'Drawings: generated from my own line drawing', { size: 22, fill: C.muted });
  },
});

// 3 ---------------------------------------------------------------------------
// One bar of 100 contacts, measured twice: the release's 40 above, the
// slide's 32 below, the difference between them hatched.
add({
  id: 'number', n: 3, beat: 'The American result', builds: 3, start: '1:35',
  clicks: ['the release: 40', 'T-Mobile’s slide: 32, the gap', 'finished: not published'],
  title: 'Telekom says 40 percent. T-Mobile’s own slide counts 32 percent.',
  source: 'Deutsche Telekom, press release, 5 Oct 2026; T-Mobile US, AI Investor Day deck, Q2 2026. Company figures, not audited. Two separate counts; whether the 40 include the 32 isn’t published.',
  notes: `<p>A correction to my own proposal. Telekom's release says AI agents now handle forty percent of customer contacts in the US; I used that number. In T-Mobile's own material I couldn't find it. Its slide counts something narrower: only contract customers, only contacts "served by an AI agent". Served means the customer meets the software first. Whether the software also finished the job, T-Mobile doesn't say. Company numbers, not audited. Still, one in three is a lot. <b>Telekom says forty percent. T-Mobile's own slide counts thirty-two percent.</b></p>`,
  draw(page, b, data) {
    const svg = svgOf(page);
    frame(svg, this);
    const P = data.numbers.plateA;
    const x0 = 360, x1 = 1760, X = (v) => x0 + (v / 100) * (x1 - x0), y = 520, hh = 70;
    // the bar: 100 contacts, with a scale of tens
    rc(svg, x0, y, x1 - x0, hh, { 'stroke-width': 3 });
    for (let v = 10; v < 100; v += 10) ln(svg, X(v), y + hh - 14, X(v), y + hh, { stroke: C.mid, 'stroke-width': 2 });
    T(svg, X(0), y + hh + 46, '0', { size: 32, fill: C.muted, anchor: 'middle' });
    T(svg, X(100), y + hh + 46, '100 contacts', { size: 32, fill: C.muted, anchor: 'end' });
    T(svg, L, y + 48, 'of 100', { size: 34, fill: C.muted });
    // above: the release
    const r = P.release.value, s = P.slide.value;
    h('rect', { x: X(0), y, width: X(r) - X(0), height: hh, fill: C.faint }, svg);
    dim(svg, X(0), X(r), y - 60, { ext: [y - 80, y], col: C.ink });
    T(svg, X(r) + 26, y - 46, `${r}`, { size: 64, weight: 600 });
    T(svg, X(r) + 120, y - 66, 'Telekom’s press release', { size: 34, weight: 600 });
    T(svg, X(r) + 120, y - 26, 'all contacts in the US, “handled by AI agents”', { size: 32, fill: C.muted });
    if (b >= 1) {
      h('rect', { x: X(0), y, width: X(s) - X(0), height: hh, fill: C.field }, svg);
      h('rect', { x: X(s), y, width: X(r) - X(s), height: hh, fill: 'url(#gap)' }, svg);
      rc(svg, x0, y, x1 - x0, hh, { 'stroke-width': 3 });
      ln(svg, X(s), y, X(s), y + hh, { stroke: C.accent, 'stroke-width': 4 });
      dim(svg, X(0), X(s), y + hh + 110, { ext: [y + hh, y + hh + 130], col: C.accent, w: 4 });
      T(svg, X(s) - 26, y + hh + 210, `${s}`, { size: 96, weight: 600, fill: C.accent, anchor: 'end' });
      T(svg, X(s) + 30, y + hh + 160, 'T-Mobile’s own slide', { size: 36, weight: 600, fill: C.accent });
      T(svg, X(s) + 30, y + hh + 202, 'contract customers’ contacts, “served by an AI agent”', { size: 32, fill: C.muted });
      // the gap between the two ends
      ln(svg, (X(s) + X(r)) / 2, y + 8, (X(s) + X(r)) / 2 + 60, y - 150, { stroke: C.mid, 'stroke-width': 1.5 });
      T(svg, (X(s) + X(r)) / 2 + 70, y - 156, 'the 8 between them: not in T-Mobile’s material', { size: 32, fill: C.muted });
    }
    if (b >= 2) {
      pth(svg, `M${X(0)} ${y + hh + 250} L${X(0)} ${y + hh + 270} L${X(s)} ${y + hh + 270} L${X(s)} ${y + hh + 250}`, { stroke: C.ink, 'stroke-width': 2.5, 'stroke-dasharray': '10 8' });
      T(svg, X(0), y + hh + 324, 'how many of these the software finished: not published', { size: 38, weight: 600 });
    }
    // the cable keeps going along the bottom
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
    const top = 360, bot = 760, ww = 470, gap = 95, cy = 520;
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
    const head = (x, a, z) => { T(svg, x, 300, a, { size: 36, weight: 600 }); T(svg, x, 340, z, { size: 32, fill: C.muted }); };
    head(xs[0], 'US: timber frame, hollow', '94% of new single-family homes');
    if (b >= 1) head(xs[1], 'Germany: brick', 'two in three new residential buildings');
    const under = (x, a, z, col) => { T(svg, x, bot + 78, a, { size: 56, weight: 700, fill: col || C.ink }); T(svg, x, bot + 124, z, { size: 34, fill: C.muted }); };
    under(xs[0], 'pulled through', 'quick; nothing to see');
    if (b >= 1) under(xs[1], 'repaint', 'a duct on the face; quick');
    if (b >= 2) under(xs[2], 'renovate', 'cut in, plastered; slow', C.accent);
    if (b >= 3) {
      T(svg, L, 940, 'The cable is the agent. The wall is what’s already there: old systems, rules, people.', { family: 'serif', italic: true, size: 40 });
    }
    cable(svg, [[-20, CABLE_Y], [1940, CABLE_Y]]);
  },
});

// 7 ---------------------------------------------------------------------------
// Fourteen keys on one ring, then three: the ways a customer proves who they
// are. One drawn key, placed fourteen times by code, so the count is exact.
add({
  id: 'simplify', n: 7, beat: 'What T-Mobile actually did', builds: 3, start: '5:25',
  clicks: ['14 today', '3 planned', 'Telekom’s own words'],
  title: 'Simplify before automating.',
  sub: 'Telekom’s own words, on its own slide.',
  source: 'Deutsche Telekom, AI Investor Day, “From AI Adoption to AI Impact”, 5 Oct 2026. Company figures; three is a target.',
  notes: `<p>Telekom isn't there yet. Across its European countries, a customer can prove who they are in fourteen different ways. Telekom wants three, and its own slide says why. <b>Simplify before automating.</b></p>`,
  draw(page, b, data) {
    const svg = svgOf(page);
    frame(svg, this, { titleSize: 72 });
    const D = data.rewire.de;
    const ring = (cx, cy, n, R, scale) => {
      dot(svg, cx, cy, 42, { fill: 'none', stroke: C.ink, 'stroke-width': 4 });
      const kw = 1536 * scale, kh = 1024 * scale;
      for (let i = 0; i < n; i++) {
        const a = -90 + (i - (n - 1) / 2) * (n > 3 ? 196 / (n - 1) : 24);
        // the key's bow hole sits at about x 150, y 512 of the drawing; hang it on the ring
        const g = h('g', { transform: `translate(${cx} ${cy}) rotate(${a + 90}) translate(${-150 * scale + 0} ${-512 * scale + 42})` }, svg);
        h('image', { href: ART + 'deck-key-proj.png', x: 0, y: 0, width: kw, height: kh, transform: `rotate(90 ${150 * scale} ${512 * scale})` }, g);
      }
    };
    ring(520, 380, D.now.value, 42, 0.19);
    T(svg, 520, 790, `${D.now.value} ways to prove who you are, today`, { size: 38, weight: 600, anchor: 'middle' });
    if (b >= 1) {
      pth(svg, 'M900 520 L1080 520 M1056 502 L1080 520 L1056 538', { stroke: C.mid, 'stroke-width': 4 });
      ring(1440, 380, D.plan.value, 42, 0.19);
      T(svg, 1440, 790, `${D.plan.value}, planned: a target`, { size: 38, weight: 600, fill: C.accent, anchor: 'middle' });
    }
    if (b < 2) {   // the title waits for its build here only because it is Telekom's line, not his
      // (frame drew it already; nothing to hide)
    }
  },
});

// 13 --------------------------------------------------------------------------
// The plan as a building drawn floor by floor, the way a drawing marks work:
// what is built in solid line, what is planned in dashed line. Each floor is
// a step; its measure stands beside it.
add({
  id: 'steps1', n: 13, beat: 'How to address it', builds: 3, start: '10:25',
  clicks: ['step 1', 'step 2', 'steps 3 and 4'],
  title: 'Measure first. Start beside the staff.',
  sub: 'Eight steps, each standing on the one below. The order is my hypothesis.',
  source: 'Step 1: the business measure from this course. Step 4: teams, never single people (2021 framework agreement). Bitkom 2025: 51% of firms with 20 or more staff strongly dependent on US digital technology.',
  notes: `<p>So how would I do it? Step one: before any agent, measure what one contact costs today and how often customers come back; then, with the agent, how many requests it finishes for good and what it costs. That's the business measure from this course, not accuracy. If it doesn't get better, the agent is the wrong tool and Telekom stops there. Step two: sign the works agreement while the system is still on paper. Steps three and four: keep the option to switch suppliers, since about half of German firms with twenty or more staff depend strongly on American technology, and train the staff before each new key, measuring teams, never single people. <b>Measure first. Start beside the staff.</b></p>`,
  draw(page, b, data) {
    const svg = svgOf(page);
    frame(svg, this);
    const st = data.plan.steps;
    const MEASURE = {
      1: 'cost per contact, repeat contacts, before and with the agent. No gain: stop',
      2: 'signed before the first agent acts',
      3: 'time to switch supplier, tests included',
      4: 'cases per hour and repeat contacts, per team',
    };
    const on = b >= 2 ? [1, 2, 3, 4] : b === 1 ? [1, 2] : [1];
    const bx = 1400, bw = 380, g = CABLE_Y - 24, fh = 70;
    for (let i = 1; i <= 8; i++) {
      const y = g - i * fh, built = on.includes(i);
      if (built) {
        h('rect', { x: bx, y, width: bw, height: fh, fill: i === Math.max(...on) ? C.field : C.paper, stroke: C.ink, 'stroke-width': 4 }, svg);
      } else {
        h('rect', { x: bx, y, width: bw, height: fh, fill: 'none', stroke: C.mid, 'stroke-width': 2.5, 'stroke-dasharray': '12 10' }, svg);
      }
      T(svg, bx + bw / 2, y + fh / 2 + 13, String(i), { size: 36, weight: 600, fill: built ? C.ink : C.mid, anchor: 'middle' });
    }
    // roof outline, planned
    pth(svg, `M${bx - 20} ${g - 8 * fh} L${bx + bw / 2} ${g - 8 * fh - 90} L${bx + bw + 20} ${g - 8 * fh}`, { stroke: C.mid, 'stroke-width': 2.5, 'stroke-dasharray': '12 10' });
    // the steps on the left, each beside its floor
    for (let i = 1; i <= 8; i++) {
      const y = g - i * fh + fh / 2 + 12, built = on.includes(i);
      if (!built) { T(svg, L, y, `${i}  ${st[i - 1].name}`, { size: 32, fill: C.mid }); continue; }
      T(svg, L, y - 4, `${i}  ${st[i - 1].name}`, { size: 38, weight: 600 });
      T(svg, L + 430, y - 4, MEASURE[i], { size: 32, fill: C.muted, width: 840, lh: 36 });
    }
    cable(svg, [[-20, CABLE_Y], [1940, CABLE_Y]]);
  },
});

// 14 --------------------------------------------------------------------------
// The biggest job, drawn: a brick wall cut open with a channel, the cable laid
// in, the right half plastered over. That is what step 5 is.
add({
  id: 'step5', n: 14, beat: 'How to address it', builds: 3, start: '11:40',
  clicks: ['the cut channel', 'keys need step 5', 'the cost of getting it wrong'],
  title: 'The biggest job is one customer record.',
  sub: 'Step 5: 14 ways to prove who you are become 3. Measure: callers recognised without questions.',
  source: 'Deutsche Telekom, AI Investor Day, 5 Oct 2026 (14 ways, 3 planned: company figures, 3 a target); T-Mobile US, Form 10-K 2025 and 10-Q Q3 2026 (write-off in Q3 2025).',
  notes: `<p>Step five. Fourteen ways of proving who you are become three, and the customer data becomes usable. An agent can't act on an account it can't identify. This is the channel cut into the brick. It takes years, and it can fail: in the third quarter of 2025 T-Mobile wrote off two hundred seventy-eight million dollars on a billing system it abandoned, about a tenth of its net income that quarter. <b>The biggest job is one customer record.</b></p>`,
  draw(page, b) {
    const svg = svgOf(page);
    frame(svg, this);
    // the drawing: 1536 x 1024, ink from y 262 to 850; the channel at about y 520-560
    const s = 0.74, w = 1536 * s, hh = 1024 * s, x = 1920 - w - 90, y = 300 - 262 * s;
    img(svg, 'deck-chase.png', x, y, w, hh);
    const chY = y + 540 * s;
    // leaders from the left column onto the drawing
    const lead = (tx, ty, x1, y1, a, col) => { T(svg, tx, ty, a, { size: 34, weight: 600, fill: col || C.ink, width: 470 }); ln(svg, tx + 480, ty - 12, x1, y1, { stroke: C.ink, 'stroke-width': 2 }); dot(svg, x1, y1, 6, { fill: C.ink }); };
    lead(L, 430, x + 330 * s, chY, 'cut open: the old systems, 14 ways in');
    T(svg, x + 1150 * s, y + 900 * s, 'plastered: one record, 3 ways in', { size: 34, weight: 600, fill: C.accent, anchor: 'middle' });
    ln(svg, x + 1150 * s, y + 850 * s, x + 1150 * s, chY + 30, { stroke: C.ink, 'stroke-width': 2 }); dot(svg, x + 1150 * s, chY + 30, 6, { fill: C.ink });
    if (b >= 1) T(svg, L, 860, 'Keys that change an account need step 5: an agent can’t act on an account it can’t identify.', { size: 36, weight: 600, width: 1680 });
    if (b >= 2) T(svg, L, 920, 'It can fail: in Q3 2025 T-Mobile wrote off $278 million on a billing system it abandoned.', { size: 32, fill: C.muted, width: 1680 });
    cable(svg, [[-20, CABLE_Y], [1940, CABLE_Y]]);
  },
});
