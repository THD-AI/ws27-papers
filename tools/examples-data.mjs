// The examples figure (section 9): how many examples each seed's network had
// seen when its curve first dipped below plain matching, at distance 3 and 5.
//
//   node tools/examples-data.mjs
//
// Read from data/learning.json (made by tools/other-half-data.mjs from our
// runs). The curves are probed at fixed points, so each number is the first
// probe below plain matching, not an exact crossing. Writes data/examples.json.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(repo, 'articles', 'other-half', 'data');
const learning = JSON.parse(readFileSync(join(DATA, 'learning.json'), 'utf8'));
// for each seed: the last check above plain matching and the first check below it; the crossing lies between
const window = (pn) => pn.curves.map((c) => {
  const i = c.points.findIndex((q) => q.rate < pn.levels.plain.rate);
  return i > 0 ? { above: c.points[i - 1].training_shots, below: c.points[i].training_shots } : null;
});
const d3 = learning.panels.find((p) => p.id === 'd3'), d5 = learning.panels.find((p) => p.id === 'd5-250m'), d5s = learning.panels.find((p) => p.id === 'd5-66m');
const a = window(d3), b = window(d5);
if (a.some((v) => v === null) || b.some((v) => v === null)) throw new Error('every seed should pass plain matching');
if (d5s.curves.some((c) => c.points.some((q) => q.rate < d5s.levels.plain.rate))) throw new Error('at 66 million no distance-5 seed should have passed plain matching');
const lo3 = Math.min(...a.map((w) => w.above)), hi3 = Math.max(...a.map((w) => w.below));
const lo5 = Math.min(...b.map((w) => w.above)), hi5 = Math.max(...b.map((w) => w.below));
// the learning rate falls over the last fifth of each run: from 52 million at distance 3, from 200 million at distance 5
const decay = (pn) => pn.training_shots * 0.8;
const out = {
  generated: new Date().toISOString().slice(0, 10),
  generated_by: 'tools/examples-data.mjs',
  inputs: ['data/learning.json'],
  source: 'OWN-D3 OWN-D5-250M',
  what: 'For each seed, the examples seen at the last check above plain matching and at the first check below it, at a noise level of 0.5%: the crossing lies between. The curves are checked at fixed points only.',
  noise_level: learning.noise_level,
  rows: [
    { distance: 3, seeds: a, lo: lo3, hi: hi3, learning_rate_falls_from: decay(d3) },
    { distance: 5, seeds: b, lo: lo5, hi: hi5, learning_rate_falls_from: decay(d5), not_by: d5s.training_shots },
  ],
  ratio: { min: lo5 / hi3, max: hi5 / lo3 },
};
writeFileSync(join(DATA, 'examples.json'), JSON.stringify(out, null, 1) + '\n', 'utf8');
console.log('wrote data/examples.json:', out.rows.map((r) => `d${r.distance}: ${(r.lo / 1e6).toFixed(1)}–${(r.hi / 1e6).toFixed(1)} million`).join(', '), `ratio ${out.ratio.min.toFixed(1)}–${out.ratio.max.toFixed(1)}`);
