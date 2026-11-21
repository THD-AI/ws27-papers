// terms: what an AI system is, in building terms. Four objects, no people,
// on one site, each with its everyday name and, under it in muted type, the
// term it stands for. Step 0: the handbook alone, the part people picture.
// Step 1: the plans archive, the bunch of keys on its ring and the cable join on the same
// ground, and a bracket takes all four as the system. Four in a row on wide
// frames, two rows of two on a phone and in a print column. Drawn in the
// same slightly uneven pen line as walls and permits (seeded, so stable).
import {
  mountFigure, svgRoot, colors, g, circle, path, text, bracket, stage, lerp, pen,
} from '../fig.js';

export const steps = 2;
// where scenes read as a sequence (tablet portrait, phone landscape): one still, the final state
export const stills = [1];
// seconds each step plays once triggered: the handbook alone, then three
// pictures in a row and the bracket under all four
export const durations = { large: [1.8, 2.4] };
// t at which `sec` seconds of a D-second step have passed (the engine's
// soft ease, article.js)
const soft = (x) => x * (1.4 - 0.4 * x);
const T = (sec, D) => soft(Math.min(1, Math.max(0, sec / D)));
// step 1 in the passage's order: archive 0–0.6 s, keys 0.6–1.2, cable
// 1.2–1.8, the bracket and its words 1.8–2.4
const D1 = durations.large[1];
const SIZE = { wide: [580, 332], tall: [360, 540] };
export const aspect = { wide: SIZE.wide[0] / SIZE.wide[1], tall: SIZE.tall[0] / SIZE.tall[1] };

// Every drawing lives in a box of 124 x 104; the ground is at y = 104.
const BOX = 124, GROUND = 104;

const arc = (cx, cy, r, a0, a1, n = 14) => Array.from({ length: n + 1 }, (_, i) => {
  const a = lerp(a0, a1, i / n) * Math.PI / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
});
const box = (x, y, w, hh) => [[x, y], [x + w, y], [x + w, y + hh], [x, y + hh], [x, y]];
const curve = (p0, c1, c2, p1, n = 16) => Array.from({ length: n + 1 }, (_, i) => {
  const t = i / n, u = 1 - t;
  return [0, 1].map((k) => u * u * u * p0[k] + 3 * u * u * t * c1[k] + 3 * u * t * t * c2[k] + t * t * t * p1[k]);
});

function handbook(P, C) {
  // one thick book lying shut: top cover, page block, back edge
  P.shape([[10, 62], [30, 36], [118, 36], [98, 62], [10, 62]], C.paper);
  P.line([[98, 62], [118, 36], [118, 80], [98, 104]]);
  P.shape(box(10, 62, 88, 42), C.paper);
  P.thin([[10, 66.5], [98, 66.5]]); P.thin([[10, 99.5], [98, 99.5]]);
  for (let yy = 71; yy < 97; yy += 3.2) P.hair([[14, yy], [94, yy]]);
  // a label on the cover, and a ribbon left in it
  P.thin([[46, 54], [55, 44], [88, 44], [79, 54], [46, 54]]);
  P.shape([[70, 62], [70, 82], [74, 78], [78, 82], [78, 62]], C.paper, 0.9);
}

function archive(P, C) {
  // a flat filing chest; the top drawer pulled half open, seen from above
  P.line(box(18, 60, 88, 44));
  P.thin([[18, 92], [106, 92]]);
  P.line([[55, 86.5], [69, 86.5]]); P.line([[55, 98], [69, 98]]);
  P.shape([[18, 60], [8, 70], [116, 70], [106, 60], [18, 60]], C.paper);
  for (let yy = 62.5; yy < 70; yy += 2.4) P.hair([[18 - (yy - 60), yy], [106 + (yy - 60), yy]]);
  // one sheet sticking out: a floor plan, rooms and doors
  const sh = g(P.root, { transform: 'rotate(-7 62 66)' });
  const S = P.at(sh);
  S.shape([[34, 70], [34, 8], [82, 8], [90, 16], [90, 70]], C.paper, 0.9);
  S.thin([[82, 8], [82, 16], [90, 16]]);
  S.line([[76, 15], [40, 15], [40, 54], [84, 54], [84, 26]], 1.15);
  S.line([[62, 15], [62, 26]], 1.15); S.line([[62, 34], [62, 54]], 1.15);
  S.line([[40, 34], [51, 34]], 1.15); S.line([[57, 34], [62, 34]], 1.15); S.line([[70, 34], [84, 34]], 1.15);
  S.hair(arc(62, 34, 8, -90, 0, 8)); S.hair(arc(51, 34, 6, -90, 0, 6));
  // the drawer front, in front of the sheet
  P.shape(box(8, 70, 108, 12), C.paper);
  P.line([[55, 76], [69, 76]]);
}

function keys(P, C) {
  // a bunch of keys on a split ring, hanging from a hook on a small board:
  // three cut keys of different lengths and bows, fanned out unevenly, none
  // reaching the ground. (Two upright keys under a round ring, standing on
  // the ground, were read as a person.)
  const cx = 29, cy = 22, rr = 9.5;
  P.shape(box(cx - 14, 2, 28, 6), C.paper, 1.1);                   // the board
  P.line([[cx, 8], [cx, cy - rr + 1.5], [cx + 3, cy - rr - 1]], 1.2);   // the hook
  // each key in its own frame: the hole at (0, 0), the blade pointing down
  const key = (ang, L, square, on) => {
    // hung at its own point of the ring (degrees, 90 = the bottom), so the bows spread
    const hx = cx + (rr - 1.2) * Math.cos(on * Math.PI / 180), hy = cy + (rr - 1.2) * Math.sin(on * Math.PI / 180);
    const k = g(P.root, { transform: `translate(${hx.toFixed(1)} ${hy.toFixed(1)}) rotate(${ang})` });
    const K = P.at(k);
    if (square) K.shape([[-4.8, -2.8], [4.8, -2.8], [4.8, 8.4], [-4.8, 8.4], [-4.8, -2.8]], C.paper, 1.2);
    else K.shape(arc(0, 2.8, 5.4, -90, 270, 16), C.paper, 1.2);
    K.thin(arc(0, 0, 1.5, -90, 270, 8));                     // the hole the ring runs through
    // shoulder, blade with its cut on one side, an angled tip
    const pts = [[-2.6, 8.4], [-2.6, L - 2.5], [0.4, L], [3, L - 3]];
    for (let y = L - 5; y > 15; y -= 4.2) pts.push([5.4, y], [3, y - 2.1]);
    pts.push([3, 13], [5.6, 11.5], [5.6, 8.4], [-2.6, 8.4]);
    K.shape(pts, C.paper, 1.15);
    K.hair([[0.2, 13.5], [0.2, L - 4.5]]);                    // the groove along the blade
  };
  key(24, 42, false, 128);
  key(-3, 50, false, 92);
  key(-27, 37, true, 56);
  // the split ring: two turns, drawn over the bows where it threads them
  P.line(arc(cx, cy, rr, -75, 262, 24), 1.3);
  P.thin(arc(cx, cy, rr - 1.6, -50, 292, 22));
  // three doors: two open to the keys, the third shut and locked
  const top = 52;
  [62, 83, 104].forEach((x, i) => {
    P.thin(box(x, top, 18, GROUND - top));
    if (i < 2) {
      P.line([[x, top], [x + 11, top + 6], [x + 11, GROUND - 4], [x, GROUND]]);
      circle(P.root, x + 9, 80, 1, { fill: C.ink });
    } else {
      P.line(box(x + 2, top + 2, 15, GROUND - top - 2));
      circle(P.root, x + 13, 77, 1.1, { fill: C.ink });
      P.thin(arc(x + 12.5, 84, 3.2, 180, 360, 8));
      P.shape(box(x + 8.5, 84, 8, 8), C.paper);
    }
  });
}

function cable(P, C) {
  // two surface junction boxes on the wall, one cable run between them:
  // the cable leaves each box through a gland and runs unbroken to the
  // other; every joint is inside a box, so nothing sits on the cable
  const top = 30, side = 32, cy = 90;
  [4, 88].forEach((x) => {
    P.shape(box(x, top, side, side), C.paper);              // the box
    P.thin(box(x + 3.5, top + 3.5, side - 7, side - 7));     // its lid
    [[x + 7, top + 7], [x + side - 7, top + 7], [x + 7, top + side - 7], [x + side - 7, top + side - 7]]
      .forEach(([sx, sy], i) => {                            // four lid screws
        P.thin(arc(sx, sy, 1.9, 0, 360, 10));
        P.hair([[sx - 1.3, sy + (i % 2 ? 0.6 : -0.6)], [sx + 1.3, sy + (i % 2 ? -0.6 : 0.6)]]);
      });
    // the cable gland under the box: a nut, then the tapered cap
    const gx = x + side / 2;
    P.shape([[gx - 5, top + side], [gx - 5, top + side + 4], [gx + 5, top + side + 4], [gx + 5, top + side]], C.paper, 1.1);
    P.shape([[gx - 3.6, top + side + 4], [gx - 2.8, top + side + 8.5], [gx + 2.8, top + side + 8.5], [gx + 3.6, top + side + 4]], C.paper, 1.1);
  });
  // the cable: down out of one gland, along the wall, up into the other
  const a = 4 + side / 2, b = 88 + side / 2, gy = top + side + 8.5;
  P.line(curve([a, gy], [a, cy - 4], [a + 4, cy], [a + 10, cy], 8)
    .concat([[b - 10, cy]])
    .concat(curve([b - 10, cy], [b - 4, cy], [b, cy - 4], [b, gy], 8)), 2);
}

const DRAW = { handbook, archive, keys, cable };

function build(el, ctx) {
  const C = colors(ctx), d = ctx.data, tall = ctx.layout === 'tall';
  const [W, H] = SIZE[tall ? 'tall' : 'wide'];
  const svg = svgRoot(el, W, H, `${d.reading} `
    + d.parts.map((q) => `${q.name}: ${q.term}`).join('. ') + '.');
  svg.style.color = C.ink;
  const st = stage();
  let seed = 11;
  // the pen, bound to a parent group
  const at = (root) => {
    const draw = (pts, w, amp, fill, stroke = C.ink) => path(root, pen(pts, seed++, amp) + (fill ? 'Z' : ''), {
      stroke, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: fill || 'none',
    });
    const P = {
      root, at,
      line: (pts, w = 1.35) => draw(pts, w, 0.55),
      thin: (pts) => draw(pts, 0.9, 0.4),
      hair: (pts) => draw(pts, 0.55, 0.3, null, C.muted),
      shape: (pts, fill, w = 1.35) => draw(pts, w, 0.55, fill),
    };
    return P;
  };

  const S = tall
    ? { x0: 12, cols: 2, gap: 16, head: 13.5, name: 13, term: 12.5, note: 13.5, rowGap: 14 }
    // wide: shown from about 464 px up; at the 520 px of a text column on an
    // upright tablet the terms render at 13 px, never under 11.6
    : { x0: 10, cols: 4, gap: 12, head: 15.5, name: 14.5, term: 14.5, note: 14.5, rowGap: 0 };
  const cellW = (W - 2 * S.x0 - (S.cols - 1) * S.gap) / S.cols;
  const sc = Math.min(cellW / BOX, 1.18);

  const hd = text(svg, S.x0, 18, d.headline, { family: 'sans', size: S.head, weight: 600, width: W - 2 * S.x0 });
  st.fade(hd.el, 0.02, 0.18);

  // when each part arrives: the handbook in step 0, the others in step 1
  // (the handbook alone takes its time; the three others follow one
  // another, each ground, drawing, then its name)
  // (the handbook spreads over the whole of step 0, its note last)
  const when = (k) => (k === 0 ? 0.08 : 1 + T(0.6 * (k - 1) + 0.02, D1));
  // the offsets below are in units of 0.3 of a step: each of the three
  // later parts fills its own 0.6 s
  const dur = (k) => (k === 0 ? 2 : (T(0.6 * k, D1) - T(0.6 * (k - 1) + 0.02, D1)) / 0.3);
  let y = hd.bottom + 12, bottom = y;
  const rows = Math.ceil(d.parts.length / S.cols);
  for (let r = 0; r < rows; r++) {
    const top = y;
    const ground = top + GROUND * sc;
    let rowBottom = ground;
    for (let c = 0; c < S.cols; c++) {
      const k = r * S.cols + c, part = d.parts[k];
      if (!part) continue;
      const x = S.x0 + c * (cellW + S.gap);
      const a = when(k);
      // the shared ground: one site, segment by segment
      const gx1 = c === 0 ? S.x0 : x - S.gap / 2, gx2 = c === S.cols - 1 ? W - S.x0 : x + cellW + S.gap / 2;
      const gl = at(svg).line([[gx1, ground + 0.5], [gx2, ground + 0.5]], 1.3);
      st.draw(gl, a, a + 0.18 * dur(k));
      const pic = g(svg, { transform: `translate(${(x + (cellW - BOX * sc) / 2).toFixed(1)} ${top.toFixed(1)}) scale(${sc.toFixed(3)})` });
      DRAW[part.key](at(pic), C);
      st.fade(pic, a + 0.04 * dur(k), a + 0.22 * dur(k));
      const lab = g(svg);
      const nm = text(lab, x, ground + 20, part.name, { family: 'sans', size: S.name, weight: 500, width: cellW, lh: S.name * 1.18 });
      const tm = text(lab, x, nm.bottom + S.term + 3, part.term, { family: 'sans', size: S.term, fill: ctx.print ? C.ink : C.muted, width: cellW, lh: S.term * 1.2 });
      st.fade(lab, a + 0.16 * dur(k), a + 0.3 * dur(k));
      rowBottom = Math.max(rowBottom, tm.bottom);
      if (k === 0) {
        // what people picture: said once, and it stays true in the end
        const nt = text(svg, x, tm.bottom + S.note + 7, d.alone, { italic: true, size: S.note, width: cellW, fill: C.ink });
        st.fade(nt.el, 0.58, 0.92);
        rowBottom = Math.max(rowBottom, nt.bottom);
      }
    }
    y = rowBottom + S.rowGap + (r < rows - 1 ? 8 : 0);
    bottom = rowBottom;
  }

  // the system is all four: a bracket under the whole row, in the accent
  const by = bottom + 14;
  const br = bracket(svg, S.x0, by, W - S.x0, by, 7, { stroke: C.accent, 'stroke-width': 1.5 });
  st.draw(br, 1 + T(1.8, D1), 1 + T(2.15, D1));
  const wh = text(svg, W / 2, by + S.note + 8, d.whole, { italic: true, size: S.note + 0.5, anchor: 'middle', fill: C.ink });
  st.fade(wh.el, 1 + T(2.0, D1), 1 + T(2.36, D1));
  svg.dataset.contentH = Math.round(wh.bottom + 4);
  return { set: (s, t) => st.set(s, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
