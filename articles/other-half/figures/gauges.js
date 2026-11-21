// gauges: section 4's analogy. Three blocks in a row and a glass strip where
// two blocks meet; the strip cracks if one block moves against the other, up
// or down, and says nothing else. Two different stories crack the same two
// strips, and the one story that moves all three cracks none.
//
// The block and the strip are his approved drawings (art/tt-block.png and
// art/tt-strip.png; trimmed copies in figures/tt/, because the builder copies
// only the opening drawing from art/). Everything else is placed by code: the
// row, the ground line, every crack (one diagonal shear line), every lit mark
// (the article's fired state: accent field and solid dot, as in lattice), the
// dotted levels and all words. Which strips crack is read from
// data/gauges.json, which tools/other-half-data.mjs computes and checks.
import { mountFigure, svgRoot, g, h, line, rect, circle, leader, stage, ease, span } from '../../../lib/fig.js';
import { pal, text, floor, show } from './shared.js';

export const steps = 4;
// the row and the key; the cracks and the question; the two guesses; all three move
export const durations = { large: [2.4, 1.8, 2.2, 2.4] };
const SIZE = { wide: [720, 450], tall: [360, 368], print: [720, 446] };
export const aspect = { wide: SIZE.wide[0] / SIZE.wide[1], tall: SIZE.tall[0] / SIZE.tall[1] };

// The drawings, in their own pixels (figures/tt/*.png).
const ART = {
  block: { href: new URL('./tt/block.png', import.meta.url).href, w: 504, h: 343, wallL: 10, wallR: 489, roof: 6, base: 333, stripY: 270 },
  strip: { href: new URL('./tt/strip.png', import.meta.url).href, w: 723, h: 195, glass: [118, 70, 610, 128] },
};
const image = (parent, a, x, y, w, hh) => h('image', { href: a.href, x: +x.toFixed(2), y: +y.toFixed(2), width: +w.toFixed(2), height: +hh.toFixed(2), preserveAspectRatio: 'none' }, parent);

// One row of three blocks standing on a ground line.
//   o: x0 (left wall of the first block), ground (y), wall (width of a
//   block's wall), gap (between two walls), k (strip width / wall width),
//   dot (radius of the lit dot), dropped (blocks one step down), drop (px).
function row(parent, C, o) {
  const B = ART.block, S = ART.strip;
  const s = o.wall / (B.wallR - B.wallL), bh = B.h * s, bw = B.w * s;
  const grp = g(parent), moving = g(grp), ground = g(grp);
  const blocks = [], strips = [];
  const dropOf = (i) => (o.dropped && o.dropped.includes(i) ? o.drop : 0);
  for (let i = 0; i < 3; i++) {
    const left = o.x0 + i * (o.wall + o.gap);
    const bg = g(moving);
    const y = o.ground - B.base * s;
    blocks.push({ el: bg, img: image(bg, B, left - B.wallL * s, y + dropOf(i), bw, bh), left, right: left + o.wall, roof: y + B.roof * s, top: y });
  }
  const pw = o.wall * o.k, ph = (pw * S.h) / S.w;
  for (let j = 0; j < 2; j++) {
    const cx = o.x0 + (j + 1) * o.wall + j * o.gap + o.gap / 2;
    const cy = o.ground - (B.base - B.stripY) * s + Math.max(dropOf(j), dropOf(j + 1));
    const sg = g(moving);
    image(sg, S, cx - pw / 2, cy - ph / 2, pw, ph);
    const [gx0, gy0, gx1, gy1] = S.glass.map((v, n) => (n % 2 === 0 ? cx - pw / 2 + (v * pw) / S.w : cy - ph / 2 + (v * ph) / S.h));
    // the lit mark: the accent field over the glass, a solid dot above the strip
    const lit = g(sg, { 'data-audit': 'skip' });
    rect(lit, gx0, gy0, gx1 - gx0, gy1 - gy0, { fill: C.field, stroke: C.accent, 'stroke-width': 1, rx: 1 });
    circle(lit, cx, cy - ph / 2 - o.dot - Math.max(2, ph * 0.12), o.dot, { fill: C.accent });
    // the crack: one diagonal shear line through the strip, at the gap
    const crack = line(sg, cx - ph * 0.2, cy - ph * 0.42, cx + ph * 0.2, cy + ph * 0.42, { stroke: C.ink, 'stroke-width': Math.max(1.4, ph * 0.075), 'stroke-linecap': 'round', 'data-audit': 'skip' });
    lit.style.display = 'none'; crack.style.display = 'none';
    strips.push({ el: sg, lit, crack, cx, cy, top: cy - ph / 2, bottom: cy + ph / 2, ph });
  }
  // the ground line lies in front: a block that drops goes below it
  const gl = line(ground, o.x0 - o.over, o.ground, o.x0 + 3 * o.wall + 2 * o.gap + o.over, o.ground, { stroke: C.ink, 'stroke-width': 1.25, 'stroke-linecap': 'round' });
  const crackStrip = (j, on) => { show(strips[j].crack, on); show(strips[j].lit, on); };
  return { grp, moving, ground: gl, blocks, strips, s, bh, right: o.x0 + 3 * o.wall + 2 * o.gap, crackStrip };
}

// A dotted line at a level, where the roof stood before.
const level = (parent, C, x1, x2, y) => line(parent, x1, y, x2, y, { stroke: C.muted, 'stroke-width': 1.1, 'stroke-dasharray': '1.5 3.5', 'stroke-linecap': 'round' });

function build(el, ctx) {
  const tall = ctx.layout === 'tall', print = !!ctx.print;
  floor(tall ? 13.8 : 12.45);
  const C = pal(ctx), d = ctx.data;
  const [W, H] = SIZE[print ? 'print' : tall ? 'tall' : 'wide'];
  const story = (id) => d.stories.find((s) => s.id === id);
  const mid = story('middle'), ends = story('ends'), all = story('all');
  const svg = svgRoot(el, W, H,
    `Three blocks in a row with a glass strip where two blocks meet; a strip cracks if one block moves against the other, up or down. `
    + `Both strips have cracked. ${mid.label[0].toUpperCase()}${mid.label.slice(1)} Or ${ends.label} Either cracks the same two strips. `
    + 'If all three move, nothing cracks, so nobody can tell, and the level of the row was what was stored.');
  svg.style.color = C.ink;
  const st = stage();

  const keyHead = 'a glass strip where two blocks meet';
  const keyBody = 'it cracks if one block moves against the other, up or down';
  const question = 'Both strips cracked since the last look. Which block moved?';
  const tooSmall = 'The move is far too small to see; only the glass shows it.';
  const same = 'either one cracks the same two strips';
  const silent = 'All three moved: nothing cracks, so nobody can tell, and the level of the row was what was stored.';
  const before = 'level before';

  // ---- print: one composite with all four states' facts -------------------
  if (print) {
    const M = row(svg, C, { x0: 24, ground: 214, wall: 110, gap: 9, k: 0.5, dot: 4, over: 12 });
    d.look_shown.forEach((j) => M.crackStrip(j, 1));
    text(svg, 24, 40, question, { italic: true, size: 15, width: 370, lh: 19 });
    const kx = 440, kw = 220, kh = (kw * ART.strip.h) / ART.strip.w;
    image(svg, ART.strip, kx, 34, kw, kh);
    const kt = text(svg, kx, 34 + kh + 24, keyHead, { family: 'sans', size: 13.5, weight: 500 });
    text(svg, kx, kt.bottom + 16, keyBody, { italic: true, size: 14, width: 250 });
    line(svg, 24, 250, W - 24, 250, { stroke: C.hairline, 'stroke-width': 1 });
    [mid, ends].forEach((sto, n) => {
      const x0 = 24 + n * 232;
      text(svg, x0, 300, sto.label, { family: 'sans', size: 13.5, weight: 500 });
      const R = row(svg, C, { x0, ground: 360, wall: 62, gap: 6, k: 0.62, dot: 3.4, over: 6, dropped: sto.dropped, drop: 5 });
      sto.cracked.forEach((j) => R.crackStrip(j, 1));
      sto.dropped.forEach((i) => level(svg, C, R.blocks[i].left - 2, R.blocks[i].right + 2, R.blocks[i].roof));
    });
    text(svg, 24, 392, same, { italic: true, size: 13.5, fill: C.muted });
    const x0 = 492, S3 = row(svg, C, { x0, ground: 360, wall: 62, gap: 6, k: 0.62, dot: 3.4, over: 6, dropped: all.dropped, drop: 5 });
    level(svg, C, x0 - 6, S3.right + 6, S3.blocks[0].roof);
    text(svg, x0, 300, all.label, { family: 'sans', size: 13.5, weight: 500 });
    text(svg, x0, 392, 'nothing cracks, so nobody can tell, and the level of the row was what was stored', { italic: true, size: 13.5, width: 204, fill: C.muted });
    text(svg, x0 + 204, S3.blocks[0].roof - 4, before, { italic: true, size: 12, anchor: 'end', fill: C.muted });
    return { set() {} };
  }

  // ---- screen ---------------------------------------------------------------
  const L = tall
    ? {
      main: { x0: 20, ground: 186, wall: 100, gap: 10, k: 0.55, dot: 4, over: 10 },
      drop: 8, top: { x: 16, y: 26, w: 328 }, key: { x: 16, y: 10, w: 118 }, keyText: { x: 146, y: 24, w: 198 },
      guess: { xs: [134, 134], grounds: [266, 334], wall: 68, gap: 7, k: 0.62, dot: 3.4, over: 6, drop: 6, labelX: 16, labelW: 104 }, same: { x: W / 2, y: 360 },
      qSize: 15, beforeAt: 'left',
    }
    : {
      main: { x0: 96, ground: 262, wall: 168, gap: 12, k: 0.42, dot: 4.5, over: 22 },
      drop: 12, top: { x: 96, y: 58, w: 540 }, key: { x: 96, y: 38, w: 232 }, keyText: { x: 352, y: 56, w: 350 },
      guess: { xs: [70, 382], ground: 400, wall: 84, gap: 8, k: 0.52, dot: 3.5, over: 10, drop: 6, label: 324 }, same: { x: W / 2, y: 436 },
      qSize: 17, beforeAt: 'right',
    };

  // the main row
  const M = row(svg, C, L.main);
  // step 0: the ground line draws from the left, the blocks arrive left to right, then the strips
  st.draw(M.ground, 0.02, 0.32);
  M.blocks.forEach((b, i) => st.fade(b.el, 0.06 + i * 0.1, 0.26 + i * 0.1));
  M.strips.forEach((sp, j) => st.fade(sp.el, 0.4 + j * 0.06, 0.56 + j * 0.06));

  // the key: the strip once, large, and what it does
  const key = g(svg), keyStrip = g(key), keyWords = g(key);
  const kh = (L.key.w * ART.strip.h) / ART.strip.w;
  image(keyStrip, ART.strip, L.key.x, L.key.y, L.key.w, kh);
  const k1 = text(keyWords, L.keyText.x, L.keyText.y, keyHead, { family: 'sans', size: 14, weight: 500, width: L.keyText.w });
  text(keyWords, L.keyText.x, k1.bottom + 17, keyBody, { italic: true, size: 14.5, width: L.keyText.w });
  // a leader from the key down the gap to the first strip on the row
  const s0 = M.strips[0];
  const kl = leader(keyStrip, s0.cx, L.key.y + kh + 4, s0.cx, s0.top - 3, { stroke: C.muted, dot: false });
  st.fade(keyStrip, 0.5, 0.68, [1, 1.16]).fade(keyWords, 0.64, 0.86, [1, 1.16]);
  void kl;

  // step 1: the strips crack and light, then the question; the blocks don't move
  const shown = d.look_shown;
  const q = g(svg), qa = g(q), qb = g(q);
  const qt = text(qa, L.top.x, L.top.y, question, { italic: true, size: L.qSize, width: L.top.w, lh: L.qSize + 5 });
  text(qb, L.top.x, qt.bottom + (tall ? 18 : 20), tooSmall, { italic: true, size: tall ? 13.8 : 14, width: L.top.w, fill: C.muted });
  st.fade(qa, 1.5, 1.74, [3, 3.14]).fade(qb, 1.66, 1.9, [3, 3.14]);

  // step 2: the two guesses, small, each cracking the same strips
  const guesses = [mid, ends].map((sto, n) => {
    const grp = g(svg);
    const x0 = L.guess.xs[n];
    const R = row(grp, C, { ...L.guess, x0, ground: L.guess.grounds ? L.guess.grounds[n] : L.guess.ground, dropped: sto.dropped });
    if (L.guess.labelX != null) text(grp, L.guess.labelX, R.blocks[0].roof + 20, sto.label, { family: 'sans', size: 14, weight: 500, width: L.guess.labelW });
    else text(grp, x0, L.guess.label, sto.label, { family: 'sans', size: 14, weight: 500 });
    sto.cracked.forEach((j) => R.crackStrip(j, 1));
    // where each guessed block's roof stood before it dropped
    sto.dropped.forEach((i) => level(grp, C, R.blocks[i].left - 2, R.blocks[i].right + 2, R.blocks[i].roof));
    return grp;
  });
  st.fade(guesses[0], 2.04, 2.36, [3, 3.14]).fade(guesses[1], 2.38, 2.7, [3, 3.14]);
  const sameG = g(svg);
  text(sameG, L.same.x, L.same.y, same, { italic: true, size: tall ? 13.8 : 14, anchor: 'middle', fill: C.muted });
  st.fade(sameG, 2.72, 2.94, [3, 3.14]);

  // the cracks: on from step 1, gone at step 3 (a new look: cracked strips were replaced)
  st.on((gg) => {
    shown.forEach((j, n) => {
      const a = 1.08 + n * 0.16;
      const p = ease(span(gg, a, a + 0.2)) * (1 - ease(span(gg, 3.02, 3.16)));
      const sp = M.strips[j];
      if (!show(sp.crack, p > 0.001 ? 1 : 0)) { show(sp.lit, 0); return; }
      // the crack runs through the strip from its upper end, then the mark lights
      const c = ease(span(gg, a, a + 0.12)) * (1 - ease(span(gg, 3.02, 3.16)));
      sp.crack.setAttribute('pathLength', '1');
      if (c >= 0.999) { sp.crack.removeAttribute('stroke-dasharray'); sp.crack.removeAttribute('stroke-dashoffset'); }
      else { sp.crack.setAttribute('stroke-dasharray', '1 1'); sp.crack.setAttribute('stroke-dashoffset', (1 - c).toFixed(4)); }
      show(sp.lit, ease(span(gg, a + 0.08, a + 0.24)) * (1 - ease(span(gg, 3.02, 3.16))));
    });
  });

  // step 3: all three drop one step together; nothing cracks; the old level dotted
  st.on((gg) => {
    const m = ease(span(gg, 3.18, 3.56));
    const v = m > 0 ? `translate(0 ${(m * L.drop).toFixed(2)})` : null;
    if (v) M.moving.setAttribute('transform', v); else M.moving.removeAttribute('transform');
  });
  const lv = g(svg);
  const roof = M.blocks[0].roof;
  const lvLine = level(lv, C, L.main.x0 - L.main.over, M.right + L.main.over, roof);
  st.fade(lvLine, 3.5, 3.7);
  const lvT = g(lv);
  if (L.beforeAt === 'right') text(lvT, M.right + L.main.over + 6, roof + 4, before, { italic: true, size: 12.5, fill: C.muted });
  else text(lvT, L.main.x0, roof - 6, before, { italic: true, size: 12.5, fill: C.muted });
  st.fade(lvT, 3.62, 3.76);
  const sl = g(svg);
  text(sl, L.top.x, L.top.y, silent, { italic: true, size: L.qSize, width: L.top.w, lh: L.qSize + 5 });
  st.fade(sl, 3.66, 3.92);

  return { set: (s, t) => st.set(s, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
