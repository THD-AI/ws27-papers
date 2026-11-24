// v3.1 world: map units only, no text. Bare stand-ins (blocks 2–3).
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

// Stand-in sizes per zone: [iso half-size, height] in map units.
// Cold box kept under half of frame A's height (1350) so it sits whole in its frame.
const SIZES = { A: [240, 480], B: [420, 60], C: [300, 120], D: [320, 260], E: [380, 200] };

// iso box corners (strict 30°) centred on p.
function isoCorners([x, y], s, hgt) {
  const c = Math.cos(Math.PI / 6) * s, d = Math.sin(Math.PI / 6) * s;
  const base = [[x, y + d], [x + c, y], [x, y - d], [x - c, y]];
  return { base, top: base.map(([a, b]) => [a, b - hgt]) };
}

// The object's box in map units – annotations start their leaders on its edge.
export function objectBox(route, z) {
  const [s, h] = SIZES[z.id], { base, top } = isoCorners(route.at((z.from + z.to) / 2), s, h);
  const pts = [...base, ...top], xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
}

const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };

function isoBox(p, s, hgt) {
  const { base, top } = isoCorners(p, s, hgt), P = (q) => q.join(',');
  return `M${P(base[0])}L${P(base[1])}L${P(top[1])}L${P(top[0])}L${P(top[3])}L${P(base[3])}Z` +
    `M${P(base[0])}L${P(top[0])}M${P(top[0])}L${P(top[1])}L${P(top[2])}L${P(top[3])}Z`;
}

// gridStep: grid module multiple. The overview uses 4 (module 480) so the ground
// stays a light hairline field instead of a grey tone (G25 intent).
export function buildWorld(svg, route, zones, map = [9600, 5400], { overview = false, redRoute = overview, gridStep = 1 } = {}) {
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
    const zg = el('g', { 'data-zone': z.id, class: 'zone' });
    const [s, h] = SIZES[z.id];
    zg.append(el('path', { d: isoBox(route.at((z.from + z.to) / 2), s, h), 'data-stroke': 'object' }));
    g.append(zg);
  }
  svg.append(g);
  return g;
}

// ---- block 3b: stand-in "things" (prisms, pile box, rulers) beside the route ----
// spec: { id, kind: 'box'|'prism'|'ruler', at (route fraction), off: [dx, dy] map units,
//         s (iso half-size), h (height), len (ruler length, map units), red }
function dirAt(route, f) { const a = route.at(Math.max(0, f - 0.001)), b = route.at(Math.min(1, f + 0.001)); const L = Math.hypot(b[0] - a[0], b[1] - a[1]); return [(b[0] - a[0]) / L, (b[1] - a[1]) / L]; }
export function thingGeom(route, t) {
  const [x, y] = route.at(t.at), p = [x + (t.off?.[0] || 0), y + (t.off?.[1] || 0)];
  if (t.kind === 'ruler') {
    const [dx, dy] = dirAt(route, t.at), q = [p[0] + dx * t.len, p[1] + dy * t.len], n = [-dy * 40, dx * 40];
    const d = `M${p[0]},${p[1]}L${q[0]},${q[1]}M${p[0] - n[0]},${p[1] - n[1]}L${p[0] + n[0]},${p[1] + n[1]}M${q[0] - n[0]},${q[1] - n[1]}L${q[0] + n[0]},${q[1] + n[1]}`;
    const xs = [p[0], q[0]], ys = [p[1], q[1]];
    return { d, box: { x: Math.min(...xs) - 40, y: Math.min(...ys) - 40, w: Math.abs(q[0] - p[0]) + 80, h: Math.abs(q[1] - p[1]) + 80 }, hull: null };
  }
  const { base, top } = isoCorners(p, t.s, t.h), P = (q) => q.join(',');
  const d = `M${P(base[0])}L${P(base[1])}L${P(top[1])}L${P(top[0])}L${P(top[3])}L${P(base[3])}Z` + `M${P(base[0])}L${P(top[0])}M${P(top[0])}L${P(top[1])}L${P(top[2])}L${P(top[3])}Z`;
  const hull = [base[0], base[1], top[1], top[2], top[3], base[3]];
  const xs = hull.map((q) => q[0]), ys = hull.map((q) => q[1]);
  return { d, hull, box: { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) } };
}
export function zoneHull(route, z) { const [s, h] = SIZES[z.id], { base, top } = isoCorners(route.at((z.from + z.to) / 2), s, h); return [base[0], base[1], top[1], top[2], top[3], base[3]]; }

// draws things and breaks the route with a paper gap under every object (mask, no filter)
export function addThings(world, route, zones, things = [], hide = []) {
  for (const z of world.querySelectorAll('.zone')) if (hide.includes(z.dataset.zone)) z.remove();
  for (const t of things) {
    const g = el('g', { 'data-thing-id': t.id, class: 'thing' + (t.red ? ' red' : '') });
    if (t.red) g.dataset.thing = 'hero';
    g.append(el('path', { d: thingGeom(route, t).d, 'data-stroke': 'object' }));
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
