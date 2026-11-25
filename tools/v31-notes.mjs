// Turns talks/quantum/v31/notes.md into notes.json for the presenter view:
// per beat the title, speaker, target seconds and every build's spoken text.
//   node tools/v31-notes.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const V = join(resolve(dirname(fileURLToPath(import.meta.url)), '..'), 'talks/quantum/v31');
const md = readFileSync(join(V, 'notes.md'), 'utf8');
const beats = {};
for (const part of md.split(/^## Beat /m).slice(1)) {
  const [head, ...rest] = part.split('\n'), num = +head.match(/^(\d+)/)[1], title = head.replace(/^\d+\s*–\s*/, '').trim();
  const target = +(rest.join('\n').match(/STORY target (\d+) s/) || [0, 0])[1];
  const builds = [];
  for (const b of part.split(/^### /m).slice(1)) {
    const h = b.split('\n')[0], id = h.split(' · ')[0], speaker = (h.match(/speaker ([AB])/) || [])[1] || '';
    const secs = +((h.match(/· ([\d.]+) s/) || [0, 0])[1]);
    const said = b.split('\n').filter((l) => l.startsWith('> ')).map((l) => l.slice(2)).join(' ');
    builds.push({ id, speaker, secs, said, pause: (h.match(/pause ([^)]*)\)/) || [])[1] || '' });
  }
  beats[num] = { title, target, speaker: builds[0]?.speaker || '', builds };
}
writeFileSync(join(V, 'notes.json'), JSON.stringify({ from: 'notes.md', beats }, null, 1));
console.log(Object.keys(beats).length, 'beats');
