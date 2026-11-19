// The deck engine: every slide is a pure drawing of (slide, build), so the
// screen steps through the same pages the PDF prints.
//   Right, Space, PageDown: next build    Left, PageUp: back
//   Home / End: first / last page         N: speaker notes
//   ?print=1: every build as its own page (tools/deck.mjs prints it)
//   ?page=N: open at page N (1-based)
import { SLIDES } from './slides.js';

const q = new URLSearchParams(location.search);
const PRINT = q.get('print') === '1';
if (PRINT) document.documentElement.classList.add('is-print');

const FACES = ['400 40px "Libre Franklin"', '500 40px "Libre Franklin"', '600 40px "Libre Franklin"', '700 40px "Libre Franklin"',
  'italic 400 40px "Newsreader"', '400 40px "Newsreader"', '500 40px "Newsreader"', '400 40px "JetBrains Mono"'];

async function loadData() {
  const ids = ['numbers', 'exits', 'attitudes', 'obstacles', 'rewire', 'repaint', 'plan', 'permits', 'walls', 'pairs'];
  const out = {};
  await Promise.all(ids.map(async (id) => {
    const r = await fetch(`../../articles/renovate/data/${id}.json`);
    out[id] = await r.json();
  }));
  const s = await (await fetch('../../articles/renovate/sources.json')).json();
  out.sources = s;
  return out;
}

const deck = document.getElementById('deck');
const notesEl = document.getElementById('notes');
const pages = [];
SLIDES.forEach((s, i) => { for (let b = 0; b < s.builds; b++) pages.push({ slide: i, build: b }); });
// Which slide number the room sees: main slides 1..16, then the end slide, then backups B1..
const MAIN = SLIDES.filter((s) => !s.backup && !s.end).length;

function render(data, n) {
  const { slide, build } = pages[n];
  const s = SLIDES[slide];
  const page = document.createElement('section');
  page.className = 'page';
  page.dataset.page = String(n + 1);
  page.dataset.slide = s.id;
  page.dataset.build = String(build);
  s.draw(page, build, data, { main: MAIN, last: build === s.builds - 1 });
  return page;
}

function fit(page) {
  const k = Math.min(innerWidth / 1920, innerHeight / 1080);
  page.style.transform = `scale(${k})`;
}

function showNotes(n) {
  const { slide, build } = pages[n];
  const s = SLIDES[slide];
  notesEl.innerHTML = `<div class="where">Page ${n + 1} of ${pages.length}, ${s.id}, build ${build + 1} of ${s.builds}</div>${s.notes || ''}`;
}

async function main() {
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
    history.replaceState(null, '', `?page=${n + 1}`);
  };
  addEventListener('resize', () => { const p = deck.firstChild; if (p) fit(p); });
  addEventListener('keydown', (e) => {
    if (['ArrowRight', ' ', 'PageDown', 'Enter'].includes(e.key)) { e.preventDefault(); go(n + 1); }
    else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); go(n - 1); }
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(pages.length - 1);
    else if (e.key === 'n' || e.key === 'N') notesEl.hidden = !notesEl.hidden;
  });
  deck.addEventListener('click', () => go(n + 1));
  go(n);
  window.__deck = { ready: true, count: pages.length, pages, go: (k) => go(k) };
}

main();
