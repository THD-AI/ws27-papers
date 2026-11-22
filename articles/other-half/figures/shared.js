// Helpers shared by the figures of "The other half of a quantum computer":
// the article's colours, the layout of the surface code, the drawing of a
// grid with its checks, the marks for errors, the dot-grid plate.
import { colors, g, circle, path, text as figText } from '../../../lib/fig.js';

const OWN = {
  '--ink': '#15171C', '--paper': '#FBFBFC', '--muted': '#5C6370',
  '--hairline': '#DADDE3', '--accent': '#4254C5', '--field': '#C9D3F7',
};

// Lettering never goes under a floor: a figure sets it for its layout so
// that the smallest text is still 11 px at the narrowest frame the layout
// is used for (tall: 288 px, wide: 640 px).
let FLOOR = 0;
export function floor(v) { FLOOR = v || 0; }
export function text(parent, x, y, str, opts = {}) {
  const asked = opts.size || 14, size = Math.max(asked, FLOOR);
  const o = { ...opts, size };
  if (opts.lh && size > asked) o.lh = Math.round(opts.lh * (size / asked) * 10) / 10;
  return figText(parent, x, y, str, o);
}

// The two kinds of check keep their own colour wherever they fire, in every
// figure: orange for a check that watches for flips, green for one that
// watches for phase errors (the film in section 4 sets them).
export const KIND = { flip: '#D4471A', phase: '#2E9C91' };
// The figures' own emphasis, one role only: the decoder's side of the machine (the network, the decoder's
// answer, the line it adds) is copper, like the cable in the opening drawing; its light field is copper too.
// The page's indigo stays the page's (links, the sources), never a figure's.
export const DECODER = { accent: '#8A5524', field: '#EFE4DA' };
export function pal(ctx) {
  return { ...colors({
    css(name) {
      let v = '';
      try { v = ctx && ctx.css ? ctx.css(name) : ''; } catch { v = ''; }
      return String(v || '').trim() || OWN[name] || '';
    },
  }), flip: KIND.flip, phase: KIND.phase, accent: DECODER.accent, field: DECODER.field };
}

// "1.48%" from 0.0148; digits after the point as asked.
export const pct = (rate, digits = 2) => `${(rate * 100).toFixed(digits)}%`;

// ---------------------------------------------------------------------------
// The rotated surface code of distance d, in the layout of data/lattice.json:
// storing qubit q = row * d + col; a square check at (row, col) sits between
// the qubits (row, col), (row, col + 1), (row + 1, col), (row + 1, col + 1);
// it asks about phase errors where row + col is even and about flips where it
// is odd; the half checks at the edges continue that pattern (flips on the
// left and right edge, phase errors on the top and bottom edge).
// ---------------------------------------------------------------------------
export function surface(d) {
  const checks = [];
  for (let row = -1; row < d; row++) for (let col = -1; col < d; col++) {
    const even = (((row + col) % 2) + 2) % 2 === 0;
    const inRow = row >= 0 && row < d - 1, inCol = col >= 0 && col < d - 1;
    const kind = even ? 'phase errors' : 'flips';
    if (inRow && inCol) {
      checks.push({ asks_about: kind, shape: 'square', row, col, qubits: [row * d + col, row * d + col + 1, (row + 1) * d + col, (row + 1) * d + col + 1] });
    } else if (inCol && even && (row === -1 || row === d - 1)) {
      const r = row === -1 ? 0 : d - 1;
      checks.push({ asks_about: kind, shape: 'half', edge: row === -1 ? 'top' : 'bottom', row, col, qubits: [r * d + col, r * d + col + 1] });
    } else if (inRow && !even && (col === -1 || col === d - 1)) {
      const c = col === -1 ? 0 : d - 1;
      checks.push({ asks_about: kind, shape: 'half', edge: col === -1 ? 'left' : 'right', row, col, qubits: [row * d + c, (row + 1) * d + c] });
    }
  }
  return checks;
}

const OUT = { top: [0, -1], bottom: [0, 1], left: [-1, 0], right: [1, 0] };

// Outline and centre of a check's tile; pos(q) -> [x, y].
export function tile(check, pos) {
  const p = check.qubits.map(pos);
  const f = (v) => v.toFixed(2);
  if (check.shape === 'square') {
    const [a, b, c, e] = p;
    return { d: `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}L${f(e[0])} ${f(e[1])}L${f(c[0])} ${f(c[1])}Z`, c: [(a[0] + e[0]) / 2, (a[1] + e[1]) / 2], r: Math.abs(b[0] - a[0]) / 2 };
  }
  const [a, b] = p, out = OUT[check.edge];
  const r = Math.hypot(b[0] - a[0], b[1] - a[1]) / 2;
  const cross = (b[0] - a[0]) * out[1] - (b[1] - a[1]) * out[0];
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
  return {
    d: `M${f(a[0])} ${f(a[1])}A${f(r)} ${f(r)} 0 0 ${cross < 0 ? 1 : 0} ${f(b[0])} ${f(b[1])}Z`,
    c: [mx + out[0] * r * 0.46, my + out[1] * r * 0.46], r, out, edgeMid: [mx, my],
  };
}

// A grid with its checks. opts: checks, d, cx, cy, pitch, C, qr (radius of a
// storing qubit), helper (radius of the helper dot; 0 for none).
// Returns pos(q), tiles[id] = { c, setFired(p) }, groups for layering.
export function grid(parent, o) {
  const { checks, d, cx, cy, pitch, C } = o;
  const qr = o.qr || pitch * 0.17, hr = o.helper ?? pitch * 0.065;
  const half = ((d - 1) / 2) * pitch;
  const pos = (q) => [cx - half + (q % d) * pitch, cy - half + Math.floor(q / d) * pitch];
  const root = g(parent);
  const gT = g(root), gF = g(root), gH = g(root), gQ = g(root), gE = g(root);
  const tiles = {};
  checks.forEach((ch, i) => {
    const t = tile(ch, pos), flips = ch.asks_about === 'flips';
    const base = path(gT, t.d, {
      fill: flips ? C.ink : 'none', 'fill-opacity': flips ? 0.075 : null,
      stroke: C.muted, 'stroke-width': flips ? 0.7 : 1.25, 'stroke-opacity': flips ? 0.75 : 0.6, 'stroke-linejoin': 'round',
    });
    const kc = flips ? C.flip : C.phase;
    const field = path(gF, t.d, { fill: kc, 'fill-opacity': 0.3, stroke: kc, 'stroke-width': 1.2, 'stroke-linejoin': 'round', 'data-audit': 'skip' });
    const helper = hr ? circle(gH, t.c[0], t.c[1], hr, { fill: C.ink }) : null;
    const dot = circle(gH, t.c[0], t.c[1], Math.max(hr * 2.1, pitch * 0.1), { fill: kc });
    field.style.display = 'none'; dot.style.display = 'none';
    tiles[ch.id || i] = {
      check: ch, c: t.c, geom: t, base, field, dot, helper,
      setFired(p) {
        const on = p > 0.001;
        field.style.display = on ? '' : 'none'; dot.style.display = on ? '' : 'none';
        if (!on) return;
        field.style.opacity = p >= 0.999 ? '' : p.toFixed(3);
        dot.style.opacity = p >= 0.999 ? '' : p.toFixed(3);
      },
    };
  });
  const qubits = [];
  for (let q = 0; q < d * d; q++) {
    const [x, y] = pos(q);
    qubits.push({ q, x, y, el: circle(gQ, x, y, qr, { fill: C.paper, stroke: C.ink, 'stroke-width': 1.25 }) });
  }
  return { root, pos, tiles, qubits, qr, gT, gF, gH, gQ, gE, half, pitch };
}

// An error on a storing qubit: a disc with its letter (X flip, Z phase error,
// Y both). 'real' is ink; 'added' is open, in the accent line.
export function errMark(parent, x, y, r, letter, C, kind = 'real') {
  const grp = g(parent);
  const real = kind === 'real';
  circle(grp, x, y, r, real ? { fill: C.ink, stroke: C.ink, 'stroke-width': 1.25 } : { fill: C.paper, stroke: C.accent, 'stroke-width': 1.6 });
  const size = r * 1.42;
  figText(grp, x, y + size * 0.355, letter, { family: 'sans', size, weight: 600, anchor: 'middle', fill: real ? C.paper : C.accent });
  return grp;
}

// The faint dot grid behind a measurement plate.
export function dotPlate(parent, x, y, w, hgt, pitch, C, r = 0.85) {
  const grp = g(parent, { class: 'fig-plate', fill: C.muted, opacity: 0.32 });
  const nx = Math.round(w / pitch), ny = Math.round(hgt / pitch);
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) circle(grp, +(x + (i * w) / nx).toFixed(2), +(y + (j * hgt) / ny).toFixed(2), r);
  return grp;
}

// Shows or hides an element with an opacity in [0, 1].
export function show(el, p) {
  // only what changed is written: an unchanged write still costs a style pass
  if (p <= 0.001) { if (el.style.display !== 'none') el.style.display = 'none'; return false; }
  if (el.style.display) el.style.display = '';
  const o = p >= 0.999 ? '' : p.toFixed(3);
  if (el.style.opacity !== o) el.style.opacity = o;
  return true;
}
