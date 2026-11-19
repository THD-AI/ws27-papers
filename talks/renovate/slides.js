// The slides of "Renovate, don't repaint". Each slide is a pure drawing of
// its build: draw(page, build, data, ctx). The figures' numbers come from the
// article's data files (articles/renovate/data); the few typed here (94%, two
// in three, the law's dates) are the article's text.md, with their sources on
// the slide and in B5. The notes are the talk plan's spoken lines, checked
// against the article (dotUni talks/innovation/storyline.md).
import { h, text, textSize } from '../../lib/fig.js';

const C = { paper: '#FBFBFC', ink: '#15171C', muted: '#5C6370', hair: '#DADDE3', accent: '#1F7A54', field: '#CDE9D9', mid: '#9AA0AA' };
const L = 96, R = 1824, W = R - L;

// ---------------------------------------------------------------------------
// Drawing helpers
// ---------------------------------------------------------------------------
function svgOf(page) {
  const svg = h('svg', { viewBox: '0 0 1920 1080', width: 1920, height: 1080, role: 'img' });
  page.appendChild(svg);
  return svg;
}
const T = (p, x, y, s, o = {}) => text(p, x, y, s, { family: 'sans', size: 36, fill: C.ink, free: true, ...o });
const ln = (p, x1, y1, x2, y2, o = {}) => h('line', { x1, y1, x2, y2, stroke: C.ink, 'stroke-width': 3, 'stroke-linecap': 'round', ...o }, p);
const rc = (p, x, y, w, hh, o = {}) => h('rect', { x, y, width: w, height: hh, fill: 'none', stroke: C.ink, 'stroke-width': 3, ...o }, p);
const dot = (p, x, y, r, o = {}) => h('circle', { cx: x, cy: y, r, ...o }, p);
const pth = (p, d, o = {}) => h('path', { d, fill: 'none', stroke: C.ink, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...o }, p);

// A row of counted dots: n of total filled, the rest as empty rings.
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

// Three bricks, the nth one green: the call-back to the walls on slide 5.
function bricks(p, x, y, n, o = {}) {
  const bw = o.w || 44, bh = o.h || 22, gp = 6;
  for (let i = 0; i < 3; i++) {
    const on = i === n - 1;
    rc(p, x + i * (bw + gp), y, bw, bh, { fill: on ? C.accent : 'none', stroke: on ? C.accent : C.mid, 'stroke-width': 2.5 });
  }
  return 3 * bw + 2 * gp;
}

// The frame every slide shares: a small label, the title (the line he says,
// arriving with the last build), the source line and the page number.
function chrome(svg, s, build, ctx, o = {}) {
  let lx = L;
  if (s.brick) { lx += bricks(svg, L, 82, s.brick) + 20; }
  if (s.label) T(svg, lx, 104, s.label, { size: 32, weight: 500, fill: C.muted });
  if (s.title && (ctx.last || o.titleAlways)) {
    let size = o.titleSize || 62;
    if (textSize(s.title, { family: 'sans', size, weight: 600, free: true }).w > (o.titleWidth || W)) size = 54;
    T(svg, L, 190, s.title, { size, weight: 600, width: o.titleWidth || W, lh: size * 1.16 });
  }
  if (s.source) {
    const lines = textSize(s.source, { family: 'sans', size: 22, free: true, width: 1520, lh: 28 }).lines;
    T(svg, L, 1040 - (lines - 1) * 28, s.source, { size: 22, fill: C.muted, width: 1520, lh: 28 });
  }
  const num = s.backup ? s.backup : s.end ? '' : `${s.n} / ${ctx.main}`;
  if (num) T(svg, R, 1040, num, { size: 22, weight: 500, fill: C.muted, anchor: 'end' });
}


// ---------------------------------------------------------------------------
// The slides
// ---------------------------------------------------------------------------
export const SLIDES = [];
const add = (s) => { s.n = SLIDES.filter((x) => !x.backup && !x.end).length + (s.backup || s.end ? 0 : 1); SLIDES.push(s); return s; };

// 1 ---------------------------------------------------------------------------
add({
  id: 'title', start: '0:00', clicks: ['title and drawing', 'the question'], builds: 2,
  landings: { 1: "Can Telekom copy what T-Mobile's agents did?" },
  notes: `<p>Deutsche Telekom openly takes an American result as its benchmark. On 5 October it told its investors about T-Mobile: software agents there now do a big part of customer service, and Telekom wants the same in Europe by 2030. My position: born in the United States, studying in Germany, so I may see Germany as the harder case. That's why every claim has a source. <b>Can Telekom copy what T-Mobile's agents did?</b></p>`,
  draw(page, b, data, ctx) {
    const svg = svgOf(page);
    h('image', { href: '../../articles/renovate/art/house.png', x: 0, y: 0, width: 1920, height: 1080, preserveAspectRatio: 'xMidYMid slice' }, svg);
    T(svg, L, 300, 'Innovation Management for AI', { size: 32, weight: 500, fill: C.muted });
    T(svg, L, 420, 'Renovate,', { family: 'serif', size: 112, weight: 500 });
    T(svg, L, 540, 'don’t repaint', { family: 'serif', size: 112, weight: 500 });
    if (b >= 1) T(svg, L, 680, "Can Telekom copy what T-Mobile's agents did?", { size: 50, weight: 600, width: 740, lh: 62 });
    T(svg, L, 930, 'Alexander Rudaev', { size: 34, weight: 600 });
    T(svg, L, 976, 'TH Deggendorf, 12 December 2026', { size: 32, fill: C.muted });
    T(svg, R, 1040, 'Drawing generated from my own line drawing', { size: 22, fill: C.muted, anchor: 'end' });
  },
});

// 2 ---------------------------------------------------------------------------
add({
  id: 'agent', start: '0:55', clicks: ['request and chatbot', 'the agent and its keys', 'title'], builds: 3, label: 'Why this case',
  title: "An agent doesn't just answer. It acts.",
  notes: `<p>Two reasons for this case: both sides publish numbers, and this software does something a chatbot doesn't. A customer writes, "Please move me to a cheaper tariff." A chatbot answers, "Here's how." An agent just does it. For that it needs keys: permission to see and change your account. In this course's terms, a transformation, not a change. <b>An agent doesn't just answer. It acts.</b></p>`,
  draw(page, b, data, ctx) {
    const svg = svgOf(page);
    chrome(svg, this, b, ctx);
    T(svg, L, 380, 'A customer writes:', { size: 34, fill: C.muted });
    T(svg, L, 450, '“Please move me to a cheaper tariff.”', { family: 'serif', size: 56 });
    const y1 = 600, y2 = 790;
    T(svg, L, y1, 'A chatbot', { size: 44, weight: 600 });
    T(svg, 520, y1, 'answers: “Here’s how.”', { size: 44, fill: C.muted });
    T(svg, 520, y1 + 52, 'The customer still does it.', { size: 32, fill: C.muted });
    if (b >= 1) {
      T(svg, L, y2, 'An agent', { size: 44, weight: 600 });
      T(svg, 520, y2, 'does it: the tariff in the account changes.', { size: 44 });
      // two keys: to see the account, to change it
      const kx = 520, ky = y2 + 62;
      const key = (x, y, col, label) => {
        dot(svg, x + 14, y + 14, 14, { fill: 'none', stroke: col, 'stroke-width': 4 });
        ln(svg, x + 28, y + 14, x + 86, y + 14, { stroke: col, 'stroke-width': 4 });
        ln(svg, x + 72, y + 14, x + 72, y + 30, { stroke: col, 'stroke-width': 4 });
        ln(svg, x + 84, y + 14, x + 84, y + 26, { stroke: col, 'stroke-width': 4 });
        T(svg, x + 108, y + 26, label, { size: 32, fill: col === C.accent ? C.accent : C.ink, weight: col === C.accent ? 600 : 400 });
      };
      key(kx, ky, C.ink, 'a key to see the account');
      key(kx + 560, ky, C.accent, 'a key to change it');
    }
  },
});

// 3 ---------------------------------------------------------------------------
add({
  id: 'number', start: '1:35', clicks: ['the release: 40', 'T-Mobile’s slide: 32', 'finished: not published', 'title'], builds: 4, label: 'The American result, corrected',
  title: "Telekom says 40 percent. T-Mobile's own slide counts 32 percent.",
  source: 'Deutsche Telekom, press release, 5 Oct 2026; T-Mobile US, AI Investor Day deck, Q2 2026. Company figures, not audited.',
  notes: `<p>A correction to my own proposal. Telekom's release says AI agents now handle forty percent of customer contacts in the US; I used that number. In T-Mobile's own material I couldn't find it. Its slide counts something narrower: only contract customers, only contacts "served by an AI agent". Served means the customer meets the software first. Whether the software also finished the job, T-Mobile doesn't say. Company numbers, not audited. Still, one in three is a lot. <b>Telekom says forty percent. T-Mobile's own slide counts thirty-two percent.</b></p>`,
  draw(page, b, data, ctx) {
    const svg = svgOf(page);
    chrome(svg, this, b, ctx);
    const P = data.numbers.plateA;
    const dx = 470, opt = { cols: 50, pitch: 26, r: 9.5, group: 10, groupGap: 14 };
    // Row A: the release
    const ya = 360;
    T(svg, L, ya + 66, String(P.release.value), { size: 120, weight: 600, fill: C.muted });
    T(svg, L + 170, ya + 26, "Telekom's press release", { size: 32, weight: 600 });
    T(svg, L + 170, ya + 66, 'of 100 contacts in the US', { size: 32, fill: C.muted });
    dotRow(svg, dx, ya + 90, 100, P.release.value, { ...opt, fill: C.mid });
    T(svg, dx, ya + 186, 'handled by AI agents, in the release’s words', { size: 34, fill: C.muted });
    if (b >= 1) {
      const yb = 610;
      T(svg, L, yb + 66, String(P.slide.value), { size: 120, weight: 600, fill: C.accent });
      T(svg, L + 170, yb + 26, "T-Mobile's own slide", { size: 32, weight: 600 });
      T(svg, L + 170, yb + 66, "of 100 contract customers' contacts", { size: 32, fill: C.muted });
      dotRow(svg, dx, yb + 90, 100, P.slide.value, { ...opt, fill: C.accent });
      T(svg, dx, yb + 186, '“served by an AI agent”: the customer meets the software first', { size: 36 });
    }
    if (b >= 2) {
      T(svg, dx, 880, 'How many of these the software finished: not published.', { size: 38, weight: 600 });
      T(svg, dx, 928, 'Two separate counts; whether the 40 include the 32 isn’t published.', { size: 32, fill: C.muted });
    }
  },
});

// 4 ---------------------------------------------------------------------------
add({
  id: 'contacts', start: '2:45', clicks: ['7.0 and 3.1', 'September 2024, the empty stretch', 'title'], builds: 3, label: 'The American result, corrected',
  title: 'Nobody outside can tell how much was the agents.',
  source: 'T-Mobile US, AI Investor Day deck (contacts per account, Q4 2021 and Q2 2026; T-Mobile reports the fall as 55%); T-Mobile US, press release, 18 Sep 2024. Company figures.',
  notes: `<p>The second number: at the end of 2021 a customer account got in touch about seven times a year. By the middle of this year, about three. Less than half. But the agents were only announced in September 2024, and nothing in between is published. <b>Nobody outside can tell how much was the agents.</b></p>`,
  draw(page, b, data, ctx) {
    const svg = svgOf(page);
    chrome(svg, this, b, ctx);
    const B = data.numbers.plateB;
    // time axis: Q4 2021 .. Q2 2026, in quarters
    const q0 = 2021 * 4 + 3, q1 = 2026 * 4 + 1;
    const ax0 = 300, ax1 = 1640, ay = 760;
    const X = (year, quarter) => ax0 + ((year * 4 + quarter - 1) - q0) / (q1 - q0) * (ax1 - ax0);
    ln(svg, ax0 - 40, ay, ax1 + 40, ay, { stroke: C.mid, 'stroke-width': 2 });
    for (let y = 2022; y <= 2026; y++) {
      const x = X(y, 1);
      ln(svg, x, ay - 10, x, ay + 10, { stroke: C.mid, 'stroke-width': 2 });
      T(svg, x, ay + 50, String(y), { size: 32, fill: C.muted, anchor: 'middle' });
    }
    const [p0, p1] = B.points;
    const col = (pt, x, fill) => {
      const full = Math.floor(pt.value), frac = pt.value - full;
      for (let i = 0; i < full; i++) dot(svg, x, ay - 40 - i * 46, 17, { fill });
      if (frac > 0.01) dot(svg, x, ay - 40 - full * 46, Math.max(4, 17 * Math.sqrt(frac)), { fill });
    };
    const xa0 = X(p0.year, p0.quarter), xb0 = X(p1.year, p1.quarter);
    col(p0, xa0, C.ink);
    T(svg, xa0, ay - 40 - 6 * 46 - 32, '7.0', { size: 64, weight: 600, anchor: 'middle' });
    T(svg, xa0, ay + 100, 'end of 2021', { size: 32, fill: C.muted, anchor: 'middle' });
    col(p1, xb0, C.accent);
    T(svg, xb0, ay - 40 - 4 * 46 - 50, '3.1', { size: 64, weight: 600, fill: C.accent, anchor: 'middle' });
    T(svg, xb0, ay - 40 - 4 * 46 - 4, 'less than half', { size: 32, weight: 600, fill: C.accent, anchor: 'middle' });
    T(svg, xb0, ay + 100, 'mid-2026', { size: 32, fill: C.muted, anchor: 'middle' });
    T(svg, L, 330, 'Contacts per customer account in a year, T-Mobile', { size: 36, weight: 600 });
    if (b >= 1) {
      const xa = xa0 + 60, xb = xb0 - 60, xe = X(2024, 3) + 20;
      rc(svg, xa, ay - 150, xb - xa, 110, { stroke: C.mid, 'stroke-width': 2, 'stroke-dasharray': '10 10' });
      T(svg, (xa + xe) / 2, ay - 84, 'nothing published in between', { size: 32, fill: C.muted, anchor: 'middle' });
      ln(svg, xe, ay - 330, xe, ay, { stroke: C.ink, 'stroke-width': 3 });
      T(svg, xe + 16, ay - 300, 'agents announced,', { size: 32, weight: 600 });
      T(svg, xe + 16, ay - 260, 'September 2024', { size: 32, weight: 600 });
    }
  },
});

// 5 ---------------------------------------------------------------------------
add({
  id: 'walls', start: '3:20', clicks: ['timber', 'repaint: the duct', 'renovate, on “cutting into the wall”', 'title'], builds: 4, label: 'The picture',
  title: 'The cable is the same. The wall decides the work.',
  source: 'NAHB 2026 (94% of new single-family homes completed in 2025 timber-framed); Destatis 2021 (about two in three residential buildings approved in 2020 brick or other masonry); DIN 18015-3. The walls picture conditions; they are not evidence.',
  notes: `<p>My father is a civil engineer, and this picture is his. In America almost every new family home has a timber frame: the wall is hollow, so a new cable drops down inside it. In Germany it's mostly brick, built to stand, so a new cable means opening the wall. You can screw a duct onto the wall: quick, and the wall stays as it was. Or you cut a channel, lay the cable and plaster it over: slow, and the cable becomes part of the wall. The cable is the agent. The wall is what's already there: old systems, rules, people. The duct is repainting. Cutting into the wall is renovating. <b>The cable is the same. The wall decides the work.</b></p>`,
  draw(page, b, data, ctx) {
    const svg = svgOf(page);
    chrome(svg, this, b, ctx);
    const top = 450, hgt = 350, ww = 500, gap = 114;
    const xs = [L, L + ww + gap, L + 2 * (ww + gap)];
    T(svg, xs[0], 330, 'US: timber frame', { size: 36, weight: 600 });
    T(svg, xs[0], 374, '94% of new single-family homes, 2025', { size: 32, fill: C.muted });
    if (b >= 1) {
      T(svg, xs[1], 330, 'Germany: mostly masonry', { size: 36, weight: 600 });
      T(svg, xs[1], 374, 'two in three residential buildings approved in 2020', { size: 32, fill: C.muted });
      ln(svg, xs[1], 398, xs[2] + ww, 398, { stroke: C.ink, 'stroke-width': 2 });
    }
    const CUT = { x: 0, y: 0 };
    const brick = (x, skip) => {
      const g = h('g', {}, svg);
      const rh = 35, bw = 100;
      for (let r = 0; top + r * rh < top + hgt; r++) {
        const y = top + r * rh;
        ln(g, x, y, x + ww, y, { stroke: C.mid, 'stroke-width': 2 });
        const off = r % 2 ? bw / 2 : 0;
        for (let bx = x + off; bx < x + ww; bx += bw) if (bx > x) ln(g, bx, y, bx, Math.min(y + rh, top + hgt), { stroke: C.mid, 'stroke-width': 2 });
      }
      rc(svg, x, top, ww, hgt, { 'stroke-width': 4 });
      return g;
    };
    const socket = (x, y) => { rc(svg, x - 22, y - 22, 44, 44, { fill: C.paper, 'stroke-width': 3 }); dot(svg, x - 8, y, 4, { fill: C.ink }); dot(svg, x + 8, y, 4, { fill: C.ink }); };
    const route = (x) => { const yz = top + 70, xz = x + 70; return { yz, xz, d: `M${x + ww - 40} ${top - 34} L${x + ww - 40} ${yz} L${xz} ${yz} L${xz} ${top + hgt - 70}` }; };
    // timber: studs, the cable dropped down one bay
    {
      const x = xs[0];
      rc(svg, x, top, ww, hgt, { 'stroke-width': 4 });
      for (let i = 1; i < 6; i++) ln(svg, x + i * ww / 6, top, x + i * ww / 6, top + hgt, { stroke: C.mid, 'stroke-width': 3 });
      const cx = x + ww / 12 * 3;
      pth(svg, `M${cx} ${top - 34} L${cx} ${top}`, { stroke: C.ink, 'stroke-width': 7 });
      pth(svg, `M${cx} ${top} L${cx} ${top + hgt - 70}`, { stroke: C.ink, 'stroke-width': 6, 'stroke-dasharray': '14 10', 'stroke-linecap': 'butt' });
      T(svg, cx + 18, top + 150, 'inside', { family: 'serif', italic: true, size: 32, fill: C.muted });
      socket(cx, top + hgt - 48);
      T(svg, x, top + hgt + 66, 'pulled through', { size: 44, weight: 600 });
      T(svg, x, top + hgt + 112, 'quick', { size: 34, fill: C.muted });
    }
    if (b >= 1) { // a duct screwed onto the plastered brick: a box on the surface
      const x = xs[1], r0 = route(x);
      brick(x);
      const duct = r0.d.replace(`M${x + ww - 40} ${top - 34}`, `M${x + ww - 40} ${top}`);
      h('path', { d: duct, fill: 'none', stroke: C.ink, 'stroke-width': 34, 'stroke-linecap': 'butt', 'stroke-linejoin': 'miter', transform: 'translate(7 7)' }, svg);
      pth(svg, duct, { stroke: C.ink, 'stroke-width': 34, 'stroke-linecap': 'butt', 'stroke-linejoin': 'miter' });
      pth(svg, r0.d.replace(`M${x + ww - 40} ${top - 34}`, `M${x + ww - 40} ${top}`), { stroke: C.paper, 'stroke-width': 26, 'stroke-linecap': 'butt', 'stroke-linejoin': 'miter' });
      pth(svg, r0.d, { stroke: C.ink, 'stroke-width': 7 });
      [[x + 240, r0.yz], [x + 400, r0.yz], [r0.xz, top + 180]].forEach(([sx, sy]) => { dot(svg, sx, sy, 6, { fill: C.paper, stroke: C.ink, 'stroke-width': 2.5 }); ln(svg, sx - 4, sy, sx + 4, sy, { stroke: C.ink, 'stroke-width': 2 }); });
      socket(r0.xz, top + hgt - 48);
      T(svg, x + 110, top + 170, 'on the wall', { family: 'serif', italic: true, size: 32, fill: C.muted });
      T(svg, x, top + hgt + 66, 'repaint', { size: 56, weight: 700 });
      T(svg, x, top + hgt + 112, 'quick; the wall unchanged', { size: 34, fill: C.muted });
    }
    if (b >= 2) { // the brick cut open, the cable laid in, plastered over: the wall changes
      const x = xs[2], r0 = route(x);
      brick(x);
      const chase = r0.d.replace(`M${x + ww - 40} ${top - 34}`, `M${x + ww - 40} ${top}`);
      pth(svg, chase, { stroke: C.accent, 'stroke-width': 56, 'stroke-linecap': 'butt', 'stroke-linejoin': 'miter' });
      pth(svg, chase, { stroke: C.field, 'stroke-width': 48, 'stroke-linecap': 'butt', 'stroke-linejoin': 'miter' });
      pth(svg, `M${x + ww - 40} ${top - 34} L${x + ww - 40} ${top}`, { stroke: C.ink, 'stroke-width': 7 });
      pth(svg, chase, { stroke: C.ink, 'stroke-width': 6, 'stroke-dasharray': '14 10', 'stroke-linecap': 'butt' });
      T(svg, x + 110, top + 170, 'in the wall', { family: 'serif', italic: true, size: 32, fill: C.accent });
      socket(r0.xz, top + hgt - 48);
      T(svg, x, top + hgt + 66, 'renovate', { size: 56, weight: 700, fill: C.accent });
      T(svg, x, top + hgt + 112, 'slow; the wall changes', { size: 34, fill: C.muted });
    }
  },
});

// 6 ---------------------------------------------------------------------------
add({
  id: 'rebuilt', start: '4:40', clicks: ['before', 'now: one system', '78%', 'title'], builds: 4, label: 'What T-Mobile actually did',
  title: 'T-Mobile rebuilt alongside its agents.',
  source: "Deutsche Telekom, AI Investor Day transcript, 5 Oct 2026 (T-Mobile's head of IT); T-Mobile US, AI Investor Day deck; Form 10-K 2025. Share of chats: company figure.",
  notes: `<p>T-Mobile didn't just repaint. Their head of IT described it to investors. Before, outside contractors worked on other companies' systems. Now T-Mobile's own engineers work on T-Mobile's own systems. They built one system that knows each customer, and the agents read from it. On that base, almost eight in ten chats never reached a person. A real result. <b>T-Mobile rebuilt alongside its agents.</b></p>`,
  draw(page, b, data, ctx) {
    const svg = svgOf(page);
    chrome(svg, this, b, ctx);
    const R6 = data.rewire.us;
    const y0 = 330;
    T(svg, L, y0, 'Before', { size: 40, weight: 600, fill: C.muted });
    T(svg, L, y0 + 48, "outside contractors on suppliers' systems", { size: 34, fill: C.muted });
    [[0, 0], [200, 34], [400, -8], [600, 26]].forEach(([dx, dy]) => rc(svg, L + dx, y0 + 96 + dy, 170, 110, { stroke: C.mid, 'stroke-width': 4 }));
    T(svg, L, y0 + 300, 'separate systems, worked on by others', { size: 34, fill: C.muted });
    if (b >= 1) {
      const x = 1000;
      T(svg, x, y0, 'Now', { size: 40, weight: 600 });
      T(svg, x, y0 + 48, 'its own engineers on its own systems', { size: 34 });
      rc(svg, x, y0 + 96, 824, 140, { 'stroke-width': 6 });
      T(svg, x + 412, y0 + 180, 'one system that knows each customer', { size: 38, weight: 600, anchor: 'middle' });
      pth(svg, `M${x + 412} ${y0 + 300} L${x + 412} ${y0 + 248}`, { stroke: C.ink, 'stroke-width': 5 });
      pth(svg, `M${x + 398} ${y0 + 262} L${x + 412} ${y0 + 246} L${x + 426} ${y0 + 262}`, { stroke: C.ink, 'stroke-width': 5 });
      T(svg, x + 412, y0 + 340, 'the agents read from it', { size: 34, anchor: 'middle' });
    }
    if (b >= 2) {
      const yr = 790, v = R6.points[1].value;
      ln(svg, L, 720, R, 720, { stroke: C.hair, 'stroke-width': 2 });
      T(svg, L, yr + 64, `${v}%`, { size: 120, weight: 600, fill: C.accent });
      T(svg, L + 310, yr, 'of chats never reached a person, mid-2026', { size: 38, weight: 600 });
      dotRow(svg, L + 310, yr + 22, 100, v, { cols: 50, pitch: 27, r: 10, group: 10, groupGap: 14, fill: C.accent });
      T(svg, L + 310, yr + 128, 'company figure; not reaching a person isn’t the same as resolved; about a quarter in mid-2024', { size: 32, fill: C.muted });
    }
  },
});

// 7 ---------------------------------------------------------------------------
add({
  id: 'simplify', start: '5:25', clicks: ['14 today', '3 planned', 'title'], builds: 3, label: "Telekom's own slide",
  title: 'Simplify before automating.',
  source: 'Deutsche Telekom, AI Investor Day, "From AI Adoption to AI Impact", 5 Oct 2026. Company figures; three is a target.',
  notes: `<p>Telekom isn't there yet. Across its European countries, a customer can prove who they are in fourteen different ways. Telekom wants three, and its own slide says why. <b>Simplify before automating.</b></p>`,
  draw(page, b, data, ctx) {
    const svg = svgOf(page);
    chrome(svg, this, b, ctx, { titleSize: 76 });
    const D = data.rewire.de;
    const y = 520;
    T(svg, L, 400, 'Ways a customer proves who they are, across Telekom’s European countries', { size: 34, weight: 600 });
    for (let i = 0; i < D.now.value; i++) dot(svg, L + 30 + i * 62, y, 22, { fill: C.ink });
    T(svg, L, y + 130, String(D.now.value), { size: 96, weight: 600 });
    T(svg, L + 120, y + 122, 'today', { size: 34, fill: C.muted });
    if (b >= 1) {
      const x = 1300;
      pth(svg, `M${L + 30 + 13 * 62 + 60} ${y} L${x - 40} ${y}`, { stroke: C.mid, 'stroke-width': 3 });
      pth(svg, `M${x - 56} ${y - 14} L${x - 40} ${y} L${x - 56} ${y + 14}`, { stroke: C.mid, 'stroke-width': 3 });
      for (let i = 0; i < D.plan.value; i++) dot(svg, x + 30 + i * 62, y, 20.5, { fill: 'none', stroke: C.accent, 'stroke-width': 4 });
      T(svg, x, y + 130, String(D.plan.value), { size: 96, weight: 600, fill: C.accent });
      T(svg, x + 80, y + 122, 'planned, a target', { size: 34, fill: C.muted });
    }
  },
});

// 8 ---------------------------------------------------------------------------
add({
  id: 'walkback', start: '5:45', clicks: ['Klarna', 'Commonwealth Bank', 'title'], builds: 3, label: 'Repainting, twice',
  title: 'Both had to walk it back.',
  source: 'Klarna, press release, 27 Feb 2024 (700: company estimate); Entrepreneur, 9 May 2025; Information Age, Aug 2025 (Commonwealth Bank).',
  notes: `<p>From the street, repainting looks the same for a while, and it's cheaper. But if nothing changes behind the agent, the saving usually comes from the staff. In February 2024 Klarna had stopped hiring and said its assistant did the work of seven hundred service agents, by its own estimate. In 2025 it was hiring people again. Commonwealth Bank went the same way faster: forty-five roles declared redundant for a voice bot, the decision withdrawn within weeks. <b>Both had to walk it back.</b></p>`,
  draw(page, b, data, ctx) {
    const svg = svgOf(page);
    chrome(svg, this, b, ctx);
    const ax0 = 620, ax1 = 1800, ay = 800;
    const M = (s) => { const [y, m] = s.split('-').map(Number); return ax0 + ((y - 2024) * 12 + (m - 1) + 0.5) / 24 * (ax1 - ax0); };
    ln(svg, ax0, ay, ax1, ay, { stroke: C.mid, 'stroke-width': 3 });
    for (let k = 0; k <= 24; k += 3) { const x = ax0 + k / 24 * (ax1 - ax0); ln(svg, x, ay - (k % 12 ? 6 : 14), x, ay + (k % 12 ? 6 : 14), { stroke: C.mid, 'stroke-width': 2 }); }
    [2024, 2025].forEach((yy) => T(svg, ax0 + (yy - 2024) * (ax1 - ax0) / 2 + 8, ay + 50, String(yy), { size: 34, fill: C.muted }));
    const lane = (c, y, name, gap) => {
      const x0 = M(c.cut.month), x1 = M(c.back.month);
      T(svg, L, y + 14, name, { size: 42, weight: 600 });
      T(svg, L, y + 62, gap, { size: 34, fill: C.muted });
      ln(svg, x0, y, x1, y, { stroke: C.ink, 'stroke-width': 6 });
      dot(svg, x0, y, 16, { fill: C.ink });
      dot(svg, x1, y, 16, { fill: C.paper, stroke: C.ink, 'stroke-width': 5 });
      ln(svg, x0, y + 18, x0, ay, { stroke: C.hair, 'stroke-width': 2 });
      ln(svg, x1, y + 18, x1, ay, { stroke: C.hair, 'stroke-width': 2 });
      return { x0, x1 };
    };
    const [kl, cba] = data.repaint.cases;
    const a = lane(kl, 420, 'Klarna', 'after 15 months');
    T(svg, a.x0 - 16, 376, 'Feb 2024: the work of 700 agents, by Klarna’s estimate', { size: 36 });
    T(svg, a.x1 + 16, 484, 'May 2025: hiring again', { size: 36, anchor: 'end' });
    if (b >= 1) {
      const c = lane(cba, 640, 'Commonwealth Bank', 'after weeks');
      T(svg, c.x1 + 16, 596, 'Jul 2025: 45 roles redundant for a voice bot', { size: 36, anchor: 'end' });
      T(svg, c.x0 - 30, 704, 'Aug 2025: withdrawn, “error”', { size: 36, anchor: 'end' });
    }
  },
});

// 9 ---------------------------------------------------------------------------
add({
  id: 'staff', start: '6:40', clicks: ['no dismissals to 2028', 'about 4,000 a year', 'title'], builds: 3, label: 'First brick', brick: 1,
  title: 'First brick: the staff stay.',
  source: 'Deutsche Telekom and ver.di, agreement of May 2026 (about 60,000 employees under its collective agreements); Deutsche Telekom, HR Factbook 2025, company figures (totals added by me).',
  notes: `<p>The harder question is what the wall looks like in Germany. Three bricks matter. The first is the staff. This May, Telekom and ver.di agreed: no dismissals for business reasons until the end of 2028. People still go by agreed routes: partial retirement, early retirement, severance. From 2021 to 2025 that was about four thousand full-time positions a year, across Telekom in Germany. Sixteen every working day. Any saving has to fit into that. I think that helps more than it hurts: the people who stay are the first ones to train. <b>First brick: the staff stay.</b></p>`,
  draw(page, b, data, ctx) {
    const svg = svgOf(page);
    chrome(svg, this, b, ctx);
    const E = data.exits;
    T(svg, L, 340, 'No dismissals for business reasons until 31 December 2028', { size: 44, weight: 600 });
    T(svg, L, 392, 'Telekom and ver.di, May 2026; about 60,000 employees under its collective agreements', { size: 32, fill: C.muted });
    if (b >= 1) {
      ln(svg, L, 440, R, 440, { stroke: C.hair, 'stroke-width': 2 });
      T(svg, L, 506, 'Still, positions leave Telekom in Germany by agreed routes', { size: 36, weight: 600 });
      T(svg, L, 550, 'one dot is 50 full-time positions', { family: 'serif', italic: true, size: 32, fill: C.muted });
      const per = E.unit.positionsPerMark, gx = 250, x0 = 640, ybase = 900;
      E.years.forEach((yr, i) => {
        const tot = E.totals.values[i], n = Math.round(tot / per), cols = 9, pitch = 22;
        const x = x0 + i * gx;
        for (let k = 0; k < n; k++) dot(svg, x + (k % cols) * pitch + 9, ybase - Math.floor(k / cols) * pitch - 9, 8, { fill: C.ink });
        T(svg, x + cols * pitch / 2, ybase + 46, String(yr), { size: 32, fill: C.muted, anchor: 'middle' });
        T(svg, x + cols * pitch / 2, ybase - Math.ceil(n / cols) * pitch - 18, tot.toLocaleString('en-US'), { size: 32, fill: C.muted, anchor: 'middle' });
      });
      T(svg, L, 650, 'about', { size: 40, fill: C.accent, weight: 600 });
      T(svg, L, 800, '4,000', { size: 130, weight: 600, fill: C.accent });
      T(svg, L, 872, 'a year, 2021 to 2025', { size: 36, fill: C.accent, weight: 600 });
      T(svg, L, 920, '20,223 in five years', { size: 32, fill: C.muted });
    }
  },
});

// 10 --------------------------------------------------------------------------
add({
  id: 'monitoring', start: '7:45', clicks: ['79%', 'title'], builds: 2, label: 'Second brick', brick: 2,
  title: 'Nearly four in five Germans see monitoring at work as bad.',
  source: 'European Commission, Special Eurobarometer 554, Artificial Intelligence and the future of work (asked in the EU only).',
  notes: `<p>The second brick starts with a worry. The EU asked people about digital monitoring at work. In Germany nearly four in five see it as a bad thing. On AI and jobs, Germans are no more pessimistic than Americans; on monitoring at work they are. Any new system here has to answer that first. <b>Nearly four in five Germans see monitoring at work as bad.</b></p>`,
  draw(page, b, data, ctx) {
    const svg = svgOf(page);
    chrome(svg, this, b, ctx);
    const P = data.attitudes.panels.find((p) => p.standsOut);
    const v = P.rows[0].value;
    T(svg, L, 380, 'Digital monitoring of workers: seen as negative, Germany', { size: 36, weight: 600 });
    T(svg, L, 540, `${v}%`, { size: 150, weight: 600, fill: C.accent });
    dotRow(svg, 500, 440, 100, v, { cols: 50, pitch: 26, r: 9.5, group: 10, groupGap: 14, fill: C.accent });
    T(svg, 500, 560, 'one dot is 1%', { family: 'serif', italic: true, size: 32, fill: C.muted });
    T(svg, L, 700, 'second-highest in the EU, after Sweden (80%)', { size: 34, fill: C.muted });
  },
});

// 11 --------------------------------------------------------------------------
add({
  id: 'checks', start: '8:10', clicks: ['United States', 'Germany: the two rules', 'since 2021', 'title'], builds: 4, label: 'Second brick', brick: 2,
  title: 'Second brick: here the checks come first.',
  source: 'BetrVG § 87(1) no. 6; AI Act Art. 50 (Regulation (EU) 2024/1689, as amended by 2026/1744); Telekom group framework agreement on IT systems, March 2021 (Bargmann 2022); T-Mobile US, press release, Sep 2024. Lengths schematic, not measured.',
  notes: `<p>German law makes it answer before launch. At T-Mobile I found no say for the staff before launch. Here, two rules matter most. One: a system that can watch the staff needs the works council to agree before it runs. Two: since August, the AI Act says customers must be told when they talk to an AI system. And here Telekom is ahead. In 2021 it agreed the rules with its works council once: nobody gets watched as a person, and results are only looked at in groups of more than five, without names. A system inside those rules needs no new decision. <b>Second brick: here the checks come first.</b></p>`,
  draw(page, b, data, ctx) {
    const svg = svgOf(page);
    chrome(svg, this, b, ctx);
    const S = data.permits.schedule;
    const x0 = 560, x1 = 1800, X = (u) => x0 + u / S.span * (x1 - x0);
    const lane = (y, label, sub, segs) => {
      T(svg, L, y + 14, label, { size: 40, weight: 600 });
      if (sub) T(svg, L, y + 58, sub, { size: 32, fill: C.muted });
      segs.forEach(([a, z, kind, word]) => {
        const st = kind === 'review' ? { fill: C.field, stroke: C.accent } : kind === 'build' ? { fill: 'none', stroke: C.ink } : { fill: 'none', stroke: C.mid, 'stroke-dasharray': '12 10' };
        rc(svg, X(a), y - 32, X(z) - X(a) - 8, 64, { ...st, 'stroke-width': 3 });
        T(svg, X(a) + 16, y + 13, word, { size: 34, fill: kind === 'launch' ? C.muted : C.ink, weight: kind === 'review' ? 600 : 400 });
      });
    };
    lane(360, 'United States', 'T-Mobile', [[0, S.us.build[1], 'build', 'build'], [S.us.launch[0], S.us.launch[1], 'launch', 'running']]);
    S.us.checks.forEach((u) => dot(svg, X(u), 424, 9, { fill: C.ink }));
    T(svg, X(S.us.checks[0]) - 12, 470, 'checks afterwards: court cases, state rules', { size: 32, fill: C.muted });
    if (b >= 1) {
      lane(570, 'Germany', 'Telekom', [[S.de.review[0], S.de.review[1], 'review', 'checks first'], [S.de.build[0], S.de.build[1], 'build', 'build'], [S.de.launch[0], S.de.launch[1], 'launch', 'running']]);
      T(svg, X(0), 660, '1  works council agrees before it runs (§ 87(1) no. 6)', { size: 34 });
      T(svg, X(0), 706, '2  customers told they talk to an AI system (AI Act Art. 50, since Aug 2026)', { size: 34 });
    }
    if (b >= 2) {
      const F = S.de.framework;
      lane(830, 'Since 2021', 'framework agreement', [[F.review[0], F.review[1], 'review', 'short check'], [F.build[0], F.build[1], 'build', 'build'], [F.launch[0], F.launch[1], 'launch', 'running']]);
      T(svg, X(0), 916, 'nobody watched as a person; results only for groups of more than five', { size: 32, fill: C.muted });
    }
  },
});

// 12 --------------------------------------------------------------------------
add({
  id: 'knowhow', start: '9:35', clicks: ['missing knowledge', 'law, data protection', 'title'], builds: 3, label: 'Third brick', brick: 3,
  title: 'Third brick: missing knowledge first. The law after.',
  source: 'Federal Statistical Office (Destatis), 2025: firms with ten or more employees that considered AI and do not use it; several answers possible.',
  notes: `<p>The third brick is know-how. Destatis went to the firms that had looked at these tools and didn't use them, and asked: why not? More than seven in ten said they were missing the knowledge. Legal uncertainty and data protection came after, each about six in ten. Without your own people who understand your systems, you can buy a language model. You can screw it onto the wall. You can't cut it in. <b>Third brick: missing knowledge first. The law after.</b></p>`,
  draw(page, b, data, ctx) {
    const svg = svgOf(page);
    chrome(svg, this, b, ctx);
    const rows = data.obstacles.rows.slice(0, 3);
    T(svg, L, 360, 'Why firms in Germany (ten or more employees) that considered AI do not use it', { size: 34, weight: 600 });
    T(svg, L, 400, 'one dot is 2% of firms', { family: 'serif', italic: true, size: 32, fill: C.muted });
    rows.forEach((r, i) => {
      if (i > 0 && b < 1) return;
      const y = 500 + i * 150, first = i === 0;
      T(svg, L, y + 20, r.label, { size: 38, weight: first ? 600 : 400, fill: first ? C.accent : C.ink });
      dotRow(svg, 640, y - 4, 50, Math.round(r.value / 2), { cols: 50, pitch: 19, r: 7, group: 10, groupGap: 12, fill: first ? C.accent : C.mid });
      T(svg, 1780, y + 24, `${r.value}%`, { size: first ? 64 : 44, weight: 600, fill: first ? C.accent : C.ink, anchor: 'end' });
    });
  },
});

// 13–15: the eight steps --------------------------------------------------------
function stepRow(svg, data, active, done) {
  const steps = data.plan.steps, y = 310, x0 = L + 90, gap = (W - 180) / 7;
  ln(svg, x0, y, x0 + 7 * gap, y, { stroke: C.hair, 'stroke-width': 3 });
  steps.forEach((s, i) => {
    const x = x0 + i * gap, on = active.includes(i + 1), was = done.includes(i + 1);
    dot(svg, x, y, 26, on ? { fill: C.accent } : was ? { fill: C.mid } : { fill: C.paper, stroke: C.mid, 'stroke-width': 3 });
    T(svg, x, y + 11, String(i + 1), { size: 32, weight: 600, fill: on || was ? C.paper : C.muted, anchor: 'middle' });
    T(svg, x, y + 72, s.name, { size: 32, fill: on ? C.ink : C.muted, weight: on ? 600 : 400, anchor: 'middle', width: gap - 14, lh: 36 });
  });
}
const STEP_MEASURE = {
  1: 'cost per contact and repeat contacts today; with the agent, requests finished for good and their cost. No gain: stop here',
  4: 'cases per hour and repeat contacts, per team of more than five',
};

add({
  id: 'steps1', start: '10:25', clicks: ['step 1', 'step 2', 'steps 3 and 4', 'title'], builds: 4, label: 'How to address it',
  title: 'Measure first. Start beside the staff.',
  source: 'The order is my hypothesis. Step 4: no control of individuals under the 2021 framework agreement. Bitkom 2025: 51% of firms with 20 or more staff strongly dependent on US digital technology.',
  notes: `<p>So how would I do it? Step one: before any agent, measure what one contact costs today and how often customers come back; then, with the agent, how many requests it finishes for good and what it costs. That's the business measure from this course, not accuracy. If it doesn't get better, the agent is the wrong tool and Telekom stops there. Step two: sign the works agreement while the system is still on paper. Steps three and four: keep the option to switch suppliers, since about half of German firms with twenty or more staff depend strongly on American technology, and train the staff before each new key, measuring teams, never single people. <b>Measure first. Start beside the staff.</b></p>`,
  draw(page, b, data, ctx) {
    const svg = svgOf(page);
    chrome(svg, this, b, ctx);
    const show = b >= 2 ? [1, 2, 3, 4] : b === 1 ? [1, 2] : [1];
    stepRow(svg, data, show, []);
    const st = data.plan.steps;
    show.forEach((n, k) => {
      const col = k % 2, row = Math.floor(k / 2), x = L + col * 880, y = 560 + row * 230;
      T(svg, x, y, `${n}`, { size: 72, weight: 600 });
      T(svg, x + 80, y - 20, st[n - 1].name, { size: 44, weight: 600 });
      T(svg, x + 80, y + 30, `measure: ${STEP_MEASURE[n] || st[n - 1].measure}`, { size: 34, fill: C.muted, width: 760, lh: 42 });
    });
  },
});

add({
  id: 'step5', start: '11:40', clicks: ['step 5: 14 → 3', 'keys need step 5', 'title'], builds: 3, label: 'How to address it',
  title: 'The biggest job is one customer record.',
  source: 'Deutsche Telekom, AI Investor Day, 5 Oct 2026 (14 ways today, 3 planned: company figures, 3 a target); T-Mobile US, Form 10-K 2025 and 10-Q Q3 2026 (write-off in Q3 2025).',
  notes: `<p>Step five. Fourteen ways of proving who you are become three, and the customer data becomes usable. An agent can't act on an account it can't identify. This is the channel cut into the brick. It takes years, and it can fail: in the third quarter of 2025 T-Mobile wrote off two hundred seventy-eight million dollars on a billing system it abandoned, about a tenth of its net income that quarter. <b>The biggest job is one customer record.</b></p>`,
  draw(page, b, data, ctx) {
    const svg = svgOf(page);
    chrome(svg, this, b, ctx);
    stepRow(svg, data, [5], [1, 2, 3, 4]);
    const D = data.rewire.de;
    T(svg, L, 540, '5', { size: 96, weight: 600 });
    T(svg, L + 100, 500, 'One customer record', { size: 56, weight: 600 });
    T(svg, L + 100, 552, 'measure: callers recognised without questions', { size: 34, fill: C.muted });
    T(svg, L + 100, 700, `${D.now.value} → ${D.plan.value}`, { size: 120, weight: 600, fill: C.accent });
    T(svg, L + 520, 664, 'ways to prove who you are', { size: 38 });
    T(svg, L + 520, 710, '3 is a target', { size: 34, fill: C.muted });
    if (b >= 1) {
      ln(svg, L, 790, R, 790, { stroke: C.hair, 'stroke-width': 2 });
      T(svg, L, 858, 'Keys that change an account need step 5.', { size: 44, weight: 600 });
      T(svg, L, 910, 'An agent can’t act on an account it can’t identify.', { size: 34, fill: C.muted });
    }
  },
});

add({
  id: 'steps68', start: '12:20', clicks: ['step 6: keys in stages', 'steps 7 and 8', 'process model', 'title'], builds: 4, label: 'How to address it',
  title: 'Then the keys: read first, risky changes last.',
  source: 'The order is my hypothesis.',
  notes: `<p>But reading doesn't have to wait. Step six: first the agent only reads, for customers already logged in: show a bill, check an order. Then actions you can undo. Last, the changes a fraudster could use, like a new bank account; the customer confirms those in the app. Each key is enforced by the systems, not by the model: the model can ask, the system decides. Steps seven and eight: each new key is an annex to the works agreement, staff and works council sign off before the agent works alone, and a named team runs it. As a process model, it's a project life cycle with a works-council gate and a stop point added. The order is my hypothesis. <b>Then the keys: read first, risky changes last.</b></p>`,
  draw(page, b, data, ctx) {
    const svg = svgOf(page);
    chrome(svg, this, b, ctx);
    const act = b >= 1 ? [6, 7, 8] : [6];
    stepRow(svg, data, act, [1, 2, 3, 4, 5]);
    T(svg, L, 540, '6', { size: 96, weight: 600 });
    T(svg, L + 100, 500, 'Keys in stages', { size: 52, weight: 600 });
    const stages = [['read', 'logged-in customers: a bill, an order'], ['undoable', 'actions that can be undone'], ['fraud-prone', 'confirmed by the customer in the app']];
    stages.forEach(([w, d], i) => {
      const x = L + 100 + i * 560;
      T(svg, x, 604, w, { size: 46, weight: 600, fill: i === 0 ? C.accent : C.ink });
      T(svg, x, 650, d, { size: 34, fill: C.muted, width: 460, lh: 40 });
      if (i < 2) pth(svg, `M${x + 470} 590 L${x + 520} 590 M${x + 506} 578 L${x + 520} 590 L${x + 506} 602`, { stroke: C.mid, 'stroke-width': 3 });
    });
    if (b >= 1) {
      ln(svg, L, 740, R, 740, { stroke: C.hair, 'stroke-width': 2 });
      T(svg, L, 810, '7', { size: 72, weight: 600 });
      T(svg, L + 80, 790, 'Acceptance', { size: 42, weight: 600 });
      T(svg, L + 80, 836, 'staff and works council sign off', { size: 34, fill: C.muted });
      T(svg, L + 880, 810, '8', { size: 72, weight: 600 });
      T(svg, L + 960, 790, 'Run it', { size: 42, weight: 600 });
      T(svg, L + 960, 836, 'a named team; cost per finished request', { size: 34, fill: C.muted });
      if (b >= 2) T(svg, L, 920, 'Process model: a project life cycle with a works-council gate and a stop point. Every new key: an annex to the works agreement.', { size: 34, width: W, lh: 42 });
    }
  },
});

// 16 --------------------------------------------------------------------------
add({
  id: 'close', start: '13:40', clicks: ['first', 'second', 'third', 'title', 'closing line'], builds: 5, label: 'Where this could be wrong',
  landings: { 3: 'Three things would prove me wrong.', 4: "Telekom can't import the 32%. It can copy the slow work behind it." },
  title: 'Three things would prove me wrong.',
  notes: `<p>If Telekom reports a German number like the thirty-two percent before its customer data is fixed, the record matters less than I think. If the service teams shrink faster than the agreed routes allow, the staff are leaving after all. If a works agreement comes months late, the law weighs more than I said. <b>Three things would prove me wrong.</b></p><p>(last build) People often say Germany is slow, and mean it as a weakness. Hall and Soskice argue the other way: economies like Germany's are better at step-by-step innovation than at radical innovation. Renovating is step-by-step work. <b>Telekom can't import the 32%. It can copy the slow work behind it.</b> Thank you.</p>`,
  draw(page, b, data, ctx) {
    const svg = svgOf(page);
    if (b < 4) {
      chrome(svg, this, b, { ...ctx, last: b === 3 });
      const items = [
        ['Telekom reports a German number like the 32%', 'before its customer data is fixed'],
        ['The service teams shrink faster', 'than the agreed routes allow'],
        ['A works agreement comes', 'months late'],
      ];
      items.forEach(([a, z], i) => {
        if (i > b) return;
        const y = 420 + i * 170;
        T(svg, L, y, String(i + 1), { size: 64, weight: 600 });
        T(svg, L + 80, y - 14, a, { size: 46, weight: 600 });
        T(svg, L + 80, y + 40, z, { size: 38, fill: C.muted });
      });
      return;
    }
    h('image', { href: '../../articles/renovate/art/house.png', x: 0, y: 0, width: 1920, height: 1080, preserveAspectRatio: 'xMidYMid slice' }, svg);
    T(svg, L, 420, 'Telekom can’t import the 32%.', { family: 'serif', size: 76, weight: 500, width: 820, lh: 86 });
    T(svg, L, 620, 'It can copy the slow work behind it.', { family: 'serif', size: 76, weight: 500, width: 820, lh: 86, fill: C.accent });
    T(svg, R, 1040, `16 / ${ctx.main}`, { size: 22, weight: 500, fill: C.muted, anchor: 'end' });
  },
});

// End slide, up during questions ---------------------------------------------------
add({
  id: 'end', end: true, builds: 1,
  notes: '<p>Questions. The backups follow; their page numbers are on the cue sheet (type the number in the PDF viewer).</p>',
  draw(page, b, data, ctx) {
    const svg = svgOf(page);
    T(svg, L, 300, 'Innovation Management for AI', { size: 32, weight: 500, fill: C.muted });
    T(svg, L, 420, 'Renovate, don’t repaint', { family: 'serif', size: 96, weight: 500 });
    T(svg, L, 540, 'Thank you. Questions?', { size: 52, weight: 600 });
    T(svg, L, 700, 'The article, with every source:', { size: 32, fill: C.muted });
    T(svg, L, 746, 'thd-ai.github.io/ws27-papers/renovate', { size: 36 });
    T(svg, L, 930, 'Alexander Rudaev', { size: 34, weight: 600 });
    T(svg, L, 976, 'TH Deggendorf, 12 December 2026', { size: 32, fill: C.muted });
  },
});

// Backups -------------------------------------------------------------------------
add({
  id: 'b1', backup: 'B1', builds: 1, label: 'Backup', title: 'The ten pairs: none compares fully.',
  source: 'Sources per row in the article, appendix. Company figures; targets and outlooks marked.',
  notes: '<p>Q3: why not compare the numbers directly?</p>',
  draw(page, b, data, ctx) {
    const svg = svgOf(page);
    chrome(svg, this, b, { ...ctx, last: true });
    const rows = data.pairs.rows;
    const cx = [L, L + 420, L + 680, L + 960], y0 = 300;
    ['What is counted', 'T-Mobile US', 'Telekom, Germany', 'Why they do not compare'].forEach((t, i) => T(svg, cx[i], y0, t, { size: 26, weight: 600, fill: C.muted }));
    ln(svg, L, y0 + 18, R, y0 + 18, { stroke: C.ink, 'stroke-width': 2 });
    const what = { 'Share handled by AI': 'Share started by an AI agent' };
    rows.forEach((r, i) => {
      const y = y0 + 66 + i * 64;
      T(svg, cx[0], y, `${r.n}. ${what[r.what] || r.what}`, { size: 26, weight: 600 });
      T(svg, cx[1], y, (r.us.show || r.us.absent || '').replace(/\[\[|\]\]/g, ''), { size: 26 });
      const tag = r.de.status === 'target' ? ' (target)' : r.de.status === 'ahead' ? ' (outlook)' : '';
      T(svg, cx[2], y, (r.de.show || r.de.absent || '').replace(/\[\[|\]\]/g, '') + tag, { size: 26 });
      T(svg, cx[3], y, r.why, { size: 24, fill: C.muted, width: 900 });
      ln(svg, L, y + 24, R, y + 24, { stroke: C.hair, 'stroke-width': 1.5 });
    });
  },
});

add({
  id: 'b2', backup: 'B2', builds: 1, label: 'Backup', title: 'Which rule bites, and when.',
  source: 'BetrVG §§ 76, 87, 90; GDPR Art. 35; AI Act (Regulation (EU) 2024/1689) as amended by Regulation (EU) 2026/1744.',
  notes: '<p>Q8–Q11: the law in detail.</p>',
  draw(page, b, data, ctx) {
    const svg = svgOf(page);
    chrome(svg, this, b, { ...ctx, last: true });
    const rows = [
      ['BetrVG § 90', 'the works council is told while the system is planned'],
      ['BetrVG § 87(1) no. 6', 'its agreement for any system suited to monitoring staff; if none, the conciliation board decides (§ 87(2), § 76)'],
      ['GDPR Art. 35', 'a data protection impact assessment before risky processing'],
      ['AI Act Art. 50', 'customers told they talk to an AI system, since 2 August 2026'],
      ['AI Act, high risk', 'a tool that monitors or evaluates employees can count as high risk; those duties from 2 December 2027'],
    ];
    rows.forEach(([a, z], i) => {
      const y = 360 + i * 124;
      T(svg, L, y, a, { size: 38, weight: 600 });
      T(svg, L + 520, y, z, { size: 32, width: 1200, lh: 40 });
    });
  },
});

add({
  id: 'b3', backup: 'B3', builds: 1, label: 'Backup', title: 'Keys enforced by the systems, not the model.',
  notes: '<p>Q12, Q13: prompt injection, fraud.</p>',
  draw(page, b, data, ctx) {
    const svg = svgOf(page);
    chrome(svg, this, b, { ...ctx, last: true });
    const rows = [
      ['read → undoable → fraud-prone', 'keys handed over in that order, each stage measured'],
      ['The model can ask, the system decides', 'permissions checked by the systems the agent calls'],
      ['A test set with hidden instructions', 'before each new key goes live'],
      ['Confirmation in the app', 'for changes a fraudster could use, like a new bank account'],
    ];
    rows.forEach(([a, z], i) => {
      const y = 380 + i * 140;
      T(svg, L, y, a, { size: 42, weight: 600 });
      T(svg, L, y + 50, z, { size: 32, fill: C.muted });
    });
  },
});

add({
  id: 'b4', backup: 'B4', builds: 1, label: 'Backup', title: 'On AI and jobs, not more hostile. On monitoring, yes.',
  source: 'Ipsos for Google 2025 and Ipsos AI Monitor 2025, in Stanford HAI AI Index 2026; Special Eurobarometer 554 (EU only).',
  notes: '<p>Q16: are Germans just against AI?</p>',
  draw(page, b, data, ctx) {
    const svg = svgOf(page);
    chrome(svg, this, b, { ...ctx, last: true });
    const P = data.attitudes.panels;
    const rowsY = [400, 600, 800];
    P.forEach((p, i) => {
      const y = rowsY[i];
      T(svg, L, y - 50, p.question.replace(/[“”]/g, '"'), { size: 32, weight: 600 });
      p.rows.forEach((r, k) => {
        const yy = y + k * 50;
        T(svg, L, yy + 14, r.country, { size: 28, fill: C.muted });
        dotRow(svg, 420, yy - 6, 50, Math.round(r.value / 2), { cols: 50, pitch: 22, r: 8, group: 10, groupGap: 10, fill: p.standsOut ? C.accent : C.ink });
        T(svg, 1680, yy + 16, `${r.value}%`, { size: 32, weight: 600, anchor: 'end' });
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
  id: 'b5', backup: 'B5', builds: 1, label: 'Backup', title: 'Sources.',
  source: 'Full list with links: the article, thd-ai.github.io/ws27-papers/renovate (sources).',
  notes: '<p>Any "where is that from?"</p>',
  draw(page, b, data, ctx) {
    const svg = svgOf(page);
    chrome(svg, this, b, { ...ctx, last: true });
    SOURCES.forEach(([a, z], i) => {
      const col = i < 10 ? 0 : 1, row = i % 10, x = L + col * 880, y = 300 + row * 66;
      T(svg, x, y, a, { size: 28, weight: 600 });
      T(svg, x, y + 30, z, { size: 24, fill: C.muted });
    });
  },
});

add({
  id: 'b6', backup: 'B6', builds: 1, label: 'Backup', title: 'How this was made.',
  notes: '<p>Q31: did you use AI?</p>',
  draw(page, b, data, ctx) {
    const svg = svgOf(page);
    chrome(svg, this, b, { ...ctx, last: true });
    const rows = [
      'Generative AI helped find and open sources, draft from my notes, and check every claim against its source. I decided what stays.',
      'The house drawing was generated with an image model from my own line drawing.',
      'The figures are drawn in code from the article’s data files; every number on these slides has its source on the slide and in B5.',
    ];
    rows.forEach((r, i) => T(svg, L, 380 + i * 170, r, { size: 40, width: 1600, lh: 52 }));
  },
});
