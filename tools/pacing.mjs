// Pacing gate: does the text move like its author, or like a news desk?
//
//   node tools/pacing.mjs <slug> [--all]
//
// Reads articles/<slug>/text.md and measures, per section (## heading) and
// for the whole body (everything before "Sources"):
//   - sentence lengths: mean, and the share of short landings (8 words or fewer)
//   - first person (I, my, me) and questions per section
//   - whether a section ends on a short plain sentence (under 10 words)
//   - how many passages end on a source mark {{...}}
//   - words in each @step passage of a scene (30 to 110 is the band)
//   - sentences that open on a date
// The standard is dotPrivate/BRAND/methods/his-pacing.md. Machine checks can
// only flag the beat; whether a sentence is really his is the readers' call.
// Exits 1 if a hard check fails.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const slug = process.argv[2];
if (!slug) { console.error('usage: node tools/pacing.mjs <slug> [--all]'); process.exit(1); }
const all = process.argv.includes('--all');
const raw = readFileSync(join('articles', slug, 'text.md'), 'utf8').replace(/\r/g, '');
const body = raw.replace(/^---\n[\s\S]*?\n---\n/, '').split(/\n## (?:Sources|Appendix)\b/)[0];

const MONTHS = 'January|February|March|April|May|June|July|August|September|October|November|December';
const clean = (s) => s.replace(/\{\{[^}]*\}\}/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*_`]/g, '').trim();
const sentencesOf = (t) => clean(t).split(/(?<=[.?!])["”’)]?\s+(?=[A-Z0-9"“‘(])/).map((s) => s.trim()).filter((s) => s.split(/\s+/).length > 1);
const words = (s) => s.split(/\s+/).filter(Boolean).length;

// split into sections and passages (paragraphs and list items of prose)
const sections = [];
let cur = { title: '(opening)', passages: [], steps: [] };
let scene = null, step = null, stepWords = 0, inFence = false;
const flushStep = () => { if (scene && step !== null) cur.steps.push({ scene, step, words: stepWords }); step = null; stepWords = 0; };
for (const block of body.split(/\n{2,}/)) {
  const b = block.trim();
  if (!b) continue;
  for (const line of b.split('\n')) {
    if (/^:::scene\s+(\S+)/.test(line)) { scene = line.match(/^:::scene\s+(\S+)/)[1]; }
    else if (/^:::\s*$/.test(line) && scene) { flushStep(); scene = null; }
    else if (/^@step\s+(\d+)/.test(line)) { flushStep(); step = line.match(/^@step\s+(\d+)/)[1] + (/\bscreen\b/.test(line) ? ' (screen)' : ''); }
  }
  if (/^##\s/.test(b)) { flushStep(); sections.push(cur); cur = { title: b.replace(/^#+\s*/, '').split('\n')[0], passages: [], steps: [] }; continue; }
  if (/^```/.test(b)) inFence = !inFence;
  if (inFence) continue;
  const prose = b.split('\n').filter((l) => !/^(:::|@|\||#|<)/.test(l)).join(' ').replace(/^[-*]\s+|^\d+\.\s+/, '');
  if (!prose.trim() || /^@caption/.test(b)) continue;
  if (b.split('\n').some((l) => /^:::(figure|steps|margin)/.test(l))) continue;    // captions and print lists
  cur.passages.push(prose);
  if (scene && step !== null) stepWords += words(clean(prose));
}
flushStep(); sections.push(cur);

let hard = 0;
const fail = (msg) => { hard++; console.log(`FAIL ${msg}`); };
const allS = [];
const rows = [];
let endsOnMark = 0, passages = 0;
for (const sec of sections) {
  const ss = sec.passages.flatMap(sentencesOf);
  if (!ss.length) continue;
  allS.push(...ss);
  const L = ss.map(words);
  const mean = L.reduce((a, b) => a + b, 0) / L.length;
  const short = L.filter((n) => n <= 8).length;
  const fp = ss.filter((s) => /\b(I|I'm|I've|I'd|my|me)\b/.test(s)).length;
  const q = ss.filter((s) => /\?["”’]?$/.test(s)).length;
  const last = ss[ss.length - 1];
  const lastQ = /\?["”’]?$/.test(last);
  const marks = sec.passages.filter((p) => /\}\}\s*$/.test(p.trim())).length;
  endsOnMark += marks; passages += sec.passages.length;
  rows.push({ title: sec.title, n: ss.length, mean, short, fp, q, lastW: words(last), lastQ, marks, np: sec.passages.length, steps: sec.steps });
}

const dateOpen = allS.filter((s) => new RegExp(`^(On|In|By|Since|From)?\\s*\\d{1,2}?\\s*(${MONTHS})\\b|^(On|In|By|Since)\\s+\\d{4}\\b|^\\d{4}\\b`).test(s));
const L = allS.map(words);
const shortShare = L.filter((n) => n <= 8).length / L.length;
console.log(`# Pacing: ${slug}\n`);
console.log(`body: ${allS.length} sentences, mean ${(L.reduce((a, b) => a + b, 0) / L.length).toFixed(1)} words, short landings (8 words or fewer) ${(shortShare * 100).toFixed(0)}%, questions ${allS.filter((s) => /\?["”’]?$/.test(s)).length}, first person in ${allS.filter((s) => /\b(I|I'm|I've|I'd|my|me)\b/.test(s)).length} sentences`);
console.log(`passages ending on a source mark: ${endsOnMark} of ${passages} (${(endsOnMark / passages * 100).toFixed(0)}%)`);
console.log(`sentences opening on a date: ${dateOpen.length}${dateOpen.length ? ': ' + dateOpen.slice(0, 4).map((s) => `"${s.slice(0, 50)}…"`).join('; ') : ''}\n`);
console.log('| section | sentences | mean | short | first person | questions | last sentence | ends on mark |');
console.log('| --- | --- | --- | --- | --- | --- | --- | --- |');
for (const r of rows) console.log(`| ${r.title.slice(0, 40)} | ${r.n} | ${r.mean.toFixed(1)} | ${r.short} | ${r.fp} | ${r.q} | ${r.lastW} words${r.lastQ ? ' (question)' : ''} | ${r.marks}/${r.np} |`);

const stepRows = rows.flatMap((r) => r.steps.map((s) => ({ ...s, sec: r.title })));
const outBand = stepRows.filter((s) => !/screen/.test(s.step) && (s.words < 30 || s.words > 110));
if (all || outBand.length) {
  console.log('\nscene passages outside 30–110 words:');
  for (const s of (all ? stepRows : outBand)) console.log(`  ${s.scene} @step ${s.step}: ${s.words} words`);
}

// hard checks: the plan's "done when" in innovation/loop-voice.md
if (dateOpen.length && /^(On|In)\s/.test(allS[0]) && dateOpen.includes(allS[0])) fail('the body opens on a date');
if (shortShare < 0.2) fail(`short landings ${(shortShare * 100).toFixed(0)}% (want 20% or more)`);
if (endsOnMark / passages > 0.34) fail(`${(endsOnMark / passages * 100).toFixed(0)}% of passages end on a source mark (want a third or fewer)`);
for (const r of rows) {
  if (r.n >= 4 && r.lastW >= 10) fail(`"${r.title}" ends on a ${r.lastW}-word sentence (want under 10)`);
  if (r.lastQ) fail(`"${r.title}" ends on a question`);
  if (r.q > 1) fail(`"${r.title}" has ${r.q} questions (one at most)`);
}
for (const s of outBand) if (s.words > 130 || s.words < 20) fail(`${s.scene} @step ${s.step}: ${s.words} words`);
console.log(hard ? `\n${hard} hard check(s) failed` : '\nno hard check failed');
process.exit(hard ? 1 : 0);
