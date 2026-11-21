// Lab: the held scene (HELD-SCENE.md, section 0) and, for comparison, the
// same figure as an ordinary pinned scene. Both pages are thin shells around
// this script; html[data-held] says which mechanism runs.
//
//   _held.html     ?band=0.45&rest=0.5&lead=0.1   the hold, in svh windows
//                  &stills=1                      force the stills
//                  &freeze=<step>:<t>             pin the figure, no scroll
//   _pinned.html   the engine's rules: a step when its passage's top passes
//                  65% of the window
//
// The pure parts (triggers, goalAt, the two players) are exported for
// tools/held-test.mjs; the page itself runs only in a browser. Nothing here
// imports lib/article.js: MODES and soft() are copied, the players follow
// its aim()/advance().

// ---------------------------------------------------------------------------
// Pure: scroll to step, and the two players
// ---------------------------------------------------------------------------
export const DEFAULTS = { lead: 0.10, band: 0.6, rest: 0.6 };
export const REF = 900;       // band and rest never get shorter than in a 900 px window: 0.6 -> 540 px
export const HYST = 25;       // px a reader must go back past an edge before a step is played back
export const ENTRY = 0.65;    // step 0 is due when the block's top passes 65% of the window
export const FLOOR = 1.2;     // no forward step of the held scene is shorter
export const BACK = 0.6;      // a step played backwards
export const EXIT = 0.6;      // once the block lets go, the step in flight ends within this
export const MIN_STEP = 0.5;  // the engine's shortest step (pinned)
export const IN_VIEW = 0.1;   // under this share of the figure on screen, a step is set, not played
export const FAST = 0.35;     // four or more behind: each queued step in order, this long (never set while seen)

// the engine's ease: a prompt start (1.4 times the mean speed), a gentle end
export const soft = (x) => x * (1.4 - 0.4 * x);
// The hold in px: the lead in svh; band and rest in svh but never shorter
// than in a 900 px window (fix round 1: max(0.6 svh, 540 px) at the default).
export function bands(svh, o = DEFAULTS) {
  const lead = o.lead * svh, band = Math.max(o.band * svh, o.band * REF), rest = Math.max(o.rest * svh, o.rest * REF);
  return { lead, band, rest, hold: lead + 3 * band + rest };
}

// Scroll positions (px) at which goal 1..5 is due; goal k shows step k - 1 complete.
export function triggers(top, svh, o = DEFAULTS) {
  const b = bands(svh, o);
  const t = [top - ENTRY * svh, top + b.lead];
  for (let k = 1; k <= 3; k++) t.push(top + b.lead + k * b.band);
  return t;
}

// Forward at once; back only once the reader is HYST px past the edge, so a
// trackpad that settles on an edge never flips a step.
export function goalAt(y, prev, T, hyst = HYST) {
  let raw = 0;
  while (raw < T.length && y >= T[raw]) raw++;
  if (raw >= prev) return raw;
  let g = prev;
  while (g > raw && y < T[g - 1] - hyst) g--;
  return g;
}

// A player's position runs 0..steps: k + u shows step k at t = soft(u); a
// whole k shows step k - 1 complete.
export function stateOf(pos, steps = 5) {
  if (pos <= 0) return [0, 0];
  const i = Math.min(steps - 1, Math.ceil(pos) - 1);
  return [i, soft(Math.min(1, Math.max(0, pos - i)))];
}
export const newPlayer = (pos = 0) => ({ pos, goal: pos, i: -1, d: 0, squeeze: 1, fast: false });

// Held. Returns why the position was set instead of played, or null.
//   - four or more behind: nothing is set; the queued steps run through in
//     order, FAST each, until the figure has caught up (fix round 1);
//   - `now` (a reason: jump, offscreen, …): set at once.
export function aimHeld(p, goal, now = false) {
  let how = null;
  if (goal !== p.goal) {
    const n = Math.ceil(Math.abs(goal - p.pos) - 1e-6);
    p.goal = goal;
    if (n >= 4) { p.fast = true; p.i = -1; }
  }
  if (now && p.pos !== p.goal) { p.pos = p.goal; p.i = -1; how = now; }
  if (p.pos === p.goal) p.fast = false;
  return how;
}
// The time of forward step i when it starts with `behind` steps to go:
// full length up to two behind; three behind, 1/1.5 of it; never under 1.2 s.
export const heldStepTime = (dur, i, behind) => Math.max(FLOOR, dur[i] / (behind >= 3 ? 1.5 : 1));
// One frame. While the block has let go (`exiting`), the step in flight ends
// within EXIT and a step that would start now is set at once (returns 'exit').
export function stepHeld(p, dt, dur, exiting = false) {
  if (p.pos === p.goal) return null;
  const dir = Math.sign(p.goal - p.pos);
  if (dir < 0) {
    const i = Math.ceil(p.pos) - 1;
    p.pos = Math.max(p.goal, i, p.pos - dt / (p.fast ? FAST : BACK));
    p.i = -1;
    if (p.pos === p.goal) p.fast = false;
    return null;
  }
  const i = Math.floor(p.pos);
  if (exiting && p.pos === i) { p.pos = p.goal; p.i = -1; p.fast = false; return 'exit'; }
  if (p.i !== i) { p.i = i; p.d = p.fast ? FAST : heldStepTime(dur, i, Math.ceil(p.goal - p.pos - 1e-6)); }
  const d = exiting ? Math.min(p.d, EXIT) : p.d;
  p.pos = Math.min(p.goal, i + 1, p.pos + dt / d);
  if (p.pos === i + 1) p.i = -1;
  if (p.pos === p.goal) p.fast = false;
  return null;
}

// Pinned: the engine's aim() and advance() (lib/article.js), for one scene.
export function aimPinned(p, goal, now = false) {
  let how = null;
  if (goal !== p.goal) {
    p.goal = goal;
    let n = Math.ceil(Math.abs(goal - p.pos) - 1e-6);
    if (n > 3) { p.pos = goal - Math.sign(goal - p.pos); n = 1; how = 'skip'; }
    p.squeeze = Math.max(1, n);
  }
  if (now && p.pos !== p.goal) { p.pos = p.goal; how = now; }
  return how;
}
export function stepPinned(p, dt, times) {
  if (p.pos === p.goal) return null;
  const dir = Math.sign(p.goal - p.pos);
  const i = dir > 0 ? Math.floor(p.pos) : Math.ceil(p.pos) - 1;
  const dur = Math.max(MIN_STEP, (dir > 0 ? times[i] : BACK) / p.squeeze);
  p.pos = dir > 0 ? Math.min(p.goal, i + 1, p.pos + dt / dur) : Math.max(p.goal, i, p.pos - dt / dur);
  if (p.pos === p.goal) p.squeeze = 1;
  return null;
}
// The engine's stepTime for a scene: the figure's own time clamped to
// 1.2–3 s, never longer than reading the passage at 230 words a minute.
export function engineTimes(dur, words) {
  return dur.map((v, i) => {
    const d = Math.min(3, Math.max(1.2, v));
    return words[i] ? Math.max(1.2, Math.min(d, (words[i] * 60) / 230)) : d;
  });
}

// ---------------------------------------------------------------------------
// The audit: lettering size, and no line through lettering (from _lab.js)
// ---------------------------------------------------------------------------
function visible(el) {
  for (let n = el; n && n.nodeType === 1 && n.tagName !== 'svg'; n = n.parentNode) {
    const st = n.style;
    if (st && (st.display === 'none' || st.visibility === 'hidden' || st.opacity === '0')) return false;
    const op = n.getAttribute('opacity');
    if (op !== null && Number(op) === 0) return false;
  }
  return true;
}
function segHitsRect(x1, y1, x2, y2, r) {
  let t0 = 0, t1 = 1;
  const dx = x2 - x1, dy = y2 - y1;
  const p = [-dx, dx, -dy, dy], qq = [x1 - r.left, r.right - x1, y1 - r.top, r.bottom - y1];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) { if (qq[i] < 0) return false; } else {
      const t = qq[i] / p[i];
      if (p[i] < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
    }
  }
  return true;
}
export function auditSvg(svg, minPx = 11) {
  const out = { problems: [], smallest: Infinity, texts: 0, segments: 0 };
  if (!svg) { out.problems.push('no svg'); return out; }
  const scale = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
  const texts = [...svg.querySelectorAll('text')].filter((t) => visible(t) && t.textContent.trim());
  out.texts = texts.length;
  const rects = texts.map((t) => {
    const fs = parseFloat(t.getAttribute('font-size')) || 14;
    if (fs * scale < out.smallest) out.smallest = fs * scale;
    if (fs * scale < minPx - 0.05) out.problems.push(`small text ${(fs * scale).toFixed(1)}px: "${t.textContent.trim().slice(0, 40)}"`);
    const r = t.getBoundingClientRect(), h = r.height;
    // the glyph box without the line box's air, less 0.8 px a side
    return { t, r: { left: r.left + 0.8, right: r.right - 0.8, top: r.top + h * 0.18 + 0.8, bottom: r.bottom - h * 0.16 - 0.8 } };
  });
  const pt = (el, x, y) => { const s = svg.createSVGPoint(); s.x = x; s.y = y; const q = s.matrixTransform(el.getScreenCTM()); return [q.x, q.y]; };
  const marks = [];
  for (const el of svg.querySelectorAll('line, path, polyline')) {
    if (!visible(el) || el.closest('.fig-plate, [data-audit="skip"]')) continue;
    if (el.tagName === 'line') {
      marks.push({ el, segs: [[pt(el, +el.getAttribute('x1'), +el.getAttribute('y1')), pt(el, +el.getAttribute('x2'), +el.getAttribute('y2'))]] });
      continue;
    }
    let len = 0;
    try { len = el.getTotalLength(); } catch { len = 0; }
    if (!len) continue;
    const n = Math.max(2, Math.min(80, Math.ceil(len / 4)));
    const pts = [];
    for (let i = 0; i <= n; i++) { const q = el.getPointAtLength((len * i) / n); pts.push(pt(el, q.x, q.y)); }
    const segs = [];
    for (let i = 1; i < pts.length; i++) segs.push([pts[i - 1], pts[i]]);
    marks.push({ el, segs });
  }
  for (const m of marks) out.segments += m.segs.length;
  const seen = new Set();
  for (const a of rects) for (const m of marks) {
    if (!m.segs.some((s) => segHitsRect(s[0][0], s[0][1], s[1][0], s[1][1], a.r))) continue;
    const key = `${a.t.textContent.trim()}|${m.el.tagName}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.problems.push(`${m.el.tagName} through "${a.t.textContent.trim().slice(0, 40)}"`);
  }
  out.smallest = +out.smallest.toFixed(2);
  return out;
}

// ---------------------------------------------------------------------------
// The page
// ---------------------------------------------------------------------------
async function main() {
  const root = document.documentElement;
  const MODE = root.dataset.held;                     // 'held' | 'pinned'
  const q = new URLSearchParams(location.search);
  const num = (k, d) => { const v = Number(q.get(k)); return q.get(k) !== null && Number.isFinite(v) ? v : d; };
  const O = { lead: num('lead', DEFAULTS.lead), band: num('band', DEFAULTS.band), rest: num('rest', DEFAULTS.rest) };

  try { await Promise.all(['italic 16px "Newsreader"', '16px "Libre Franklin"', '600 16px "Libre Franklin"', '14px "JetBrains Mono"'].map((f) => document.fonts.load(f))); } catch { /* fallbacks */ }
  const mod = await import('./film.js');
  const data = await (await fetch('../data/film.json')).json();
  const NOTES = mod.notes(data);
  const DUR = mod.durations.large;
  const ASPECT = mod.aspectFor ? mod.aspectFor({ notes: false }) : mod.aspect;
  const css = (name) => getComputedStyle(root).getPropertyValue(name).trim();

  // copied from lib/article.js (2d): how a scene is laid out
  const MODES = {
    side: matchMedia('(min-width: 1000px) and (min-height: 560px), (min-width: 640px) and (min-height: 450px) and (max-height: 559.98px)'),     // figure pinned beside the passages
    top: matchMedia('(max-width: 999.98px) and (min-height: 560px)'),    // figure pinned above them
  };                                                                     // neither: a sequence of stills
  const sceneMode = () => (MODES.side.matches ? 'side' : MODES.top.matches ? 'top' : 'seq');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = matchMedia('(pointer: coarse)');

  const probe = document.querySelector('.svh-probe');
  const block = document.getElementById('film-block');
  const stage = block.querySelector('.held-stage, .scene-stage');
  const figBox = block.querySelector('.held-fig, .scene-stage .fig');
  const stillsBox = document.querySelector('.held-stills');
  let frame = block.querySelector('.fig-frame');

  // the kicker: which page, which parameters
  const kick = document.querySelector('.lab-kicker');
  if (kick) {
    const other = MODE === 'held' ? `<a href="./_pinned.html">pinned</a>` : `<a href="./_held.html">held</a>`;
    kick.innerHTML = MODE === 'held'
      ? `Lab · held scene · band ${O.band} · rest ${O.rest} (at least as in a 900 px window) · compare ${other}`
      : `Lab · pinned scene (the engine's rules) · compare ${other}`;
  }

  // the notes as page text: in the held block a list, on the pinned page the passages
  const noteEls = [];
  if (MODE === 'held') {
    const ol = block.querySelector('.held-notes');
    NOTES.forEach((s, i) => {
      const li = document.createElement('li');
      li.textContent = s;
      ol.append(li); noteEls.push(li);
    });
  } else {
    const text = block.querySelector('.scene-text');
    NOTES.forEach((s, i) => {
      const d = document.createElement('div');
      d.className = 'passage'; d.dataset.step = String(i);
      d.innerHTML = `<p class="note">${s}</p>`;
      text.append(d); noteEls.push(d);
    });
  }

  // ---- state and log --------------------------------------------------------
  const G = { mode: 'seq', svh: 0, top: 0, T: [], end: 0, start: 0, stop: 0, exiting: false, why: '', figW: 0, layout: '' };
  const p = newPlayer();
  const words = NOTES.map((s) => (s.match(/[\p{L}\p{N}]+/gu) || []).length);
  const TIMES = engineTimes(DUR, words);
  let handle = null, raf = 0, last = 0, pending = 0;
  let L = null;
  let focusAt = -1e9;
  const now = () => performance.now();
  function reset() {
    L = { t0: now(), steps: NOTES.map(() => ({ trig: null, start: null, done: null, set: null, cut: null, share: null, capped: false, fast: false })), goals: [], back: [], exit: null };
  }
  reset();

  const share = () => {
    const r = frame.getBoundingClientRect();
    if (!r.height) return 0;
    return Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0)) / r.height;
  };
  function track(prev, next, how, fast = false) {
    const t = now() - L.t0;
    if (next > prev) {
      for (let i = 0; i < NOTES.length; i++) {
        const s = L.steps[i];
        if (how === 'play') {
          if (prev <= i && next > i && s.start === null) s.start = t;
          if (G.exiting && next > i && prev < i + 1) s.capped = true;
          if (fast && next > i && prev < i + 1) s.fast = true;
          if (next >= i + 1 && prev < i + 1 && s.done === null) { s.done = t; s.share = +share().toFixed(2); }
        } else if (next >= i + 1 && prev < i + 1 && s.done === null) {
          if (s.start === null) { s.set = how; s.start = t; } else s.cut = how;
          s.done = t; s.share = +share().toFixed(2);
        }
      }
    } else if (next < prev) {
      for (let i = 0; i < NOTES.length; i++) if (prev > i && next <= i) L.back.push({ i, t, how });
    }
  }

  // ---- drawing --------------------------------------------------------------
  function mountFig(layout) {
    if (handle && G.layout === layout) return;
    const fresh = document.createElement('div');
    fresh.className = 'fig-frame';
    frame.replaceWith(fresh);
    frame = fresh;
    G.layout = layout;
    handle = mod.default(frame, { layout, print: false, reduced: false, data, css, notes: false });
  }
  function draw() {
    if (!handle) return;
    const [i, t] = stateOf(p.pos, NOTES.length);
    handle.set(i, t);
    const active = p.pos <= 0 ? -1 : Math.min(NOTES.length - 1, Math.ceil(p.pos) - 1);
    noteEls.forEach((el, k) => {
      el.classList.toggle('is-on', k <= active);
      el.classList.toggle('is-current', k === active);
      if (MODE === 'pinned') el.classList.toggle('is-read', k < active);
    });
  }

  // the stills: the five states one after another, each with its note
  let stillsAt = 0;
  function mountStills() {
    stillsBox.hidden = false;
    const w = stillsBox.getBoundingClientRect().width;
    if (stillsAt && Math.abs(stillsAt - w) < 2) return;
    stillsAt = w;
    stillsBox.replaceChildren();
    const layout = w >= 640 ? 'wide' : 'tall';
    const fw = layout === 'wide' ? Math.min(w, 940) : Math.min(w, 432);
    NOTES.forEach((s, k) => {
      const fig = document.createElement('figure');
      fig.className = 'held-still';
      fig.innerHTML = `<p class="held-still-note"></p><div class="fig-frame"></div>`;
      fig.querySelector('.held-still-note').textContent = s;
      stillsBox.append(fig);
      const f = fig.querySelector('.fig-frame');
      f.style.width = `${fw}px`;
      f.style.aspectRatio = String(ASPECT[layout]);
      mod.default(f, { layout, print: false, reduced: true, data, css, notes: false }).set(k, 1);
    });
  }

  // ---- layout (load and real resizes, never while scrolling) -----------------
  function fitHeld(mode) {
    block.className = `held is-${mode}`;
    const text = block.querySelector('.held-text');
    if (mode === 'side') {
      const ar = ASPECT.wide;
      const col = figBox.getBoundingClientRect().width;
      const w = Math.floor(Math.min(col, (G.svh - 64) * ar));
      const textH = text.getBoundingClientRect().height;
      G.figW = w;
      if (w < 690) { G.why = `figure ${w} px wide beside the passage, under 690`; return false; }
      if (textH > G.svh - 32) { G.why = `passage and notes ${Math.round(textH)} px, over the window`; return false; }
      block.style.setProperty('--fig-w', `${w}px`);
      block.style.setProperty('--fig-ar', String(ar));
      return 'wide';
    }
    const ar = ASPECT.tall;
    const room = stage.getBoundingClientRect().width - 24;
    const textH = text.getBoundingClientRect().height;
    const w = Math.floor(Math.min(room, 432, ((G.svh - textH - 40) * ar)));
    G.figW = w;
    if (w < 313) { G.why = `figure ${w} px wide under the passage, under 313`; return false; }
    block.style.setProperty('--fig-w', `${w}px`);
    block.style.setProperty('--fig-ar', String(ar));
    return 'tall';
  }
  function fitPinned(mode) {
    block.classList.toggle('is-seq', mode === 'seq');
    const st = block.style;
    const text = block.querySelector('.scene-text');
    ['--stage-top', '--pitch'].forEach((k) => st.removeProperty(k));
    text.style.paddingTop = ''; text.style.paddingBottom = '';
    if (mode === 'side') {
      const ar = ASPECT.wide;
      const col = stage.getBoundingClientRect().width;
      const w = Math.floor(Math.min(col, (G.svh - 32) * ar));
      G.figW = w;
      st.setProperty('--fig-w', `${w}px`); st.setProperty('--fig-ar', String(ar));
      const stageH = w / ar;
      const top = Math.max(16, (G.svh - stageH) / 2);
      st.setProperty('--stage-top', `${Math.round(top)}px`);
      // as sizeScenes(): the first passage reaches the reading line once the
      // figure stands whole, and the scene runs on after the last passage
      const whole = Math.max(top, G.svh - stageH - 8);
      const settled = G.svh < 560 ? whole : (top + whole) / 2;
      text.style.paddingTop = `${Math.round(Math.max(0, G.svh * 0.5 - settled))}px`;
      const lastH = noteEls[noteEls.length - 1].getBoundingClientRect().height;
      text.style.paddingBottom = `${Math.round(Math.max(0, top + stageH + G.svh * 0.36 - G.svh * 0.5 - lastH))}px`;
      G.stageTop = top; G.stageH = stageH;
      return 'wide';
    }
    // on top: the tall drawing in at most 45% of the window, lettering 11.5 px
    // (the engine measures the drawing cut to its content; this uses its frame)
    const ar = ASPECT.tall;
    const room = innerWidth - 24;
    const w = Math.floor(Math.min(room, 432, 0.45 * G.svh * ar));
    G.figW = w;
    if (w < 313) { G.why = `figure ${w} px wide in 45% of the window, under 313`; return false; }
    st.setProperty('--fig-w', `${w}px`); st.setProperty('--fig-ar', String(ar));
    const stageH = stage.getBoundingClientRect().height;
    const band = G.svh - stageH;
    const rem = parseFloat(getComputedStyle(root).fontSize);
    const pitch = Math.round(Math.min(G.svh * 0.38, 22 * rem, Math.max(170, G.svh * 0.26, band * 0.6)));
    st.setProperty('--pitch', `${pitch}px`);
    G.stageTop = 0; G.stageH = stageH; G.pitch = pitch;
    return 'tall';
  }

  function layout() {
    G.svh = probe.getBoundingClientRect().height;
    G.why = '';
    G.B = bands(G.svh, O);
    if (MODE === 'held') block.style.setProperty('--hold-px', `${Math.round(G.B.hold)}px`);
    let mode = sceneMode();
    if (reduced.matches) { mode = 'seq'; G.why = 'reduced motion'; }
    if (q.get('stills') === '1') { mode = 'seq'; G.why = 'stills=1'; }
    if (mode === 'seq' && !G.why) G.why = 'MODES: stills on this window';
    let kind = mode === 'seq' ? false : MODE === 'held' ? fitHeld(mode) : fitPinned(mode);
    if (!kind) mode = 'seq';
    G.mode = mode;
    if (MODE === 'held') block.className = `held is-${mode}`; else { block.classList.toggle('is-seq', mode === 'seq'); block.classList.toggle('is-side', mode === 'side'); block.classList.toggle('is-top', mode === 'top'); }
    if (mode === 'seq') {
      if (MODE === 'pinned') { const t = block.querySelector('.scene-text'); t.style.paddingTop = ''; t.style.paddingBottom = ''; }
      mountStills();
      p.pos = p.goal = NOTES.length;
    } else {
      stillsBox.hidden = true;
      mountFig(kind);
    }
    G.top = block.getBoundingClientRect().top + scrollY;
    if (MODE === 'held') {
      G.T = triggers(G.top, G.svh, O);
      G.end = G.top + G.B.hold;
      G.start = G.T[0] - 0.3 * G.svh;
      G.stop = G.end + 0.6 * G.svh;
    } else {
      // the trigger of passage k, in scroll px: its top passes the trigger line
      const line = mode === 'top' ? G.stageH + 0.2 * (G.svh - G.stageH) + 0.4 * (G.pitch || 0) : ENTRY * G.svh;
      G.line = line;
      G.T = noteEls.map((el) => el.getBoundingClientRect().top + scrollY - line);
      const bottom = block.getBoundingClientRect().bottom + scrollY;
      G.end = bottom - (G.stageTop + G.stageH);           // the figure is let go
      G.start = G.top - 0.9 * G.svh;
      G.stop = G.end + 0.3 * G.svh;
    }
  }

  // ---- scroll -> goal -> play -----------------------------------------------
  function goalNow(y) {
    if (MODE === 'held') return goalAt(y, p.goal, G.T);
    // the engine: the passages whose top passed the line; before the first,
    // step 0 once 40% of the figure is in view
    let k = 0;
    while (k < G.T.length && y >= G.T[k]) k++;
    if (k === 0 && share() >= 0.4) k = 1;
    return k;
  }
  function update(jump = false) {
    if (G.mode === 'seq' || frozen) return;
    // a scroll that follows a focus move (Tab, Shift+Tab into or over the
    // block) is a jump: the figure is set, never played back or forth
    if (now() - focusAt < 600) jump = true;
    const y = scrollY;
    const was = G.exiting;
    G.exiting = y > G.end;
    if (G.exiting && !was && L) {
      const inflight = p.pos % 1 !== 0 && p.goal > p.pos ? Math.floor(p.pos) : null;
      L.exit = { t: now() - L.t0, y: Math.round(y), pos: +p.pos.toFixed(3), goal: p.goal, inflight, queued: Math.max(0, p.goal - Math.ceil(p.pos)) };
    }
    const goal = goalNow(y);
    if (goal !== p.goal) {
      L.goals.push({ t: now() - L.t0, y: Math.round(y), from: p.goal, to: goal });
      for (let i = p.goal; i < goal; i++) if (L.steps[i].trig === null) L.steps[i].trig = now() - L.t0;
    }
    const sh = share();
    const reason = jump ? 'jump' : sh < IN_VIEW ? 'offscreen' : false;
    const prev = p.pos;
    const how = MODE === 'held' ? aimHeld(p, goal, reason) : aimPinned(p, goal, reason);
    if (how) track(prev, p.pos, how);
    if (p.pos !== p.goal && !raf) { last = 0; raf = requestAnimationFrame(frameLoop); }
    root.dataset.moving = p.pos !== p.goal ? '1' : '';
    draw();
  }
  function frameLoop(t) {
    const dt = last ? Math.min(0.1, (t - last) / 1000) : 1 / 60;
    last = t;
    const prev = p.pos, fast = !!p.fast;
    const how = MODE === 'held' ? stepHeld(p, dt, DUR, G.exiting) : stepPinned(p, dt, TIMES);
    track(prev, p.pos, how || 'play', fast);
    draw();
    raf = p.pos !== p.goal ? requestAnimationFrame(frameLoop) : 0;
    root.dataset.moving = raf ? '1' : '';
  }
  addEventListener('scroll', () => {
    if (pending) return;
    pending = requestAnimationFrame(() => { pending = 0; update(false); });
  }, { passive: true });

  // a height-only change under 150 px on a touch screen is the address bar:
  // nothing is laid out again; otherwise wait for calm and keep the place
  let w0 = innerWidth, h0 = innerHeight, rt = 0;
  addEventListener('resize', () => {
    if (innerWidth === w0 && Math.abs(innerHeight - h0) < 150 && coarse.matches) return;
    clearTimeout(rt);
    rt = setTimeout(() => {
      w0 = innerWidth; h0 = innerHeight;
      const span = Math.max(1, G.end - G.top);
      const f = G.mode !== 'seq' && scrollY >= G.start && scrollY <= G.stop ? (scrollY - G.top) / span : null;
      layout();
      if (f !== null) scrollTo(0, G.top + f * Math.max(1, G.end - G.top));
      update(true);
    }, 200);
  });
  addEventListener('pageshow', (e) => { if (e.persisted) update(true); });
  addEventListener('focusin', () => { focusAt = now(); update(true); }, true);
  addEventListener('hashchange', () => update(true));
  document.querySelector('.held-skip')?.addEventListener('click', () => setTimeout(() => update(true), 0));
  reduced.addEventListener?.('change', () => { layout(); update(true); });

  // ?freeze=<step>:<t>
  let frozen = false;
  layout();
  if (q.get('freeze')) {
    const [s, t] = q.get('freeze').split(':').map(Number);
    frozen = true;
    p.pos = p.goal = s + (Number.isFinite(t) ? t : 1);
    if (handle) { handle.set(s, Number.isFinite(t) ? t : 1); }
  } else update(true);

  window.__held = {
    mode: MODE, O, G, p, NOTES, DUR, TIMES, goalAt, triggers,
    get log() { return L; },
    reset() { reset(); },
    update(jump) { update(!!jump); },
    share,
    finish() { if (raf) cancelAnimationFrame(raf); raf = 0; p.pos = p.goal; p.i = -1; draw(); root.dataset.moving = ''; },
    audit(minPx) {
      const boxes = G.mode === 'seq' ? [...stillsBox.querySelectorAll('.fig-frame')] : [frame];
      return boxes.map((f) => auditSvg(f.querySelector('svg'), minPx));
    },
    relayout() { layout(); update(true); },
    ready: true,
  };
}

if (typeof document !== 'undefined' && document.documentElement.dataset.held) {
  main().catch((err) => {
    window.__held = { ready: true, error: String((err && err.stack) || err) };
    const pre = document.createElement('pre');
    pre.textContent = String((err && err.stack) || err);
    document.body.prepend(pre);
  });
}
