// lattice, variant C (grid lab). The current figure's clean, exact grid as
// the data layer (tiles, qubits, checks from shared.js); only the human marks
// are pen lines, one stroke each: the error letters, the line of errors to
// the edge, the pairing joins, the one ring. No monospace; counts as
// tallies; a quieter wash for fired checks. Tall layout 360 x 456.
// Drop-in for figures/lattice.js with _scene.js and _hand.js beside it.
import { makeScene } from './_scene.js';
import { grid } from '../shared.js';

// a fired check's wash: the article's accent mixed into warm paper rather
// than the flat interface tint; the accent itself stays for the dot
const WASH = '#D3D2E6';

function gridC(parent, o) {
  const C2 = { ...o.C, field: WASH };
  const M = grid(parent, { checks: o.checks, d: o.d, cx: o.cx, cy: o.cy, pitch: o.pitch, C: C2, qr: o.qr });
  const parts = [];
  Object.values(M.tiles).forEach((t) => {
    t.field.setAttribute('stroke', 'none');
    parts.push({ el: t.base, x: t.c[0], how: 'fade' });
    if (t.helper) parts.push({ el: t.helper, x: t.c[0], how: 'fade', late: true });
  });
  return { ...M, parts };
}

const S = makeScene(gridC, { onQubit: true, single: true, sansLabels: true, commas: true, copyQr: 0.2, tallCopyPitch: 44 });
export const steps = S.steps;
export const durations = S.durations;
export const aspect = S.aspect;
export default S.mount;
