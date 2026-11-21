// lattice, variant D (grid lab), from C. The clean grid of shared.js is the
// data layer; the marks are single pen lines. Changes against C: a key for
// the two kinds of check (shaded flip-checks, white phase-checks), the
// article's own colours only (ink, paper, its accent line): a fired check is
// its outline in the accent with the accent dot, no tinted fill; one text
// face (Libre Franklin) below the title; a closed ring; in step 3 a faint
// "?" on each storing qubit that one of the explanations blames.
// Drop-in for figures/lattice.js with _scene.js and _hand.js beside it.
import { makeScene } from './_scene.js';
import { grid } from '../shared.js';

function gridD(parent, o) {
  const M = grid(parent, { checks: o.checks, d: o.d, cx: o.cx, cy: o.cy, pitch: o.pitch, C: o.C, qr: o.qr });
  const parts = [];
  Object.values(M.tiles).forEach((t) => {
    t.field.setAttribute('fill', 'none');
    t.field.setAttribute('stroke', o.C.accent);
    t.field.setAttribute('stroke-width', Math.max(2, o.pitch * 0.028).toFixed(2));
    parts.push({ el: t.base, x: t.c[0], how: 'fade' });
    if (t.helper) parts.push({ el: t.helper, x: t.c[0], how: 'fade', late: true });
  });
  return { ...M, parts };
}

const S = makeScene(gridD, {
  onQubit: true, single: true, sansLabels: true, commas: true, copyQr: 0.2, tallCopyPitch: 44,
  oneFace: true, checkKey: true, hint: true, ringClosed: true,
});
export const steps = S.steps;
export const durations = S.durations;
export const aspect = S.aspect;
export default S.mount;
