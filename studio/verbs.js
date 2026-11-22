// The motion verbs of the v2 system (studio/README.md, "Motion").
// A figure renders its whole state from a position: render(pos), where pos k
// means step k complete and k - 1 + t means step k at time t (0..1). Every
// verb below is a pure function of that t, so playing, reversing, chains and
// cross-fades all come out of one render.

export const NS = 'http://www.w3.org/2000/svg';
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const span = (t, a, b) => (b <= a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a)));
export const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2); // camera only

export function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) e.setAttribute(k, v);
  if (parent) parent.appendChild(e);
  return e;
}

// Pen speed in figure units: a stroke as long as the figure is high takes 0.8 s.
export const penSeconds = (len, figH) => clamp(0.8 * len / figH, 0.25, 1.2);

// A step is planned as parts on a seconds timeline; the step lasts their sum
// (clamped 0.9–2.0 s by the engine, which logs any plan outside it).
// plan = [{ at, dur }] -> { total, window(i) } where window gives [a, b] in t.
export function plan(parts) {
  const total = Math.max(...parts.map((p) => p.at + p.dur));
  return { total, w: (i) => [parts[i].at / total, (parts[i].at + parts[i].dur) / total] };
}

// draw: along the stroke. pathLength="1" keeps the dash maths unit-free.
export function draw(path, u) {
  path.setAttribute('pathLength', '1');
  path.style.strokeDasharray = '1 1';
  path.style.strokeDashoffset = String(1 - clamp(u));
  path.style.opacity = u > 0 ? 1 : 0;
}
// fire / frame: a cut.
export const fire = (node, on) => { node.style.opacity = on ? 1 : 0; };
// settle: fade in place, no rise. label: the same, for words.
export const settle = (node, u) => { node.style.opacity = clamp(u); };
export const label = settle;
// ghost: what nobody can see any more.
export const ghost = (node, on) => { node.style.opacity = on ? 0.4 : 1; };

// A stand-in pen line: a gently uneven polyline through the points, no added
// jitter. Marked as a stand-in in the studio until his strokes replace it.
export const penPath = (pts) => 'M' + pts.map((p) => p.join(',')).join(' L');

// Design spaces, chosen by the stage's aspect (tall < 1.05 <= mid < 1.45 <= wide).
// Lettering: at least 14 units in tall and mid, 15 in wide, so that it stays
// at or above 11.5 px at every stage size in the device table.
export const DESIGN = { tall: [360, 400], mid: [400, 320], wide: [720, 440] };
export const textMin = (layout) => (layout === 'wide' ? 15 : 14);
