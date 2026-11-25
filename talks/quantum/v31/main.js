// v3.1 player: one page = one camera on the world + a screen-space annotation layer.
// start(P, F) is called by index.html (fetches pages.json and facts.json) or by
// offline.js (the esbuild bundle, JSON inlined). Annotations are placed by camera
// maths (project()); getScreenCTM is only used by the gates to measure.
import { makeRoute, buildWorld, objectBox, addThings, thingGeom, zoneGeom, geomPoints } from './world.js';
import { rect, project, hop, FRAME } from './camera.js';

const NS = 'http://www.w3.org/2000/svg';
const el = (tag, a = {}, txt) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); if (txt != null) e.textContent = txt; return e; };

// Screen layout (1920 × 1080): 5% safe area, title band, caption band, locator.
const SAFE = { x: 96, y: 54, r: 1824, b: 1026 };
const CAPTION_Y = 1000, BAND_TOP = 958;
const LOC = { x: 1536, y: 740, w: 288, h: 200 };
const FONTS = {
  title: ['400', 56, 'Newsreader', 'title'],
  caption: ['400', 32, 'Libre Franklin', 'caption'],
  hero: ['600', 120, 'Libre Franklin', 'hero'],
  heroS: ['600', 96, 'Libre Franklin', 'hero'],
  num: ['600', 44, 'Libre Franklin', 'label'],
  tag: ['500', 44, 'Libre Franklin', 'label'],
  name: ['500', 44, 'Libre Franklin', 'label'],
  mini: ['500', 30, 'Libre Franklin', 'qualifier'],
  source: ['400', 30, 'Libre Franklin', 'qualifier'],
  zone: ['500', 44, 'Libre Franklin', 'label'],
  loc: ['500', 30, 'Libre Franklin', 'qualifier'],
};
const STOPNAME = { A: 'A cold box', B: 'B chip', BC: 'B–C chip to film', 'CD-frame': 'C newest frame', D: 'D reader', CD: 'C–D film to reader', E: 'E results' };
// numbers: a thin space between value and unit, as in the article
const num = (s) => s.replace(/(\d) (?=(µs|ms|s)\b)/g, '$1\u2009');
const ctx = document.createElement('canvas').getContext('2d');
const width = (f, s) => { const [w, px, fam] = FONTS[f]; ctx.font = `${w} ${px}px "${fam}"`; return ctx.measureText(s).width; };
const text = (f, x, y, s, extra = {}) => { const [w, px, fam, type] = FONTS[f]; return el('text', { x, y, 'font-family': fam, 'font-weight': w, 'font-size': px, 'data-type': type, 'data-role': f, ...extra }, s); };

const overlap = (a, b, pad = 0) => a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;
// keep-inside rule: a label box is clamped into the free area, never clipped by the frame
const clampBox = (bx, free) => ({ ...bx, x: Math.min(Math.max(bx.x, free.x), free.r - bx.w), y: Math.min(Math.max(bx.y, free.y), free.b - bx.h) });
// where the ray from a box's centre towards p leaves the box
function edgePoint(b, p) {
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2, dx = p[0] - cx, dy = p[1] - cy;
  const s = Math.min(dx ? (b.w / 2) / Math.abs(dx) : Infinity, dy ? (b.h / 2) / Math.abs(dy) : Infinity);
  return [cx + dx * s, cy + dy * s];
}

export function start(P, F, q = new URLSearchParams(location.search), svgEl = null) {
  const facts = Object.fromEntries(F.facts.map((f) => [f.id, f]));
  const n = Math.max(0, Math.min(P.pages.length - 1, (+q.get('page') || 1) - 1));
  let page = P.pages[n]; const route = makeRoute(q.get('route') || 'chevron');
  let r = rect(P.stops[page.camera], route, P.map);
  if (q.has('from') && q.has('t')) r = hop(rect(P.stops[P.pages[+q.get('from') - 1].camera], route, P.map), r, +q.get('t'));
  const overview = page.camera === 'overview';
  const svg = svgEl || document.getElementById('page');
  const cam = svg.querySelector('[data-layer=cam], #cam'), ann = svg.querySelector('[data-layer=ann], #ann');
  cam.replaceChildren(); ann.replaceChildren();
  const world = buildWorld(cam, route, P.zones, P.map, { overview, redRoute: page.redRoute ?? overview, gridStep: 9600 / r.w < 2 ? 4 : 1 });
  for (const t of page.things || []) if (t.kind === 'pile') t.count = Math.round(facts[t.fact].value / t.N);
  // motion (block 8): ?p=0..1 is the build's progress. Only the world copy moves; labels are
  // placed from the final state, so within a build only the focus element changes (G12).
  const prog = q.has('p') ? Math.max(0, Math.min(1, +q.get('p'))) : 1, A = page.anim;
  const shown = (page.things || []).map((t) => ({ ...t, off: t.off ? [...t.off] : t.off }));
  if (A && prog < 1) {
    const t = shown.find((x) => x.id === A.focus);
    if (A.kind === 'rings') t.rings = Math.floor(3 * prog + 1e-9);
    if (A.kind === 'grow') t.count = Math.max(1, Math.round(t.count * prog));
    if (A.kind === 'fill') t.len = Math.max(1, t.len * prog);
    if (A.kind === 'slide') { const a = route.at(t.at - 0.001), b = route.at(t.at + 0.001), L = Math.hypot(b[0] - a[0], b[1] - a[1]); t.off[0] -= (b[0] - a[0]) / L * A.dist * (1 - prog); t.off[1] -= (b[1] - a[1]) / L * A.dist * (1 - prog); }
  }
  addThings(world, route, P.zones, shown, page.hide || []);
  cam.setAttribute('transform', `scale(${FRAME[0] / r.w}) translate(${-r.x},${-r.y})`);
  const heroZone = page.hero && page.hero.parts.some((p) => p.red) ? page.hero.zone : null;
  for (const z of world.querySelectorAll('.zone')) {
    if (!overview && z.dataset.zone !== page.focus) z.classList.add('context');
    if (z.dataset.zone === heroZone) { z.classList.add('red'); z.classList.remove('context'); z.dataset.thing = 'hero'; }
  }

  // reserved: header band (paper, holds eyebrow and title), caption band, locator
  const used = [];
  let top = page.question ? 226 : page.rowNote ? 196 : 150;
  ann.append(el('rect', { x: 0, y: 0, width: 1920, height: top - 10, class: 'band', 'data-anchor': 'header-band' }));
  ann.append(text('title', SAFE.x, 116, page.title, { 'data-anchor': 'title' }));
  if (page.question) ann.append(text('title', SAFE.x, 196, page.question, { 'data-anchor': 'question' }));
  // a row's shared qualifiers sit under the title (P4: qualifiers may leave the flags)
  if (page.rowNote) ann.append(text('source', SAFE.x, 166, page.rowNote, { fill: 'var(--muted)', 'data-anchor': 'rownote' }));
  ann.append(el('rect', { x: 0, y: BAND_TOP, width: 1920, height: 1080 - BAND_TOP, class: 'band' }));
  ann.append(el('path', { d: `M${SAFE.x},${BAND_TOP}H${SAFE.r}`, 'data-stroke': 'grid' }));
  ann.append(text('caption', SAFE.x, CAPTION_Y, page.caption, { 'data-anchor': 'caption' }));
  const free = { x: SAFE.x, y: top, r: SAFE.r, b: BAND_TOP - 12 };
  if (!overview && typeof page.beat === 'number') { drawLocator(ann, route, P, r, P.stops[page.camera].prev ? rect(P.stops[P.stops[page.camera].prev], route, P.map) : null, STOPNAME[page.camera] || 'backup ' + page.camera); used.push({ x: LOC.x, y: LOC.y, w: LOC.w, h: LOC.h }); }

  // route as screen points, for placement scoring and the route gate
  const rp = route.pts.map((q) => project(q, r)), routePts = [];
  for (let i = 0; i < rp.length - 1; i++) for (let k = 0; k <= 200; k++) routePts.push([rp[i][0] + (rp[i + 1][0] - rp[i][0]) * k / 200, rp[i][1] + (rp[i + 1][1] - rp[i][1]) * k / 200]);
  window.V31_ROUTE = rp;
  const objScreen = (id) => {
    const z = P.zones.find((q) => q.id === id), t = (page.things || []).find((q) => q.id === id);
    const ob = z ? objectBox(route, z) : thingGeom(route, t).box;
    const [x0, y0] = project([ob.x, ob.y], r), [x1, y1] = project([ob.x + ob.w, ob.y + ob.h], r);
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  };
  const targetPts = (id) => {
    const z = P.zones.find((q) => q.id === id), t = (page.things || []).find((q) => q.id === id);
    const g = z ? zoneGeom(route, z, overview) : thingGeom(route, t);
    if (g.anchor) return [project(g.anchor, r)];
    if (g.paths && g.paths.some((q) => q.transform)) { const pts = []; for (const q of g.paths) { const [tx, ty, k] = q.transform.match(/-?[0-9.]+(e-?[0-9]+)?/g).map(Number); for (const [x, y] of geomPoints([q])) pts.push(project([tx + x * k, ty + y * k], r)); } return pts; }
    if (!g.paths) { const b = g.box; return [[b.x, b.y], [b.x + b.w, b.y], [b.x, b.y + b.h], [b.x + b.w, b.y + b.h], [b.x + b.w / 2, b.y + b.h]].map((q) => project(q, r)); }
    return geomPoints(g.paths).map((q) => project(q, r));
  };
  const onScreen = (b) => b.x + b.w > 0 && b.x < FRAME[0] && b.y + b.h > 0 && b.y < FRAME[1];
  for (const id of [...P.zones.map((z) => z.id), ...(page.things || []).map((t) => t.id)]) { if ((page.hide || []).includes(id)) continue; const o = objScreen(id); if (onScreen(o)) used.push(o); }

  // a block = lines of [font, string, attrs]; placed beside its object, leader from the object's edge to the first line
  function place(id, zoneId, lines, { outline = false, mode = null, at = null } = {}) {
    const ob = objScreen(zoneId);
    if (!onScreen(ob)) return;
    const lh = (f) => FONTS[f][1] * 1.15;
    const pad = outline ? 14 : 0;
    const lw = lines.map(([f, s]) => (Array.isArray(s) ? s.reduce((a, p) => a + width(f, p.t), 0) : width(f, s)));
    const w = Math.max(...lw) + pad * 2;
    const h = lines.reduce((a, [f]) => a + lh(f), 0) + pad * 2;
    const cx = ob.x + ob.w / 2, cy = ob.y + ob.h / 2, cands = [];
    for (const gap of [48, 96, 160]) cands.push(
      { x: ob.x + ob.w + gap, y: cy - h / 2 }, { x: ob.x - gap - w, y: cy - h / 2 },
      { x: cx - w / 2, y: ob.y - gap - h }, { x: cx - w / 2, y: ob.y + ob.h + gap },
      { x: ob.x + ob.w + gap, y: ob.y - h }, { x: ob.x - gap - w, y: ob.y - h },
      { x: ob.x + ob.w + gap, y: ob.y + ob.h }, { x: ob.x - gap - w, y: ob.y + ob.h });
    if (mode === 'above') { cands.splice(0, cands.length); for (const dy of [30, 110, 190, 270, 350]) for (const dx of [0, -0.35, 0.35]) cands.push({ x: cx - w / 2 + dx * w, y: ob.y - dy - h }); }
    if (mode === 'aboveHigh') { for (const dy of [280, 360, 200]) for (const dx of [0, -0.3, 0.3]) cands.push({ x: cx - w / 2 + dx * w, y: ob.y - dy - h }); }
    if (mode === 'left') { cands.splice(0, cands.length); for (const dy of [-200, -100, 0, 100, 200]) cands.push({ x: ob.x - 40 - w, y: cy - h / 2 + dy }); }
    if (mode === 'under') cands.splice(0, cands.length, { x: cx - w / 2, y: ob.y + ob.h + 64 });
    const boxes = cands.map((c) => clampBox({ ...c, w, h }, free));
    const area = (a, u) => Math.max(0, Math.min(a.x + a.w, u.x + u.w + 16) - Math.max(a.x, u.x - 16)) * Math.max(0, Math.min(a.y + a.h, u.y + u.h + 16) - Math.max(a.y, u.y - 16));
    const onRoute = (b) => routePts.filter(([x, y]) => x > b.x - 12 && x < b.x + b.w + 12 && y > b.y - 12 && y < b.y + b.h + 12).length;
    const dist = (b) => Math.hypot(b.x + b.w / 2 - cx, b.y + b.h / 2 - cy);
    const score = (b) => used.reduce((s, u) => s + area(b, u), 0) * 10 + onRoute(b) * 200000 + dist(b) * 40;
    const best = boxes.reduce((a, b) => (score(b) < score(a) ? b : a));
    used.push(best);
    const g = el('g', { 'data-anchor': id, 'data-zone': zoneId, 'data-target': zoneId, 'data-box': [best.x, best.y, w, h].map(Math.round).join(',') });
    const first = { x: best.x + pad, y: best.y + pad, w: lw[0], h: lh(lines[0][0]) };
    const fc = [first.x + first.w / 2, first.y + first.h / 2], tp = targetPts(zoneId).filter(([x, y]) => x >= 0 && x <= FRAME[0] && y >= 0 && y <= FRAME[1]);
    const tq = at ? [project(at, r)] : tp;
    const p0 = tq.length ? tq.reduce((a, q) => (Math.hypot(q[0] - fc[0], q[1] - fc[1]) < Math.hypot(a[0] - fc[0], a[1] - fc[1]) ? q : a)) : edgePoint(ob, fc);
    if (mode === 'under') { /* names sit under their object, no leader */ }
    const grow = (b, m) => ({ x: b.x - m, y: b.y - m, w: b.w + 2 * m, h: b.h + 2 * m });
    const p1 = outline || (mode && mode.startsWith('above')) ? edgePoint(grow({ x: best.x, y: best.y, w, h }, 8), p0) : edgePoint(grow(first, 8), p0);
    if (mode !== 'under') {
      g.append(el('path', { d: `M${p0[0]},${p0[1]}L${p1[0]},${p1[1]}`, 'data-stroke': 'leader' }));
      g.append(el('circle', { cx: p0[0], cy: p0[1], r: 3, fill: 'var(--ink)' }));
    }
    if (outline) g.append(el('rect', { x: best.x, y: best.y, width: w, height: h, 'data-stroke': 'leader', fill: 'var(--paper)' }));
    if (!id.startsWith('hero')) g.append(el('rect', { x: best.x - 8, y: best.y - 4, width: w + 16, height: h + 8, class: 'knock' })); // the hero keeps only its text halo, so it never hides drawing
    let y = best.y + pad;
    for (const [f, s, a = {}] of lines) {
      y += FONTS[f][1];
      if (Array.isArray(s)) {
        const t = text(f, best.x + pad, y, null, a);
        for (const p of s) t.append(el('tspan', p.a || {}, p.t));
        g.append(t);
      } else g.append(text(f, best.x + pad, y, s, a));
      y += FONTS[f][1] * 0.15;
    }
    ann.append(g);
  }

  if (page.zoneLabels) {
    P.zones.forEach((z) => place('zone-' + z.id, z.id, [['zone', `${z.id} ${z.name}`]]));
  }
  // mid-hop: only title, caption and locator; labels arrive when the camera lands
  const hopping = q.has('from') && q.has('t') && +q.get('t') < 1;
  if (hopping) { page = { ...page, flags: [], names: [], minis: [], joins: [], hero: null, zoneLabels: false }; }
  for (const [i, fl] of (page.flags || []).entries()) {
    const f = facts[fl.fact];
    const first = fl.inline ? ['tag', [{ t: fl.inline }, { t: num(f.display), a: { 'data-fact': fl.fact } }]] : ['num', [{ t: num(f.display), a: { 'data-fact': fl.fact } }]];
    place('flag-' + i, fl.zone, [first, ...(fl.inline || !fl.tag ? [] : [['tag', fl.tag]]), ...(fl.source ? [['source', fl.source, { fill: 'var(--muted)' }]] : [])], { mode: fl.mode });
  }
  if (page.hero) { // after the flags, so it steers around them
    const parts = [];
    page.hero.parts.forEach((p, i) => {
      if (i) parts.push({ t: ' / ' });
      const f = facts[p.fact];
      parts.push({ t: num(f.display), a: { 'data-fact': p.fact, ...(p.red ? { class: 'red', 'data-thing': 'hero' } : {}) } });
    });
    const long = parts.reduce((a, p) => a + p.t.length, 0) > 8;
    place('hero', page.hero.zone, [[long ? 'heroS' : 'hero', parts], ...(page.hero.tag ? [['tag', page.hero.tag]] : []), ...(page.hero.source ? [['source', page.hero.source, { fill: 'var(--muted)' }]] : [])], { mode: page.hero.mode });
  }
  for (const [i, nm] of (page.names || []).entries()) place('name-' + i, nm.zone, [['name', nm.text]], { mode: nm.mode || 'under' });
  for (const [i, mi] of (page.minis || []).entries()) {
    const t = (page.things || []).find((q) => q.id === mi.zone), g = thingGeom(route, t);
    place('mini-' + i, mi.zone, [[mi.big ? 'tag' : 'mini', mi.text]], { at: g.points?.[mi.point], mode: mi.mode });
  }
  for (const j of page.joins || []) {
    const a = thingGeom(route, (page.things || []).find((q) => q.id === j.from)), zb = zoneGeom(route, P.zones.find((z) => z.id === j.to));
    const pa = project([a.box.x + a.box.w / 2, a.box.y + a.box.h], r), pts = geomPoints(zb.paths || []).map((q) => project(q, r));
    const pb = pts.length ? pts.reduce((u, v) => (Math.hypot(v[0] - pa[0], v[1] - pa[1]) < Math.hypot(u[0] - pa[0], u[1] - pa[1]) ? v : u)) : pa;
    ann.append(el('path', { d: `M${pa[0]},${pa[1]}L${pb[0]},${pb[1]}`, 'data-stroke': 'leader', 'stroke-dasharray': '10 8', 'data-anchor': 'join' }));
  }
  // counter: the pile's flag is placed from its final text, then counts up during the build
  if (A && A.kind === 'grow' && prog < 1) { const i = (page.flags || []).findIndex((x) => x.fact === A.counter), sp = ann.querySelector('[data-anchor=flag-' + i + '] tspan[data-fact]'); if (sp) { sp.textContent = Math.round(facts[A.counter].value * prog) + ' waiting'; sp.removeAttribute('data-fact'); } }
  if (page.station) drawCrop(ann, route, P, page.station);
  // U+2009 falls back to a wide glyph in the web subset of Libre Franklin (measured 51 px against a
  // 25 px space at 120 px), so the thin space is drawn as a 0.17 em gap instead.
  const walk = document.createTreeWalker(ann, NodeFilter.SHOW_TEXT), hits = [];
  while (walk.nextNode()) if (walk.currentNode.nodeValue.includes(' ')) hits.push(walk.currentNode);
  for (const tn of hits) {
    const [a, ...rest] = tn.nodeValue.split(' '), par = tn.parentNode, frag = document.createDocumentFragment();
    frag.append(el('tspan', {}, a)); for (const r2 of rest) frag.append(el('tspan', { dx: '0.17em' }, r2));
    par.replaceChild(frag, tn);
  }
  // text halo as a separate paper copy behind each label: PDF output ignores paint-order and would
  // draw the halo stroke over the letters
  for (const t of [...ann.querySelectorAll("text")]) { const h = t.cloneNode(true); h.setAttribute("class", "halo"); h.removeAttribute("data-fact"); h.setAttribute("aria-hidden", "true"); h.removeAttribute("data-role"); h.removeAttribute("data-type"); h.removeAttribute("data-anchor"); h.querySelectorAll("[data-fact],[data-thing],.red").forEach((s) => { s.removeAttribute("data-fact"); s.removeAttribute("data-thing"); s.removeAttribute("class"); }); t.parentNode.insertBefore(h, t); }
  window.V31_RULERS = (page.things || []).filter((t) => ['ruler', 'plane', 'planex', 'panel', 'flatruler', 'bar', 'whisker'].includes(t.kind)).length; // no hull, no route gap
  window.V31 = { page: n + 1, camera: page.camera, rect: r, route: route.kind, anim: A || null, ready: true };
  return svg;
}

function drawLocator(ann, route, P, r, prev, name) {
  const s = LOC.w / P.map[0], g = el('g', { 'data-anchor': 'locator', 'data-thing': 'locator', transform: `translate(${LOC.x},${LOC.y})` });
  const H = P.map[1] * s;
  g.append(el('rect', { x: 0, y: 0, width: LOC.w, height: H, fill: 'var(--paper)', 'data-stroke': 'locator' }));
  g.append(el('path', { d: 'M' + route.pts.map(([x, y]) => `${x * s},${y * s}`).join('L'), 'data-stroke': 'locator', class: 'loc-route' }));
  if (prev) g.append(el('path', { d: `M${(prev.x + prev.w / 2) * s},${(prev.y + prev.h / 2) * s}L${(r.x + r.w / 2) * s},${(r.y + r.h / 2) * s}`, 'data-stroke': 'locator', class: 'loc-trace' }));
  g.append(el('rect', { x: r.x * s, y: r.y * s, width: r.w * s, height: r.h * s, fill: 'none', 'data-stroke': 'leader' }));
  g.append(text('loc', 0, H + 34, name, { fill: 'var(--muted)' }));
  ann.append(g);
}

// Backups: a small crop of the map around the station they hang off, and a hairline leader
// from the panel's hero block into it.
function drawCrop(ann, route, P, id) {
  const z = P.zones.find((q) => q.id === id), c = route.at((z.from + z.to) / 2), W = 2400, H = W * LOC.h / LOC.w, s = LOC.w / W;
  const g = el('g', { 'data-anchor': 'crop', transform: `translate(${LOC.x},${LOC.y})` });
  const cid = 'crop' + Math.random().toString(36).slice(2, 7), clip = el('clipPath', { id: cid }); clip.append(el('rect', { x: 0, y: 0, width: LOC.w, height: LOC.h })); g.append(clip);
  g.append(el('rect', { x: 0, y: 0, width: LOC.w, height: LOC.h, fill: 'var(--paper)', 'data-stroke': 'locator' }));
  const inner = el('g', { 'clip-path': `url(#${cid})` });
  inner.append(el('path', { d: 'M' + route.pts.map(([x, y]) => `${(x - c[0] + W / 2) * s},${(y - c[1] + H / 2) * s}`).join('L'), 'data-stroke': 'locator' }));
  const b = objectBox(route, z); inner.append(el('rect', { x: (b.x - c[0] + W / 2) * s, y: (b.y - c[1] + H / 2) * s, width: b.w * s, height: b.h * s, fill: 'none', 'data-stroke': 'leader' }));
  g.append(inner);
  g.append(text('loc', 0, LOC.h + 34, z.id + ' ' + z.name.toLowerCase(), { fill: 'var(--muted)' }));
  ann.append(g);
  const hero = ann.querySelector('[data-anchor=hero]');
  if (hero) { const [x, y, w, h] = hero.dataset.box.split(',').map(Number); const sx = LOC.x + (b.x + b.w / 2 - c[0] + W / 2) * s, sy = LOC.y + (b.y - c[1] + H / 2) * s;
    ann.append(el('path', { d: `M${x + w},${y + h / 2}L${sx},${sy}`, 'data-stroke': 'hair', 'data-anchor': 'station-leader' })); }
}
