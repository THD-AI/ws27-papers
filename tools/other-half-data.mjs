#!/usr/bin/env node
// Regenerates the own-result data files of articles/other-half from the group's result files,
// so that no measured number is typed by hand.
//
//   node tools/other-half-data.mjs [--results <folder>]
//
// <folder> is seminar/experiments/results in the Quantum course repository (private). Default: the
// worktree next to this repository, or the environment variable QEC_RESULTS.
//
// Writes into articles/other-half/data/:
//   learning.json         own learning curves, distance 3 and 5            OWN-D3, OWN-D5, OWN-D5-250M
//   noise.json            the 250-million run over eight noise levels      OWN-D5-250M
//   syndromes.json        all 256 check patterns at distance 3             OWN-ENUM
//   lattice.json          the distance-3 grid and the computed example     OWN-ENUM
//   line.json             a distance-5 grid, three errors, the wrong guess OWN-ARITH
//   qubits.json           qubits per logical qubit, distances 3 to 9       OWN-ARITH
//   results-summary.json  every own number used in text.md, with its file
//
// Not written here (copied from the cited papers by hand): clock.json, suppression.json.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '..');
const OUT = join(repo, 'articles', 'other-half', 'data');
const argAt = process.argv.indexOf('--results');
const RESULTS = resolve(argAt > 0 ? process.argv[argAt + 1]
  : process.env.QEC_RESULTS || join(repo, '../../../dotUni/.worktrees/quantum-seminar/seminar/experiments/results'));
if (!existsSync(RESULTS)) { console.error('results folder not found: ' + RESULTS); process.exit(1); }
mkdirSync(OUT, { recursive: true });

const read = rel => JSON.parse(readFileSync(join(RESULTS, rel), 'utf8'));
const write = (name, obj) => { writeFileSync(join(OUT, name), JSON.stringify(obj, null, 1) + '\n', 'utf8'); console.log('wrote data/' + name); };
const now = new Date(), two = n => String(n).padStart(2, '0');
const today = `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}`;   // local date
const head = inputs => ({ generated: today, generated_by: 'tools/other-half-data.mjs', inputs });

// 95% Wilson interval, the same formula as in the experiment scripts
function wilson(k, n, z = 1.96) {
  const ph = k / n, den = 1 + z * z / n, mid = (ph + z * z / (2 * n)) / den;
  const half = z * Math.sqrt(ph * (1 - ph) / n + z * z / (4 * n * n)) / den;
  return [Math.max(0, mid - half), Math.min(1, mid + half)];
}
const count = (errors, shots) => ({ errors, shots, rate: errors / shots, ci95: wilson(errors, shots) });
const pool = list => count(list.reduce((s, c) => s + c.errors, 0), list.reduce((s, c) => s + c.shots, 0));
const range = xs => ({ min: Math.min(...xs), max: Math.max(...xs), mean: xs.reduce((a, b) => a + b, 0) / xs.length });
const overlap = (a, b) => a.ci95[0] <= b.ci95[1] && b.ci95[0] <= a.ci95[1];

// ---------------------------------------------------------------- the neural-decoder runs
const RUNS = [
  // "repeat": run later with new seeds and the same settings
  { id: 'd3', source: 'OWN-D3', file: 'neural_pilot_d3.json', parts: [
    { dir: 'kaggle-d3/d3-seeds', seeds: [1, 2, 3, 4, 5] },
    { dir: 'kaggle-d3-rerun/d3-seeds', seeds: [11, 12, 13], repeat: true }] },
  { id: 'd5-66m', source: 'OWN-D5', file: 'neural_pilot_d5.json', parts: [
    { dir: 'kaggle-d5/d5-seeds', seeds: [1, 2, 3, 4, 5] }] },
  { id: 'd5-250m', source: 'OWN-D5-250M', file: 'neural_pilot_d5.json', parts: [
    { dir: 'kaggle-d5-250m/d5-seeds', seeds: [1, 2] },
    { dir: 'kaggle-d5-250m-rerun/d5-seeds', seeds: [11, 12, 13], repeat: true }] },
];
const P_MAIN = 0.005;

function loadRun(spec) {
  const seeds = spec.parts.flatMap(part => part.seeds.map(n => ({ n, part }))).map(({ n, part }) => {
    const rel = `${part.dir}/seed-${n}/${spec.file}`, j = read(rel);
    const cell = (row, name) => row[name] ? count(row[name].errors, row.shots) : null;
    const rows = j.rows.map(r => ({ p: r.p, shots: r.shots, network: cell(r, 'neural'), plain: cell(r, 'matching'),
      correlated: cell(r, 'correlated'), table: cell(r, 'table') }));
    const probeShots = j.data_efficiency.test_shots, probePlain = Math.round(j.data_efficiency.matching_rate * probeShots);
    return {
      seed: n, later_repeat: !!part.repeat, file: rel, rng_seed: j.seed, tool_versions: j.tool_versions,
      distance: j.distance, rounds: j.rounds, detectors: j.detectors, noise_model: j.noise_model, code: j.code,
      network: j.network, steps: j.training.steps, batch: j.training.batch, training_shots: j.training.shots_seen,
      train_noise_levels: j.training.train_ps, schedule: j.training.schedule,
      train_seconds: j.training.seconds, device: j.training.device, table_shots_per_p: j.table_shots_per_p,
      probe: { p: j.data_efficiency.p, shots: probeShots, plain: count(probePlain, probeShots) },
      points: j.data_efficiency.points.map(q => ({ step: q.step, training_shots: q.shots_seen, ...count(q.errors, probeShots) })),
      rows,
    };
  });
  return { ...spec, seeds };
}
const runs = Object.fromEntries(RUNS.map(s => [s.id, loadRun(s)]));

// the two long runs reuse the random seeds of seeds 1 and 2 of the five-seed run: same test shots
const twins = runs['d5-250m'].seeds.map(s => [s, runs['d5-66m'].seeds.find(t => t.rng_seed === s.rng_seed)]).filter(p => p[1]);
const sharedTest = {
  seeds: twins.map(p => p[0].seed),
  same_test_runs: twins.every(([s, t]) => t.rows.every((r, i) => r.plain.errors === s.rows[i].plain.errors)),
  // both were trained from scratch; the curves are identical until the shorter run starts lowering its learning rate
  identical_curve_points_until: twins.map(([s, t]) => { let last = null; for (const q of s.points) { const o = t.points.find(x => x.step === q.step); if (o && o.errors === q.errors) last = q.training_shots; else break; } return last; }),
};

function atP(seed, p) { return seed.rows.find(r => Math.abs(r.p - p) < 1e-12); }
function levels(run, p) {
  const rs = run.seeds.map(s => atP(s, p));
  const o = { plain: pool(rs.map(r => r.plain)), correlated: pool(rs.map(r => r.correlated)) };
  if (rs[0].table) o.table = pool(rs.map(r => r.table));
  o.plain.per_seed = range(rs.map(r => r.plain.rate)); o.correlated.per_seed = range(rs.map(r => r.correlated.rate));
  return o;
}
// first checkpoint from which the network stays below a level on the fixed probe set
function staysBelow(points, level) {
  let at = null;
  for (let i = points.length - 1; i >= 0; i--) { if (points[i].rate < level) at = points[i]; else break; }
  return at ? { step: at.step, training_shots: at.training_shots } : null;
}

const learning = {
  ...head(Object.values(runs).flatMap(r => r.seeds.map(s => s.file))),
  what: 'Share of simulated runs in which a decoder gave the wrong answer about the logical qubit, against the number of training runs the network had seen.',
  noise_level: P_MAIN,
  note_probe: 'Curve points are scored on a fixed probe set of 1,000,000 runs per seed. The two matching levels and the final network value come from 2,000,000 fresh test runs per seed.',
  note_schedule: 'Every run lowers its learning rate over its last fifth. The last points of a 66-million run are therefore not the same as the 66-million point of a 250-million run.',
  d5_250m_against_d5_66m_same_random_seeds: sharedTest,
  later_repeats: 'Seeds 11 to 13 of d3 and of d5-250m were run later, with new seeds and the same settings.',
  panels: Object.values(runs).map(run => {
    const lv = levels(run, P_MAIN), s0 = run.seeds[0];
    return {
      id: run.id, source: run.source, distance: s0.distance, rounds: s0.rounds, detectors: s0.detectors,
      network_parameters: s0.network.parameters, training_shots: s0.training_shots, seeds: run.seeds.length,
      levels: lv,
      final_network: { per_seed: run.seeds.map(s => ({ seed: s.seed, later_repeat: s.later_repeat, ...atP(s, P_MAIN).network })), ...range(run.seeds.map(s => atP(s, P_MAIN).network.rate)), pooled: pool(run.seeds.map(s => atP(s, P_MAIN).network)) },
      curves: run.seeds.map(s => ({
        seed: s.seed, later_repeat: s.later_repeat, probe_plain: s.probe.plain,
        below_plain_from: staysBelow(s.points, s.probe.plain.rate),
        below_correlated_from: staysBelow(s.points, lv.correlated.rate),
        first_point_below_plain: (q => q ? q.training_shots : null)(s.points.find(q => q.rate < s.probe.plain.rate)),
        points: s.points.map(q => ({ training_shots: q.training_shots, rate: q.rate, ci95: q.ci95 })),
      })),
    };
  }),
};
write('learning.json', learning);

// ---------------------------------------------------------------- the 250-million run over noise levels
const long = runs['d5-250m'];
// Verdicts compare the 95% intervals of the pooled values: all long seeds together, 2,000,000 runs per seed.
const verdict = (net, other) => net.ci95[1] < other.ci95[0] ? 'ahead' : net.ci95[0] > other.ci95[1] ? 'behind' : 'level';
const noise = {
  ...head(long.seeds.map(s => s.file)), source: 'OWN-D5-250M',
  what: 'Distance 5, five rounds, network trained on about 250 million simulated runs (' + long.seeds.length + ' seeds, each trained from scratch). Share of fresh test runs in which each decoder was wrong, at eight noise levels.',
  seeds: long.seeds.map(s => ({ seed: s.seed, later_repeat: s.later_repeat })),
  comparison_basis: 'network_vs_correlated and network_vs_plain compare the 95% Wilson intervals of the pooled values (' + long.seeds.length + ' seeds, ' + long.seeds.length * 2 + ' million runs per noise level). "level" means the intervals overlap. The pooled interval of the network does not include the spread between seeds; that spread is in network.per_seed and network.seed_range.',
  training_shots: long.seeds[0].training_shots, train_noise_levels: long.seeds[0].train_noise_levels,
  rows: long.seeds[0].rows.map(r0 => {
    const rs = long.seeds.map(s => atP(s, r0.p));
    const net = rs.map(r => r.network), plain = pool(rs.map(r => r.plain)), corr = pool(rs.map(r => r.correlated));
    const netPooled = pool(net);
    return {
      p: r0.p, shots_per_seed: r0.shots, trained_at_this_level: long.seeds[0].train_noise_levels.includes(r0.p),
      network: { pooled: netPooled, seed_range: range(net.map(c => c.rate)), per_seed: net.map((c, i) => ({ seed: long.seeds[i].seed, ...c })) },
      plain: { pooled: plain, per_seed: rs.map((r, i) => ({ seed: long.seeds[i].seed, ...r.plain })) },
      correlated: { pooled: corr, per_seed: rs.map((r, i) => ({ seed: long.seeds[i].seed, ...r.correlated })) },
      network_vs_correlated: verdict(netPooled, corr), network_vs_plain: verdict(netPooled, plain),
      seeds_ahead_of_plain: net.filter((c, i) => c.rate < rs[i].plain.rate).length,
      seeds_ahead_of_correlated: net.filter((c, i) => c.rate < rs[i].correlated.rate).length,
      network_over_correlated: netPooled.rate / corr.rate, network_over_plain: netPooled.rate / plain.rate,
    };
  }),
};
write('noise.json', noise);

// ---------------------------------------------------------------- the surface code as geometry
// Rotated surface code of odd distance d. Storing qubit q = row * d + col.
// A check between rows r, r+1 and columns c, c+1 asks about phase errors when r + c is even ("x"),
// about flips when it is odd ("z"). Half checks at the edges: x on top and bottom, z on left and right.
function code(d) {
  const checks = [];
  for (let r = -1; r < d; r++) for (let c = -1; c < d; c++) {
    const qs = [];
    for (const [rr, cc] of [[r, c], [r, c + 1], [r + 1, c], [r + 1, c + 1]]) if (rr >= 0 && rr < d && cc >= 0 && cc < d) qs.push(rr * d + cc);
    const kind = (r + c) % 2 === 0 ? 'x' : 'z';
    if (qs.length === 4) checks.push({ kind, shape: 'square', row: r, col: c, qubits: qs });
    else if (qs.length === 2) {
      const edge = r === -1 ? 'top' : r === d - 1 ? 'bottom' : c === -1 ? 'left' : 'right';
      if ((kind === 'x') === (edge === 'top' || edge === 'bottom')) checks.push({ kind, shape: 'half', edge, row: r, col: c, qubits: qs });
    }
  }
  const order = { square: 0, half: 1 };
  for (const k of ['x', 'z']) checks.filter(c => c.kind === k).sort((a, b) => order[a.shape] - order[b.shape] || a.row - b.row || a.col - b.col)
    .forEach((c, i) => { c.id = k + i; });
  checks.sort((a, b) => a.id < b.id ? -1 : 1);
  if (checks.length !== d * d - 1) throw new Error('check count');
  return { d, checks, x: checks.filter(c => c.kind === 'x'), z: checks.filter(c => c.kind === 'z') };
}
const fired = (cs, set) => cs.filter(c => c.qubits.filter(q => set.includes(q)).length % 2 === 1).map(c => c.id);
const checkOut = c => ({ id: c.id, asks_about: c.kind === 'x' ? 'phase errors' : 'flips', shape: c.shape, ...(c.edge ? { edge: c.edge } : {}),
  row: c.row, col: c.col, qubits: c.qubits });

const qubits = {
  ...head([]), source: 'OWN-ARITH',
  what: 'Physical qubits for one logical qubit in the surface code: d × d storing qubits and d × d − 1 helpers, 2d² − 1 in all.',
  rows: [3, 5, 7, 9].map(d => ({ distance: d, storing: d * d, helpers: code(d).checks.length, total: 2 * d * d - 1, source: 'OWN-ARITH' })),
};
write('qubits.json', qubits);

// ---------------------------------------------------------------- the enumeration at distance 3
// A port of docs/proposal/paper/data/find_example.py (Quantum course repository), same order of loops.
// Every storing qubit suffers X, Z or Y with probability p/3 each; checks are perfect.
const c3 = code(3), P_ENUM = 0.05;
{ // the layout must be the proposal's
  const want = { x: [[0, 1, 3, 4], [4, 5, 7, 8], [1, 2], [6, 7]], z: [[1, 2, 4, 5], [3, 4, 6, 7], [0, 3], [5, 8]] };
  for (const k of ['x', 'z']) c3[k].forEach((c, i) => { if (c.qubits.join() !== want[k][i].join()) throw new Error('layout differs from find_example.py'); });
}
const XS = c3.x.map(c => c.qubits), ZS = c3.z.map(c => c.qubits), LX = [0, 3, 6], LZ = [0, 1, 2];
const all = Array.from({ length: 512 }, (_, i) => Array.from({ length: 9 }, (_, q) => (i >> (8 - q)) & 1));
const par = (b, sup) => sup.reduce((s, q) => s + b[q], 0) & 1;
const key = (b, sups) => sups.map(s => par(b, s)).join('');
const weight = b => b.reduce((s, v) => s + v, 0);
function minweight(sups, logical) {
  const best = new Map();
  for (const b of all) {
    const s = key(b, sups), w = weight(b), f = par(b, logical), cur = best.get(s);
    if (!cur || w < cur.w) best.set(s, { w, flips: new Set([f]), b });
    else if (w === cur.w) cur.flips.add(f);
  }
  return best;
}
const mx = minweight(ZS, LZ), mz = minweight(XS, LX);        // flips light z checks, phase errors light x checks
const prob = new Map();
const sxOf = all.map(b => key(b, ZS)), fxOf = all.map(b => par(b, LZ)), szOf = all.map(b => key(b, XS)), fzOf = all.map(b => par(b, LX));
const pw = Array.from({ length: 10 }, (_, w) => Math.pow(P_ENUM / 3, w) * Math.pow(1 - P_ENUM, 9 - w));
for (let i = 0; i < 512; i++) for (let j = 0; j < 512; j++) {
  let w = 0; for (let q = 0; q < 9; q++) if (all[i][q] || all[j][q]) w++;
  const k = sxOf[i] + '|' + szOf[j], cls = fxOf[i] + '' + fzOf[j];
  let m = prob.get(k); if (!m) { m = new Map(); prob.set(k, m); }
  m.set(cls, (m.get(cls) || 0) + pw[w]);
}
const letters = (xb, zb) => Object.fromEntries(Array.from({ length: 9 }, (_, q) => [q, 'IXZY'[xb[q] + 2 * zb[q]]]).filter(e => e[1] !== 'I'));
function likeliestError(sx, sz, cls) {
  let best = null;
  for (let i = 0; i < 512; i++) { if (sxOf[i] !== sx || fxOf[i] !== +cls[0]) continue;
    for (let j = 0; j < 512; j++) { if (szOf[j] !== sz || fzOf[j] !== +cls[1]) continue;
      let w = 0; for (let q = 0; q < 9; q++) if (all[i][q] || all[j][q]) w++;
      if (!best || w < best.w) best = { w, xb: all[i], zb: all[j] }; } }
  return best;
}
const cells = [];
for (const [k, classes] of prob) {
  const [sx, sz] = k.split('|'), a = mx.get(sx), b = mz.get(sz);
  const total = [...classes.values()].reduce((s, v) => s + v, 0);
  let ml = null; for (const [cls, v] of classes) if (ml === null || v > classes.get(ml)) ml = cls;
  const tie = a.flips.size > 1 || b.flips.size > 1;
  const matchCls = tie ? null : [...a.flips][0] + '' + [...b.flips][0];
  cells.push({ sx, sz, total, tie, matchCls, ml, pMatch: tie ? null : classes.get(matchCls) / total, pMl: classes.get(ml) / total,
    // Compare with a tolerance: under this model a Y costs the same as an X, so two classes are often exactly
    // equally likely, and a strict comparison of floating-point sums would let rounding call one of them "the most
    // likely". Such a pattern is a tie: no decoder can do better than matching on it.
    correction: letters(a.b, b.b),
    state: tie ? 'tie' : classes.get(matchCls) >= classes.get(ml) * (1 - 1e-9) ? (matchCls === ml ? 'same' : 'tie-best') : 'differs' });
}
const differs = cells.filter(c => c.state === 'differs').sort((a, b) => (+b.total.toPrecision(10)) - (+a.total.toPrecision(10)) || (a.sx < b.sx ? 1 : a.sx > b.sx ? -1 : 0) || (a.sz < b.sz ? 1 : -1));
const nTie = cells.filter(c => c.state === 'tie').length;
const nTieBest = cells.filter(c => c.state === 'tie-best').length;
if (differs.length !== 24) throw new Error('expected 24 patterns where matching is strictly less likely, got ' + differs.length);
if (cells.length !== 256) throw new Error('expected 256 patterns, got ' + cells.length);
// The proposal's Figure 1 shows the pattern z2 + x0 + x1. Several differing patterns are equally frequent
// (mirror images of each other); which of them a sort lists first is decided by rounding, so it is named here
// and checked to be one of the most frequent.
const ex = differs.find(c => c.sx === '0010' && c.sz === '1100');
const mostFrequent = differs.filter(c => +c.total.toPrecision(10) === +differs[0].total.toPrecision(10)).length;
if (!ex || +ex.total.toPrecision(10) !== +differs[0].total.toPrecision(10)) throw new Error('the proposal\'s example is not among the most frequent differing patterns');
const exLikely = likeliestError(ex.sx, ex.sz, ex.ml);
const firedIds = (bits, cs) => cs.filter((_, i) => bits[i] === '1').map(c => c.id);
const pops = s => [...s].filter(ch => ch === '1').length;
const order16 = Array.from({ length: 16 }, (_, i) => i.toString(2).padStart(4, '0')).sort((a, b) => pops(a) - pops(b) || (a < b ? 1 : -1));

write('syndromes.json', {
  ...head(['port of docs/proposal/paper/data/find_example.py']), source: 'OWN-ENUM',
  what: 'All 256 patterns of the eight checks at distance 3. For each: does the correction of smallest weight per kind of check (plain matching) belong to the most likely kind of correction?',
  conditions: { error_per_storing_qubit: P_ENUM, error_kinds: 'X, Z or Y, each with a third of that chance', checks: 'perfect, one round' },
  counts: { patterns: cells.length, differs: differs.length, same: cells.filter(c => c.state === 'same').length, tie: nTie, tied_with_the_likeliest: nTieBest },
  share_of_all_cases_with_a_differing_pattern: differs.reduce((s, c) => s + c.total, 0),
  share_of_all_cases_with_no_check_fired: cells.find(c => c.sx === '0000' && c.sz === '0000').total,
  grid: { rows: 'flip-check pattern (z0 z1 z2 z3)', columns: 'phase-check pattern (x0 x1 x2 x3)', order: order16,
    order_note: 'sorted by the number of fired checks, none first' },
  example: { flip_checks: ex.sx, phase_checks: ex.sz, equally_frequent_differing_patterns: mostFrequent },
  cells: order16.flatMap((sx, r) => order16.map((sz, c) => {
    const k = cells.find(q => q.sx === sx && q.sz === sz);
    return { row: r, col: c, flip_checks: sx, phase_checks: sz, fired: pops(sx) + pops(sz), state: k.state, chance_of_pattern: k.total,
      chance_matching_right: k.pMatch, chance_likeliest_right: k.pMl, source: 'OWN-ENUM' };
  })),
});

write('lattice.json', {
  ...head(['port of docs/proposal/paper/data/find_example.py']), source: 'OWN-ENUM',
  what: 'The surface code at distance 3 and the computed example of the proposal\'s Figure 1.',
  distance: 3, storing_qubits: 9, helpers: 8, total: 17,
  qubit_position: 'q = row * 3 + col, rows from the top, columns from the left',
  checks: c3.checks.map(checkOut),
  walk: [
    { step: 1, errors: { 4: 'X' }, fired: fired(c3.z, [4]), note: 'one flip in the middle fires the two flip-checks beside it' },
    { step: 2, errors: { 4: 'X', 7: 'X' }, fired: fired(c3.z, [4, 7]), note: 'a row of two: the check between them sees two errors and stays quiet; the row ends at the edge without firing' },
  ],
  example: {
    conditions: { error_per_storing_qubit: P_ENUM, checks: 'perfect, one round' },
    fired: [...firedIds(ex.sx, c3.z), ...firedIds(ex.sz, c3.x)],
    chance_of_pattern: ex.total,
    plain_matching: { errors: ex.correction, chance_right: ex.pMatch, flip_puzzle: 'z2 joined to the left edge through qubit 0', phase_puzzle: 'x0 joined to x1 through qubit 4' },
    read_together: { errors: letters(exLikely.xb, exLikely.zb), chance_right: ex.pMl },
    rest: 1 - ex.pMatch - ex.pMl,
    source: 'OWN-ENUM',
  },
});

// ---------------------------------------------------------------- a logical error at distance 5
const c5 = code(5);
{
  const real = [2, 7, 12], guess = [17, 22], both = [...real, ...guess];   // column 2: rows 0-2 real, rows 3-4 guessed
  const fr = fired(c5.z, real), fg = fired(c5.z, guess), fb = fired(c5.z, both);
  const crosses = both.filter(q => q < 5).length % 2 === 1;               // crosses the top row once
  if (fr.join() !== fg.join() || fr.length !== 1 || fb.length !== 0 || !crosses) throw new Error('line example does not hold');
  // no single flip explains the fired check alone, so two is the smallest explanation
  for (let q = 0; q < 25; q++) if (fired(c5.z, [q]).join() === fr.join()) throw new Error('a single flip explains it');
  write('line.json', {
    ...head([]), source: 'OWN-ARITH',
    what: 'Distance 5: three real flips in one column fire one check. The smallest explanation of that check is two flips below it. Real errors and correction together cross the grid and no check fires.',
    distance: 5, qubit_position: 'q = row * 5 + col', flip_checks: c5.z.map(checkOut),
    real_errors: real, fired_by_real_errors: fr, decoder_correction: guess, fired_by_correction_alone: fg,
    together: both, fired_together: fb, crosses_from: 'top edge', crosses_to: 'bottom edge',
    checked: 'the script recomputes the fired checks and stops if the example does not hold',
  });
}

// ---------------------------------------------------------------- correlated against plain matching, timing
const cc = read('correlated-check-2026-11-15.json'), tm = read('timing-2026-11-15.json');
const mc = cc.monte_carlo.map(r => ({ basis: r.basis, distance: r.d, rounds: r.rounds, p: r.p, shots: r.shots,
  plain: count(r.plain.errors, r.shots), correlated: count(r.correlated.errors, r.shots),
  only_plain_wrong: r.only_plain_wrong, only_correlated_wrong: r.only_correlated_wrong, paired_z: r.paired_z_correlated_worse }));
const sf = cc.single_faults.map(r => ({ basis: r.basis, distance: r.d, rounds: r.rounds, mechanisms: r.fault_classes,
  plain_fails: r.plain_failed, correlated_fails: r.correlated_failed, chance_over_p: r.correlated_failed_probability_over_p }));
const dec = tm.decoding.filter(r => r.d === r.rounds && r.p === 0.005).map(r => ({ distance: r.d, rounds: r.rounds, shots: r.decoders.matching.shots,
  plain_us_per_run: r.decoders.matching.us_per_shot, correlated_us_per_run: r.decoders.correlated.us_per_shot,
  network_one_core_us_per_run: r.decoders.network_1_thread.us_per_shot }));
const decAll = tm.decoding.filter(r => r.d === r.rounds).map(r => ({ distance: r.d, rounds: r.rounds, p: r.p,
  plain_us_per_run: r.decoders.matching.us_per_shot, correlated_us_per_run: r.decoders.correlated.us_per_shot,
  network_one_core_us_per_run: r.decoders.network_1_thread.us_per_shot, network_over_plain: r.decoders.network_1_thread.us_per_shot / r.decoders.matching.us_per_shot }));

const pct = (x, n = 2) => (100 * x).toFixed(n) + '%';
const ci = c => `${pct(c.rate, 3)} (${pct(c.ci95[0], 3)}–${pct(c.ci95[1], 3)})`;
const panel = id => learning.panels.find(p => p.id === id);
const d3low = [0.001, 0.002, 0.003, 0.004, 0.005].map(p => ({ p, ...(({ plain, correlated }) => ({ plain, correlated }))(levels(runs.d3, p)) }));

const summary = {
  ...head(['kaggle-d3', 'kaggle-d3-rerun', 'kaggle-d5', 'kaggle-d5-250m', 'kaggle-d5-250m-rerun', 'correlated-check-2026-11-15.json', 'timing-2026-11-15.json']),
  method: Object.fromEntries(Object.values(runs).map(r => { const s = r.seeds[0]; return [r.id, {
    source: r.source, code: s.code, distance: s.distance, rounds: s.rounds, detectors: s.detectors, noise_model: s.noise_model,
    network: s.network, steps: s.steps, batch: s.batch, training_shots: s.training_shots, train_noise_levels: s.train_noise_levels,
    schedule: s.schedule, seeds: r.seeds.map(q => q.rng_seed), test_shots_per_noise_level: s.rows[0].shots, probe_shots: s.probe.shots,
    table_shots_per_noise_level: s.table_shots_per_p, tool_versions: s.tool_versions, device: [...new Set(r.seeds.map(q => q.device))],
    train_seconds: range(r.seeds.map(q => q.train_seconds)) }]; })),
  at_noise_0_005: Object.fromEntries(learning.panels.map(p => [p.id, { source: p.source, network: p.final_network, levels: p.levels,
    below_plain_from: p.curves.map(c => c.below_plain_from), below_correlated_from: p.curves.map(c => c.below_correlated_from) }])),
  d5_250m_at_about_66_million: runs['d5-250m'].seeds.map(s => { const q = s.points.reduce((a, b) => Math.abs(b.training_shots - 65536000) < Math.abs(a.training_shots - 65536000) ? b : a); return { seed: s.seed, training_shots: q.training_shots, rate: q.rate, ci95: q.ci95 }; }),
  d5_250m_last_two_probe_points: runs['d5-250m'].seeds.map(s => s.points.slice(-3).map(q => ({ seed: s.seed, training_shots: q.training_shots, rate: q.rate }))),
  d3_plain_against_correlated_in_the_five_seed_run: d3low,
  correlated_check: { source: 'OWN-CORR', monte_carlo: mc },
  single_mechanisms: { source: 'OWN-CORR', rows: sf, failing_detector_sets_d3_r3_Z: cc.single_faults.find(r => r.basis === 'Z' && r.d === 3 && r.rounds === 3).correlated_failed_detectors,
    pairs_d5: cc.fault_pairs_d5 },
  timing: { source: 'OWN-TIME', machine: tm.machine.cpu, emulated: tm.machine.python_build_is_x64_on_arm64, decoding_at_noise_0_005: dec, decoding_all: decAll, notes: tm.notes, python: tm.machine.python,
    training_step_ms: tm.training.filter(r => r.d === r.rounds).map(r => ({ distance: r.d, ms_per_step: r.ms_per_step_mean })) },
  enumeration: { source: 'OWN-ENUM', patterns: 256, differs: differs.length, ties: nTie, tied_with_the_likeliest: nTieBest, example_matching: ex.pMatch, example_likeliest: ex.pMl },
};
write('results-summary.json', summary);

// ---------------------------------------------------------------- a readable print-out
console.log('\nAt noise 0.5%:');
for (const p of learning.panels) {
  const f = p.final_network;
  console.log(` ${p.id} (${p.seeds} seeds): network ${pct(f.min, 3)} to ${pct(f.max, 3)} (mean ${pct(f.mean, 3)}, pooled ${ci(f.pooled)}), plain ${ci(p.levels.plain)}, correlated ${ci(p.levels.correlated)}` + (p.levels.table ? `, table ${ci(p.levels.table)}` : ''));
  console.log(`   ratios: net/plain ${(f.min / p.levels.plain.rate).toFixed(3)}–${(f.max / p.levels.plain.rate).toFixed(3)} pooled ${(f.pooled.rate / p.levels.plain.rate).toFixed(3)}; net/corr ${(f.min / p.levels.correlated.rate).toFixed(3)}–${(f.max / p.levels.correlated.rate).toFixed(3)} pooled ${(f.pooled.rate / p.levels.correlated.rate).toFixed(3)}` + (p.levels.table ? `; net/table ${(f.pooled.rate / p.levels.table.rate).toFixed(4)}` : ''));
  console.log(`   plain per seed ${pct(p.levels.plain.per_seed.min, 3)}–${pct(p.levels.plain.per_seed.max, 3)}; correlated per seed ${pct(p.levels.correlated.per_seed.min, 3)}–${pct(p.levels.correlated.per_seed.max, 3)}`);
  f.per_seed.forEach(s => console.log(`   seed ${s.seed}${s.later_repeat ? ' (repeat)' : ''}: ${ci(s)}  ${s.errors}/${s.shots}`));
  console.log('   first point below plain: ' + p.curves.map(c => c.first_point_below_plain).join(', '));
  console.log('   stays below plain from: ' + p.curves.map(c => c.below_plain_from ? c.below_plain_from.training_shots : 'never').join(', '));
  console.log('   stays below correlated from: ' + p.curves.map(c => c.below_correlated_from ? c.below_correlated_from.training_shots : 'never').join(', '));
  console.log('   curve tails: ' + p.curves.map(c => c.points.slice(-4).map(q => (q.training_shots / 1e6).toFixed(1) + ':' + pct(q.rate, 2)).join(' ')).join(' | '));
  if (p.id === 'd3') console.log('   at 9.3 and 13.1 million: ' + p.curves.map(c => c.points.filter(q => q.training_shots > 9e6 && q.training_shots < 14e6).map(q => pct(q.rate, 3)).join('/')).join(' | '));
}
console.log(' d5 250m against 66m, same random seeds: ' + JSON.stringify(sharedTest));
console.log('\nNoise table, long run, pooled over ' + long.seeds.length + ' seeds:');
for (const r of noise.rows) console.log(` p=${pct(r.p, 1)}  net ${pct(r.network.pooled.rate, 4)} (${pct(r.network.pooled.ci95[0], 4)}–${pct(r.network.pooled.ci95[1], 4)}) seeds ${pct(r.network.seed_range.min, 4)}–${pct(r.network.seed_range.max, 4)} [${r.network.pooled.errors}] | plain ${pct(r.plain.pooled.rate, 4)} (${pct(r.plain.pooled.ci95[0], 4)}–${pct(r.plain.pooled.ci95[1], 4)}) [${r.plain.pooled.errors}] | corr ${pct(r.correlated.pooled.rate, 4)} (${pct(r.correlated.pooled.ci95[0], 4)}–${pct(r.correlated.pooled.ci95[1], 4)}) [${r.correlated.pooled.errors}] | vs corr ${r.network_vs_correlated} x${r.network_over_correlated.toFixed(3)} (${r.seeds_ahead_of_correlated} seeds ahead), vs plain ${r.network_vs_plain} x${r.network_over_plain.toFixed(3)} (${r.seeds_ahead_of_plain} seeds ahead)`);
console.log('\nDistance 3, all seeds pooled, plain against correlated:');
for (const r of d3low) console.log(` p=${pct(r.p, 1)}  plain ${ci(r.plain)}  correlated ${ci(r.correlated)}`);
console.log('\nPaired check:'); for (const r of mc) console.log(` ${r.basis} d${r.distance} p=${pct(r.p, 1)} shots ${r.shots}: plain ${pct(r.plain.rate, 4)} (${pct(r.plain.ci95[0], 4)}–${pct(r.plain.ci95[1], 4)}) correlated ${pct(r.correlated.rate, 4)} (${pct(r.correlated.ci95[0], 4)}–${pct(r.correlated.ci95[1], 4)}) z ${r.paired_z.toFixed(1)}`);
console.log('\nSingle mechanisms:'); for (const r of sf) console.log(` ${r.basis} d${r.distance} r${r.rounds}: ${r.mechanisms} mechanisms, plain fails ${r.plain_fails}, correlated fails ${r.correlated_fails}, ${r.chance_over_p.toFixed(2)} p`);
console.log(' pairs at distance 5: ' + JSON.stringify(cc.fault_pairs_d5.map(r => [r.basis, r.pairs, r.plain_failed, r.correlated_failed])));
console.log('\nTraining seconds:'); for (const [id, m] of Object.entries(summary.method)) console.log(` ${id}: ${m.train_seconds.min}–${m.train_seconds.max} s on ${m.device}, ${m.training_shots} runs, ${m.network.parameters} parameters, table ${m.table_shots_per_noise_level}`);
console.log('\nDecoding on the laptop, one core, untrained network (µs per run):'); for (const r of decAll) console.log(` d${r.distance} p=${r.p}: plain ${r.plain_us_per_run.toFixed(2)}, correlated ${r.correlated_us_per_run.toFixed(2)}, network ${r.network_one_core_us_per_run.toFixed(2)} (x${r.network_over_plain.toFixed(1)})`);
console.log(`\nEnumeration: ${differs.length} of ${cells.length} differ, ${nTie} ties; example ${ex.pMatch.toFixed(3)} against ${ex.pMl.toFixed(3)}`);
