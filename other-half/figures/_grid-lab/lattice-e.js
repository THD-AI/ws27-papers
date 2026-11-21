// lattice, variant E (grid lab), from D. Steps 4 and 5 show two larger
// copies (the large grid becomes the first), bolder letters and tallies,
// one line under the right-hand copy on why it is likelier, a closed ring.
// The grid is drawn, not ruled: A's washes for the cells (a pencil-grey wash
// on the flip-checks, the accent field on fired checks, each set a little off
// the lines, as the opening drawing's field sits off its pen line), and every
// line, tile edge and qubit one pen stroke: a slight wobble, its own weight,
// ends that overshoot, circles that do not quite close. No hatching, no
// second pass.
// Drop-in for figures/lattice.js with _scene-e.js and _hand.js beside it.
import { makeScene } from './_scene-e.js';
import { g, circle, penRing, rng } from '../../../../lib/fig.js';
import { tilePts, stroke, wash } from './_hand.js';

function gridE(parent, o) {
  const { checks, d, pitch, C, cx, cy } = o;
  const r = rng(o.seed || 3);
  let seed = (o.seed || 3) * 13;
  const half = ((d - 1) / 2) * pitch;
  const pos = (q) => [cx - half + (q % d) * pitch, cy - half + Math.floor(q / d) * pitch];
  const root = g(parent);
  const gW = g(root), gF = g(root), gT = g(root), gH = g(root), gQ = g(root), gE = g(root);
  if (o.filter) { gW.setAttribute('filter', o.filter); gF.setAttribute('filter', o.filter); }
  const qr = o.qr || pitch * 0.17;
  const wgt = () => 1.15 + r() * 0.35;          // each stroke its own weight
  const parts = [], tiles = {};
  checks.forEach((ch) => {
    const t = tilePts(ch, pos), flips = ch.asks_about === 'flips';
    if (flips) parts.push({ el: wash(gW, t.pts, seed++, C.ink, { op: 0.075, amp: pitch * 0.014, dx: -pitch * 0.02, dy: pitch * 0.025 }), x: t.c[0], how: 'fade' });
    const field = wash(gF, t.pts, seed++, C.field, { dx: pitch * 0.035, dy: pitch * 0.045, amp: pitch * 0.02 });
    const dot = circle(gH, t.c[0], t.c[1], Math.max(pitch * 0.075, 3.4), { fill: C.accent, 'data-audit': 'skip' });
    const helper = circle(gH, t.c[0], t.c[1], Math.max(pitch * 0.045, 2.1), { fill: C.ink });
    parts.push({ el: helper, x: t.c[0], how: 'fade', late: true });
    if (ch.shape === 'half') {
      // the arc runs on a little past the qubit it ends at
      const a = t.arc, n = a.length, k = 0.1;
      const tail = [a[n - 1][0] + (a[n - 1][0] - a[n - 2][0]) * k * 6, a[n - 1][1] + (a[n - 1][1] - a[n - 2][1]) * k * 6];
      const el = stroke(gT, [...a, tail], seed++, { w: wgt() * 0.85, amp: pitch * 0.012, stroke: C.ink, op: 0.75 });
      parts.push({ el, x: Math.min(...a.map((p) => p[0])), how: 'draw' });
    }
    field.style.display = 'none'; dot.style.display = 'none';
    tiles[ch.id] = {
      check: ch, c: t.c,
      setFired(p) {
        const on = p > 0.001;
        for (const e of [field, dot]) { e.style.display = on ? '' : 'none'; if (on) e.style.opacity = p >= 0.999 ? '' : p.toFixed(3); }
      },
    };
  });
  for (let i = 0; i < d; i++) {
    const a = pos(i * d), b = pos(i * d + d - 1);
    const o1 = pitch * (0.06 + r() * 0.1), o2 = pitch * (0.04 + r() * 0.1);
    parts.push({ el: stroke(gT, [[a[0] - o1, a[1] + (r() - 0.5) * 2], [b[0] + o2, b[1] + (r() - 0.5) * 2]], seed++, { w: wgt(), amp: pitch * 0.013, stroke: C.ink, op: 0.8 }), x: a[0] - o1, how: 'draw', len: 1 });
    const c = pos(i), e = pos((d - 1) * d + i);
    const o3 = pitch * (0.04 + r() * 0.1), o4 = pitch * (0.06 + r() * 0.1);
    parts.push({ el: stroke(gT, [[c[0] + (r() - 0.5) * 2, c[1] - o3], [e[0] + (r() - 0.5) * 2, e[1] + o4]], seed++, { w: wgt(), amp: pitch * 0.013, stroke: C.ink, op: 0.8 }), x: c[0], how: 'draw' });
  }
  const qubits = [];
  for (let q = 0; q < d * d; q++) {
    const [x, y] = pos(q);
    const grp = g(gQ);
    circle(grp, x, y, qr * 0.94, { fill: C.paper, 'data-audit': 'skip' });
    const ring = penRing(grp, x, y, qr, qr * (0.96 + r() * 0.06), { seed: 40 + q + (o.seed || 0), width: 1.25 + r() * 0.3, stroke: C.ink, overlap: 0.18 + r() * 0.2 });
    ring.paths[1].remove();                     // one stroke, not two
    qubits.push({ q, x, y, el: grp });
  }
  return { root, pos, half, gW, gF, gT, gH, gQ, gE, tiles, qubits, qr, parts, pitch };
}

const S = makeScene(gridE, {
  onQubit: true, single: true, sansLabels: true, commas: true,
  oneFace: true, checkKey: true, hint: true, ringClosed: true,
});
export const steps = S.steps;
export const durations = S.durations;
export const aspect = S.aspect;
export default S.mount;
