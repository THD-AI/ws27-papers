// qubits: the margin scene, "what one qubit takes". The grid of one logical
// qubit, growing from its centre: 1 qubit, then distance 3, 5 and 7, and at
// §7 distance 9. It is drawn in the article's one grid language, the same
// code as line, syndromes and lattice (shared.js grid()): storing qubits are
// open circles, checks are tiles (flips tinted, phase errors open, half tiles
// at the edges), a check that fires is a tile in the accent field with a dot.
// At distance 7 (beside the text that defines "fires") the checks of one
// simulated round are lit: the round the film in §4 holds up
// (data/qubits.json lit_d7, from data/film.json by figures/film-rule.js).
// Every count is from data/qubits.json.
import { mountFigure, svgRoot, g, circle, rect, clamp, lerp, ease, easeOut } from '../../../lib/fig.js';
import { pal, surface, grid, show, text } from './shared.js';

export const steps = 5;
// seconds each change plays at its marker, seen from the corner of the eye
export const durations = { small: [1.3, 1.3, 1.3, 1.4, 1.3] };
const W = 224, H = 256;
export const aspect = { wide: W / H, tall: W / H };

function build(el, ctx) {
  const C = pal(ctx), data = ctx.data, rows = data.rows;
  // Pinned in the margin rail the drawing carries a title and a hairline
  // frame; the stills at the section starts (phones, print) keep the plain look.
  const rail = !el.closest('.margin-still');
  const cy = 106 + (rail ? 0 : -6), cx = W / 2;
  const byD = (d) => rows.find((r) => r.distance === d);
  const D = rows.map((r) => r.distance);                 // 3, 5, 7, 9
  const lit = data.lit_d7 || { checks: [] };

  // what each state shows
  const K = [
    { d: 1, pitch: 84, label: '1 qubit', sub: 'on its own' },
    { d: D[0], pitch: 36 },
    { d: D[1], pitch: 26 },
    { d: D[2], pitch: 20, lit: true },
    { d: D[3], pitch: 16 },
  ];
  K.forEach((k) => {
    const r = byD(k.d);
    if (!r) { k.say = 'One qubit on its own.'; return; }
    k.label = `${r.total} · distance ${r.distance}`;
    k.sub = k.lit ? `one round: ${lit.checks.length} of ${r.helpers} fire` : k.d === D[0] ? `${r.storing} store, ${r.helpers} check` : `${r.helpers} checks a round`;
    k.say = `Distance ${r.distance}: ${r.storing} storing qubits, drawn as circles, and ${r.helpers} checks, drawn as tiles between them; ${r.total} qubits in all.`
      + (k.lit ? ` In one simulated round, ${lit.checks.length} of the ${r.helpers} checks fire, lit in blue: the round the film in section 4 holds up.` : '');
  });

  const svg = svgRoot(el, W, H, K[0].say);
  svg.style.color = C.ink;
  const heads = [];
  if (rail) {
    const H0 = 'what one qubit takes';
    const HS = [H0, H0, H0, H0, 'one step larger'];
    [...new Set(HS)].forEach((hd) => { const hg = g(svg); text(hg, 4, 15, hd, { family: 'sans', size: 13.5, weight: 600 }); heads.push({ hg, at: HS.map((x, i) => (x === hd ? i : -1)).filter((i) => i >= 0) }); });
    rect(svg, 2.5, 24.5, W - 5, 168, { fill: 'none', stroke: C.hairline, 'stroke-width': 1, 'data-audit': 'skip' });
  }

  // one drawing per state, each at its own pitch around the same centre; a
  // change zooms both to a common pitch, so the inner qubits stay in place
  const layers = K.map((k, s) => {
    const root = g(svg);
    const els = [];
    if (k.d === 1) {
      const c = circle(root, cx, cy, k.pitch * 0.17, { fill: C.paper, stroke: C.ink, 'stroke-width': 1.25 });
      els.push({ el: c, rad: 0, cheb: 0 });
    } else {
      const checks = surface(k.d);
      const r = byD(k.d);
      if (r && checks.length !== r.helpers) console.warn(`qubits: ${checks.length} checks drawn at distance ${k.d}, data says ${r.helpers}`);
      const gr = grid(root, { checks, d: k.d, cx, cy, pitch: k.pitch, C });
      const mid = (k.d - 1) / 2;
      for (const t of Object.values(gr.tiles)) {
        const ch = t.check, dx = ch.col + 0.5 - mid, dy = ch.row + 0.5 - mid;
        const rad = Math.hypot(dx, dy), cheb = Math.max(Math.abs(dx), Math.abs(dy)), edge = ch.shape === 'half';
        els.push({ el: t.base, rad, cheb, edge });
        if (t.helper) els.push({ el: t.helper, rad, cheb, edge });
      }
      for (const q of gr.qubits) {
        const dx = (q.q % k.d) - mid, dy = Math.floor(q.q / k.d) - mid;
        els.push({ el: q.el, rad: Math.hypot(dx, dy), cheb: Math.max(Math.abs(dx), Math.abs(dy)) });
      }
      if (k.lit) {
        k.fired = Object.values(gr.tiles).filter((t) => lit.checks.some((c) => c.row === t.check.row && c.col === t.check.col && c.asks_about === t.check.asks_about));
        if (k.fired.length !== lit.checks.length) console.warn(`qubits: ${k.fired.length} of ${lit.checks.length} lit checks found on the grid`);
      }
    }
    root.querySelectorAll('path, circle').forEach((n) => n.setAttribute('vector-effect', 'non-scaling-stroke'));
    // the arrival order: from the centre outwards
    els.sort((a, b) => a.rad - b.rad);
    root.style.display = 'none';
    return { k, s, root, els, last: new Map(), shownAt: null };
  });
  const put = (L, e, v) => { if (L.last.get(e) !== v) { L.last.set(e, v); e.el.setAttribute('opacity', v); } };

  // labels, one pair per state
  const labels = K.map((k) => {
    const grp = g(svg);
    text(grp, W / 2, 214, k.label, { family: 'mono', size: 15, weight: 500, anchor: 'middle' });
    if (k.sub) text(grp, W / 2, 236, k.sub, { family: 'mono', size: 13.5, anchor: 'middle', fill: C.muted });
    return grp;
  });

  // layer L at a common pitch p, its elements present to the share 'reach'
  // (from the centre out; the part inside the old grid is there at once)
  // old: the layer that leaves; its interior is covered exactly by the new
  // layer's, so only its rim (the half tiles) fades, and nothing doubles up
  const place = (L, p, opacity, reach, inner, old = false) => {
    if (!show(L.root, old ? (opacity > 0.001 ? 1 : 0) : opacity)) return;
    const z = p / L.k.pitch;
    const tr = Math.abs(z - 1) < 1e-4 ? '' : `translate(${cx} ${cy}) scale(${z.toFixed(4)}) translate(${-cx} ${-cy})`;
    if (L.tr !== tr) { L.tr = tr; L.root.setAttribute('transform', tr); }
    const n = L.els.length, spread = Math.max(1, n * 0.3);
    L.els.forEach((e, i) => {
      let o = 1;
      if (old) o = e.edge ? opacity : 0;
      else if (reach < 1 && e.cheb > inner) o = easeOut(clamp((reach * (n + spread) - i) / spread));
      put(L, e, o >= 0.999 ? '1' : o <= 0.001 ? '0' : o.toFixed(2));
    });
  };

  function set(step, t) {
    const G = clamp(step, 0, K.length - 1) + clamp(t) - 1;   // G = k: state k complete
    const k1 = Math.max(0, Math.ceil(G - 1e-9)), k0 = Math.max(0, k1 - 1);
    const u = G <= 0 ? 1 : G - (k1 - 1);                       // progress into state k1
    const a = K[k0], b = K[k1];
    const m = ease(clamp(u / 0.7));
    const p = lerp(a.pitch, b.pitch, m);
    const arrive = G <= 0 ? 1 : clamp((u - 0.25) / 0.65);
    const fadeOld = 1 - ease(clamp((u - 0.15) / 0.5));
    const inner = (a.d - 1) / 2 + 0.01;   // inside the old grid's last qubits
    layers.forEach((L, s) => {
      if (k0 === k1 || G <= 0) { place(L, L.k.pitch, s === k1 ? 1 : 0, 1, 0); return; }
      if (s === k0) place(L, p, fadeOld, 1, 0, true);
      else if (s === k1) place(L, p, 1, arrive, inner);
      else show(L.root, 0);
    });
    // the fired checks of the film's round: lit once the grid has arrived
    for (const L of layers) {
      if (!L.k.fired) continue;
      const pf = L.s === k1 ? (k0 === k1 || G <= 0 ? 1 : ease(clamp((u - 0.72) / 0.28))) : L.s === k0 ? (k0 === k1 ? 1 : fadeOld) : 0;
      for (const tl of L.k.fired) tl.setFired(pf);
    }
    // labels: the old one gives way to the new one, never a blank
    labels.forEach((lb, i) => {
      let pp = 0;
      if (k0 === k1) pp = i === k1 ? 1 : 0;
      else if (i === k0) pp = 1 - ease(clamp(u / 0.3));
      else if (i === k1) pp = ease(clamp((u - 0.3) / 0.3));
      show(lb, pp);
    });
    const hv = (i) => heads.find((hh) => hh.at.includes(i));
    heads.forEach((hh) => {
      let pp = 0;
      if (hv(k0) === hv(k1)) pp = hh === hv(k1) ? 1 : 0;
      else if (hh === hv(k0)) pp = 1 - ease(clamp(u / 0.3));
      else if (hh === hv(k1)) pp = ease(clamp((u - 0.3) / 0.3));
      show(hh.hg, pp);
    });
    svg.setAttribute('aria-label', K[u >= 0.6 ? k1 : k0].say);
  }
  return { set };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
