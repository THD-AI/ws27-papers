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

// ---- the same lights, from different errors (step 6) ----------------------------
const flipLights = (qs) => checks.filter((c) => kindOf(c.id) === 'flip' && qs.filter((q) => c.qubits.includes(q)).length % 2).map((c) => c.id).join(',');
const storyA = [4], storyB = [1, 7];
assert(flipLights(storyA) === 'z0,z1' && flipLights(storyB) === 'z0,z1', 'both stories light z0 and z1');
// together they are a flip on the middle column, which no check sees and which flips the stored value
const both = [1, 4, 7];
assert(flipLights(both) === '', 'the two stories together light nothing');
const LZ = [0, 1, 2];   // the top row: a flip on the middle column changes its parity, so the stored value flips
assert(both.filter((q) => LZ.includes(q)).length % 2 === 1, 'together they flip the stored value');
const P = 0.001;        // one flip against two: at a chance of p per qubit, two are about p times as likely as one
const oddsOneToTwo = Math.round((P * (1 - P)) / (P * P));

// ---- the pen ---------------------------------------------------------------------
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
function pen(ctrl, size) {
  const pts = cr(ctrl).map((p, i, a) => {
    const u = a[Math.max(0, i - 1)], v = a[Math.min(a.length - 1, i + 1)];
    const sp = Math.hypot(v[0] - u[0], v[1] - u[1]);
    return [p[0], p[1], Math.max(0.22, Math.min(1, 1.2 - sp / 11))];
  });
  const s = getStroke(pts, { size, thinning: 0.72, smoothing: 0.55, streamline: 0.3, simulatePressure: false,
    start: { taper: size * 5, cap: true }, end: { taper: size * 8, cap: true } });
  const f = (v) => v.toFixed(1);
  let d = `M${f(s[0][0])} ${f(s[0][1])}Q`;
  for (let i = 0; i < s.length; i++) { const [x0, y0] = s[i], [x1, y1] = s[(i + 1) % s.length]; d += `${f(x0)} ${f(y0)} ${f((x0 + x1) / 2)} ${f((y0 + y1) / 2)} `; }
  return d.trim() + 'Z';
}

// Geometry of the two layouts, shared with figures/film.js through the data.
const LAYOUT = {
  wide: { W: 720, H: 470, win: [138, 558], fw: 105, chipY: 128, stripY: 292, stripH: 132, pitch: 21, visible: 4,
    box: [584, 222, 704, 362], notesY: 392, keyY: 450 },
  tall: { W: 360, H: 440, win: [22, 338], fw: 105.3, chipY: 118, stripY: 246, stripH: 106, pitch: 19, visible: 3,
    box: [60, 372, 300, 406], notesY: 340, keyY: 430 },
};
function strokes(L, tall) {
  const [x0, x1] = L.win, yT = L.stripY - L.stripH / 2, yB = L.stripY + L.stripH / 2;
  const [bx0, by0, bx1, by1] = L.box;
  const S = {};
  const run = tall ? x1 + 4 : bx0 + 6;
  S.stripTop = pen([[x0 - 8, yT + 0.6], [x0 + 120, yT - 1.1], [x0 + 260, yT + 0.7], [run, yT - 0.4]], 3);
  S.stripBottom = pen([[x0 - 5, yB - 0.4], [x0 + 140, yB + 1.2], [x0 + 280, yB - 0.5], [run - 2, yB + 0.8]], 3);
  if (tall) {
    // the decoder below the strip: a box, and an arrow from the strip down into it
    S.box = [pen([[bx0 - 3, by0 + 1], [bx0 + 110, by0 - 1.2], [bx1 + 4, by0 + 0.8]], 3.2), pen([[bx1 + 1, by0 - 4], [bx1 + 2.2, (by0 + by1) / 2], [bx1 - 0.5, by1 + 4]], 3.2),
      pen([[bx1 + 3, by1 - 0.6], [bx0 + 90, by1 + 1.1], [bx0 - 2, by1 - 0.2]], 3.2), pen([[bx0 + 1, by1 + 3], [bx0 - 1.2, (by0 + by1) / 2], [bx0 + 0.6, by0 - 4]], 3.2)];
    const ax = (bx0 + bx1) / 2;
    const m = (by0 + by1) / 2;
    S.arrow = [pen([[34, yB + 6], [32.5, (yB + by0) / 2 + 14], [35, m]], 2.6), pen([[35, m], [46, m + 0.6], [55, m]], 2.4), pen([[47, m - 7], [57, m], [47, m + 7.5]], 2.2)];
  } else {
    // the decoder at the end of the strip: the strip runs into its left side
    S.box = [pen([[bx0 - 2, by0 + 1], [bx0 + 60, by0 - 1.4], [bx1 + 4, by0 + 0.6]], 3.2), pen([[bx1 + 0.5, by0 - 5], [bx1 + 2, (by0 + by1) / 2], [bx1 - 1, by1 + 4]], 3.2),
      pen([[bx1 + 3, by1 - 0.4], [bx0 + 50, by1 + 1.2], [bx0 - 3, by1 - 0.3]], 3.2), pen([[bx0 + 0.5, by1 + 3], [bx0 - 0.5, yB + 6]], 3), pen([[bx0, yT - 6], [bx0 + 1, by0 - 3]], 3)];
  }
  // notes: an underline for "no change" and a bracket over the two misreport frames (positions in window units, placed by the figure)
  S.tick = pen([[0, 10], [2, 0], [-1, -12]], 2.2);
  S.bracket = pen([[-L.fw * 0.86, -6], [-L.fw * 0.8, 3], [0, 2.2], [L.fw * 0.8, 3.4], [L.fw * 0.86, -5]], 2.4);
  // step 6: an arrow from the seen frame to the stories, and a bracket over the stories
  return S;
}
const pens = { wide: strokes(LAYOUT.wide, false), tall: strokes(LAYOUT.tall, true) };
pens.wide.storyArrow = pen([[250, 210], [300, 200], [352, 207], [388, 216]], 2.6);
pens.wide.storyArrowHead = pen([[377, 204], [390, 216], [376, 228]], 2.2);
pens.wide.storyBracket = pen([[402, 108], [408, 97], [552, 93], [696, 98], [702, 109]], 2.4);
pens.tall.storyArrow = pen([[180, 172], [178, 190], [181, 208]], 2.6);
pens.tall.storyArrowHead = pen([[169, 198], [180, 211], [192, 197]], 2.2);
pens.tall.storyBracket = pen([[28, 256], [34, 246], [180, 243], [326, 247], [332, 257]], 2.4);

const out = {
  generated: new Date().toISOString().slice(0, 10),
  generated_by: 'tools/film-data.mjs',
  inputs: ['data/lattice.json'],
  source: 'OWN-ENUM',
  what: 'An example run of six rounds on the distance-3 grid, constructed by us: which errors are on the chip, and which checks light (change their answer from the round before). Also the two stories behind one frame, and the drawn lines of the figure.',
  convention: 'a check lights in a round when its answer differs from the round before; round 0 has every answer even',
  lattice_checks: checks.map(({ id, shape, edge, row, col, qubits }) => ({ id, shape, edge, row, col, qubits, asks_about: id[0] === 'z' ? 'flips' : 'phase errors' })),
  rounds,
  stories: { lights: ['z0', 'z1'], one: storyA, two: storyB, together_flip_stored_value: true, one_flip_against_two_at_p: { p: P, times_likelier: oddsOneToTwo } },
  layout: LAYOUT,
  pen: pens,
};
writeFileSync(join(DATA, 'film.json'), JSON.stringify(out) + '\n', 'utf8');
console.log('wrote data/film.json:', rounds.map((r) => `r${r.round}[${r.lit.join(' ')}]`).join(' '), `one flip ${oddsOneToTwo}x likelier than two at p=${P}`);
