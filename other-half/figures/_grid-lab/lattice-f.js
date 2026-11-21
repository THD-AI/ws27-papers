// lattice, variant F (grid lab), from D and E. D's clean, exact grid (the
// lines and circles of shared.js, untouched), with A's fills: the quiet
// flip-checks filled with a fine wavy pencil hatching, the fired checks with
// a loose wash of the accent field set a little off the lines. Steps 4 and 5
// as in E (two copies, the large grid becomes the first; the Y sentence), a
// larger "?" on the phone. Drop-in for figures/lattice.js with _scene-e.js
// and _hand.js beside it.
import { makeScene } from './_scene-e.js';
import { g, path } from '../../../../lib/fig.js';
import { grid } from '../shared.js';
import { tilePts, wash, hatch } from './_hand.js';

function gridF(parent, o) {
  const { pitch, C } = o;
  const M = grid(parent, { checks: o.checks, d: o.d, cx: o.cx, cy: o.cy, pitch, C, qr: o.qr });
  // hatching and washes lie under the exact tile edges, as in A
  const gHatch = g(M.gT), gWash = g(M.gT);
  M.gT.insertBefore(gHatch, M.gT.firstChild); M.gT.insertBefore(gWash, M.gT.firstChild);   // wash, then hatching over it, then the edges
  // A's hatching is wavy because it sits under the same displacement filter
  // as the washes: the same filter here, on the hatching and the washes
  if (o.filter) { gWash.setAttribute('filter', o.filter); gHatch.setAttribute('filter', o.filter); }
  let seed = (o.seed || 3) * 17;
  const parts = [];
  Object.entries(M.tiles).forEach(([id, t]) => {
    const flips = t.check.asks_about === 'flips';
    const tp = tilePts(t.check, M.pos);
    // the tile keeps its exact edge; the flat grey fill gives way to hatching
    t.base.setAttribute('fill', 'none');
    parts.push({ el: t.base, x: t.c[0], how: 'fade' });
    if (flips) parts.push({ el: hatch(gHatch, tp.pts, pitch, C, seed++), x: t.c[0], how: 'fade' });
    // fired: a loose wash set off the lines instead of the exact field
    t.field.remove();
    const w = wash(gWash, tp.pts, seed++, C.field, { dx: pitch * 0.035, dy: pitch * 0.045, amp: pitch * 0.02 });
    w.style.display = 'none';
    const dot = t.dot;
    t.setFired = (p) => {
      const on = p > 0.001;
      for (const e of [w, dot]) { e.style.display = on ? '' : 'none'; if (on) e.style.opacity = p >= 0.999 ? '' : p.toFixed(3); }
    };
    if (t.helper) parts.push({ el: t.helper, x: t.c[0], how: 'fade', late: true });
  });
  return { ...M, parts };
}

// the key's swatches: an exact square, hatched for the flip-checks
function keySwatch(parent, sq, flips, C, i, filter) {
  if (flips) { const hg = hatch(parent, sq, 46, C, 400 + i); if (filter) hg.setAttribute('filter', filter); }
  path(parent, sq.map((p, k) => `${k ? 'L' : 'M'}${p[0]} ${p[1]}`).join('') + 'Z', { stroke: C.muted, 'stroke-width': 1, 'stroke-opacity': 0.75 });
}

const S = makeScene(gridF, {
  onQubit: true, single: true, sansLabels: true, commas: true,
  oneFace: true, checkKey: true, hint: true, ringClosed: true,
  tallPitch: 48, ringPad: 14, qSize: 1.6, keySwatch,
  // phone: tallies larger; desktop: the two copies and the note closer together
  tallyTall: { step: 4, gap: 6.5, h: 15, w: 2.1, faint: 0.55 },
  wideXs: [176, 176, 418], whyX: 546, whyW: 166, restCount: true,
});
export const steps = S.steps;
export const durations = S.durations;
export const aspect = S.aspect;
export default S.mount;
