// v3.1 player: one page = one camera on the world + a screen-space annotation layer.
// start(P, F) is called by index.html (fetches pages.json and facts.json) or by
// offline.js (the esbuild bundle, JSON inlined). Annotations are placed by camera
// maths (project()); getScreenCTM is only used by the gates to measure.
import { makeRoute, buildWorld, objectBox, addThings, thingGeom } from './world.js';
import { rect, project, hop, FRAME } from './camera.js';

const NS = 'http://www.w3.org/2000/svg';
const el = (tag, a = {}, txt) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); if (txt != null) e.textContent = txt; return e; };

// Screen layout (1920 × 1080): 5% safe area, title band, caption band, locator.
const SAFE = { x: 96, y: 54, r: 1824, b: 1026 };
const CAPTION_Y = 1000, BAND_TOP = 958;
const LOC = { x: 1536, y: 770, w: 288, h: 162 };
const FONTS = {
  eyebrow: ['500', 24, 'Libre Franklin', 'source'],
  title: ['400', 56, 'Newsreader', 'title'],
  caption: ['400', 32, 'Libre Franklin', 'main'],
  hero: ['500', 120, 'JetBrains Mono', 'hero'],
  heroS: ['500', 96, 'JetBrains Mono', 'hero'],
  num: ['500', 40, 'JetBrains Mono', 'mono'],
  tag: ['500', 32, 'Libre Franklin', 'main'],
  source: ['400', 24, 'Libre Franklin', 'source'],
  zone: ['500', 32, 'Libre Franklin', 'main'],
  loc: ['500', 24, 'Libre Franklin', 'locator'],
};
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

export function start(P, F, q = new URLSearchParams(location.search)) {
  const facts = Object.fromEntries(F.facts.map((f) => [f.id, f]));
  const n = Math.max(0, Math.min(P.pages.length - 1, (+q.get('page') || 1) - 1));
  const page = P.pages[n], route = makeRoute(q.get('route') || 'chevron');
  let r = rect(P.stops[page.camera], route, P.map);
  if (q.has('from') && q.has('t')) r = hop(rect(P.stops[P.pages[+q.get('from') - 1].camera], route, P.map), r, +q.get('t'));
  const overview = page.camera === 'overview';
  const svg = document.getElementById('page');
  const cam = document.getElementById('cam'), ann = document.getElementById('ann');
  cam.replaceChildren(); ann.replaceChildren();
  const world = buildWorld(cam, route, P.zones, P.map, { overview, redRoute: page.redRoute ?? overview, gridStep: 9600 / r.w < 2 ? 4 : 1 });
  for (const t of page.things || []) if (t.kind === 'pile') t.count = Math.round(facts[t.fact].value / t.N);
  addThings(world, route, P.zones, page.things || [], page.hide || []);
  cam.setAttribute('transform', `scale(${FRAME[0] / r.w}) translate(${-r.x},${-r.y})`);
  const heroZone = page.hero && page.hero.parts.some((p) => p.red) ? page.hero.zone : null;
  for (const z of world.querySelectorAll('.zone')) {
    if (!overview && z.dataset.zone !== page.focus) z.classList.add('context');
    if (z.dataset.zone === heroZone) { z.classList.add('red'); z.classList.remove('context'); z.dataset.thing = 'hero'; }
  }

  // reserved: header band (paper, holds eyebrow and title), caption band, locator
  const used = [];
  let top = page.question ? 266 : 186;
  ann.append(el('rect', { x: 0, y: 0, width: 1920, height: top - 10, class: 'band', 'data-anchor': 'header-band' }));
  ann.append(text('eyebrow', SAFE.x, 92, page.eyebrow, { fill: 'var(--muted)', 'data-anchor': 'eyebrow' }));
  ann.append(text('title', SAFE.x, 156, page.title, { 'data-anchor': 'title' }));
  if (page.question) ann.append(text('title', SAFE.x, 236, page.question, { 'data-anchor': 'question' }));
  ann.append(el('rect', { x: 0, y: BAND_TOP, width: 1920, height: 1080 - BAND_TOP, class: 'band' }));
  ann.append(el('path', { d: `M${SAFE.x},${BAND_TOP}H${SAFE.r}`, 'data-stroke': 'grid' }));
  ann.append(text('caption', SAFE.x, CAPTION_Y, page.caption, { 'data-anchor': 'caption' }));
  const free = { x: SAFE.x, y: top, r: SAFE.r, b: BAND_TOP - 12 };
  if (!overview) { drawLocator(ann, route, P, r); used.push({ x: LOC.x, y: LOC.y, w: LOC.w, h: LOC.h }); }

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
  const onScreen = (b) => b.x + b.w > 0 && b.x < FRAME[0] && b.y + b.h > 0 && b.y < FRAME[1];
  for (const id of [...P.zones.map((z) => z.id), ...(page.things || []).map((t) => t.id)]) { if ((page.hide || []).includes(id)) continue; const o = objScreen(id); if (onScreen(o)) used.push(o); }

  // a block = lines of [font, string, attrs]; placed beside its object, leader from the object's edge to the first line
  function place(id, zoneId, lines, { outline = false } = {}) {
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
    const boxes = cands.map((c) => clampBox({ ...c, w, h }, free));
    const area = (a, u) => Math.max(0, Math.min(a.x + a.w, u.x + u.w + 16) - Math.max(a.x, u.x - 16)) * Math.max(0, Math.min(a.y + a.h, u.y + u.h + 16) - Math.max(a.y, u.y - 16));
    const onRoute = (b) => routePts.filter(([x, y]) => x > b.x - 12 && x < b.x + b.w + 12 && y > b.y - 12 && y < b.y + b.h + 12).length;
    const dist = (b) => Math.hypot(b.x + b.w / 2 - cx, b.y + b.h / 2 - cy);
    const score = (b) => used.reduce((s, u) => s + area(b, u), 0) + onRoute(b) * 5000 + dist(b) * 20;
    const best = boxes.reduce((a, b) => (score(b) < score(a) ? b : a));
    used.push(best);
    const g = el('g', { 'data-anchor': id, 'data-zone': zoneId, 'data-box': [best.x, best.y, w, h].map(Math.round).join(',') });
    const first = { x: best.x + pad, y: best.y + pad, w: lw[0], h: lh(lines[0][0]) };
    const p0 = edgePoint(ob, [first.x + first.w / 2, first.y + first.h / 2]);
    const p1 = outline ? edgePoint(best, p0) : edgePoint(first, p0);
    g.append(el('path', { d: `M${p0[0]},${p0[1]}L${p1[0]},${p1[1]}`, 'data-stroke': 'leader' }));
    g.append(el('circle', { cx: p0[0], cy: p0[1], r: 3, fill: 'var(--ink)' }));
    if (outline) g.append(el('rect', { x: best.x, y: best.y, width: w, height: h, 'data-stroke': 'leader', fill: 'var(--paper)' }));
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
    P.zones.forEach((z, i) => place('zone-' + z.id, z.id, [['zone', `${z.id} ${z.name}`], ['source', `beat ${[1, 2, 3, 5, 7][i]}`, { fill: 'var(--muted)' }]]));
  }
  if (page.hero) {
    const parts = [];
    page.hero.parts.forEach((p, i) => {
      if (i) parts.push({ t: ' / ' });
      const f = facts[p.fact];
      parts.push({ t: f.display, a: { 'data-fact': p.fact, ...(p.red ? { class: 'red', 'data-thing': 'hero' } : {}) } });
    });
    const long = parts.reduce((a, p) => a + p.t.length, 0) > 8;
    place('hero', page.hero.zone, [[long ? 'heroS' : 'hero', parts], ['tag', page.hero.tag], ['source', page.hero.source, { fill: 'var(--muted)' }]]);
  }
  for (const [i, fl] of (page.flags || []).entries()) {
    const f = facts[fl.fact];
    place('flag-' + i, fl.zone, [['num', [{ t: f.display, a: { 'data-fact': fl.fact } }]], ['tag', fl.tag], ['source', fl.source, { fill: 'var(--muted)' }]], { outline: true });
  }
  window.V31_RULERS = (page.things || []).filter((t) => t.kind === 'ruler' || t.kind === 'plane').length; // no hull, no route gap
  window.V31 = { page: n + 1, camera: page.camera, rect: r, route: route.kind, ready: true };
  return svg;
}

function drawLocator(ann, route, P, r) {
  const s = LOC.w / P.map[0], g = el('g', { 'data-anchor': 'locator', transform: `translate(${LOC.x},${LOC.y})` });
  g.append(el('rect', { x: 0, y: 0, width: LOC.w, height: LOC.h, fill: 'var(--paper)', 'data-stroke': 'locator' }));
  g.append(el('path', { d: 'M' + route.pts.map(([x, y]) => `${x * s},${y * s}`).join('L'), 'data-stroke': 'locator' }));
  g.append(el('rect', { x: r.x * s, y: r.y * s, width: r.w * s, height: r.h * s, fill: 'none', 'data-stroke': 'leader' }));
  // letters only if 24 px fits between zone centres (VISUAL: drop letters otherwise)
  const cs = P.zones.map((z) => route.at((z.from + z.to) / 2).map((v) => v * s));
  const minGap = Math.min(...cs.slice(1).map((c, i) => Math.hypot(c[0] - cs[i][0], c[1] - cs[i][1])));
  const cr = { x: r.x * s - 4, y: r.y * s - 4, r: (r.x + r.w) * s + 4, b: (r.y + r.h) * s + 4 };
  const hits = (x, y) => !(x + 16 < cr.x || x > cr.r || y < cr.y || y - 20 > cr.b) && !(x > cr.x + 8 && x + 16 < cr.r - 8 && y - 20 > cr.y + 8 && y < cr.b - 8);
  if (minGap >= 24 * 1.6) P.zones.forEach((z, i) => { const x = cs[i][0] - 7, y = cs[i][1] - 10; if (!hits(x, y)) g.append(text('loc', x, y, z.id, { fill: 'var(--muted)' })); });
  ann.append(g);
}
