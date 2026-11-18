// Reading material for one reader round, all from one build.
//
//   node tools/round.mjs <slug> <outDir>
//
// Builds dist/, renders the paper (shots --quick writes print.pdf), the
// device read-through sheets and the paper pages (pdftocairo), and writes
// MANIFEST.md with the commit, the build time and what each folder holds.
// Readers get <outDir> and nothing older: in two rounds a reader checked a
// PDF made before that round's edits, because --matrix doesn't render print.

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readdirSync, statSync, rmSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const [slug, outArg] = process.argv.slice(2);
if (!slug || !outArg) { console.error('usage: node tools/round.mjs <slug> <outDir>'); process.exit(1); }
const out = resolve(outArg);
const run = (cmd, args) => execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8' });

const started = new Date();
run('node', ['lib/build.mjs']);
const pdfPath = join('.shots', slug, 'print.pdf');
if (existsSync(pdfPath)) rmSync(pdfPath);
run('node', ['tools/shots.mjs', slug, '--quick']);
if (!existsSync(pdfPath) || statSync(pdfPath).mtime < started) throw new Error('print.pdf was not rendered in this run');

mkdirSync(out, { recursive: true });
const sheets = join(out, slug);
if (existsSync(sheets)) rmSync(sheets, { recursive: true });
run('node', ['tools/devices.mjs', slug, sheets]);

const paper = join(out, 'paper');
if (existsSync(paper)) rmSync(paper, { recursive: true });
mkdirSync(paper, { recursive: true });
run('pdftocairo', ['-r', '110', '-png', pdfPath, join(paper, 'page')]);
const pages = readdirSync(paper).filter((f) => f.endsWith('.png')).length;

const commit = run('git', ['rev-parse', '--short', 'HEAD']).trim();
const dirty = run('git', ['status', '--porcelain']).trim() ? ' (with uncommitted changes)' : '';
writeFileSync(join(out, 'MANIFEST.md'), [
  `# Reading material: ${slug}`,
  '',
  `- Built: ${started.toISOString()} from commit ${commit}${dirty}`,
  `- \`${slug}/<device>/\`: read-through sheets (tools/devices.mjs)`,
  `- \`paper/\`: ${pages} pages of print.pdf, rendered with pdftocairo`,
  '',
].join('\n'));
console.log(`round material: ${out} (commit ${commit}${dirty}, ${pages} paper pages)`);
