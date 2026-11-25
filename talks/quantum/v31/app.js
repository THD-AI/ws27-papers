// v3.1 app (block 9): one entry for the screen player, the presenter window and print.
//   index.html?page=N            screen player (→ ← next/back, M motion, G go to page, P presenter)
//   #presenter                   presenter window, driven by its opener with postMessage
//   ?print=all  (or Ctrl+P)      every page as one 16:9 sheet, camera frozen, culled, backups after a divider
//   ?print=1&page=N              one frozen page (board views, gates)
import { start } from './main.js';

const NS = 'http://www.w3.org/2000/svg';
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const mmss = (s) => `${s < 0 ? '−' : ''}${Math.floor(Math.abs(s) / 60)}:${String(Math.floor(Math.abs(s) % 60)).padStart(2, '0')}`;

function sheet() {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'sheet'); svg.setAttribute('viewBox', '0 0 1920 1080'); svg.setAttribute('width', 1920); svg.setAttribute('height', 1080);
  for (const l of ['cam', 'ann']) { const g = document.createElementNS(NS, 'g'); g.dataset.layer = l; svg.append(g); }
  return svg;
}

// world objects whose box lies outside the page are culled before printing
function cull(svg) {
  const r = svg.getBoundingClientRect();
  for (const g of svg.querySelectorAll('[data-layer=cam] #world > [data-zone], [data-layer=cam] #world > [data-thing-id]')) {
    const b = g.getBoundingClientRect();
    if (b.right < r.left || b.left > r.right || b.bottom < r.top || b.top > r.bottom) g.remove();
  }
}

function printAll(P, F) {
  document.body.classList.add('print-all');
  document.getElementById('page')?.remove();
  const q = new URLSearchParams(location.search);
  P.pages.forEach((pg, i) => {
    if (typeof pg.beat === 'string' && typeof P.pages[i - 1]?.beat === 'number') {
      const d = sheet(); d.classList.add('divider'); document.body.append(d);
      const t = document.createElementNS(NS, 'text'); t.setAttribute('x', 96); t.setAttribute('y', 560); t.setAttribute('class', 'divider-text'); t.textContent = 'Backups'; d.append(t);
    }
    const svg = sheet(); document.body.append(svg);
    start(P, F, new URLSearchParams({ page: i + 1, print: 1, ...(q.has('route') ? { route: q.get('route') } : {}) }), svg);
    cull(svg);
  });
  window.V31 = { ready: true, sheets: document.querySelectorAll('svg.sheet').length };
}

function presenter(P, N) {
  document.body.classList.add('presenter');
  document.getElementById('page')?.remove();
  const base = location.href.split('#')[0].split('?')[0];
  document.body.insertAdjacentHTML('beforeend', `<div id="pv">
    <div class="pv-now"><div class="pv-box"><iframe id="pv-cur"></iframe></div><div class="pv-lab">Now <span id="pv-n"></span></div></div>
    <div class="pv-side"><div class="pv-box"><iframe id="pv-next"></iframe></div><div class="pv-lab">Next</div>
      <div class="pv-clocks"><div><span class="pv-k">Beat</span><b id="pv-beat">0:00</b><span id="pv-target"></span></div><div><span class="pv-k">Against plan</span><b id="pv-left">0:00</b></div><div><span class="pv-k">Build</span><b id="pv-build"></b></div><div><span class="pv-k">Speaker</span><b id="pv-spk"></b></div></div>
      <div id="pv-notes"></div></div></div>`);
  let page = 0, beatStart = performance.now(), talkStart = null, beat = null;
  // planned start of every beat (s) from the notes' build times, and a flat list of builds
  const order = Object.keys(N.beats).map(Number).sort((x, y) => x - y), plan = {}, flat = [];
  { let t = 0; for (const b of order) { plan[b] = t; for (const bl of N.beats[b].builds) { flat.push({ beat: b, id: bl.id }); t += bl.secs; } } }
  const buildIndex = (n) => { const pg = P.pages[n - 1]; if (typeof pg.beat !== 'number') return -1; const first = P.pages.findIndex((x) => x.beat === pg.beat); const k = n - 1 - first, list = N.beats[pg.beat].builds; return Math.min(k, list.length - 1); };
  const set = (n) => {
    if (n === page) return; page = n;
    const pg = P.pages[n - 1];
    document.getElementById('pv-cur').src = `${base}?print=1&page=${n}`;
    document.getElementById('pv-next').src = n < P.pages.length ? `${base}?print=1&page=${n + 1}` : 'about:blank';
    document.getElementById('pv-n').textContent = '';
    if (pg.beat !== beat) { beat = pg.beat; beatStart = performance.now(); }
    if (talkStart == null && n > 1) talkStart = performance.now();
    const nb = N.beats[pg.beat];
    document.getElementById('pv-spk').textContent = nb ? `speaker ${nb.speaker}` : '–';
    document.getElementById('pv-target').textContent = nb ? ` / ${mmss(nb.target)}` : '';
    document.getElementById('pv-notes').innerHTML = nb
      ? `<h2>${nb.title}</h2>` + nb.builds.map((b, k) => `<p class="${k === buildIndex(n) ? 'pv-cur' : ''}"><span class="pv-k">${b.id} · ${b.speaker} · ${b.secs} s${b.pause ? ' · pause ' + b.pause : ''}</span><br>${b.said || '<i>silence</i>'}</p>`).join('')
      : `<h2>Backup ${pg.beat}</h2><p>${pg.title}</p><p>${pg.caption || ''}</p><p class="pv-k">Spoken answer: QUESTIONS.md</p>`;
    const bi = buildIndex(n), cur = document.querySelector('#pv-notes .pv-cur'); if (cur) cur.scrollIntoView({ block: 'center' });
    const gi = bi < 0 ? -1 : flat.findIndex((x) => x.beat === pg.beat) + bi;
    const bc = gi < 0 ? `backup ${pg.beat}` : `build ${N.beats[pg.beat].builds[bi].id} · ${gi + 1} of ${flat.length}`;
    document.getElementById('pv-build').textContent = gi < 0 ? 'backup' : `${gi + 1} of ${flat.length}`;
    document.getElementById('pv-n').textContent = bc;
  };
  const set0 = set;
  addEventListener('message', (e) => { if (e.data && e.data.v31page) set0(e.data.v31page); });
  setInterval(() => {
    document.getElementById('pv-beat').textContent = mmss((performance.now() - beatStart) / 1000);
    const pg = P.pages[page - 1], el2 = document.getElementById('pv-left');
    if (pg && typeof pg.beat === 'number' && talkStart) { const d = (performance.now() - talkStart) / 1000 - plan[pg.beat] - (performance.now() - beatStart) / 1000; el2.textContent = (d > 0 ? mmss(d) + ' late' : mmss(-d) + ' early'); el2.style.color = d > 15 ? '#E0705F' : ''; } else el2.textContent = '–';
  }, 250);
  set(+(location.hash.split('=')[1]) || 1);
  window.V31 = { ready: true, presenter: true, page: () => page };
  addEventListener('keydown', (e) => window.opener && window.opener.postMessage({ v31key: e.key }, '*'));
}

function player(P, F) {
  const q0 = new URLSearchParams(location.search);
  let n = Math.max(1, +q0.get('page') || 1), motion = !matchMedia('(prefers-reduced-motion: reduce)').matches, run = 0, pres = null;
  const show = (extra = {}) => { start(P, F, new URLSearchParams({ page: n, ...(q0.has('print') ? { print: 1 } : {}), ...extra })); if (pres && !pres.closed) pres.postMessage({ v31page: n }, '*'); };
  const tween = (dur, f) => new Promise((done) => { const id = ++run, t0 = performance.now(); const step = (now) => { if (id !== run) return done(); const t = Math.min(1, (now - t0) / dur); f(t); t < 1 ? requestAnimationFrame(step) : done(); }; requestAnimationFrame(step); });
  async function go(to) {
    if (to < 1 || to > P.pages.length) return;
    const from = n; n = to;
    try { history.replaceState(null, '', '?page=' + n + (q0.has('print') ? '&print=1' : '')); } catch { /* file:// may refuse */ }
    const a = P.pages[from - 1], b = P.pages[n - 1], hop = a.camera !== b.camera && to === from + 1;
    if (pres && !pres.closed) pres.postMessage({ v31page: n }, '*');
    if (!motion || q0.has('print')) return show();
    if (hop) await tween(1000, (t) => show({ from, t: ease(t), p: 0 }));
    if (b.anim && to === from + 1) await tween(b.anim.dur, (t) => show({ p: b.anim.kind === 'fill' ? t : ease(t) }));
    show();
  }
  const key = (k) => {
    if (['ArrowRight', 'ArrowDown', ' ', 'PageDown'].includes(k)) go(n + 1);
    else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(k)) { run++; go(n - 1); }
    else if (k === 'm' || k === 'M') motion = !motion;
    else if (k === 'g' || k === 'G') { const t = +prompt('Go to page'); if (t) { run++; n = t; show(); } }
    else if (k === 'p' || k === 'P') { pres = window.open(location.href.split('#')[0].split('?')[0] + '#presenter=' + n, 'v31presenter', 'width=1600,height=900'); }
  };
  addEventListener('keydown', (e) => key(e.key));
  addEventListener('message', (e) => { if (e.data && e.data.v31key) key(e.data.v31key); });
  // Ctrl+P from the screen player prints every page
  addEventListener('beforeprint', () => { if (!document.body.classList.contains('print-all')) { printAll(P, F); } });
  window.V31_GO = go; window.V31_KEY = key;
  show(Object.fromEntries([...q0].filter(([k]) => ['from', 't', 'p', 'route'].includes(k))));
  requestAnimationFrame(() => { window.V31_FIRST = performance.now(); }); // first drawn frame, for G18
}

export function app(P, F, N) {
  const q = new URLSearchParams(location.search);
  if (location.hash.startsWith('#presenter')) presenter(P, N);
  else if (q.get('print') === 'all') printAll(P, F);
  else player(P, F);
}
