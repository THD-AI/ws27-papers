// The film (section 4): an example run on the distance-3 grid, and the drawn
// pen lines of the figure for its two layouts.
//
//   node tools/film-data.mjs
//
// Writes articles/other-half/data/film.json. Every light is computed here from
// the errors and the check layout in data/lattice.json, and checked against
// what the text says about it. The pen lines are drawn here once, with
// perfect-freehand (MIT), so the page needs no drawing library: each stroke is
// authored (its points chosen), pressure follows the speed of the stroke, and
// nothing is random.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getStroke } from 'perfect-freehand';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'articles', 'other-half', 'data');
const lattice = JSON.parse(readFileSync(join(DATA, 'lattice.json'), 'utf8'));
const checks = lattice.checks;
const kindOf = (id) => (id[0] === 'z' ? 'flip' : 'phase');   // z-checks watch for flips, x-checks for phase errors

function assert(c, msg) { if (!c) throw new Error('film: ' + msg); }

// ---- the run -----------------------------------------------------------------
// Errors stay once they happen. A check's answer is the parity of the errors of
// its kind among its qubits (a flip is seen by flip-checks, a phase error by
// phase-checks), flipped in a round where the check misreports. A check lights
// in a round when its answer differs from the round before (round 0: all even).
const EVENTS = [
  { round: 1 },
  { round: 2, error: { qubit: 4, kind: 'X' } },
  { round: 3 },
  { round: 4, error: { qubit: 8, kind: 'Z' } },
  { round: 5, misreport: 'z3' },
  { round: 6 },
];
const sees = (check, kind) => (kindOf(check.id) === 'flip' ? kind === 'X' || kind === 'Y' : kind === 'Z' || kind === 'Y');
const present = [];
let prev = Object.fromEntries(checks.map((c) => [c.id, 0]));
const rounds = EVENTS.map((ev) => {
  if (ev.error) present.push(ev.error);
  const ans = {};
  for (const c of checks) {
    let p = 0;
    for (const e of present) if (c.qubits.includes(e.qubit) && sees(c, e.kind)) p ^= 1;
    if (ev.misreport === c.id) p ^= 1;
    ans[c.id] = p;
  }
  const lit = checks.filter((c) => ans[c.id] !== prev[c.id]).map((c) => c.id);
  prev = ans;
  return { round: ev.round, errors_present: present.map((e) => ({ ...e })), new_error: ev.error || null, misreport: ev.misreport || null, lit };
});
const litOf = (r) => rounds[r - 1].lit.join(',');
assert(litOf(1) === '', 'round 1 is dark');
assert(litOf(2) === 'z0,z1', 'a flip on qubit 4 lights z0 and z1, got ' + litOf(2));
assert(litOf(3) === '', 'round 3: the flip stays, nothing changes, so the frame is dark');
assert(litOf(4) === 'x1', 'a phase error on qubit 8 lights only x1, got ' + litOf(4));
assert(litOf(5) === 'z3' && litOf(6) === 'z3', 'a misreport in round 5 lights z3 in rounds 5 and 6');

// ---- the same lights, from different errors (steps 6 and 7) ----------------------
const flipLights = (qs) => checks.filter((c) => kindOf(c.id) === 'flip' && qs.filter((q) => c.qubits.includes(q)).length % 2).map((c) => c.id).join(',');
const LZ = [0, 1, 2];   // the top row: a flip that changes its parity changes the stored value
const flipsStored = (qs) => qs.filter((q) => LZ.includes(q)).length % 2 === 1;
const storyA = [4], storyB = [1, 7];
assert(flipLights(storyA) === 'z0,z1' && flipLights(storyB) === 'z0,z1', 'both stories light z0 and z1');
assert(flipLights([1, 4, 7]) === '' && flipsStored([1, 4, 7]), 'together they light nothing and flip the stored value');
// every story of one or two flips that lights exactly z0 and z1
const singles = [], pairs = [];
for (let a = 0; a < 9; a++) {
  if (flipLights([a]) === 'z0,z1') singles.push([a]);
  for (let b = a + 1; b < 9; b++) if (flipLights([a, b]) === 'z0,z1') pairs.push([a, b]);
}
assert(singles.length === 1 && singles[0][0] === 4, 'one single flip lights z0 and z1: qubit 4');
assert(pairs.length === 4, 'four pairs of flips light z0 and z1, got ' + pairs.length);
assert(pairs.every((pq) => flipsStored(pq) !== flipsStored([4])), 'every pair leaves the stored value the other way round from the single flip');
// independent flips with chance p per qubit: one flip against all the pairs together
const P = 0.001;
const ratio = (P * (1 - P) ** 8) / (pairs.length * P * P * (1 - P) ** 7);
assert(ratio > 240 && ratio < 260, 'about 250 times, got ' + ratio);

// ---- the pen ---------------------------------------------------------------------
// Each stroke is authored: its points, its weight, how much it thins with speed
// and how long its ends taper are chosen per stroke, as a hand would vary them.
function cr(pts, n = 18) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts.at(-1));
  return out;
}
function pen(ctrl, size, { thin = 0.6, t0 = 4, t1 = 7, slow = 11, n = 18 } = {}) {
  const pts = cr(ctrl, n).map((p, i, a) => {
    const u = a[Math.max(0, i - 1)], v = a[Math.min(a.length - 1, i + 1)];
    const sp = Math.hypot(v[0] - u[0], v[1] - u[1]);
    return [p[0], p[1], Math.max(0.2, Math.min(1, 1.2 - sp / slow))];
  });
  const s = getStroke(pts, { size, thinning: thin, smoothing: 0.55, streamline: 0.3, simulatePressure: false,
    start: { taper: size * t0, cap: true }, end: { taper: size * t1, cap: true } });
  const f = (v) => v.toFixed(1);
  let d = `M${f(s[0][0])} ${f(s[0][1])}Q`;
  for (let i = 0; i < s.length; i++) { const [x0, y0] = s[i], [x1, y1] = s[(i + 1) % s.length]; d += `${f(x0)} ${f(y0)} ${f((x0 + x1) / 2)} ${f((y0 + y1) / 2)} `; }
  return d.trim() + 'Z';
}

// Geometry of the two layouts, shared with figures/film.js through the data.
const LAYOUT = {
  wide: { W: 720, H: 470, win: [138, 558], fw: 105, chipY: 128, stripY: 292, stripH: 132, pitch: 21, visible: 4,
    box: [584, 222, 704, 362], notesY: 406, keyY: 456 },
  tall: { W: 360, H: 456, win: [22, 338], fw: 105.3, chipY: 118, stripY: 246, stripH: 106, pitch: 19, visible: 3,
    box: [60, 372, 300, 406], notesY: 340, keyY: 430 },
  // print: all six rounds at once on the left, the stories and the bet on the right, in the wide frame
  print: { W: 720, H: 470, win: [132, 456], fw: 54, chipY: 128, stripY: 268, stripH: 96, pitch: 13, visible: 6,
    box: [468, 230, 532, 306], notesY: 360, keyY: 456 },
};
function strokes(L, tall) {
  const [x0, x1] = L.win, yT = L.stripY - L.stripH / 2, yB = L.stripY + L.stripH / 2;
  const [bx0, by0, bx1, by1] = L.box, m = (by0 + by1) / 2;
  const S = {};
  const run = tall ? x1 + 4 : bx0 + 6;
  S.stripTop = pen([[x0 - 8, yT + 0.6], [x0 + 120, yT - 1.1], [x0 + 260, yT + 0.7], [run, yT - 0.4]], 3, { thin: 0.45, t0: 2, t1: 9 });
  S.stripBottom = pen([[x0 - 5, yB - 0.4], [x0 + 140, yB + 1.2], [x0 + 280, yB - 0.5], [run - 2, yB + 0.8]], 3.3, { thin: 0.7, t0: 6, t1: 4 });
  // the chip: one stroke around the upper row, started at the top left and closed with a small overlap
  const cT = L.chipY - (tall ? 52 : 58), cB = L.chipY + (tall ? 46 : 58), cl = x0 - 8, cr2 = x1 + 8;
  S.chip = pen([[cl + 14, cT + 0.5], [(cl + cr2) / 2, cT - 1], [cr2 - 3, cT + 0.8], [cr2 + 0.5, cT + 10], [cr2 + 1.2, (cT + cB) / 2], [cr2 - 0.5, cB - 6],
    [cr2 - 9, cB + 0.6], [(cl + cr2) / 2, cB + 1.4], [cl + 6, cB - 0.4], [cl - 0.8, cB - 9], [cl + 0.6, (cT + cB) / 2], [cl - 0.4, cT + 9], [cl + 10, cT - 0.2], [cl + 30, cT + 0.6]], 1.6, { thin: 0.55, t0: 3, t1: 6, n: 10 });
  if (tall) {
    // the decoder below the strip: one stroke around it; an arrow comes down the left side and turns into it
    S.box = [pen([[bx0 + 12, by0 - 0.4], [bx0 + 120, by0 - 1.4], [bx1 - 6, by0 + 0.4], [bx1 + 1, by0 + 7], [bx1 + 1.6, m], [bx1 - 1, by1 - 5],
      [bx1 - 10, by1 + 0.8], [bx0 + 110, by1 + 1.2], [bx0 + 6, by1 - 0.3], [bx0 - 0.6, by1 - 7], [bx0 + 0.8, m], [bx0 - 0.2, by0 + 6], [bx0 + 9, by0 - 0.8], [bx0 + 26, by0 - 0.2]], 3, { thin: 0.5, t0: 2.5, t1: 5, n: 10 })];
    S.arrow = [pen([[34, yB + 6], [32.5, (yB + by0) / 2 + 14], [35, m - 1], [46, m + 0.6], [55, m]], 2.6, { thin: 0.65, t0: 3, t1: 3 }),
      pen([[45, m - 7.5], [55.5, m - 0.6]], 2.2, { thin: 0.3, t0: 1, t1: 2.5 }), pen([[45.5, m + 7], [55, m + 0.8]], 2.1, { thin: 0.3, t0: 1, t1: 2.5 })];
  } else {
    // the decoder at the end of the strip: one stroke from above the strip, round the box, back to below the strip
    S.box = [pen([[bx0 + 1, yT - 6], [bx0 - 0.5, by0 + 8], [bx0 + 9, by0 - 0.6], [bx0 + 60, by0 - 1.6], [bx1 - 6, by0 + 0.4], [bx1 + 1, by0 + 8], [bx1 + 2, m],
      [bx1 - 0.5, by1 - 7], [bx1 - 9, by1 + 0.9], [bx0 + 50, by1 + 1.4], [bx0 + 8, by1 - 0.2], [bx0 - 0.4, by1 - 8], [bx0 + 0.6, yB + 6]], 3, { thin: 0.5, t0: 3, t1: 6, n: 10 })];
  }
  // notes: a tick under "no change", a bracket under the two misreport frames (placed by the figure)
  S.tick = pen([[0, 10], [2, 0], [-1, -12]], 2.2, { thin: 0.7, t0: 1, t1: 4 });
  S.bracket = pen([[-L.fw * 0.88, -4], [-L.fw * 0.82, 2.6], [-L.fw * 0.3, 3.4], [0, 2.4], [L.fw * 0.76, 3.6], [L.fw * 0.84, -7.5]], 2.4, { thin: 0.4, t0: 2, t1: 5 });
  return S;
}
const pens = { wide: strokes(LAYOUT.wide, false), tall: strokes(LAYOUT.tall, true), print: strokes(LAYOUT.print, false) };
pens.print.storyArrow = pen([[632, 182], [631, 188], [632.5, 192]], 1.6, { thin: 0.5, t0: 1, t1: 1 });
pens.print.storyArrowHead = [];
pens.print.storyBracket = pen([[556, 222], [561, 211], [636, 208], [710, 212], [714, 223]], 2.2, { thin: 0.45, t0: 3, t1: 5 });
// steps 6 and 7: an arrow from the seen frame to the stories (a shaft and two separate ticks), a brace over the stories
pens.wide.storyArrow = pen([[236, 214], [276, 206], [318, 211], [346, 219]], 2.6, { thin: 0.7, t0: 4, t1: 2 });
pens.wide.storyArrowHead = [pen([[333, 209], [347, 219.5]], 2.2, { thin: 0.3, t0: 1, t1: 3 }), pen([[334, 230], [346.5, 220.5]], 2.1, { thin: 0.3, t0: 1, t1: 3 })];
pens.wide.storyBracket = pen([[356, 152], [362, 141], [515, 137], [668, 142], [674, 153]], 2.4, { thin: 0.45, t0: 3, t1: 5 });
pens.tall.storyArrow = pen([[180, 172], [178, 190], [181, 208]], 2.6, { thin: 0.7, t0: 4, t1: 2 });
pens.tall.storyArrowHead = [pen([[170, 198], [180.5, 209]], 2.2, { thin: 0.3, t0: 1, t1: 3 }), pen([[191, 197.5], [181, 209.5]], 2.1, { thin: 0.3, t0: 1, t1: 3 })];
pens.tall.storyBracket = pen([[28, 256], [34, 246], [180, 243], [326, 247], [332, 257]], 2.4, { thin: 0.45, t0: 3, t1: 5 });

const out = {
  generated: new Date().toISOString().slice(0, 10),
  generated_by: 'tools/film-data.mjs',
  inputs: ['data/lattice.json'],
  source: 'OWN-ENUM',
  what: 'An example run of six rounds on the distance-3 grid, constructed by us: which errors are on the chip, and which checks light (change their answer from the round before). Also the stories behind one frame, and the drawn lines of the figure.',
  convention: 'a check lights in a round when its answer differs from the round before; round 0 has every answer even',
  lattice_checks: checks.map(({ id, shape, edge, row, col, qubits }) => ({ id, shape, edge, row, col, qubits, asks_about: id[0] === 'z' ? 'flips' : 'phase errors' })),
  rounds,
  stories: { lights: ['z0', 'z1'], one: storyA, two: storyB, all_pairs: pairs, together_flip_stored_value: true,
    one_flip_against_all_pairs: { p: P, independent: true, times_likelier: Math.round(ratio) } },
  layout: LAYOUT,
  pen: pens,
};
writeFileSync(join(DATA, 'film.json'), JSON.stringify(out) + '\n', 'utf8');
console.log('wrote data/film.json:', rounds.map((r) => `r${r.round}[${r.lit.join(' ')}]`).join(' '), `pairs ${JSON.stringify(pairs)}, one flip ${ratio.toFixed(0)}x likelier than all pairs at p=${P}`);
