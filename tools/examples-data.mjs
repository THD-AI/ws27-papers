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
const first = (pn) => pn.curves.map((c) => { const p = c.points.find((q) => q.rate < pn.levels.plain.rate); return p ? p.training_shots : null; });
const d3 = learning.panels.find((p) => p.id === 'd3'), d5 = learning.panels.find((p) => p.id === 'd5-250m'), d5s = learning.panels.find((p) => p.id === 'd5-66m');
const a = first(d3), b = first(d5);
if (a.some((v) => v === null) || b.some((v) => v === null)) throw new Error('every seed should pass plain matching');
if (first(d5s).some((v) => v !== null)) throw new Error('at 66 million no distance-5 seed should have passed plain matching');
const out = {
  generated: new Date().toISOString().slice(0, 10),
  generated_by: 'tools/examples-data.mjs',
  inputs: ['data/learning.json'],
  source: 'OWN-D3 OWN-D5-250M',
  what: 'Examples the network had seen when its curve first went below plain matching, one value per seed, at a noise level of 0.5%. The curves are probed at fixed points, so these are the first probes below, not exact crossings.',
  noise_level: learning.noise_level,
  rows: [
    { distance: 3, seeds: a.length, examples: a, min: Math.min(...a), max: Math.max(...a) },
    { distance: 5, seeds: b.length, examples: b, min: Math.min(...b), max: Math.max(...b), not_by: d5s.training_shots },
  ],
};
writeFileSync(join(DATA, 'examples.json'), JSON.stringify(out, null, 1) + '\n', 'utf8');
console.log('wrote data/examples.json:', out.rows.map((r) => `d${r.distance}: ${(r.min / 1e6).toFixed(1)}–${(r.max / 1e6).toFixed(1)} million`).join(', '));
