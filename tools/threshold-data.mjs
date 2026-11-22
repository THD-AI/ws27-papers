// The threshold figure (section 2): from our own runs, plain matching at
// distance 3 (three rounds) and distance 5 (five rounds), turned into the
// chance of a logical error per round, so the two distances can be compared.
//
//   node tools/threshold-data.mjs [--results <folder>]
//
// A run of r rounds fails when an odd number of its rounds fail, so a run
// failure P and a per-round failure e are related by P = (1 - (1 - 2e)^r) / 2,
// and e = (1 - (1 - 2P)^(1/r)) / 2. Every seed of a distance reads the same
// kind of fresh runs; plain matching does not learn, so its runs are pooled
// over all seeds. Writes articles/other-half/data/threshold.json.
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const argAt = process.argv.indexOf('--results');
const RESULTS = resolve(argAt > 0 ? process.argv[argAt + 1]
  : process.env.QEC_RESULTS || join(repo, '../../../dotUni/.worktrees/quantum-seminar/seminar/experiments/results'));
if (!existsSync(RESULTS)) { console.error('results folder not found: ' + RESULTS); process.exit(1); }

function wilson(k, n, z = 1.96) {
  const ph = k / n, den = 1 + z * z / n, mid = (ph + z * z / (2 * n)) / den;
  const half = (z / den) * Math.sqrt(ph * (1 - ph) / n + z * z / (4 * n * n));
  return [mid - half, mid + half];
}
const perRound = (P, r) => (1 - Math.pow(1 - 2 * P, 1 / r)) / 2;

function pool(dirs, file, distance) {
  const files = [];
  for (const d of dirs) {
    const base = join(RESULTS, d, `d${distance}-seeds`);
    if (!existsSync(base)) continue;
    for (const s of readdirSync(base)) if (existsSync(join(base, s, file))) files.push(join(d, `d${distance}-seeds`, s, file));
  }
  const acc = new Map();
  let rounds = null;
  for (const f of files) {
    const j = JSON.parse(readFileSync(join(RESULTS, f), 'utf8'));
    if (rounds !== null && j.rounds !== rounds) throw new Error('mixed round counts in ' + f);
    rounds = j.rounds;
    for (const row of j.rows) {
      const a = acc.get(row.p) || { errors: 0, shots: 0 };
      a.errors += row.matching.errors; a.shots += row.shots;
      acc.set(row.p, a);
    }
  }
  return { files, rounds, rows: [...acc].sort((x, y) => x[0] - y[0]).map(([p, a]) => {
    const P = a.errors / a.shots, ci = wilson(a.errors, a.shots);
    return { p, errors: a.errors, shots: a.shots, run_failure: P, per_round: perRound(P, rounds), per_round_ci95: ci.map((v) => perRound(v, rounds)) };
  }) };
}

const d3 = pool(['kaggle-d3', 'kaggle-d3-rerun'], 'neural_pilot_d3.json', 3);
const d5 = pool(['kaggle-d5-250m', 'kaggle-d5-250m-rerun'], 'neural_pilot_d5.json', 5);
if (d3.rounds !== 3 || d5.rounds !== 5) throw new Error('expected 3 and 5 rounds');
// above 1%: the sweep of 22 November (04_threshold_sweep.py, same circuit, same noise, plain matching)
const SWEEP = join(RESULTS, 'threshold-2026-11-22.json');
const sweepFiles = [];
if (existsSync(SWEEP)) {
  const sw = JSON.parse(readFileSync(SWEEP, 'utf8'));
  sweepFiles.push('threshold-2026-11-22.json');
  for (const r of sw.rows) {
    if (r.p <= 0.01) continue;                                // up to 1% the larger pooled runs stand
    const pool = r.distance === 3 ? d3 : d5;
    const P = r.rate;
    pool.rows.push({ p: r.p, errors: r.errors, shots: r.shots, run_failure: P, per_round: perRound(P, r.rounds), per_round_ci95: r.ci95.map((v) => perRound(v, r.rounds)), from: 'sweep' });
  }
  for (const pool of [d3, d5]) pool.rows.sort((a, b) => a.p - b.p);
  // the sweep repeats 0.8% and 1%: it must agree with the pooled runs there
  for (const r of sw.rows.filter((q) => q.p <= 0.01)) {
    const pool = r.distance === 3 ? d3 : d5, old = pool.rows.find((q) => q.p === r.p);
    if (old && (r.ci95[1] < old.run_failure * 0.97 || r.ci95[0] > old.run_failure * 1.03)) throw new Error(`sweep disagrees with the pooled runs at d=${r.distance}, p=${r.p}`);
  }
}
const ps = d3.rows.map((r) => r.p).filter((p) => d5.rows.some((q) => q.p === p));
const ratio = ps.map((p) => {
  const a = d3.rows.find((r) => r.p === p), b = d5.rows.find((r) => r.p === p);
  return { p, d3_over_d5: a.per_round / b.per_round };
});
// what the figure says: distance 5 wins at every level we ran, and its lead shrinks as the noise rises
for (let i = 1; i < ratio.length; i++) if (!(ratio[i].d3_over_d5 < ratio[i - 1].d3_over_d5)) throw new Error('the lead should shrink as the noise rises, at ' + ratio[i].p);
// where the line meets 1 (no gain), by interpolation on log scales between the two points around it
let crossing = null;
for (let i = 1; i < ratio.length; i++) if (ratio[i - 1].d3_over_d5 > 1 && ratio[i].d3_over_d5 <= 1) {
  const a = ratio[i - 1], b = ratio[i];
  const t = Math.log(a.d3_over_d5) / (Math.log(a.d3_over_d5) - Math.log(b.d3_over_d5));
  crossing = Math.exp(Math.log(a.p) + t * (Math.log(b.p) - Math.log(a.p)));
}

const out = {
  generated: new Date().toISOString().slice(0, 10),
  generated_by: 'tools/threshold-data.mjs',
  inputs: [...d3.files, ...d5.files, ...sweepFiles],
  source: 'OWN-D3 OWN-D5-250M',
  what: 'Plain matching on our simulated runs, as the chance of a logical error per round, at distance 3 and distance 5, at eight noise levels. Below the threshold the bigger grid wins; the lead shrinks as the noise approaches it.',
  conversion: 'per round e = (1 - (1 - 2P)^(1/r)) / 2 for a run of r rounds that fails with chance P',
  noise_model: 'uniform circuit-level depolarizing noise of strength p on every operation (Stim), as in section 9',
  d3: { rounds: 3, rows: d3.rows },
  d5: { rounds: 5, rows: d5.rows },
  ratio,
  crossing_p: crossing,
};
writeFileSync(join(repo, 'articles', 'other-half', 'data', 'threshold.json'), JSON.stringify(out, null, 1) + '\n', 'utf8');
console.log('wrote data/threshold.json:', ratio.map((r) => `${(r.p * 100).toFixed(1)}%: ${r.d3_over_d5.toFixed(2)}`).join(', '), crossing ? `crossing near ${(crossing * 100).toFixed(2)}%` : 'no crossing');
