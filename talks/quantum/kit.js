// The slide kit of the Quantum talk: the page, the type, the colours and the
// frame every slide shares. The look is the article's (its colours, its grid
// code, its pen) at slide size; the frame is the Renovate deck's (a title that
// is the line said, a bottom band for the source and the page number).
import { h, text, textSize, penRing, g, circle, path, line, FONTS } from '../../lib/fig.js';

// Virgil, the article's face for the machines' names only.
FONTS.virgil = "'Virgil', 'Libre Franklin', sans-serif";

// The article's colours (articles/other-half/figures/shared.js).
export const C = {
  paper: '#FBFBFC', ink: '#15171C', muted: '#5C6370', hair: '#DADDE3', faint: '#E8EAEE',
  accent: '#4254C5', field: '#C9D3F7', mid: '#8A9099',
};

// Page geometry at 1920 x 1080 (a 13.33 in slide: 144 px per inch).
export const L = 120, R = 1800, W = R - L, TOP = 148, BAND = 1000;

export const ART = '../../articles/other-half/art/';
export const DECK_ART = './art/';
export const ARTICLE = 'https://thd-ai.github.io/ws27-papers/other-half/';

// Text: Libre Franklin unless asked otherwise; never under the floors the
// gate checks (32 px on main slides, 22 px in the bottom band).
export const T = (p, x, y, s, o = {}) => text(p, x, y, s, { family: 'sans', size: 36, fill: C.ink, free: true, ...o });
export const size = (s, o = {}) => textSize(s, { family: 'sans', size: 36, free: true, ...o });
export const ln = (p, x1, y1, x2, y2, o = {}) => h('line', { x1, y1, x2, y2, stroke: C.ink, 'stroke-width': 3, 'stroke-linecap': 'round', ...o }, p);
export const pth = (p, d, o = {}) => h('path', { d, fill: 'none', stroke: C.ink, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...o }, p);
export const rc = (p, x, y, w, hh, o = {}) => h('rect', { x, y, width: w, height: hh, fill: 'none', stroke: C.ink, 'stroke-width': 3, ...o }, p);
export const dot = (p, x, y, r, o = {}) => h('circle', { cx: x, cy: y, r, ...o }, p);
export { g, circle, path, line, h, penRing };

// A drawing from the article or the deck, placed by its pixel box.
export const img = (p, href, x, y, w, hh, o = {}) => h('image', { href, x, y, width: w, height: hh, preserveAspectRatio: 'xMidYMid meet', ...o }, p);

export function svgOf(page) {
  const svg = h('svg', { viewBox: '0 0 1920 1080', width: 1920, height: 1080, role: 'img' });
  page.appendChild(svg);
  const defs = h('defs', {}, svg);
  // the Virgil face for the machines' names, as in the article's film
  h('style', {}, defs).textContent = `@font-face { font-family: 'Virgil'; src: url('${ART}film-virgil.woff2') format('woff2'); }`;
  return svg;
}

// Text that links to the article in the HTML deck; it looks like the rest.
export const toArticle = (svg) => h('a', { href: ARTICLE, target: '_blank', rel: 'noopener', class: 'to-article' }, svg);

// The frame: the title (the line said at the last build), the source line in
// the bottom band, the slide number and the part it belongs to.
export function frame(svg, s, o = {}) {
  let bottom = TOP;
  if (s.title) {
    let sz = o.titleSize || 56;
    const width = o.titleWidth || 1560;
    if (size(s.title, { size: sz, weight: 600, width }).lines > 2) sz = 50;
    const t = T(svg, L, TOP, s.title, { size: sz, weight: 600, width, lh: sz * 1.16 });
    bottom = t.bottom;
  }
  ln(svg, L, BAND - 18, R, BAND - 18, { stroke: C.hair, 'stroke-width': 2 });
  if (s.source) T(svg, L, 1030, s.source, { size: 22, fill: C.muted, width: 1380, lh: 27 });
  if (s.n) {
    T(svg, R, 1036, `${s.n}`, { size: 28, weight: 600, anchor: 'end' });
    if (s.part) T(svg, R - 48, 1036, s.part, { size: 22, fill: C.muted, anchor: 'end' });
  }
  return bottom;
}

// A small label with a hairline leader to a point; the label measures itself
// so the leader starts after the words.
export function label(svg, x, y, str, to, o = {}) {
  const t = T(svg, x, y, str, { size: 32, ...o });
  if (to) {
    const sx = o.anchor === 'end' ? t.x - 14 : t.right + 14;
    ln(svg, sx, t.cy, to[0], to[1], { stroke: C.ink, 'stroke-width': 2 });
  }
  return t;
}

// The article's grid at slide size: drawn by its own grid() (one look with
// the article), then thickened for the projector (plan, section 2): tile and
// qubit strokes 3 px at full opacity, the fired edge 3 px, helper dots at
// least 6 px, the fired dot at least 10 px.
import { grid as articleGrid, surface, errMark as articleErr, tile } from '../../articles/other-half/figures/shared.js';
export { surface, tile };
export function slideGrid(parent, o) {
  const G = articleGrid(parent, { C, helper: Math.max(6, o.pitch * 0.07), ...o });
  Object.values(G.tiles).forEach((t) => {
    t.base.setAttribute('stroke-width', 3); t.base.setAttribute('stroke-opacity', 1);
    t.base.setAttribute('stroke', t.check.asks_about === 'flips' ? C.ink : C.muted);
    // the flip tint a little deeper than the article's 0.075, for the projector
    if (t.check.asks_about === 'flips') t.base.setAttribute('fill-opacity', 0.16);
    t.field.setAttribute('stroke-width', 3);
    t.dot.setAttribute('r', Math.max(10, o.pitch * 0.15));   // the dot carries 'fired' on either kind of tile
    if (t.helper) t.helper.setAttribute('r', Math.max(6, o.pitch * 0.065));
    // on slides a fired check looks the same on both kinds of tile (field and
    // large dot); the kind stays in the outline (ink for flips, grey for phase)
    const fired = t.setFired.bind(t), flips = t.check.asks_about === 'flips';
    t.setFired = (p) => { fired(p); if (flips) t.base.setAttribute('fill-opacity', p > 0.001 ? 0 : 0.16); };
  });
  G.qubits.forEach((q) => q.el.setAttribute('stroke-width', 3));
  return G;
}
// An error mark at slide size: X a flip, Z a phase error, Y both; real errors
// filled, the decoder's guess open.
export const errMark = (p, x, y, r, letter, kind = 'real') => {
  const m = articleErr(p, x, y, r, letter, C, kind);
  m.querySelectorAll('circle').forEach((c) => c.setAttribute('stroke-width', 3));
  return m;
};

// A backup slide: the title, then ruled rows of [label, line, line…] or a
// table (head + rows). Backups use the 24 px floor; they answer questions.
export function backup(svg, s, o = {}) {
  frame(svg, { title: s.title, n: s.n, part: 'Backup', source: s.source }, { titleSize: 48 });
  let y = o.y0 || 300;
  if (o.rows) o.rows.forEach(([k, ...lines]) => {
    ln(svg, L, y, R, y, { stroke: C.hair, 'stroke-width': 2 });
    T(svg, L, y + 46, k, { size: 32, weight: 600 });
    lines.forEach((t, i) => T(svg, L + (o.kw || 360), y + 46 + i * 40, t, { size: 30 }));
    y += 46 + lines.length * 40 + 24;
  });
  if (o.table) {
    const { head, rows, xs } = o.table;
    head.forEach((t, i) => T(svg, xs[i], y + 30, t, { size: 26, weight: 600, anchor: i ? 'end' : 'start' }));
    y += 50; ln(svg, L, y, R, y, { stroke: C.ink, 'stroke-width': 2 });
    rows.forEach((r) => { y += 52; r.forEach((t, i) => T(svg, xs[i], y, t, { size: 28, anchor: i ? 'end' : 'start', weight: i === 1 ? 600 : 400, fill: i === 1 ? C.accent : C.ink })); });
  }
  return y;
}

// ---------------------------------------------------------------------------
// The article's own figures on a slide (his rule of 23 November: the deck's
// visuals must be the article's, which he approved). A figure module from
// articles/other-half/figures is mounted into a box on the page and set to
// the end of one of its steps; reduced motion, so nothing idles.
// Returns the box and the scale from the figure's own units to the page, so
// hand strokes can be laid over exact points of the figure.
// the article's muted grey (#5C6370) washes out on a projector: a darker one on slides
const FIG_CSS = { '--ink': C.ink, '--paper': C.paper, '--muted': '#3A3F48', '--hairline': C.hair, '--accent': C.accent, '--field': C.field };
export function articleFigure(page, mod, step, box, data, o = {}) {
  const layout = o.layout || 'wide';
  // Mounted at a narrow width and scaled up: the figure's own lettering floor
  // (lib/fig.js, 11.5 px on screen, 9 on paper) then lands at about 32 px on
  // the slide, the deck's floor, while the drawing keeps the article's look.
  const paper = document.documentElement.classList.contains('is-print');
  const k = (o.textPx || 32) / (paper ? 9 : 11.5);
  const el = document.createElement('div');
  el.className = 'article-figure';
  Object.assign(el.style, { position: 'absolute', left: `${box.x}px`, top: `${box.y}px`, width: `${box.w / k}px`, transform: `scale(${k})`, transformOrigin: '0 0' });
  page.appendChild(el);
  const h = mod.default(el, { layout, print: false, reduced: true, data, css: (n) => FIG_CSS[n] || '', where: o.where || 'scene' });
  if (h && h.set) h.set(step, 1);
  const vb = el.querySelector('svg').viewBox.baseVal;
  // fit the height too: a tall figure is scaled down (its lettering with it)
  const maxH = o.maxH || 960 - box.y, fullH = box.w * (vb.height / vb.width);
  if (fullH > maxH) {
    const f = maxH / fullH, w2 = box.w * f;
    el.style.transform = `scale(${k * f})`;
    el.style.left = `${box.x + (box.w - w2) / 2}px`;
    box = { ...box, x: box.x + (box.w - w2) / 2, w: w2 };
  }
  return { el, k: box.w / vb.width, x: box.x, y: box.y, h: box.w * (vb.height / vb.width), at: (fx, fy) => [box.x + fx * (box.w / vb.width), box.y + fy * (box.w / vb.width)] };
}

// ---------------------------------------------------------------------------
// Hand strokes, as Excalidraw draws them (rough.js, the library Excalidraw
// uses): an ink layer above everything else on the page. Colours from
// Excalidraw's own stroke palette where a mark needs one.
import rough from '../../lib/vendor/rough.esm.js';
export const PEN = { ink: '#1e1e1e', red: '#e03131', green: '#2f9e44', blue: '#1971c2', orange: '#f08c00' };
export function inkLayer(page) {
  const svg = h('svg', { viewBox: '0 0 1920 1080', width: 1920, height: 1080, class: 'ink' });
  Object.assign(svg.style, { position: 'absolute', left: 0, top: 0, pointerEvents: 'none' });
  page.appendChild(svg);
  const rc = rough.svg(svg);
  const base = (o) => ({ roughness: 1.6, bowing: 1.2, strokeWidth: 3, stroke: PEN.ink, seed: o.seed || 7, ...o });
  const api = {
    svg,
    line: (x1, y1, x2, y2, o = {}) => svg.appendChild(rc.line(x1, y1, x2, y2, base(o))),
    curve: (pts, o = {}) => svg.appendChild(rc.curve(pts, base(o))),
    ellipse: (cx, cy, w, hh, o = {}) => svg.appendChild(rc.ellipse(cx, cy, w, hh, base(o))),
    rect: (x, y, w, hh, o = {}) => svg.appendChild(rc.rectangle(x, y, w, hh, base(o))),
    // an arrow: a curved shaft through a middle point and an open two-stroke head
    arrow(pts, o = {}) {
      const shaft = pts.length > 2 ? rc.curve(pts, base(o)) : rc.line(pts[0][0], pts[0][1], pts[1][0], pts[1][1], base(o));
      svg.appendChild(shaft);
      const [ax, ay] = pts[pts.length - 2], [bx, by] = pts[pts.length - 1];
      const a = Math.atan2(by - ay, bx - ax), L0 = o.head || 30, sp = 0.45;
      [a + Math.PI - sp, a + Math.PI + sp].forEach((t, i) => svg.appendChild(rc.line(bx, by, bx + L0 * Math.cos(t), by + L0 * Math.sin(t), base({ ...o, seed: (o.seed || 7) + i + 1 }))));
    },
    // a handwritten note in Virgil, Excalidraw's own face
    note: (x, y, s, o = {}) => T(svg, x, y, s, { family: 'virgil', size: 34, fill: o.color || PEN.ink, ...o }),
  };
  return api;
}
