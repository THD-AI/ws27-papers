// Writes the studio figures' data from the article's generated data files,
// so a studio figure draws nothing that is not in them.
//   node tools/studio-data.mjs   -> studio/data/reels.json
import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const L = JSON.parse(await readFile(join(ROOT, 'articles/other-half/data/learning.json'), 'utf8'));
const pick = (p) => ({
  id: p.id, distance: p.distance, examples: p.training_shots,
  plain: p.levels.plain.rate, correlated: p.levels.correlated.rate,
  seeds: p.final_network.per_seed.map((s) => ({ seed: s.seed, rate: s.rate, ci95: s.ci95 })),
});
const panels = L.panels.map(pick);
for (const p of panels) if (!p.seeds.length || !(p.plain > 0)) throw new Error('bad panel ' + p.id);
await writeFile(join(ROOT, 'studio/data/reels.json'), JSON.stringify({
  generated_from: 'articles/other-half/data/learning.json (OWN-D3, OWN-D5, OWN-D5-250M)',
  noise_level: L.noise_level, panels,
}, null, 1) + '\n');
console.log(panels.map((p) => `${p.id}: ${p.seeds.length} seeds, ${p.examples}`).join('; '));
