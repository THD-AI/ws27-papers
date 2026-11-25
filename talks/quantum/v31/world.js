// v3.1 world: map units only, no text. Real objects since block 5 (objects.js, forged cryostat raster).
// Route: chevron (+30° through A–C, −30° through D–E); strip kept for the block-2 comparison.
const T30 = Math.tan(Math.PI / 6);

export function makeRoute(kind, map = [9600, 5400]) {
  let pts;
  if (kind === 'strip') pts = [[800, 2700], [8800, 2700]];
  else { const x0 = 800, y0 = 4400, h1 = 4960, h2 = 3040; pts = [[x0, y0], [x0 + h1, y0 - h1 * T30], [x0 + h1 + h2, y0 - h1 * T30 + h2 * T30]]; }
  const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const L = seg.reduce((a, b) => a + b, 0);
  const at = (f) => {
    let d = f * L;
    for (let i = 0; i < seg.length; i++) {
      if (d <= seg[i] || i === seg.length - 1) { const t = d / seg[i]; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t]; }
      d -= seg[i];
    }
  };
  return { kind, pts, L, at };
}

// Lifted panel boxes (exploded parts in the sky above each zone), map units.
export function panels(route, zones) {
  return zones.map((z) => { const [x, y] = route.at((z.from + z.to) / 2); return { id: 'panel-' + z.id, x: x - 350, y: y - 1300, w: 700, h: 450 }; });
}

// ---- real objects (block 5) ----
import { whisker, chip, film, reader, prism, backPlane, backPlaneX, liftedTile, tie, panel, flatRuler, bar, startTick, pile, qubit, checkTile, ruler, frame,
  chipOverview, filmOverview, readerOverview, cryoOverview, pileOverview, qubitOverview } from './objects.js';

const C30 = Math.cos(Math.PI / 6);
// cryostat: forged raster, 700 map units tall, ground point at the bottom of the drawing
export const CRYO = { src: new URL('./art/cryostat-world.png', import.meta.url).href, W: 1024, H: 1536, h: 700, foot: 1460 };
const bboxOf = (paths) => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of paths) { const n = (p.d || p).match(/-?\d+(\.\d+)?(e-?\d+)?/g).map(Number); for (let i = 0; i + 1 < n.length; i += 2) { x0 = Math.min(x0, n[i]); x1 = Math.max(x1, n[i]); y0 = Math.min(y0, n[i + 1]); y1 = Math.max(y1, n[i + 1]); } }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
};
const rectHull = (b) => [[b.x, b.y], [b.x + b.w, b.y], [b.x + b.w, b.y + b.h], [b.x, b.y + b.h]];

// a zone's object at a point p (route point), full or overview variant
export function zoneGeom(route, z, ov = false) {
  const p = route.at((z.from + z.to) / 2);
  if (z.id === 'A') {
    const k = CRYO.h / CRYO.H, wpx = CRYO.W * k, box = { x: p[0] - wpx / 2, y: p[1] - CRYO.foot * k, w: wpx, h: CRYO.h };
    if (ov) { const paths = cryoOverview().map((q) => ({ ...q, transform: `translate(${box.x},${box.y}) scale(${k})` })); return { paths, box, hull: rectHull(box) }; }
    return { image: { href: CRYO.src, ...box }, box, hull: rectHull(box) };
  }
  let paths;
  if (z.id === 'B') { const o = [p[0], p[1] + 280]; paths = ov ? chipOverview(o) : chip(o); }
  else if (z.id === 'C') { const o = [p[0] - 500 * C30 + 100 * C30, p[1] + 300]; paths = ov ? filmOverview(o) : film(o); }
  else if (z.id === 'D') { const o = [p[0] + 40 * C30 - 0, p[1] + 170]; paths = ov ? readerOverview(o) : reader(o); }
  else { // E: the results row (beat 7 language), drawn as a context object off the route
    const o = [p[0] - 520, p[1] + 230]; paths = [];
    [282, 266, 218].forEach((h, i) => paths.push(...prism([o[0] + i * 190, o[1]], h, 90, 'E' + i)));
    if (!ov) paths.push(...backPlaneX([o[0] - 100, o[1] + 45], 3 * 190 + 60, 340, 100, 282, 'E-plane'));
    if (ov) paths.splice(0, paths.length, ...paths.slice(0, 20));
  }
  const box = bboxOf(paths);
  return { paths, box, hull: rectHull(box) };
}

export function objectBox(route, z) { return zoneGeom(route, z).box; }
export function zoneHull(route, z) { return zoneGeom(route, z).hull; }


const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };


// gridStep: grid module multiple. The overview uses 4 (module 480) so the ground
// stays a light hairline field instead of a grey tone (G25 intent).
export function buildWorld(svg, route, zones, map = [9600, 5400], { overview = false, redRoute = overview, gridStep = 1, ov = overview } = {}) {
  const g = el('g', { id: 'world' });
  const grid = el('g', { class: 'grid' });
  let d = '';
  const M = 120 * gridStep, span = map[0] + map[1] / T30, dx = M * 2 / Math.sqrt(3);
  for (let k = -span; k <= span; k += dx) d += `M${k},0L${k + map[1] / T30},${map[1]}M${k},${map[1]}L${k + map[1] / T30},0`;
  grid.append(el('path', { d, 'data-stroke': 'grid' }));
  const clipId = 'mapclip' + Math.random().toString(36).slice(2, 7);
  const clip = el('clipPath', { id: clipId }); clip.append(el('rect', { x: 0, y: 0, width: map[0], height: map[1] }));
  svg.append(clip); grid.setAttribute('clip-path', `url(#${clipId})`);
  g.append(grid);
  g.append(el('path', { id: 'route', d: 'M' + route.pts.map((p) => p.join(',')).join('L'), 'data-stroke': 'route', class: redRoute ? 'red' : '' }));
  for (const z of zones) {
    const zg = el('g', { 'data-zone': z.id, class: 'zone' }), geo = zoneGeom(route, z, ov);
    if (geo.image) zg.append(el('image', { href: geo.image.href, x: geo.image.x, y: geo.image.y, width: geo.image.w, height: geo.image.h, 'data-raster': '1', preserveAspectRatio: 'none' }));
    for (const q of geo.paths || []) zg.append(el('path', { d: q.d, 'stroke-width': q.w, 'data-stroke': q.stroke || 'object', ...(q.cls ? { class: q.cls } : {}), ...(q.transform ? { transform: q.transform } : {}) }));
    g.append(zg);
  }
  svg.append(g);
  return g;
}

// ---- things beside the route: prisms, back planes, pile, rulers, qubit, check tile ----
// spec: { id, kind, at (route fraction), off: [dx, dy] map units, red, ... }
function dirAt(route, f) { const a = route.at(Math.max(0, f - 0.001)), b = route.at(Math.min(1, f + 0.001)); const L = Math.hypot(b[0] - a[0], b[1] - a[1]); return [(b[0] - a[0]) / L, (b[1] - a[1]) / L]; }
export function thingGeom(route, t, ov = false) {
  const [x, y] = t.pos ? t.pos : route.at(t.at), p = [x + (t.off?.[0] || 0), y + (t.off?.[1] || 0)];
  let paths, hull = true;
  if (t.kind === 'ruler') { paths = ruler(p, dirAt(route, t.at), t.len, t.every || 0, t.tick || 40); hull = false; }
  else if (t.kind === 'planex') { paths = backPlaneX(p, t.len, t.top, t.step, t.tallest, t.id); hull = false; var points = { top: [p[0], p[1] - t.top], base: p }; }
  else if (t.kind === 'lifted') {
    paths = liftedTile(p, t.s || 420, t.fired ?? ['z2', 'x0', 'x1'], t.id, t.errs || {}); var points = paths.points;
    if (t.from) { const f = thingGeom(route, t.from); const fo = t.from.pos ? t.from.pos : route.at(t.from.at); paths = [...paths, ...tie([fo[0] + t.from.off[0], fo[1] + t.from.off[1]], t.from.U || 160, t.from.V || 120, p, t.s || 420)]; }
  }
  else if (t.kind === 'bar') { const d = dirAt(route, t.at); paths = [...bar(p, d, t.len, t.id), ...(t.tick ? startTick(p, d, t.id + '-t') : [])]; hull = false; }
  else if (t.kind === 'panel') { paths = panel(p, t.w, t.h, t.id); hull = false; }
  else if (t.kind === 'flatruler') { paths = flatRuler(p, t.len, t.ticks || [], t.id); hull = false; var points = { start: p, end: [p[0] + t.len, p[1]] }; }
  else if (t.kind === 'whisker') { paths = whisker(p, t.len, t.dir || [1, 0], t.cap || 18, t.id); if (t.thick) paths = paths.map((q) => ({ ...q, stroke: 'mark' })); hull = false; var points = { mid: [p[0] + (t.dir || [1, 0])[0] * t.len / 2, p[1] + (t.dir || [1, 0])[1] * t.len / 2] }; }
  else if (t.kind === 'prism') paths = prism(p, t.h, t.s || 90, t.id);
  else if (t.kind === 'plane') { paths = backPlane(p, t.len, t.top, t.step, t.id); hull = false; }
  else if (t.kind === 'pile') paths = ov ? pileOverview(p, t.count * 18) : pile(p, t.count);
  else if (t.kind === 'qubit') paths = ov ? qubitOverview(p) : qubit(p, t.r || 70, t.rings ?? 3);
  else if (t.kind === 'tile') paths = checkTile(p, t.s || 180);
  else paths = frame(p, t.U || 160, t.V || 120, t.id);
  const box = bboxOf(paths);
  let anchor = null;
  if (t.anchor === 'centre') anchor = p;
  if (t.anchor === 'end') { const d = dirAt(route, t.at); anchor = [p[0] + d[0] * t.len, p[1] + d[1] * t.len]; }
  return { paths, box, hull: hull ? rectHull(box) : null, anchor, points: typeof points !== 'undefined' ? points : null };
}

// draws things and breaks the route with a paper gap under every object (mask, no filter)
export function addThings(world, route, zones, things = [], hide = []) {
  for (const z of world.querySelectorAll('.zone')) if (hide.includes(z.dataset.zone)) z.remove();
  for (const t of things) {
    const g = el('g', { 'data-thing-id': t.id, 'data-kind': t.kind, class: 'thing' + (t.red ? ' red' : '') + (t.redmarks ? ' redmarks' : '') });
    if (t.red || t.redmarks) g.dataset.thing = 'hero';
    for (const q of thingGeom(route, t).paths) g.append(el('path', { d: q.d, 'stroke-width': q.w, 'data-stroke': q.stroke || 'object', ...(q.cls ? { class: q.cls } : {}) }));
    world.append(g);
  }
  const id = 'routegap' + Math.random().toString(36).slice(2, 7);
  const mask = el('mask', { id, maskUnits: 'userSpaceOnUse', x: -20000, y: -20000, width: 60000, height: 60000 });
  mask.append(el('rect', { x: -20000, y: -20000, width: 60000, height: 60000, fill: 'white' }));
  const hulls = zones.filter((z) => !hide.includes(z.id)).map((z) => zoneHull(route, z)).concat(things.map((t) => thingGeom(route, t).hull).filter(Boolean));
  for (const h of hulls) mask.append(el('path', { d: 'M' + h.map((q) => q.join(',')).join('L') + 'Z', fill: 'black', stroke: 'black', 'stroke-width': 16, 'vector-effect': 'non-scaling-stroke', 'stroke-linejoin': 'round' }));
  world.prepend(mask);
  world.querySelector('#route').setAttribute('mask', `url(#${id})`);
}

// screen-independent geometry points of an object (map units) – leaders end on these, not on a bbox
export function geomPoints(paths) {
  const pts = [];
  for (const q of paths) { const n = (q.d || q).match(/-?\d+(\.\d+)?(e-?\d+)?/g).map(Number); for (let i = 0; i + 1 < n.length; i += 2) pts.push([n[i], n[i + 1]]); }
  return pts;
}
