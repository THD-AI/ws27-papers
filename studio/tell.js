// Scroll telling, v2 engine (studio). Implements the system in studio/README.md:
// progress mode (each paragraph one step, played by time once its
// paragraph reaches the reading line), held mode (the paragraph pins and the
// scroll sets frames directly, cuts, ±8% hysteresis), one sticky stage per
// run, strict handovers, "set" as a cross-fade, the layout cascade, G12.
//
// Markup (see run.html):
//   <section class="run"><div class="stage" aria-hidden="true"></div><div class="flow">
//     <div class="chapter" data-fig="id"> <p data-k="step|rest"> … <div class="held" data-frames="6"><p>…</p></div> </div>
//     <div class="gap"> text-only, keeps the last figure as a ghost </div>
//   </div></section>
// Consecutive chapters with the same data-fig are one figure (a camera
// handover: nothing thrown away).
//
// Figures (figures/<id>.js) export { steps: [{ held?: n }], mount(svg, ctx) -> { render(pos), dur(k), alone } }.

const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const T = (window.__tell = { steps: [], frames: [], violations: [], lastMotion: 0, sets: 0, cls: '', durWarn: [] });
const now = () => performance.now();

const probe = Object.assign(document.createElement('div'), { className: 'tell-probe' });
document.body.appendChild(probe);

let H = 0, W = 0, cls = '', stageH = 0, k = 1;
const readProbe = () => { H = probe.getBoundingClientRect().height || innerHeight; };

function classify() {
  const w = innerWidth;
  const em = 17 * k;
  const besideNeeds = 28 * em + 32 + 440 + 32;           // text, gap, stage, gutters
  if (H < 500) return 'stills';
  if (w >= 900 && w >= besideNeeds && H >= 560 && w > H) return 'beside';
  return 'top';
}

// ------------------------------------------------------------------ model
const runs = [...document.querySelectorAll('.run')].map((runEl) => {
  const stage = runEl.querySelector('.stage');
  const segs = [];
  for (const node of runEl.querySelectorAll(':scope > .flow > .chapter, :scope > .flow > .gap')) {
    if (node.classList.contains('gap')) { segs.push({ kind: 'ghost', el: node, items: [{ el: node, kind: 'rest' }] }); continue; }
    const fig = node.dataset.fig;
    let seg = segs.at(-1);
    if (!seg || seg.kind !== 'fig' || seg.fig !== fig) { seg = { kind: 'fig', fig, el: node, items: [] }; segs.push(seg); }
    for (const it of node.querySelectorAll(':scope > p[data-k], :scope > .held')) {
      if (it.classList.contains('held')) seg.items.push({ el: it, kind: 'held', frames: +it.dataset.frames, p: it.querySelector('p') });
      else seg.items.push({ el: it, kind: it.dataset.k });
    }
  }
  for (const s of segs) {
    let n = 0;
    for (const it of s.items) if (it.kind === 'step' || it.kind === 'held') it.step = ++n;
    s.total = n;
  }
  segs.forEach((s, i) => { if (s.kind === 'ghost') s.of = segs.slice(0, i).reverse().find((x) => x.kind === 'fig'); });
  return { el: runEl, stage, segs, active: -1, cur: null, busyUntil: 0, queue: [] };
});

const mods = new Map();
const load = (id) => { if (!mods.has(id)) mods.set(id, import(`./figures/${id}.js`).then((m) => m.default)); return mods.get(id); };

function ctxFor(w, h) {
  const r = w / Math.max(1, h);
  return { layout: r < 1.05 ? 'tall' : r < 1.45 ? 'mid' : 'wide', k, reduced: reduced.matches };
}

// ------------------------------------------------------------- layout
function layout() {
  readProbe();
  W = innerWidth;
  k = W <= 1920 ? 1 : Math.min(1.25, 1 + 0.25 * (W - 1920) / 640);
  root.style.setProperty('--k', k.toFixed(3));
  const c = classify();
  root.classList.remove('tell-top', 'tell-beside', 'tell-stills');
  root.classList.add('tell-' + c);
  cls = T.cls = c;
  stageH = c === 'top' ? (W < 700 ? 0.44 : 0.40) * H
    : c === 'beside' ? (H < 600 ? H - 64 : Math.min(0.8 * H, 860 * k)) : 0;
  root.style.setProperty('--H', H + 'px');
  root.style.setProperty('--stage-h', stageH + 'px');
  root.style.setProperty('--stage-pad', (c === 'top' ? stageH : 0) + 'px');

  const pitch = c === 'top' ? Math.max(0.30 * H, 170) : 0.35 * H;
  const FL = c === 'top' ? 0.40 * H : 0.35 * H;
  for (const run of runs) {
    for (const s of run.segs) for (const it of s.items) { it.el.style.paddingBottom = ''; if (it.kind === 'held') it.el.style.height = ''; }
    if (c === 'stills') continue;
    // held wrappers: paragraph + frames + one held length; pinned top-aligned
    for (const s of run.segs) for (const it of s.items) if (it.kind === 'held') {
      const ph = it.p.getBoundingClientRect().height;
      it.FL = FL;
      it.el.style.height = ph + it.frames * FL + FL + 'px';
      it.pinTop = c === 'top' ? stageH + 16 : Math.max(16, (H - ph) / 2);
      it.p.style.top = it.pinTop + 'px';
    }
    // pitch between consecutive items, and the dwell before the next segment
    const all = run.segs.flatMap((s, si) => s.items.map((it, ii) => ({ it, last: ii === s.items.length - 1 && si < run.segs.length - 1 })));
    for (let i = 0; i < all.length - 1; i++) {
      const a = all[i].it.el.getBoundingClientRect(), b = all[i + 1].it.el.getBoundingClientRect();
      const need = all[i].last ? Math.max(pitch, 0.45 * H) : pitch;
      const gap = b.top - a.top;
      if (gap < need) all[i].it.el.style.paddingBottom = need - gap + 'px';
    }
  }
}

function lines() {
  if (cls === 'beside') return { L: 0.6 * H, back: 0.66 * H };
  const band = H - stageH, pitch = Math.max(0.30 * H, 170);
  const L = stageH + 0.2 * band + 0.4 * pitch;
  return { L, back: L + 0.06 * H };
}

// --------------------------------------------------------------- stage
async function mountSeg(run, seg, pos) {
  const id = seg.kind === 'ghost' ? seg.of.fig : seg.fig;
  const mod = await load(id);
  const layer = document.createElement('div');
  layer.className = 'layer';
  const r = run.stage.getBoundingClientRect();
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  layer.appendChild(svg);
  run.stage.appendChild(layer);
  const api = mod.mount(svg, ctxFor(r.width, r.height));
  const total = seg.kind === 'ghost' ? seg.of.total : seg.total;
  const p = seg.kind === 'ghost' ? (api.alone ?? total) : pos;
  api.render(p);
  if (seg.kind === 'ghost') layer.style.opacity = 0.4;
  return { seg, mod, api, layer, svg, pos: p, goal: p, total, steps: mod.steps };
}

// "set": a cross-fade between end states (0.3 s; 0.15 s with reduced motion).
function setTo(run, pos, dur = reduced.matches ? 0.15 : 0.3) {
  const cur = run.cur;
  const clone = cur.svg.cloneNode(true);
  const over = document.createElement('div');
  over.className = 'layer ghost-out';
  over.style.opacity = cur.layer.style.opacity || 1;
  over.appendChild(clone);
  run.stage.appendChild(over);
  cur.api.render(pos);
  cur.pos = pos;
  cur.layer.style.transition = 'none';
  const base = cur.seg.kind === 'ghost' ? 0.4 : 1;
  cur.layer.style.opacity = 0;
  requestAnimationFrame(() => {
    cur.layer.style.transition = `opacity ${dur}s linear`;
    over.style.transition = `opacity ${dur}s linear`;
    cur.layer.style.opacity = base;
    over.style.opacity = 0;
  });
  setTimeout(() => over.remove(), dur * 1000 + 50);
  run.busyUntil = now() + dur * 1000;
  T.sets++; T.lastMotion = now() + dur * 1000;
}

function fadeOut(run, dur = reduced.matches ? 0.15 : 0.3) {
  const cur = run.cur;
  run.cur = null;
  cur.layer.style.transition = `opacity ${dur}s linear`;
  cur.layer.style.opacity = 0;
  setTimeout(() => cur.layer.remove(), dur * 1000 + 30);
  run.busyUntil = now() + dur * 1000 + 30;
  T.lastMotion = now() + dur * 1000;
}

// ------------------------------------------------------------ the loop
const heldState = new WeakMap();

function goalOf(run, seg, L, back) {
  let g = 0, held = null;
  for (const it of seg.items) {
    if (it.kind === 'rest') continue;
    const top = it.el.getBoundingClientRect().top;
    if (it.kind === 'held') {
      const s = (it.pinTop - top) / it.FL;           // frames scrolled since the pin
      if (s < 0) break;
      // frame f covers s in [f - 1, f); it moves only 8% past a boundary
      let f = heldState.get(it) ?? 1;
      while (f < it.frames && s >= f + 0.08) f++;
      while (f > 1 && s < f - 1 - 0.08) f--;
      heldState.set(it, f);
      g = it.step - 1 + f / it.frames;
      if (s < it.frames + 1) held = { it, f };
      if (s < it.frames) break;
      continue;
    }
    const passed = it.passed ? top < back : top < L;
    it.passed = passed;
    if (!passed) break;
    g = it.step;
  }
  return { g, held };
}

function activeSeg(run, L, back) {
  let a = -1;
  run.segs.forEach((s, i) => {
    const top = s.items[0].el.getBoundingClientRect().top;
    const on = s.started ? top < back : top < L;
    s.started = on;
    if (on) a = i;
  });
  return a;
}

function markParagraphs(run) {
  const { L } = lines();
  for (const s of run.segs) for (const it of s.items) {
    const p = it.kind === 'held' ? it.p : it.el;
    if (!p || it.kind === 'ghost') continue;
    const r = p.getBoundingClientRect();
    p.classList.toggle('is-read', r.bottom < L - 0.1 * H && s === run.segs[run.active]);
  }
}

let last = now();
async function frame() {
  const t = now(), dt = Math.min(0.1, (t - last) / 1000);
  last = t;
  if (cls !== 'stills') {
    const { L, back } = lines();
    T.line = L;
    for (const run of runs) {
      const a = activeSeg(run, L, back);
      if (run.switching) continue;
      if (a !== run.active) {
        const forward = a > run.active;
        run.switching = true;
        if (run.cur) { fadeOut(run); await new Promise((r) => setTimeout(r, Math.max(0, run.busyUntil - now()))); }
        run.active = a;
        if (a >= 0) {
          const seg = run.segs[a];
          const g = seg.kind === 'fig' ? goalOf(run, seg, L, back).g : 0;
          run.cur = await mountSeg(run, seg, forward ? 0 : g);
          // backwards, or a ghost: the figure is set (faded in) at its state;
          // forwards it starts empty and its first step plays
          if (!forward || seg.kind === 'ghost') {
            const L2 = run.cur.layer, base = seg.kind === 'ghost' ? 0.4 : 1, d = reduced.matches ? 0.15 : 0.3;
            L2.style.opacity = 0;
            requestAnimationFrame(() => { L2.style.transition = `opacity ${d}s linear`; L2.style.opacity = base; });
            run.busyUntil = now() + d * 1000; T.lastMotion = now() + d * 1000;
          }
        }
        run.switching = false;
        continue;
      }
      const cur = run.cur;
      if (!cur || cur.seg.kind === 'ghost') { markParagraphs(run); continue; }
      const { g, held } = goalOf(run, cur.seg, L, back);
      cur.goal = g;
      markParagraphs(run);
      if (t < run.busyUntil) continue;
      if (held) {
        // held: the scroll sets frames directly, by a cut; entry finishes any running step
        if (cur.pos !== g) {
          if (Math.abs(cur.pos - g) > 1e-6) T.frames.push({ t, y: scrollY, frame: held.f, fig: cur.seg.fig });
          cur.api.render(g); cur.pos = g; cur.playing = null;
        }
        continue;
      }
      if (Math.abs(cur.pos - g) < 1e-6) { if (cur.playing) { cur.playing.end = t; T.steps.push(cur.playing); cur.playing = null; } continue; }
      const dir = Math.sign(g - cur.pos);
      const behind = Math.ceil(Math.abs(g - cur.pos) - 1e-6);
      if (reduced.matches) { setTo(run, g); continue; }
      if (behind > 1) {
        // a chain: more than three behind sets the second-to-last state at once;
        // otherwise each missed step is set (0.4 s); the last step then plays
        const toward = dir > 0 ? Math.ceil(cur.pos + 1e-6) : Math.floor(cur.pos - 1e-6);
        const target = behind > 3 ? g - dir : toward;
        cur.playing = null;
        setTo(run, target, behind > 3 ? 0.3 : 0.4);
        continue;
      }
      // play one step: forward at its own duration, backwards 1.5 times faster
      const stepK = dir > 0 ? Math.floor(cur.pos + 1e-6) + 1 : Math.ceil(cur.pos - 1e-6);
      const raw = cur.api.dur(stepK);
      const d = Math.min(2.0, Math.max(0.9, raw));
      if (raw > 2.0 || raw < 0.9) { const key = cur.seg.fig + ':' + stepK; if (!T.durWarn.includes(key)) T.durWarn.push(key); }
      if (!cur.playing || cur.playing.k !== stepK || cur.playing.dir !== dir) {
        if (cur.playing) { cur.playing.end = t; T.steps.push(cur.playing); }
        cur.playing = { fig: cur.seg.fig, k: stepK, dir, start: t, planned: dir > 0 ? d : d / 1.5 };
      }
      const speed = (dir > 0 ? 1 : 1.5) / d;
      let next = cur.pos + dir * speed * dt;
      if ((dir > 0 && next > g) || (dir < 0 && next < g)) next = g;
      cur.pos = next;
      cur.api.render(next);
      T.lastMotion = t;
    }
    // no frame shows two figures: count opaque layers that aren't a set's overlay
    for (const run of runs) {
      const vis = [...run.stage.querySelectorAll(':scope > .layer:not(.ghost-out)')].filter((l) => +getComputedStyle(l).opacity > 0.02);
      if (vis.length > 1) T.violations.push({ t, kind: 'two-figures', n: vis.length });
    }
  }
  requestAnimationFrame(frame);
}

// ------------------------------------------------- stills and descriptions
async function buildStills() {
  for (const run of runs) for (const s of run.segs) {
    if (s.kind !== 'fig') continue;
    const mod = await load(s.fig);
    for (const it of s.items) {
      if (it.kind === 'rest') continue;
      const mk = (pos, parent) => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        parent.appendChild(svg);
        const api = mod.mount(svg, { layout: 'wide', k: 1, reduced: true, still: true });
        api.render(pos);
        return api;
      };
      if (it.kind === 'held') {
        const strip = document.createElement('div');
        strip.className = 'strip'; strip.style.setProperty('--n', it.frames);
        for (let f = 1; f <= it.frames; f++) { const c = document.createElement('div'); c.className = 'still'; strip.appendChild(c); mk(it.step - 1 + f / it.frames, c); }
        it.el.after(strip);
      } else {
        const c = document.createElement('div'); c.className = 'still';
        it.el.after(c);
        const api = mk(it.step, c);
        if (api.desc) { const d = document.createElement('span'); d.className = 'sr-only step-desc'; d.textContent = api.desc(it.step); it.el.appendChild(d); }
      }
    }
  }
}

// ---------------------------------------------------------------- G12
// Relayout only on a change of width or class; keep the reader's paragraph
// where it was; then set the figure (no replay).
function anchorEl() {
  const { L } = lines();
  let best = null;
  for (const p of document.querySelectorAll('main p')) { const r = p.getBoundingClientRect(); if (r.top < L) best = p; }
  return best;
}
let pending = 0;
addEventListener('resize', () => {
  cancelAnimationFrame(pending);
  pending = requestAnimationFrame(() => {
    const oldW = W, oldCls = cls;
    readProbe();
    const nextCls = classify();
    if (innerWidth === oldW && nextCls === oldCls) return;       // toolbars: nothing moves
    const a = anchorEl(), before = a?.getBoundingClientRect().top;
    layout();
    // the reader's paragraph goes to the new layout's reading line (or stays
    // where it was, if that is higher), never off the screen
    const mid = a?.getBoundingClientRect().top;
    if (a) scrollBy(0, mid - Math.min(before, lines().L - 0.15 * H));
    T.anchor = { text: a?.textContent.slice(0, 20), before, mid, after: a?.getBoundingClientRect().top, y: scrollY, max: document.documentElement.scrollHeight - innerHeight };
    for (const run of runs) if (run.cur) {
      const r = run.stage.getBoundingClientRect();
      const keep = run.cur.pos;
      run.cur.svg.replaceChildren();
      run.cur.api = run.cur.mod.mount(run.cur.svg, ctxFor(r.width, r.height));
      run.cur.api.render(keep);
    }
  });
});

// ---------------------------------------------------------------- start
(async () => {
  try {
    layout();
    await buildStills();
    layout();
    requestAnimationFrame(frame);
    root.classList.add('tell-ready');
  } catch (e) {
    console.error(e);
    root.classList.add('js-failed');
  }
})();
