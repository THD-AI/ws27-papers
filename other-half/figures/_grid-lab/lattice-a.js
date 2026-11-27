// lattice, variant A (grid lab). Drop-in for figures/lattice.js: same
// exports, same six steps, same data; needs _scene.js and _hand.js beside it.
import { makeScene } from './_scene.js';
import { gridA } from './_hand.js';

const S = makeScene(gridA);
export const steps = S.steps;
export const durations = S.durations;
export const aspect = S.aspect;
export default S.mount;
