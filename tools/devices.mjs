// Read-through sheets for every device a reader is likely to use.
//
//   node tools/devices.mjs <slug> [outDir]
//
// Runs tools/filmstrip.mjs for phones and tablets in both orientations, a
// laptop and a desktop, and copies the sheets into outDir/<device>/ (default
// .shots/<slug>/devices/). Readers on the web panel get these folders.

import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, copyFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const [slug, outArg] = process.argv.slice(2);
if (!slug) { console.error('usage: node tools/devices.mjs <slug> [outDir]'); process.exit(1); }
const out = outArg || join('.shots', slug, 'devices');
const DEVICES = [
  ['phone-portrait', 390, 844, 6],
  ['phone-landscape', 844, 390, 4],
  ['tablet-portrait', 820, 1180, 4],
  ['tablet-landscape', 1180, 820, 3],
  ['laptop', 1440, 900, 3],
  ['windows-laptop', 1536, 864, 3],
  ['small-laptop', 1366, 768, 3],
  ['desktop', 1920, 1080, 3],
];

for (const [name, w, h, per] of DEVICES) {
  const shots = join('.shots', slug);
  for (const f of readdirSync(shots).filter((f) => f.startsWith(`strip-${w}x${h}-`))) rmSync(join(shots, f));
  execFileSync(process.execPath, ['tools/filmstrip.mjs', slug, String(w), String(h), String(per)], { stdio: 'inherit' });
  const dir = join(out, name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  for (const f of readdirSync(shots).filter((f) => f.startsWith(`strip-${w}x${h}-`))) copyFileSync(join(shots, f), join(dir, f));
}
console.log(`devices: ${out}`);
