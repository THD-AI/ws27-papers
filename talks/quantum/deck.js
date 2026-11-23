// The deck engine for the Quantum talk: every slide is a pure drawing of
// (slide, build), so the screen steps through the same pages the PDF prints.
// The slides live one per folder in slides/NN-id/slide.js (see slides.js).
//   Right, Space, PageDown: next build    Left, PageUp: back
//   Home / End: first / last page         N: speaker notes   G: go to page
//   ?print=1: every build as its own page (tools/qdeck.mjs prints it)
//   ?page=N: open at page N (1-based)    ?only=<slide id>: that slide alone

import { SLIDES } from './slides.js';

const q = new URLSearchParams(location.search);
const PRINT = q.get('print') === '1';
if (PRINT) document.documentElement.classList.add('is-print');

const FACES = ['400 40px "Libre Franklin"', '500 40px "Libre Franklin"', '600 40px "Libre Franklin"', '700 40px "Libre Franklin"',
  '400 40px "JetBrains Mono"', '400 40px "Virgil"'];

const DATA = ['qubits', 'lattice', 'line', 'syndromes', 'suppression', 'clock', 'learning', 'noise', 'film', 'results-summary'];

async function loadData() {
  const out = {};
  await Promise.all(DATA.map(async (id) => {
    const r = await fetch(`../../articles/other-half/data/${id}.json`);
    out[id] = await r.json();
  }));
  out.sources = await (await fetch('../../articles/other-half/sources.json')).json();
  // the speaker notes are each slide's notes.md, shown as simple HTML
  await Promise.all(SLIDES.map(async (s) => {
    try {
      const md = await (await fetch(`./slides/${s.dir}/notes.md`)).text();
      s.notes = md.replace(/^#.*$/m, '').trim().split(/\r?\n\s*\r?\n/).map((p) => `<p>${p.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\r?\n/g, ' ')}</p>`).join('');
    } catch { s.notes = ''; }
  }));
  return out;
}

const deck = document.getElementById('deck');
const notesEl = document.getElementById('notes');
const only = q.get('only');
const shown = only ? SLIDES.filter((s) => s.id === only) : SLIDES;
const pages = [];
shown.forEach((s) => { for (let b = 0; b < s.builds; b++) pages.push({ slide: SLIDES.indexOf(s), build: b }); });
const MAIN = SLIDES.filter((s) => !s.backup && !s.end).length;

function render(data, n) {
  const { slide, build } = pages[n];
  const s = SLIDES[slide];
  const page = document.createElement('section');
  page.className = 'page';
  page.dataset.page = String(n + 1);
  page.dataset.slide = s.id;
  page.dataset.build = String(build);
  if (s.backup) page.dataset.backup = '1';
  s.draw(page, build, data, { main: MAIN, last: build === s.builds - 1, n: s.n, backup: s.backup });
  return page;
}

function fit(page) {
  const k = Math.min(innerWidth / 1920, innerHeight / 1080);
  page.style.transform = `translate(-50%, -50%) scale(${k})`;
}

function showNotes(n) {
  const { slide, build } = pages[n];
  const s = SLIDES[slide];
  notesEl.innerHTML = `<div class="where">Page ${n + 1} of ${pages.length}, ${s.id}, build ${build + 1} of ${s.builds}</div>${s.notes || ''}`;
}

async function main() {
  const fv = new FontFace('Virgil', 'url(../../articles/other-half/art/film-virgil.woff2)');
  try { document.fonts.add(await fv.load()); } catch { /* the names fall back to the sans */ }
  await Promise.all(FACES.map((f) => document.fonts.load(f).catch(() => null)));
  const data = await loadData();
  if (PRINT) {
    pages.forEach((_, n) => deck.appendChild(render(data, n)));
    window.__deck = { ready: true, count: pages.length, pages };
    return;
  }
  let n = Math.min(pages.length - 1, Math.max(0, (Number(q.get('page')) || 1) - 1));
  const go = (k) => {
    n = Math.min(pages.length - 1, Math.max(0, k));
    deck.replaceChildren();
    const p = render(data, n);
    deck.appendChild(p);
    fit(p);
    showNotes(n);
    const u = new URLSearchParams(location.search); u.set('page', String(n + 1));
    history.replaceState(null, '', `?${u}`);
  };
  addEventListener('resize', () => { const p = deck.firstChild; if (p) fit(p); });
  addEventListener('keydown', (e) => {
    if (['ArrowRight', ' ', 'PageDown', 'Enter'].includes(e.key)) { e.preventDefault(); go(n + 1); }
    else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); go(n - 1); }
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(pages.length - 1);
    else if (e.key === 'n' || e.key === 'N') notesEl.hidden = !notesEl.hidden;
    else if (e.key === 'g' || e.key === 'G') { const k = Number(prompt('Page')); if (k) go(k - 1); }
  });
  deck.addEventListener('click', (e) => { if (!e.target.closest('a')) go(n + 1); });
  go(n);
  window.__deck = { ready: true, count: pages.length, pages, go: (k) => go(k) };
}

main();
