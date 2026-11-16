// terms: what an AI system is, in building terms. Four objects, no people,
// on one site, each with its everyday name and, under it in muted type, the
// term it stands for. Step 0: the handbook alone, the part people picture.
// Step 1: the plans archive, the ring of keys and the cable join on the same
// ground, and a bracket takes all four as the system. Four in a row on wide
// frames, two rows of two on a phone and in a print column.
import {
  mountFigure, svgRoot, colors, g, line, circle, rect, path, text, bracket, stage,
} from '../../../lib/fig.js';

export const steps = 2;
const SIZE = { wide: [580, 282], tall: [360, 460] };
export const aspect = { wide: SIZE.wide[0] / SIZE.wide[1], tall: SIZE.tall[0] / SIZE.tall[1] };

// Every drawing lives in a box of 124 x 92; the ground is at y = 88.
const BOX = 124, GROUND = 88;

function handbook(p, ink, thin, C) {
  // one thick book lying shut: top cover, page block, back edge
  path(p, 'M18 62L38 40L114 40L94 62Z', { ...ink, fill: C.paper });
  path(p, 'M94 62L114 40L114 64L94 88', ink);
  rect(p, 18, 62, 76, 26, ink);
  line(p, 18, 65.5, 94, 65.5, thin); line(p, 18, 84.5, 94, 84.5, thin);
  for (let yy = 69; yy < 83; yy += 2.6) line(p, 21, yy, 91, yy, { ...thin, 'stroke-width': 0.55, stroke: C.muted });
  // a label on the cover, and a ribbon left in it
  path(p, 'M50 54L58 46L86 46L78 54Z', thin);
  path(p, 'M70 62L70 76L73 73L76 76L76 62', { ...thin, fill: C.paper });
}

function archive(p, ink, thin, C) {
  // a flat filing chest; the top drawer pulled half open, seen from above
  rect(p, 20, 52, 84, 36, ink);
  line(p, 20, 75, 104, 75, thin);
  [69.5, 81.5].forEach((yy) => line(p, 55, yy, 69, yy, ink));
  path(p, 'M20 52L12 60L112 60L104 52Z', { ...ink, fill: C.paper });
  for (let yy = 54.5; yy < 60; yy += 2) line(p, 20 - (yy - 52), yy, 104 + (yy - 52), yy, { ...thin, 'stroke-width': 0.5, stroke: C.muted });
  // one sheet sticking out: a floor plan, rooms as rectangles
  const sh = g(p, { transform: 'rotate(-7 62 56)' });
  // a thin sheet with one corner turned over, no frame
  path(sh, 'M38 58L38 16L80 16L88 24L88 58', { ...thin, fill: C.paper });
  path(sh, 'M80 16L80 24L88 24', thin);
  // walls of the rooms, gaps for doors with their swing
  path(sh, 'M44 22L74 22M44 22L44 50L82 50L82 30M63 22L63 30M63 36L63 50M44 36L54 36M60 36L63 36M70 36L82 36', { ...ink, 'stroke-width': 1.1 });
  path(sh, 'M63 30A6 6 0 0 1 69 36M54 36A6 6 0 0 1 60 30', { ...thin, 'stroke-width': 0.6 });
  // the drawer front, in front of the sheet
  rect(p, 12, 60, 100, 9, { ...ink, fill: C.paper });
  line(p, 55, 64.5, 69, 64.5, ink);
}

function keys(p, ink, thin, C) {
  // the ring with two keys on it
  circle(p, 29, 30, 8, ink);
  [[24, 14], [34, -14]].forEach(([x, a]) => {
    const k = g(p, { transform: `rotate(${a} ${x} 37)` });
    circle(k, x, 42.5, 5.5, { ...ink, fill: C.paper });
    circle(k, x, 42.5, 1.6, thin);
    path(k, `M${x} 48L${x} 82M${x} 82L${x + 6} 82L${x + 6} 78L${x} 78M${x} 73L${x + 5} 73L${x + 5} 70L${x} 70`, ink);
  });
  // three doors: two open to the keys, the third shut and locked
  const top = 46;
  [60, 81, 102].forEach((x, i) => {
    rect(p, x, top, 17, GROUND - top, thin);
    if (i < 2) {
      path(p, `M${x} ${top}L${x + 10} ${top + 5}L${x + 10} ${GROUND - 3}L${x} ${GROUND}`, ink);
      circle(p, x + 8, 68, 0.9, { fill: C.ink });
    } else {
      rect(p, x + 1.5, top + 1.5, 14, GROUND - top - 1.5, ink);
      circle(p, x + 12, 66, 1, { fill: C.ink });
      path(p, `M${x + 10} 72L${x + 10} 69C${x + 10} 65 ${x + 15} 65 ${x + 15} 69L${x + 15} 72`, thin);
      rect(p, x + 8.5, 72, 8, 7, { ...ink, fill: C.paper });
    }
  });
}

function cable(p, ink, thin, C) {
  // two wall sockets, a plugged cable between them
  [8, 94].forEach((x) => {
    rect(p, x, 36, 22, 22, { ...ink, fill: C.paper, rx: 2.5 });
    circle(p, x + 11, 47, 6.5, thin);
    circle(p, x + 8.3, 47, 1.1, { fill: C.ink });
    circle(p, x + 13.7, 47, 1.1, { fill: C.ink });
  });
  rect(p, 16, 58, 6, 6, { ...ink, fill: C.paper });
  rect(p, 102, 58, 6, 6, { ...ink, fill: C.paper });
  path(p, 'M19 64C19 84 50 82 62 82C74 82 105 84 105 64', { ...ink, 'stroke-width': 2 });
}

const DRAW = { handbook, archive, keys, cable };

function build(el, ctx) {
  const C = colors(ctx), d = ctx.data, tall = ctx.layout === 'tall';
  const [W, H] = SIZE[tall ? 'tall' : 'wide'];
  const svg = svgRoot(el, W, H, `${d.reading} `
    + d.parts.map((q) => `${q.name}: ${q.term}`).join('. ') + '.');
  svg.style.color = C.ink;
  const st = stage();
  const ink = { stroke: C.ink, 'stroke-width': 1.25, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' };
  const thin = { ...ink, 'stroke-width': 0.9 };

  const S = tall
    ? { x0: 12, cols: 2, gap: 16, head: 13, name: 12.5, term: 12, note: 13, rowGap: 14 }
    : { x0: 14, cols: 4, gap: 12, head: 14, name: 12.5, term: 12, note: 13, rowGap: 0 };
  const cellW = (W - 2 * S.x0 - (S.cols - 1) * S.gap) / S.cols;
  const sc = Math.min(cellW / BOX, 1.18);

  const hd = text(svg, S.x0, 18, d.headline, { family: 'sans', size: S.head, weight: 600, width: W - 2 * S.x0 });
  st.fade(hd.el, 0, 0.08);

  // when each part arrives: the handbook in step 0, the others in step 1
  const at = (k) => (k === 0 ? 0.02 : 1.05 + (k - 1) * 0.16);
  let y = hd.bottom + 14, bottom = y;
  const rows = Math.ceil(d.parts.length / S.cols);
  for (let r = 0; r < rows; r++) {
    const top = y;
    const ground = top + (GROUND - 14) * sc;
    let rowBottom = ground;
    for (let c = 0; c < S.cols; c++) {
      const k = r * S.cols + c, part = d.parts[k];
      if (!part) continue;
      const x = S.x0 + c * (cellW + S.gap);
      const a = at(k);
      // the shared ground: one site, segment by segment
      const gx1 = c === 0 ? S.x0 : x - S.gap / 2, gx2 = c === S.cols - 1 ? W - S.x0 : x + cellW + S.gap / 2;
      const gl = line(svg, gx1, ground + 0.5, gx2, ground + 0.5, { ...ink });
      st.draw(gl, a, a + 0.14);
      const pic = g(svg, { transform: `translate(${(x + (cellW - BOX * sc) / 2).toFixed(1)} ${(top - 14 * sc).toFixed(1)}) scale(${sc.toFixed(3)})` });
      DRAW[part.key](pic, ink, thin, C);
      st.fade(pic, a, a + 0.18);
      const lab = g(svg);
      const nm = text(lab, x, ground + 20, part.name, { family: 'sans', size: S.name, weight: 500, width: cellW, lh: 15 });
      const tm = text(lab, x, nm.bottom + S.term + 3, part.term, { family: 'sans', size: S.term, fill: ctx.print ? C.ink : C.muted, width: cellW, lh: 14.5 });
      st.fade(lab, a + 0.04, a + 0.2);
      rowBottom = Math.max(rowBottom, tm.bottom);
      if (k === 0) {
        // what people picture: said once, and it stays true in the end
        const nt = text(svg, x, tm.bottom + S.note + 7, d.alone, { italic: true, size: S.note, width: cellW, fill: C.ink });
        st.fade(nt.el, 0.3, 0.5);
        rowBottom = Math.max(rowBottom, nt.bottom);
      }
    }
    y = rowBottom + S.rowGap + (r < rows - 1 ? 8 : 0);
    bottom = rowBottom;
  }

  // the system is all four: a bracket under the whole row, in the accent
  const by = bottom + 14;
  const br = bracket(svg, S.x0, by, W - S.x0, by, 7, { stroke: C.accent, 'stroke-width': 1.5 });
  st.draw(br, 1.62, 1.86);
  const wh = text(svg, W / 2, by + S.note + 8, d.whole, { italic: true, size: S.note + 0.5, anchor: 'middle', fill: C.ink });
  st.fade(wh.el, 1.78, 1.94);
  svg.dataset.contentH = Math.round(wh.bottom + 4);
  return { set: (s, t) => st.set(s, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
