// Review harness: mounts any figure at any state, as the page shell would.
//
//   _lab.html                                   index of all states
//   _lab.html?fig=path&step=6&t=1&layout=wide&print=0
//   _lab.html?fig=path&sheet=1&layout=wide      every step at t = 1 on one sheet
//   further: w=<px> width of the frame, reduced=0|1 (default 1: stills),
//            cols=<n> columns of a sheet, nocss=1 (figure falls back to its
//            own colours), audit=0 to hide the checks
//
// Frame widths follow lib/article.css: scenes about 708 px beside the text
// at 1440, wide figures up to 928, column figures 552, phones 355, the
// margin scene 224 (184 as a still on phones, 44 mm in print), print 180 mm
// across both columns and 86.5 mm in one.

const FIGS = {
  numbers:   { role: 'scene',  steps: 5 },
  pairs:     { role: 'wide',   steps: 1 },
  obstacles: { role: 'scene',  steps: 2 },
  path:      { role: 'scene',  steps: 9 },
  exits:     { role: 'scene',  steps: 3 },
  attitudes: { role: 'scene',  steps: 3 },
  house:     { role: 'margin', steps: 6 },
  'walls': { role: 'scene', steps: 3 },
  'permits': { role: 'scene', steps: 3 },
  'roadmap': { role: 'wide', steps: 3 },
  'terms': { role: 'scene', steps: 2 },
  'repaint': { role: 'scene', steps: 2 },
  'plan': { role: 'scene', steps: 8 },
};
const MM = 96 / 25.4;

const q = new URLSearchParams(location.search);
const lab = document.getElementById('lab');
const auditEl = document.getElementById('audit');

function frameWidth(id, layout, print) {
  if (q.get('w')) return Number(q.get('w'));
  const role = FIGS[id].role;
  if (role === 'margin') return print ? Math.round(44 * MM) : layout === 'wide' ? 224 : 184;
  if (print) return Math.round((role === 'column' ? 86.5 : 180) * MM);
  if (layout === 'tall') return 355;
  return role === 'scene' ? 708 : role === 'wide' ? 928 : 552;
}

// What the shell passes: margin scenes are always 'tall'; in print a column
// figure is 'tall', scenes and wide figures are 'wide'.
function shellLayout(id, layout, print) {
  const role = FIGS[id].role;
  if (role === 'margin') return 'tall';
  if (print) return role === 'column' ? 'tall' : 'wide';
  return layout;
}

const css = (name) => (q.get('nocss') === '1' ? '' : getComputedStyle(document.documentElement).getPropertyValue(name).trim());

async function mountOne(parent, id, step, t, layout, print, title) {
  const mod = await import(`./${id}.js`);
  let data = null;
  try { data = await (await fetch(`../data/${id}.json`)).json(); } catch { data = null; }
  const lay = shellLayout(id, layout, print);
  const cell = document.createElement('div');
  cell.className = 'cell';
  const w = frameWidth(id, lay, print);
  cell.style.width = `${w}px`;
  if (title) { const hd = document.createElement('h2'); hd.textContent = title; cell.append(hd); }
  const frame = document.createElement('div');
  frame.className = 'frame';
  frame.style.aspectRatio = String(mod.aspect?.[lay] || (lay === 'tall' ? 0.8 : 1.6));
  cell.append(frame);
  parent.append(cell);
  const margin = FIGS[id].role === 'margin';
  const ctx = {
    layout: lay, print: print && !margin,
    reduced: q.get('reduced') !== '0' || print, data, css,
  };
  const handle = mod.default(frame, ctx);
  const s = print && !margin ? mod.steps - 1 : step;
  handle.set(s, print && !margin ? 1 : t);
  return { frame, id, step: s, print, handle, steps: mod.steps };
}

// --- checks: smallest lettering, lettering on lettering, lettering on marks
function visible(el) {
  for (let n = el; n && n.nodeType === 1 && n.tagName !== 'svg'; n = n.parentNode) {
    const st = n.style;
    if (st && (st.display === 'none' || st.visibility === 'hidden' || st.opacity === '0')) return false;
    const op = n.getAttribute('opacity');
    if (op !== null && Number(op) === 0) return false;
  }
  return true;
}
const inter = (a, b, pad = 0) => a.left < b.right - pad && b.left < a.right - pad && a.top < b.bottom - pad && b.top < a.bottom - pad;
function segHitsRect(x1, y1, x2, y2, r) {
  let t0 = 0, t1 = 1;
  const dx = x2 - x1, dy = y2 - y1;
  const p = [-dx, dx, -dy, dy], qq = [x1 - r.left, r.right - x1, y1 - r.top, r.bottom - y1];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) { if (qq[i] < 0) return false; } else {
      const t = qq[i] / p[i];
      if (p[i] < 0) { if (t > t1) return false; if (t > t0) t0 = t; }
      else { if (t < t0) return false; if (t < t1) t1 = t; }
    }
  }
  return true;
}
const shrink = (r, d) => ({ left: r.left + d, right: r.right - d, top: r.top + d, bottom: r.bottom - d });

function audit(m) {
  const svg = m.frame.querySelector('svg');
  const out = { id: m.id, step: m.step, problems: [] };
  if (!svg) { out.problems.push('no svg'); return out; }
  const box = svg.getBoundingClientRect();
  const vb = svg.viewBox.baseVal;
  const scale = box.width / vb.width;
  const minPx = m.print ? 6.5 * 96 / 72 : 11;
  const texts = [...svg.querySelectorAll('text')].filter((t) => visible(t) && t.textContent.trim() && !t.closest('[data-audit="skip"]'));
  let smallest = Infinity;
  const rects = texts.map((t) => {
    let fs = Infinity;
    for (const n of [t, ...t.querySelectorAll('tspan')]) {
      const v = parseFloat(n.getAttribute('font-size'));
      // a mono run inside a serif note is set smaller on purpose to match its x-height
      if (v && !(n.tagName === 'tspan' && n !== t)) fs = Math.min(fs, v);
    }
    if (fs * scale < smallest) smallest = fs * scale;
    if (fs * scale < minPx - 0.05) out.problems.push(`small text ${(fs * scale).toFixed(1)}px: "${t.textContent.trim().slice(0, 40)}"`);
    const r = t.getBoundingClientRect();
    // the glyph box without the generous line box above and below
    const hgt = r.height;
    return { t, r: { left: r.left, right: r.right, top: r.top + hgt * 0.18, bottom: r.bottom - hgt * 0.16 } };
  });
  out.smallest = +smallest.toFixed(2);
  out.scale = +scale.toFixed(3);
  if (svg.dataset.contentH) out.problems.push(`content height ${svg.dataset.contentH} of ${vb.height}`);
  for (const a of rects) {
    if (a.r.left < box.left - 0.5 || a.r.right > box.right + 0.5 || a.r.top < box.top - 0.5 || a.r.bottom > box.bottom + 0.5) {
      out.problems.push(`text outside the frame: "${a.t.textContent.trim().slice(0, 40)}"`);
    }
  }
  for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
    const a = rects[i], b = rects[j];
    if (a.t.parentNode === b.t.parentNode) {            // lines of one block may sit close
      if (inter(shrink(a.r, 1.5), shrink(b.r, 1.5))) out.problems.push(`lines of one text overlap: "${a.t.textContent.trim().slice(0, 30)}"`);
      continue;
    }
    if (inter(a.r, b.r, 0.5)) out.problems.push(`text on text: "${a.t.textContent.trim().slice(0, 30)}" / "${b.t.textContent.trim().slice(0, 30)}"`);
  }
  // marks: circles, straight lines, rects that are not fields, leader paths
  const marks = [];
  const ctmPt = (el, x, y) => { const pt = svg.createSVGPoint(); pt.x = x; pt.y = y; const p = pt.matrixTransform(el.getScreenCTM()); return [p.x, p.y]; };
  for (const el of svg.querySelectorAll('circle, line, rect, path, polyline')) {
    if (!visible(el) || el.closest('.fig-plate, .fig-ring, [data-audit="skip"]')) continue;
    const tag = el.tagName;
    if (tag === 'circle') { marks.push({ el, kind: 'dot', r: el.getBoundingClientRect() }); continue; }
    if (tag === 'rect') { marks.push({ el, kind: 'rect', r: el.getBoundingClientRect() }); continue; }
    if (tag === 'line') {
      const a = ctmPt(el, +el.getAttribute('x1'), +el.getAttribute('y1')), b = ctmPt(el, +el.getAttribute('x2'), +el.getAttribute('y2'));
      marks.push({ el, kind: 'line', segs: [[a, b]] });
      continue;
    }
    // paths: sample along the length
    let len = 0;
    try { len = el.getTotalLength(); } catch { len = 0; }
    if (!len) continue;
    const n = Math.max(2, Math.min(60, Math.ceil(len / 6)));
    const pts = [];
    for (let i = 0; i <= n; i++) { const p = el.getPointAtLength((len * i) / n); pts.push(ctmPt(el, p.x, p.y)); }
    const segs = [];
    for (let i = 1; i < pts.length; i++) segs.push([pts[i - 1], pts[i]]);
    marks.push({ el, kind: 'path', segs });
  }
  const seen = new Set();
  for (const a of rects) {
    const r = shrink(a.r, 0.8);
    for (const m2 of marks) {
      let hit = false;
      if (m2.r) hit = inter(r, m2.r, 0.3);
      else hit = m2.segs.some((s) => segHitsRect(s[0][0], s[0][1], s[1][0], s[1][1], r));
      if (!hit) continue;
      const key = `${a.t.textContent.trim().slice(0, 30)}|${m2.kind}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.problems.push(`text on ${m2.kind}${m2.el.closest('.fig-leader') ? ' (leader)' : ''}: "${a.t.textContent.trim().slice(0, 40)}"`);
    }
  }
  // leaders crossing each other
  const leaders = marks.filter((m2) => m2.segs && m2.el.closest('.fig-leader'));
  const cross = (s, u) => {
    const d = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const d1 = d(u[0], u[1], s[0]), d2 = d(u[0], u[1], s[1]), d3 = d(s[0], s[1], u[0]), d4 = d(s[0], s[1], u[1]);
    return d1 * d2 < 0 && d3 * d4 < 0;
  };
  for (let i = 0; i < leaders.length; i++) for (let j = i + 1; j < leaders.length; j++) {
    if (leaders[i].segs.some((s) => leaders[j].segs.some((u) => cross(s, u)))) out.problems.push('two leaders cross');
  }
  if (!svg.getAttribute('aria-label') || svg.getAttribute('role') !== 'img') out.problems.push('no role/aria-label');
  return out;
}

function index() {
  const nav = document.createElement('nav');
  for (const [id, f] of Object.entries(FIGS)) {
    const hd = document.createElement('h2'); hd.textContent = id; nav.append(hd);
    for (const layout of ['wide', 'tall']) {
      const a = document.createElement('a');
      a.href = `?fig=${id}&sheet=1&layout=${layout}`; a.textContent = `${layout} sheet`; nav.append(a);
      for (let s = 0; s < f.steps; s++) {
        const b = document.createElement('a');
        b.href = `?fig=${id}&step=${s}&t=1&layout=${layout}&print=0`; b.textContent = `${layout} ${s}`; nav.append(b);
      }
      nav.append(document.createElement('br'));
    }
    const p = document.createElement('a'); p.href = `?fig=${id}&step=0&t=1&layout=wide&print=1`; p.textContent = 'print'; nav.append(p);
    if (f.role === 'margin') { const s = document.createElement('a'); s.href = `?fig=${id}&sheet=1&print=1`; s.textContent = 'print sheet'; nav.append(s); }
  }
  lab.replaceWith(nav);
}

async function main() {
  const id = q.get('fig');
  if (!id || !FIGS[id]) { index(); window.__lab = { ready: true, audits: [] }; return; }
  try { await Promise.all(['italic 14px "Newsreader"', 'italic 600 14px "Newsreader"', '14px "Libre Franklin"', '500 14px "Libre Franklin"', '600 14px "Libre Franklin"', '14px "JetBrains Mono"', '500 14px "JetBrains Mono"'].map((f) => document.fonts.load(f))); } catch { /* fallbacks */ }
  const layout = q.get('layout') === 'tall' ? 'tall' : 'wide';
  const print = q.get('print') === '1';
  document.documentElement.classList.toggle('is-print', print);
  const mounts = [];
  if (q.get('sheet') === '1') {
    const sheet = document.createElement('div');
    sheet.className = 'sheet';
    const cols = Number(q.get('cols')) || (layout === 'tall' || FIGS[id].role === 'margin' ? 3 : 2);
    sheet.style.gridTemplateColumns = `repeat(${cols}, max-content)`;
    lab.append(sheet);
    const ts = (q.get('ts') || '1').split(',').map(Number);
    for (let s = 0; s < FIGS[id].steps; s++) for (const t of ts) {
      mounts.push(await mountOne(sheet, id, s, t, layout, print, `${id} · ${shellLayout(id, layout, print)}${print ? ' · print' : ''} · step ${s} · t ${t}`));
    }
  } else {
    const step = Number(q.get('step') || 0), t = q.get('t') === null ? 1 : Number(q.get('t'));
    mounts.push(await mountOne(lab, id, step, t, layout, print, q.get('bare') === '1' ? '' : `${id} · ${shellLayout(id, layout, print)}${print ? ' · print' : ''} · step ${step} · t ${t}`));
  }
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const audits = mounts.map(audit);
  if (q.get('audit') !== '0') {
    auditEl.innerHTML = audits.map((a) => `step ${a.step}: scale ${a.scale}, smallest text ${a.smallest}px`
      + (a.problems.length ? `\n  <b>${a.problems.map((p) => p.replace(/</g, '&lt;')).join('\n  ')}</b>` : ' – no findings')).join('\n');
  }
  window.__lab = { ready: true, audits, mounts };
}

main().catch((err) => { auditEl.textContent = String(err && err.stack || err); window.__lab = { ready: true, error: String(err && err.stack || err), audits: [] }; });
