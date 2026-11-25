// The deck engine for the Quantum talk: every slide is a pure drawing of
// (slide, build), so the screen steps through the same pages the PDF prints.
// The slides live one per folder in slides/NN-id/slide.js (see slides.js).
//   Right, Space, PageDown: next build    Left, PageUp: back
//   Shift+Right / Shift+Left: whole slide  Home / End: first / last page
//   G: go to page   C: contents   F: full screen   N: speaker notes
//   B or .: blank   ?: the keys   Esc: close what is open
//   ?print=1: every build as its own page (tools/qdeck.mjs prints it)
//   ?page=N: open at page N (1-based)    ?only=<slide id>: that slide alone

import { SLIDES } from './slides.js';
import { ARTICLE } from './kit.js';

// Where each slide comes from in the article (ids of the built article).
const FROM = {
  threshold: ['s-2', 'Section 2'], logical: ['s-2', 'Section 2'], grid: ['s-2', 'Section 2'], checks: ['s-3', 'Section 3'],
  film: ['fig-1', 'Figure 1'], matching: ['fig-4', 'Figure 4'], silent: ['fig-2', 'Figure 2'], patterns: ['fig-3', 'Figure 3'],
  'two-ways': ['fig-4', 'Figure 4'], google: ['fig-5', 'Figure 5'], clock: ['fig-6', 'Figure 6'], method: ['s-9', 'Section 9'],
  ours: ['fig-7', 'Figure 7'], properties: ['s-8', 'Section 8'], cost: ['s-9', 'Section 9'], 'noise-model': ['what-we-could-not-show', 'What we could not show'],
  correlated: ['s-6', 'Section 6'], 'noise-table': ['fig-8', 'Figure 8'], 'second-script': ['s-9', 'Section 9'],
};

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

const BAR = 44;   // the strip under the slide; the slide never sits under it
function fit(page) {
  const hh = innerHeight - (document.fullscreenElement ? 0 : BAR);
  const k = Math.min(innerWidth / 1920, hh / 1080);
  page.style.top = `${hh / 2}px`;
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
  // Excalifont: the article figures' notes are set in it (lib/fig.js)
  const fx = new FontFace('Excalifont', 'url(../../lib/vendor/excalifont/Excalifont.woff2)');
  try { document.fonts.add(await fx.load()); } catch { /* falls back to Virgil */ }
  await Promise.all(FACES.map((f) => document.fonts.load(f).catch(() => null)));
  const data = await loadData();
  if (PRINT) {
    pages.forEach((_, n) => deck.appendChild(render(data, n)));
    window.__deck = { ready: true, count: pages.length, pages };
    return;
  }
  let n = Math.min(pages.length - 1, Math.max(0, (Number(q.get('page')) || 1) - 1));
  const sectionOf = (s) => (s.backup ? 'Backup' : s.end ? 'Questions' : s.part || '');
  const firstPage = (i) => pages.findIndex((p) => p.slide === i);
  const add = (tag, id, html) => { const e = document.createElement(tag); e.id = id; if (html) e.innerHTML = html; document.body.appendChild(e); return e; };

  // The strip under the slide: page, section, the article link, buttons.
  const bar = add('footer', 'bar', `<span class="pg"></span><span class="sec"></span><a class="src" target="_blank" rel="noopener"></a>
    <label class="go" hidden>Page <input inputmode="numeric" aria-label="Go to page" size="3"></label>
    <span class="btns"><button data-k="c" title="Contents (C)">Contents</button><button data-k="?" title="Keys (?)">Keys</button><button data-k="f" title="Full screen (F)">Full screen</button></span>`);
  const blank = add('div', 'blank'); blank.hidden = true;

  // Contents: the slides in the talk's sections, with page numbers.
  const groups = [];
  SLIDES.forEach((s, i) => {
    if (firstPage(i) < 0) return;
    const name = sectionOf(s);
    if (!groups.length || groups.at(-1).name !== name) groups.push({ name, items: [] });
    groups.at(-1).items.push(i);
  });
  const toc = add('div', 'toc', `<div class="panel"><h2>Contents</h2>${groups.map((g) => `<section><h3>${g.name}</h3><ol>${g.items.map((i) => {
    const s = SLIDES[i];
    return `<li><button data-i="${i}"><span class="no">${s.n || ''}</span><span class="t">${s.title || s.id}</span><span class="p">${firstPage(i) + 1}</span></button></li>`;
  }).join('')}</ol></section>`).join('')}</div>`);
  const KEYS = [['→  Space  PageDown  click', 'Next'], ['←  PageUp', 'Back'], ['Shift + →  /  Shift + ←', 'Next / previous slide'], ['Home  End', 'First / last page'],
    ['G', 'Go to page'], ['C', 'Contents'], ['F', 'Full screen'], ['N', 'Speaker notes'], ['B  .', 'Blank screen'], ['?', 'These keys'], ['Esc', 'Close']];
  const help = add('div', 'help', `<div class="panel"><h2>Keys</h2><dl>${KEYS.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl></div>`);
  const overlays = [toc, help];
  overlays.forEach((o) => { o.className = 'overlay'; o.hidden = true; });

  const goBox = bar.querySelector('.go'), goIn = goBox.querySelector('input');
  const closeAll = () => { overlays.forEach((o) => { o.hidden = true; }); goBox.hidden = true; blank.hidden = true; };
  const toggle = (o) => { const was = o.hidden; closeAll(); o.hidden = !was; wake(); };
  const full = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => {});

  // The strip fades after 2 s without the mouse, unless something is open.
  let timer = 0;
  function wake() {
    bar.classList.remove('quiet'); clearTimeout(timer);
    timer = setTimeout(() => { if (overlays.every((o) => o.hidden) && goBox.hidden) bar.classList.add('quiet'); else wake(); }, 2000);
  }
  addEventListener('mousemove', wake);

  const go = (k) => {
    n = Math.min(pages.length - 1, Math.max(0, k));
    deck.replaceChildren();
    const p = render(data, n);
    deck.appendChild(p);
    fit(p);
    showNotes(n);
    const s = SLIDES[pages[n].slide];
    bar.querySelector('.pg').textContent = `${n + 1} / ${pages.length}`;
    bar.querySelector('.sec').textContent = sectionOf(s);
    const src = bar.querySelector('.src'), from = FROM[s.id];
    if (pages[n].slide === 0) { src.href = ARTICLE; src.textContent = 'Read the article'; src.hidden = false; }
    else if (from) { src.href = `${ARTICLE}#${from[0]}`; src.textContent = `In the article: ${from[1]}`; src.hidden = false; }
    else src.hidden = true;
    toc.querySelectorAll('button').forEach((b) => b.classList.toggle('on', Number(b.dataset.i) === pages[n].slide));
    const u = new URLSearchParams(location.search); u.set('page', String(n + 1));
    history.replaceState(null, '', `?${u}`);
  };
  // Shift+arrows: the first page of the next or previous slide
  const slideStep = (d) => {
    let k = n;
    if (d > 0) { while (k < pages.length && pages[k].slide === pages[n].slide) k++; }
    else if (pages[n].build > 0) k = n - pages[n].build;
    else if (n > 0) k = n - 1 - pages[n - 1].build;
    go(k);
  };

  const refit = () => { const p = deck.firstChild; if (p) fit(p); };
  addEventListener('resize', refit);
  document.addEventListener('fullscreenchange', refit);
  goIn.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') { const k = Number(goIn.value); goBox.hidden = true; goIn.blur(); if (k) go(k - 1); wake(); }
    else if (e.key === 'Escape') { goBox.hidden = true; goIn.blur(); wake(); }
  });
  addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;
    if (k === 'Escape') { closeAll(); wake(); return; }
    if (k === '?') { toggle(help); return; }
    if (k === 'c' || k === 'C') { toggle(toc); return; }
    if (k === 'f' || k === 'F') { full(); return; }
    if (k === 'n' || k === 'N') { notesEl.hidden = !notesEl.hidden; return; }
    if (k === 'b' || k === 'B' || k === '.') { const was = blank.hidden; closeAll(); blank.hidden = !was; return; }
    if (k === 'g' || k === 'G') { e.preventDefault(); closeAll(); goBox.hidden = false; goIn.value = ''; goIn.focus(); wake(); return; }
    blank.hidden = true;
    if (e.shiftKey && k === 'ArrowRight') { e.preventDefault(); slideStep(1); }
    else if (e.shiftKey && k === 'ArrowLeft') { e.preventDefault(); slideStep(-1); }
    else if (['ArrowRight', ' ', 'PageDown', 'Enter'].includes(k)) { e.preventDefault(); go(n + 1); }
    else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(k)) { e.preventDefault(); go(n - 1); }
    else if (k === 'Home') go(0);
    else if (k === 'End') go(pages.length - 1);
  });
  bar.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    b.blur();
    if (b.dataset.k === 'c') toggle(toc); else if (b.dataset.k === '?') toggle(help); else if (b.dataset.k === 'f') full();
  });
  toc.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-i]');
    if (b) { closeAll(); go(firstPage(Number(b.dataset.i))); wake(); } else if (e.target === toc) { closeAll(); wake(); }
  });
  help.addEventListener('click', (e) => { if (e.target === help) { closeAll(); wake(); } });
  blank.addEventListener('click', () => { blank.hidden = true; });
  deck.addEventListener('click', (e) => { if (!e.target.closest('a')) go(n + 1); });
  go(n);
  wake();
  window.__deck = { ready: true, count: pages.length, pages, go: (k) => go(k) };
}

main();
