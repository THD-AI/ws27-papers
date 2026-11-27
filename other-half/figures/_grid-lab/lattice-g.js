// lattice, variant G (grid lab): the article's lattice.js (F2) with the
// original's dot strips instead of tallies. Needs _scene-g.js beside it and
// figures/_lattice-hand.js.
// lattice, variant F (grid lab), from D and E. D's clean, exact grid (the
// lines and circles of shared.js, untouched), with A's fills: the quiet
// flip-checks filled with a fine wavy pencil hatching, the fired checks with
// a loose wash of the accent field set a little off the lines. Steps 4 and 5
// as in E (two copies, the large grid becomes the first; the Y sentence), a
// larger "?" on the phone. Drop-in for figures/lattice.js with _scene-e.js
// and _hand.js beside it.
import { makeScene } from './_scene-g.js';
import { g, path } from '../../../../lib/fig.js';
import { grid } from '../shared.js';
import { tilePts, markerWash, smoothHatch, unitsPerPx } from '../_lattice-hand.js';

function gridF(parent, o) {
  const { pitch, C } = o;
  const M = grid(parent, { checks: o.checks, d: o.d, cx: o.cx, cy: o.cy, pitch, C, qr: o.qr });
  // washes, then hatching over them, then the exact tile edges. Plain
  // vectors: no filter anywhere (a displacement filter rasterises, and
  // showed as broken lines and pixel noise when zoomed in).
  const gHatch = g(M.gT), gWash = g(M.gT);
  M.gT.insertBefore(gHatch, M.gT.firstChild); M.gT.insertBefore(gWash, M.gT.firstChild);
  // the large grid later shrinks by altK (steps 4 and 5); a second hatching,
  // spaced for that size, takes over then, so the tone stays the same
  const px = unitsPerPx();
  const gAlt = o.altK ? g(M.gT) : null;
  if (gAlt) M.gT.insertBefore(gAlt, gHatch.nextSibling);
  let seed = (o.seed || 3) * 17;
  const parts = [];
  Object.entries(M.tiles).forEach(([id, t]) => {
    const flips = t.check.asks_about === 'flips';
    const tp = tilePts(t.check, M.pos);
    // the tile keeps its exact edge; the flat grey fill gives way to hatching
    t.base.setAttribute('fill', 'none');
    parts.push({ el: t.base, x: t.c[0], how: 'fade' });
    if (flips) {
      parts.push({ el: smoothHatch(gHatch, tp.pts, C, seed, { px }), x: t.c[0], how: 'fade' });
      if (gAlt) smoothHatch(gAlt, tp.pts, C, seed, { px: px / o.altK, wUnits: 0.75 * px });
      seed++;
    }
    // fired: a loose wash set off the lines instead of the exact field
    t.field.remove();
    const w = markerWash(gWash, tp.pts, seed++, C.field, { dx: pitch * 0.035, dy: pitch * 0.045, amp: pitch * 0.022, rimColor: C.accent, rimOp: 0.16, rimW: Math.max(1, pitch * 0.025) });
    w.style.display = 'none';
    const dot = t.dot;
    t.setFired = (p) => {
      const on = p > 0.001;
      for (const e of [w, dot]) { e.style.display = on ? '' : 'none'; if (on) e.style.opacity = p >= 0.999 ? '' : p.toFixed(3); }
    };
    if (t.helper) parts.push({ el: t.helper, x: t.c[0], how: 'fade', late: true });
  });
  return { ...M, parts, hatchMain: gHatch, hatchAlt: gAlt };
}

// the key's swatches: an exact square, hatched for the flip-checks
function keySwatch(parent, sq, flips, C, i) {
  if (flips) smoothHatch(parent, sq, C, 400 + i, { gap: 4.2, lambda: 8 });
  path(parent, sq.map((p, k) => `${k ? 'L' : 'M'}${p[0]} ${p[1]}`).join('') + 'Z', { stroke: C.muted, 'stroke-width': 1, 'stroke-opacity': 0.75 });
}

const S = makeScene(gridF, {
  onQubit: true, single: true, sansLabels: true, commas: true,
  oneFace: true, checkKey: true, hint: true, ringClosed: true,
  tallPitch: 48, ringPad: 14, qSize: 1.6, keySwatch,
  // phone: tallies larger; desktop: the two copies and the note closer together
  tallyTall: { step: 4, gap: 6.5, h: 15, w: 2.1, faint: 0.55 },
  wideXs: [176, 176, 418], whyX: 562, whyW: 152, restCount: true,
});
export const steps = S.steps;
export const durations = S.durations;
export const aspect = S.aspect;
export default S.mount;
