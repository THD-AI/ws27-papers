// Builds articles/<slug>/sources.json from the research dossiers.
//
//   node tools/sources.mjs renovate
//
// The dossiers and the register are only read. Every id used in text.md
// ({{ID ID}} tags) and every R-id mentioned in FIGURES.md is looked up in
// the Markdown source tables (first in the dossiers, then in the register).
// Titles and publishers are cut out of the table's citation cell; nothing
// is added that is not in the table, except the entries in OVERRIDES below.
// Ids that cannot be resolved are reported and the script exits with code 1.

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PLV1 = process.env.PLV1_DIR
  || 'C:/Users/rudae/Documents/dotUni/.worktrees/innovation-paper/docs/plv1';

const slug = process.argv[2] || 'renovate';
const articleDir = join(ROOT, 'articles', slug);

// ---------------------------------------------------------------------------
// Entries written by hand.
//
// A full entry (with `title`) stands on its own: the two surveys below are
// not in the dossiers. A partial entry only replaces the fields it names,
// for rows where the automatic cut reads badly or the table has no type
// column (dossier R12 lists "Opened" only). Every word still comes from the
// table row of that id; the types for R12 are my classification of what the
// row describes.
// ---------------------------------------------------------------------------
const OVERRIDES = {
  'B-2025': {
    title: 'Europas Weg in die digitale Souveränität',
    publisher: 'Bitkom',
    date: '2025-11-13',
    url: 'https://www.bitkom.org/Presse/Presseinformation/Europas-Weg-digitale-Souveraenitaet',
    type: 'survey',
  },
  'SRG-2025': {
    title: "European Cloud Providers' Local Market Share Now Holds Steady at 15%",
    publisher: 'Synergy Research Group',
    date: '2025-07-24',
    url: 'https://srgresearch.com/articles/european-cloud-providers-local-market-share-now-holds-steady-at-15',
    type: 'survey',
  },

  // The building analogy (draft 5): opened on 16 November 2026, not in the dossiers.
  'NAHB-2026': {
    title: 'Wood framing continues to dominate single-family construction (Census Survey of Construction, 2025 completions)',
    publisher: 'NAHB, Eye on Housing',
    date: '2026-09',
    url: 'https://eyeonhousing.org/2026/09/wood-framing-continues-to-dominate-single-family-construction/',
    type: 'statistics',
  },
  'DESTATIS-2021': {
    title: 'Baugenehmigungen 2020 nach überwiegend verwendetem Baustoff (Destatis, reported by Baulinks)',
    publisher: 'Federal Statistical Office (Destatis)',
    date: '2021-10',
    url: 'https://www.baulinks.de/webplugin/2021/1028.php4',
    type: 'statistics',
  },
  'BAUNETZ-DIN18015': {
    title: 'Leitungsverlegung und Installationszonen (DIN 18015-3)',
    publisher: 'Baunetz Wissen',
    date: '2016',
    url: 'https://www.baunetzwissen.de/elektro/fachwissen/leitungen-verteiler/leitungsverlegung-und-installationszonen-153012',
    type: 'standard',
  },

  // Draft 6 (17 November 2026): the approval analogy and two peer-reviewed frames, opened that day.
  'FR-2020-28107': {
    title: 'Notice regarding the applicability of NHTSA FMVSS test procedures to certifying manufacturers (85 FR 83143)',
    publisher: 'National Highway Traffic Safety Administration, Federal Register',
    date: '2020-12-21',
    url: 'https://www.govinfo.gov/content/pkg/FR-2020-12-21/html/2020-28107.htm',
    type: 'legal text',
  },
  'EU-2018-858': {
    title: 'Regulation (EU) 2018/858 on the approval and market surveillance of motor vehicles and their trailers (Art. 6(4), recital 40)',
    publisher: 'European Parliament and Council',
    date: '2018-05-30',
    url: 'https://eur-lex.europa.eu/eli/reg/2018/858/oj',
    type: 'legal text',
  },
  'BRS-2021': {
    title: 'The Productivity J-Curve: How Intangibles Complement General Purpose Technologies. American Economic Journal: Macroeconomics 13(1), 333–372',
    publisher: 'Erik Brynjolfsson, Daniel Rock, Chad Syverson',
    date: '2021-01',
    url: 'https://doi.org/10.1257/mac.20180386',
    type: 'peer-reviewed',
  },
  'HS-2001': {
    title: 'Varieties of Capitalism: The Institutional Foundations of Comparative Advantage',
    publisher: 'Peter A. Hall, David Soskice (eds.), Oxford University Press',
    date: '2001',
    url: 'https://doi.org/10.1093/0199247757.001.0001',
    type: 'peer-reviewed',
  },
  'TOE-1990': {
    title: 'The Processes of Technological Innovation (the technology–organisation–environment framework); summarised in J. Baker, "The Technology–Organization–Environment Framework", Information Systems Theory, 2012',
    publisher: 'Louis G. Tornatzky, Mitchell Fleischer, Lexington Books',
    date: '1990',
    url: 'https://doi.org/10.1007/978-1-4419-6108-2_12',
    type: 'peer-reviewed',
  },
  'CBA-2025': {
    title: 'CBA reverses AI-driven job cuts, admits "error"',
    publisher: 'Information Age (Australian Computer Society)',
    date: '2025-08-21',
    url: 'https://ia.acs.org.au/article/2025/cba-reverses-ai-driven-job-cuts--admits--error-.html',
    type: 'press',
  },
  'DGB-2026': {
    title: 'Tarifergebnis Deutsche Telekom: mehr Entgelt, Kündigungsschutz und erstmals Mitgliederbonus',
    publisher: 'Deutscher Gewerkschaftsbund (DGB), Tarifmeldung',
    date: '2026',
    url: 'https://www.dgb.de/service/weiterer-service/tarifmeldungen/tarifmeldung/tarifergebnis-deutsche-telekom-mehr-entgelt-kuendigungsschutz-und-erstmals-mitgliederbonus/',
    type: 'union release',
  },
  'CL-1990': {
    title: 'Absorptive Capacity: A New Perspective on Learning and Innovation. Administrative Science Quarterly 35(1), 128–152',
    publisher: 'Wesley M. Cohen, Daniel A. Levinthal',
    date: '1990-03',
    url: 'https://doi.org/10.2307/2393553',
    type: 'peer-reviewed',
  },

  // The dossier row reads "Regulation (EU) 2026/1744 ..., recitals 38, 40";
  // the automatic cut kept only the tail.
  'R9-05': {
    title: 'Regulation (EU) 2026/1744 (Digital Omnibus on AI), amending the AI Act',
    publisher: 'European Union',
    date: '2026-07-24',
    url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=OJ:L_202601744',
    type: 'legal text',
  },

  // The register gives this one as a bare link; "EIB" is in its title.
  'R10-01': { publisher: 'European Investment Bank' },

  // Rows where the citation starts with the document, not with a publisher.
  'R4-01': { publisher: 'European Union', title: 'Regulation (EU) 2026/1744 (Digital Omnibus on AI)' },
  'R9-04': { publisher: 'European Union', title: 'Regulation (EU) 2024/1689 (AI Act)' },
  'R11-22': { publisher: 'European Union', title: 'Regulation (EU) 2016/679 (GDPR), Art. 22, 35, 36, 38' },
  'R11-05': { publisher: 'Germany', title: 'Betriebsverfassungsgesetz § 90' },
  'R11-07': { publisher: 'Germany', title: 'Betriebsverfassungsgesetz § 87' },
  'R11-08': { publisher: 'Germany', title: 'Betriebsverfassungsgesetz § 76' },
  'R11-35': { publisher: 'United States', title: '29 U.S.C. § 2102 (WARN Act)' },
  'R11-36': { publisher: 'United States', title: '29 U.S.C. § 158 (NLRA section 8)' },
  'R11-40': { publisher: 'United States', title: '47 CFR § 64.2010 (safeguards on disclosure of CPNI)' },

  // Dossier R12 has no type column.
  'R12-01': { type: 'company report' },
  'R12-11': { type: 'trade press' },
  'R12-14': { type: 'company press release' },
  'R12-15': { type: 'press' },
  'R12-20': { type: 'press' },
  'R12-21': { type: 'trade press' },
  'R12-25': { type: 'institutional report' },
  'R12-28': { type: 'official survey' },
  'R12-34': { type: 'peer-reviewed (abstract)' },
  'R12-37': { type: 'working paper (abstract)' },
};

// ---------------------------------------------------------------------------
// 1. Which ids does the article need?
// ---------------------------------------------------------------------------
const ID = /^(R\d+-\d+|[A-Z]{1,5}-\d{4})$/;

function idsOfArticle() {
  const ids = [];
  const add = (id) => { if (!ids.includes(id)) ids.push(id); };

  const text = readFileSync(join(articleDir, 'text.md'), 'utf8');
  for (const m of text.matchAll(/\{\{([^}]*)\}\}/g)) {
    m[1].trim().split(/[\s,]+/).filter(Boolean).forEach(add);
  }
  const figs = join(articleDir, 'FIGURES.md');
  if (existsSync(figs)) {
    for (const m of readFileSync(figs, 'utf8').matchAll(/\bR\d+-\d+\b/g)) add(m[0]);
  }
  return ids;
}

// ---------------------------------------------------------------------------
// 2. Read every source table in a Markdown file.
// ---------------------------------------------------------------------------
function cells(line) {
  // "| a | b |" -> ["a", "b"]; a backslash-escaped pipe stays in its cell.
  return line.trim().replace(/^\|/, '').replace(/\|$/, '')
    .split(/(?<!\\)\|/).map((c) => c.trim());
}

function readTables(file) {
  const rows = new Map();
  let head = null;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line.trim().startsWith('|')) { head = null; continue; }
    const c = cells(line);
    if (/^id$/i.test(c[0])) { head = c.map((h) => h.toLowerCase()); continue; }
    if (!head || /^:?-+:?$/.test(c[0])) continue;
    if (!ID.test(c[0])) continue;

    const col = (re) => { const i = head.findIndex((h) => re.test(h)); return i < 0 ? '' : (c[i] || ''); };
    let citation = col(/citation|^source/);
    let url = col(/^url/);
    // The register writes the link into the citation: "… [link](url)" or "[Title](url)".
    const link = citation.match(/\[([^\]]*)\]\(((?:[^()]|\([^)]*\))+)\)/);
    if (link) {
      if (!url) url = link[2];
      citation = citation.replace(link[0], link[1] === 'link' ? '' : link[1]).trim();
    }
    if (!rows.has(c[0])) {
      rows.set(c[0], { citation, url, published: col(/^published/), type: col(/type/) });
    }
  }
  return rows;
}

// ---------------------------------------------------------------------------
// 3. Cut a citation cell into publisher and title.
// ---------------------------------------------------------------------------
const clean = (s) => s.replace(/[*`]/g, '').replace(/\s+/g, ' ').replace(/^[\s,.;:]+|[\s,;:]+$/g, '').trim();

// Removes " (…)" groups that are not inside a quoted title: page references,
// reading notes, "(= R6-02)" and the like. A bracket that follows a letter
// or digit directly, as in "COM(2026)" or "34(4)", is part of a name and stays.
function dropParens(s) {
  let out = '', depth = 0, quoted = false, prev = ' ';
  for (const ch of s) {
    const before = prev; prev = ch;
    if (!depth && (ch === '"' || ch === '“' || ch === '”')) quoted = !quoted;
    if (!quoted && ch === '(' && (depth || /[\s,]/.test(before))) { depth++; continue; }
    if (!quoted && ch === ')' && depth) { depth--; continue; }
    if (!depth) out += ch;
  }
  return out.replace(/\s+([,.;])/g, '$1').replace(/\s+/g, ' ');
}

function splitCitation(raw) {
  let s = raw.replace(/[*`]/g, '');

  // "Publisher (2026). Title …" – the year in brackets ends the publisher.
  const dated = s.match(/^([^"“]{2,80}?)\s*\((\d{4})\)\.\s+(.+)$/);
  if (dated) {
    return { publisher: clean(dated[1]), title: clean(dropParens(dated[3]).split(/;\s/)[0]) };
  }

  s = dropParens(s);
  // Trailing page references and reading notes are not part of a title.
  s = s.replace(/,?\s*(report\s+)?pp?\.\s*[\d–\-, ]+.*$/i, '').replace(/;.*$/, '');

  const q = s.match(/^(.*?)[“"]([^”"]+)[”"](.*)$/);
  if (q) {
    const before = clean(q[1]);
    const after = clean(q[3]);
    const parts = before.split(/,\s*/);
    // "S. Genz, L. Bellmann, …" or "Bloom, Genakos, Sadun" before a quoted
    // title is a list of authors: keep it whole and add where it appeared.
    const authors = /(^|,\s*)[A-Z]\.\s/.test(before) || /\band\b/.test(before)
      || (parts.length > 2 && parts.every((p) => /^[\p{Lu}][\p{L} .'-]+$/u.test(p) && p.split(' ').length <= 2));
    if (authors) {
      return { publisher: clean([before, after].filter(Boolean).join(', ')), title: clean(q[2]) };
    }
    if (parts.length === 1 && before) return { publisher: before, title: clean(q[2]) };
    // "Publisher, Form 8-K, Exhibit 99.1, "Title"" – the middle belongs to the title.
    if (before) return { publisher: parts[0], title: clean(`${parts.slice(1).join(', ')}, “${q[2]}”`) };
    return { publisher: after, title: clean(q[2]) };
  }

  const i = s.indexOf(', ');
  if (i > 0) return { publisher: clean(s.slice(0, i)), title: clean(s.slice(i + 2)) };
  return { publisher: '', title: clean(s) };
}

function normType(t) {
  const s = clean(dropParens(t || ''));
  // Lower-case the first letter only, so "SEC filing" keeps its capitals.
  return /^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s;
}

function normDate(p) {
  const m = (p || '').match(/^(\d{4})(-\d{2})?(-\d{2})?/);
  return m ? m[0] : '';
}

// ---------------------------------------------------------------------------
// 4. Put it together.
// ---------------------------------------------------------------------------
const dossierDir = join(PLV1, '03-research');
const files = readdirSync(dossierDir)
  .filter((f) => /^R\d+.*\.md$/.test(f))
  .map((f) => join(dossierDir, f));
files.push(join(PLV1, '02-sources', '01-register.md'));

const table = new Map();
for (const f of files) {
  for (const [id, row] of readTables(f)) if (!table.has(id)) table.set(id, row);
}

const out = {};
const unresolved = [];
for (const id of idsOfArticle()) {
  const o = OVERRIDES[id];
  if (o && o.title && o.url) { out[id] = o; continue; }
  const row = table.get(id);
  if (!row) { unresolved.push(id); continue; }

  const { publisher, title } = splitCitation(row.citation);
  const url = (row.url.match(/https?:\/\/[^\s;]+/) || [''])[0];
  const entry = { title, publisher, url, type: normType(row.type) };
  const date = normDate(row.published);
  if (date) entry.date = date;
  Object.assign(entry, o || {});
  if (!entry.title || !entry.url) { unresolved.push(id); continue; }
  out[id] = entry;
}

const target = join(articleDir, 'sources.json');
writeFileSync(target, JSON.stringify(out, null, 2) + '\n');
console.log(`sources: ${Object.keys(out).length} entries -> ${target}`);
const untyped = Object.entries(out).filter(([, e]) => !e.type).map(([id]) => id);
if (untyped.length) console.log(`sources: no type in the tables for ${untyped.join(', ')}`);
if (unresolved.length) {
  console.error(`sources: could not resolve ${unresolved.join(', ')}`);
  process.exit(1);
}
