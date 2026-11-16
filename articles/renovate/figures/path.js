// path: one decision on both sides. Two tracks from the decision to the
// launch flag and on to "taking the saving". A check is a short bar across
// the track with a gap: in Germany the checks stand before the flag, in the
// United States the same kind of bar stands after it. The axis is the order
// of steps, not time.
//
// wide: tracks run left to right, every label stays once it has arrived.
// tall: tracks run top to bottom; a phone has no room for all labels at
// once, so the notes of a step leave when the next step begins and only the
// short ones stay. Travelling dots exist only as idle motion on screen; no
// still, no reduced-motion state and no print shows them.
import {
  mountFigure, svgRoot, colors, g, line, circle, rect, path, text, textSize,
  leader, bracket, penRing, stage, idle, rng, span, ease, clamp, lerp,
} from '../../../lib/fig.js';

export const steps = 9;
const SIZE = { wide: [800, 600], tall: [360, 478] };
export const aspect = { wide: SIZE.wide[0] / SIZE.wide[1], tall: SIZE.tall[0] / SIZE.tall[1] };

function build(el, ctx) {
  const C = colors(ctx), d = ctx.data, tall = ctx.layout === 'tall';
  const [W, H] = SIZE[tall ? 'tall' : 'wide'];
  const top = tall ? 52 : 24;
  const outer = svgRoot(el, W, H, d.reading);
  outer.style.color = C.ink;
  const st = stage();
  const hl = g(outer);
  const hlt = text(hl, tall ? 14 : 16, tall ? 14 : 17, d.headline, { family: 'sans', size: tall ? 12.5 : 13.5, weight: 600, width: W - 28, lh: 15 });
  if (tall) text(hl, 14, Math.min(hlt.bottom + 13, 46), d.axis.tall, { family: 'mono', size: 11.5, fill: C.muted });
  st.fade(hl, 0, 0.1);
  const svg = g(outer, { transform: `translate(0 ${top})` });

  // a: position along a track, c: the track's place across the drawing
  const P = tall ? (a, c) => [c, a] : (a, c) => [a, c];
  const seg = (parent, a0, a1, c, attrs) => { const p = P(a0, c), q = P(a1, c); return line(parent, p[0], p[1], q[0], q[1], attrs); };
  const cross = (parent, a, c0, c1, attrs) => { const p = P(a, c0), q = P(a, c1); return line(parent, p[0], p[1], q[0], q[1], attrs); };
  const ink = { stroke: C.ink, 'stroke-width': 1.25, 'stroke-linecap': 'round' };
  const data = { stroke: C.ink, 'stroke-width': 2.25, 'stroke-linecap': 'round' };

  const G = tall
    ? { us: 34, de: 190, a0: 46, gates: [76, 110, 144, 174], ticks: [188, 4], flag: 224, marks: [250, 268, 286], open: 304, usEnd: 314, branch: 242, shut: 288, slot: 110, hb: 13, gap: 4.5, r: 2.3, note: 12.5, holder: 12, basis: 11, name: 12.5 }
    : { us: 132, de: 372, a0: 64, gates: [160, 272, 384, 462], ticks: [492, 8], flag: 572, marks: [656, 690, 724], open: 768, usEnd: 782, branch: 650, shut: 722, slot: 272, hb: 20, gap: 5.5, r: 2.7, note: 14, holder: 13, basis: 12, name: 13.5 };
  const N = { italic: true, size: G.note };
  const gone = (s) => (tall ? [s + 1.0, s + 1.12] : undefined);     // tall: a step's notes leave with the step
  const fadeT = (elm, a, b, s) => st.fade(elm, a, b, gone(s));
  // tall: the notes of a step stand in one block under the drawing, at full
  // width, so that they wrap freely on the narrowest phone
  const ZY = 330, zones = {};
  const zput = (s, str, o = {}) => {
    const z = zones[s] || (zones[s] = { g: g(svg), y: ZY });
    const t = text(z.g, 14, z.y + 11, str, { italic: true, size: G.note, width: W - 28, ...o });
    z.y = t.bottom + 6;
    return t;
  };
  const pin = (s, a, c) => { const p = P(a, c); const m = circle(svg, p[0], p[1], 3, { fill: C.accent }); fadeT(m, s + 0.4, s + 0.6, s); };
  // a check: the same bar with a gap on either track
  const gate = (parent, a, c) => {
    cross(parent, a, c - G.hb, c - G.gap, { stroke: C.ink, 'stroke-width': 2.6, 'stroke-linecap': 'butt' });
    cross(parent, a, c + G.gap, c + G.hb, { stroke: C.ink, 'stroke-width': 2.6, 'stroke-linecap': 'butt' });
  };

  // --- the one field: the gated stretch of the German track ---------------
  const f0 = G.gates[0] - 9, fEnd = G.flag - 7;
  const fld = tall
    ? rect(svg, G.de - G.hb, f0, G.hb * 2, 1, { fill: C.field, 'data-audit': 'skip' })
    : rect(svg, f0, G.de - G.hb, 1, G.hb * 2, { fill: C.field, 'data-audit': 'skip' });
  st.on((gg) => {
    const end = gg < 4.05 ? G.gates[0] + 9 : gg < 5.05 ? lerp(G.gates[0] + 9, G.gates[1] + 9, ease(span(gg, 4.05, 4.3))) : lerp(G.gates[1] + 9, fEnd, ease(span(gg, 5.05, 5.45)));
    fld.setAttribute(tall ? 'height' : 'width', Math.max(1, end - f0).toFixed(1));
    const p = ease(span(gg, 3.2, 3.4));
    fld.style.display = p <= 0.001 ? 'none' : '';
    fld.style.opacity = p >= 0.999 ? '' : p.toFixed(3);
  });

  // --- step 0: both tracks, empty ----------------------------------------
  const guides = g(svg);
  seg(guides, G.a0, G.usEnd, G.us, { stroke: C.hairline, 'stroke-width': 1.25 });
  seg(guides, G.a0, G.shut, G.de, { stroke: C.hairline, 'stroke-width': 1.25 });
  st.fade(guides, 0.04, 0.3);
  const starts = g(svg);
  [G.us, G.de].forEach((c) => { const p = P(G.a0, c); circle(starts, p[0], p[1], tall ? 4.2 : 5, { fill: C.ink }); });
  st.fade(starts, 0.1, 0.3);
  const flags = g(svg);
  [G.us, G.de].forEach((c) => {
    const [x, y] = P(G.flag, c);
    if (tall) {
      path(flags, `M${x} ${y}L${x + 15} ${y}`, ink);
      path(flags, `M${x + 15} ${y - 9}L${x + 15} ${y + 2}`, ink);
      path(flags, `M${x + 15} ${y - 9}L${x + 26} ${y - 5.5}L${x + 15} ${y - 2}Z`, { fill: C.ink, stroke: C.ink, 'stroke-width': 1, 'stroke-linejoin': 'round' });
      text(flags, x + 31, y - 1, d.launch, { family: 'sans', size: G.holder, weight: 500 });
    } else {
      path(flags, `M${x} ${y}L${x} ${y - 36}`, ink);
      path(flags, `M${x} ${y - 36}L${x + 13} ${y - 31.5}L${x} ${y - 27}Z`, { fill: C.ink, stroke: C.ink, 'stroke-width': 1, 'stroke-linejoin': 'round' });
      text(flags, x + 18, y - 26, d.launch, { family: 'sans', size: G.holder, weight: 500 });
    }
  });
  st.fade(flags, 0.5, 0.7);
  const names = g(svg);
  if (tall) {
    text(names, 14, 22, d.tracks.us, { family: 'sans', size: G.name, weight: 600 });
    text(names, G.de - 26, 22, d.tracks.de, { family: 'sans', size: G.name, weight: 600 });
  } else {
    text(names, 74, G.us - 13, d.tracks.us, { family: 'sans', size: G.name, weight: 600 });
    text(names, 74, G.de - 13, d.tracks.de, { family: 'sans', size: G.name, weight: 600 });
  }
  st.fade(names, 0.2, 0.4);
  // the decision: one note, joined to both start dots by a bracket
  const dec = g(svg);
  if (tall) {
    bracket(dec, G.us, 33, G.de, 33, -6, { stroke: C.ink, 'stroke-width': 1 });
    text(dec, (G.us + G.de) / 2, 52, d.decision.note, { ...N, width: 128, anchor: 'middle' });
  } else {
    bracket(dec, 38, G.us, 38, G.de, 17, { stroke: C.ink, 'stroke-width': 1 });
    text(dec, 46, 196, d.decision.note, { ...N, width: 104 });
  }
  fadeT(dec, 0.66, 0.86, 0);
  const axn = g(svg);
  if (!tall) text(axn, W - 10, 568, d.axis.wide, { family: 'mono', size: 12, fill: C.muted, anchor: 'end' });
  st.fade(axn, 0.7, 0.9);

  // --- inked tracks: they draw from the decision outward -----------------
  const usTrack = [seg(svg, G.a0, G.flag, G.us, data), seg(svg, G.flag, G.marks[2] + (tall ? 8 : 14), G.us, data), seg(svg, G.marks[2] + (tall ? 8 : 14), G.usEnd, G.us, data)];
  st.draw(usTrack[0], 1.05, 1.5).draw(usTrack[1], 2.04, 2.28).draw(usTrack[2], 6.05, 6.25);
  const deStops = [G.a0, G.gates[0], G.gates[1], G.flag, G.shut];
  const deTrack = deStops.slice(1).map((b, i) => seg(svg, deStops[i], b, G.de, data));
  st.draw(deTrack[0], 3.05, 3.3).draw(deTrack[1], 4.05, 4.28).draw(deTrack[2], 5.05, 5.45).draw(deTrack[3], 6.3, 6.5);

  // --- step 1: the US run -------------------------------------------------
  const run = g(svg);
  if (tall) {
    bracket(run, 18, G.flag, 18, G.a0, -4, { stroke: C.ink, 'stroke-width': 1 });
    zput(1, d.us.run.note);
  } else {
    bracket(run, G.a0, 88, G.flag, 88, -5, { stroke: C.ink, 'stroke-width': 1 });
    text(run, 190, 56, d.us.run.note, { ...N, width: 380 });
  }
  fadeT(run, 1.5, 1.7, 1);
  const slot = g(svg);
  cross(slot, G.slot, G.us - G.hb + 3, G.us - G.gap, { stroke: C.muted, 'stroke-width': 1, 'stroke-dasharray': '2.5 3' });
  cross(slot, G.slot, G.us + G.gap, G.us + G.hb - 3, { stroke: C.muted, 'stroke-width': 1, 'stroke-dasharray': '2.5 3' });
  { const [x, y] = P(G.slot, G.us); line(slot, x - 9, y + 9, x + 9, y - 9, { stroke: C.muted, 'stroke-width': 1 }); }
  if (tall) text(slot, G.us + 20, G.slot + 4, d.us.slot.note, { ...N, fill: C.muted, width: 124 });
  else text(slot, G.slot, G.us + 37, d.us.slot.note, { ...N, fill: C.muted, anchor: 'middle' });
  fadeT(slot, 1.76, 1.94, 1);

  // --- step 2: the checks after launch, the same bars as in Germany ------
  const mk = d.us.after.marks;
  G.marks.forEach((a, i) => {
    const m = g(svg);
    gate(m, a, G.us);
    st.fade(m, 2.24 + i * 0.1, 2.34 + i * 0.1);
    const lg = g(svg);
    if (tall) {
      zput(2, mk[i].label);
    } else {
      const by = G.us + G.hb + 16 + i * 18;
      text(lg, a - 6, by, mk[i].label, { ...N, anchor: 'end' });
      leader(lg, a, by - 2, a, G.us + G.hb + 3, { stroke: C.muted, dot: false });
    }
    fadeT(lg, 2.3 + i * 0.1, 2.44 + i * 0.1, 2);
  });
  const aft = g(svg), aftL = g(svg);
  if (tall) {
    bracket(aft, 15, G.marks[2] + 8, 15, G.marks[0] - 8, -4, { stroke: C.ink, 'stroke-width': 1 });
    text(aftL, G.us + 19, G.marks[0] + 6, d.us.after.bracket, { family: 'sans', size: G.holder, weight: 500, width: 84, lh: 15 });
  } else {
    bracket(aft, G.marks[0] - 10, G.us - 30, G.marks[2] + 10, G.us - 30, -5, { stroke: C.ink, 'stroke-width': 1 });
    text(aftL, G.marks[0] - 8, G.us - 53, d.us.after.bracket, { family: 'sans', size: G.holder, weight: 500, width: 92, lh: 16 });
  }
  st.fade(aft, 2.62, 2.8).fade(aftL, 2.74, 2.9);

  // --- steps 3 to 5: the German checks before launch ----------------------
  const gateT = [3.3, 4.26, 5.18, 5.34];
  const ticksEnd = G.ticks[0] + (d.de.more.count - 1) * G.ticks[1];
  d.de.gates.forEach((gt, i) => {
    const a = G.gates[i], t0 = gateT[i];
    const gg = g(svg);
    gate(gg, a, G.de);
    st.fade(gg, t0, t0 + 0.14);
    const lg = g(svg);
    if (tall) {
      zput(gt.step, gt.holder, { family: 'sans', italic: false, size: G.holder, weight: 500 });
      zones[gt.step].y -= 4;
      zput(gt.step, gt.basis, { family: 'mono', italic: false, size: G.basis, fill: C.muted });
      if (gt.note) zput(gt.step, gt.note);
      pin(gt.step, a, G.de + G.hb + 8);
    } else {
      const wd = (G.gates[i + 1] || G.flag) - a - 8;
      const o = { family: 'sans', size: G.holder, weight: 500, width: i === 3 ? 96 : wd, lh: 16 };
      const sz = textSize(gt.holder, o);
      const ho = text(lg, a - 1, G.de - G.hb - 7 - (sz.lines - 1) * sz.lh, gt.holder, o);
      text(lg, i === 0 ? a - 5 : a + (i === 1 ? 4 : -1), G.de + G.hb + 19, gt.basis, { family: 'mono', size: G.basis, fill: C.muted, width: 104, lh: 15, anchor: i === 0 ? 'end' : 'start' });
      st.fade(lg, t0 + 0.12, t0 + 0.3);
      if (gt.note) {
        const ng = g(svg);
        const nt = text(ng, a - 1, ho.y - 12, gt.note, N);
        leader(ng, a + 3, nt.bottom + 2, a + 3, ho.y - 2, { stroke: C.muted, dot: false });
        st.fade(ng, 4.7, 4.9);
      }
    }
  });
  const more = g(svg), moreL = g(svg);
  for (let k = 0; k < d.de.more.count; k++) cross(more, G.ticks[0] + k * G.ticks[1], G.de - (tall ? 4.5 : 6), G.de + (tall ? 4.5 : 6), { stroke: C.ink, 'stroke-width': 1.25 });
  st.fade(more, 5.56, 5.74);
  if (tall) {
    zput(5, d.de.more.note);
  } else {
    const t = text(moreL, G.flag + 18, G.de + G.hb + 15, d.de.more.note, { ...N, width: 80 });
    leader(moreL, t.x - 3, t.y + 5, ticksEnd + 3, G.de + 9, { stroke: C.muted, dot: false });
  }
  fadeT(moreL, 5.76, 5.94, 5);
  // the bracket that names them: checks before launch
  const bef = g(svg), befL = g(svg);
  if (tall) {
    const bx0 = G.de - G.hb - 11, gapY = G.gates[1] - 9;
    path(bef, `M${bx0 + 4} ${G.gates[0] - 8}L${bx0} ${G.gates[0] - 8}L${bx0} ${gapY - 7}M${bx0} ${gapY + 7}L${bx0} ${ticksEnd + 4}L${bx0 + 4} ${ticksEnd + 4}`, { stroke: C.ink, 'stroke-width': 1, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    text(befL, bx0 - 6, 146, d.de.before, { family: 'sans', size: G.holder, weight: 500, width: 62, anchor: 'end', lh: 15 });
  } else {
    bracket(bef, G.gates[0] - 9, 240, ticksEnd + 6, 240, -5, { stroke: C.ink, 'stroke-width': 1 });
    text(befL, ticksEnd + 6, 233, d.de.before, { family: 'sans', size: G.holder, weight: 500, anchor: 'end' });
  }
  st.fade(bef, 5.6, 5.8).fade(befL, 5.74, 5.9);

  // --- step 6: taking the saving ------------------------------------------
  const sav = g(svg);
  if (tall) {
    bracket(sav, 354, G.usEnd, 354, G.flag + 8, 4, { stroke: C.muted, 'stroke-width': 1 });
    text(sav, G.de + 20, G.flag + 20, d.saving, { family: 'sans', size: G.holder, weight: 600, fill: C.muted });
  } else {
    const x0 = G.flag + 10, x1 = G.usEnd, y = 226;
    path(sav, `M${x0} ${y - 6}L${x0} ${y + 6}M${x0} ${y}L${x1} ${y}M${x1} ${y - 6}L${x1} ${y + 6}`, { stroke: C.muted, 'stroke-width': 1, 'stroke-linecap': 'round' });
    text(sav, (x0 + x1) / 2, y + 19, d.saving, { family: 'sans', size: G.holder, weight: 600, fill: C.muted, anchor: 'middle' });
  }
  st.fade(sav, 6.04, 6.2);
  const og = g(svg);
  cross(og, G.open, G.us - G.hb, G.us - G.gap - (tall ? 3.5 : 6), { stroke: C.ink, 'stroke-width': 2.6 });
  cross(og, G.open, G.us + G.gap + (tall ? 3.5 : 6), G.us + G.hb, { stroke: C.ink, 'stroke-width': 2.6 });
  st.fade(og, 6.22, 6.36);
  const ex = g(svg);
  if (tall) {
    zput(6, d.us.exit.note);
    pin(6, G.open, G.us + G.hb + 8);
  } else {
    const t = text(ex, 596, 26, d.us.exit.note, { ...N, width: 196 });
    leader(ex, G.open, t.bottom + 3, G.open, G.us - G.hb - 3, { stroke: C.muted, dot: false });
  }
  fadeT(ex, 6.36, 6.56, 6);
  const sg = g(svg);
  cross(sg, G.shut, G.de - G.hb, G.de + G.hb, { stroke: C.accent, 'stroke-width': 3.4, 'stroke-linecap': 'butt' });
  cross(sg, G.shut + (tall ? 4.5 : 5.5), G.de - G.hb, G.de + G.hb, { stroke: C.accent, 'stroke-width': 1.25 });
  st.fade(sg, 6.5, 6.64);
  // the shut gate: its words, then the date on a line of its own, ringed
  const sl = g(svg);
  const so = { family: 'sans', size: G.holder, weight: 500, width: tall ? 138 : 150, lh: tall ? 15 : 16.5 };
  const sz = textSize(d.de.shut.note, so);
  const sy = tall ? G.flag + 39 : G.de - G.hb - 34 - (sz.lines - 1) * sz.lh;
  const sx = tall ? G.de + 20 : 640;
  const sn0 = text(sl, sx, sy, d.de.shut.note, so);
  const dateT = text(sl, sx + 6, sn0.bottom + G.holder + 8, d.de.shut.date, { family: 'mono', size: G.holder, weight: 500 });
  st.fade(sl, 6.6, 6.76);
  const pr = penRing(svg, dateT.cx, dateT.cy - 0.5, dateT.w / 2 + (tall ? 7 : 8), G.holder * 0.5 + (tall ? 3.6 : 4.2), { seed: 17, stroke: C.accent, width: tall ? 1.3 : 1.5 });
  pr.paths.forEach((p, k) => st.draw(p, 6.76 + k * 0.03, 6.94 + k * 0.03));
  const side = tall
    ? path(svg, `M${G.de} ${G.branch}C${G.de} ${G.branch + 14} ${G.de - 8} ${G.branch + 20} ${G.de - 22} ${G.branch + 20}L${G.de - 46} ${G.branch + 20}`, data)
    : path(svg, `M${G.branch} ${G.de}C${G.branch + 18} ${G.de} ${G.branch + 28} ${G.de + 10} ${G.branch + 28} ${G.de + 30}L${G.branch + 28} ${G.de + 118}`, data);
  st.draw(side, 6.62, 6.84);
  const sn = g(svg);
  if (tall) { zput(6, d.de.side.note); pin(6, G.branch + 20, G.de - 46 - 8); }
  else text(sn, G.branch + 40, G.de + 74, d.de.side.note, { ...N, width: 104 });
  if (!tall) st.fade(sn, 6.82, 6.96);

  // --- step 7: the queue before gate 2 ------------------------------------
  const qn = Math.floor((G.gates[1] - G.gates[0] - (tall ? 12 : 16)) / (tall ? 4.6 : 5.2));
  const queue = [];
  for (let k = 0; k < qn; k++) {
    const [x, y] = P(G.gates[1] - (tall ? 7 : 9) - k * (tall ? 4.6 : 5.2), G.de);
    const c = circle(svg, x, y, tall ? 1.8 : 2.1, { fill: C.ink, stroke: C.field, 'stroke-width': 0.6 });
    c.dataset.r = tall ? 1.8 : 2.1;
    queue.push(c);
  }
  st.fill(queue, 7.08, 7.6, [8.04, 8.34]);
  // before and after 2021: one block, a thin rule between, one leader to gate 2
  const blk = g(svg), sv = g(svg);
  if (tall) {
    zput(7, d.de.queue.note);
    const q8 = zput(8, d.de.queue.note, { fill: C.muted });
    line(zones[8].g, 14, q8.bottom + 3, W - 14, q8.bottom + 3, { stroke: C.muted, 'stroke-width': 0.8 });
    zones[8].y += 2;
    zput(8, d.de.sieve.note);
    zput(8, d.de.box.note);
    pin(7, G.gates[1], G.de + G.hb + 8); pin(8, G.gates[1], G.de + G.hb + 8);
  } else {
    const bx0 = 276;
    const q = text(blk, bx0, 480, d.de.queue.note, { ...N, width: 250 });
    leader(blk, bx0 - 8, q.y - 4, G.gates[1] - 3, G.de + G.hb + 3, { stroke: C.muted, dot: false });
    line(blk, bx0 - 8, q.y - 4, bx0 - 8, q.bottom, { stroke: C.muted, 'stroke-width': 0.8 });
    line(sv, bx0, q.bottom + 6, bx0 + 250, q.bottom + 6, { stroke: C.muted, 'stroke-width': 0.8 });
    const s2 = text(sv, bx0, q.bottom + G.note + 10, d.de.sieve.note, { ...N, width: 250 });
    line(sv, bx0 - 8, q.bottom, bx0 - 8, s2.bottom, { stroke: C.muted, 'stroke-width': 0.8 });
  }
  if (!tall) st.fade(blk, 7.6, 7.84).fade(sv, 8.46, 8.66);
  Object.keys(zones).forEach((k) => { const s = Number(k); st.fade(zones[k].g, s + 0.45, s + 0.65, s < steps - 1 ? [s + 1.0, s + 1.12] : undefined); });

  // --- step 8: the sieve --------------------------------------------------
  const tp = g(svg);
  { const [x, y] = P(G.gates[1], G.de); circle(tp, x, y, G.gap - 0.4, { fill: C.paper, stroke: C.accent, 'stroke-width': 1.4 }); }
  st.fade(tp, 8.18, 8.36);
  const bx = g(svg);
  let oddFrom, oddTo;
  const closed = (x, y, s) => {
    rect(bx, x, y, s, s, { fill: C.paper, stroke: C.ink, 'stroke-width': 1.25 });
    rect(bx, x + 3.5, y + 3.5, s - 7, s - 7, { fill: C.ink });
  };
  if (tall) {
    const a = G.gates[1] - 9, x1 = G.de - 44;
    path(bx, `M${G.de} ${a}L${x1 + 9} ${a}`, { stroke: C.ink, 'stroke-width': 1, 'stroke-dasharray': '2 3' });
    closed(x1 - 9, a - 9, 18);
    oddFrom = [G.de, a]; oddTo = [x1 + 15, a];
  } else {
    const a = 206, y1 = 478;
    path(bx, `M${a} ${G.de}L${a} ${y1}`, { stroke: C.ink, 'stroke-width': 1, 'stroke-dasharray': '2 3' });
    closed(a - 11, y1, 22);
    oddFrom = [a, G.de]; oddTo = [a, y1 - 9];
    text(bx, a - 20, y1 + 8, d.de.box.note, { ...N, width: 172, anchor: 'end' });
  }
  st.fade(bx, 8.5, 8.7);
  const odd = rect(svg, -3, -3, 6, 6, { fill: C.ink });
  st.on((gg) => {
    const p = ease(span(gg, 8.36, 8.8));
    const x = lerp(oddFrom[0], oddTo[0], p), y = lerp(oddFrom[1], oddTo[1], p);
    odd.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(45)`);
    const o = ease(span(gg, 8.3, 8.4));
    odd.style.display = o <= 0.001 ? 'none' : '';
    odd.style.opacity = o >= 0.999 ? '' : o.toFixed(3);
  });

  // --- travelling dots: idle motion on screen only ------------------------
  let breathe = { stop() {} };
  if (!ctx.reduced && !ctx.print && !tall) {
    const flow = (c, n, seed, gatesAt) => {
      const rnd = rng(seed), offs = [], els = [];
      for (let i = 0; i < n; i++) { offs.push((i + 0.15 + rnd() * 0.5) / n); els.push(circle(svg, 0, 0, G.r, { fill: C.ink, 'data-audit': 'skip', style: 'display:none' })); }
      return (gg, phase, inkEnd, show) => {
        const zones = gatesAt(gg).map((a) => [a - (tall ? 15 : 27), a - (tall ? 5 : 7)]);
        const segs = [];
        let x = G.a0 + 8;
        for (const z of zones) { if (z[0] > x) segs.push([x, z[0], 1]); segs.push([Math.max(x, z[0]), z[1], 0.22]); x = z[1]; }
        segs.push([x, G.flag - 4, 1]);
        const total = segs.reduce((s, q) => s + (q[1] - q[0]) / q[2], 0);
        els.forEach((elm, i) => {
          let tt = (((offs[i] + phase) % 1) + 1) % 1 * total, pos = G.a0 + 8;
          for (const q of segs) { const dur = (q[1] - q[0]) / q[2]; if (tt <= dur) { pos = q[0] + tt * q[2]; break; } tt -= dur; pos = q[1]; }
          const vis = show * clamp((inkEnd - 4 - pos) / 10) * clamp((pos - G.a0 - 6) / 8) * clamp((G.flag - 2 - pos) / 8);
          if (vis <= 0.01) { elm.style.display = 'none'; return; }
          const [px, py] = P(pos, c);
          elm.style.display = ''; elm.style.opacity = vis >= 0.99 ? '' : vis.toFixed(2);
          elm.setAttribute('cx', px.toFixed(1)); elm.setAttribute('cy', py.toFixed(1));
        });
      };
    };
    const usFlow = flow(G.us, tall ? 5 : 7, 3, () => []);
    const deFlow = flow(G.de, tall ? 6 : 8, 9, (gg) => G.gates.filter((a, i) => gg >= gateT[i] && !(i === 1 && gg >= 8.2)));
    let cur = 0, started = false;
    st.on((gg) => { cur = gg; });
    breathe = idle(outer, ctx, (sec) => {
      started = true;
      const phase = sec * 0.035;
      usFlow(cur, phase * 1.6, lerp(G.a0, G.flag, ease(span(cur, 1.05, 1.5))), span(cur, 1.2, 1.4) * clamp(sec / 1.5));
      const deEnd = cur < 4.05 ? lerp(G.a0, G.gates[0], ease(span(cur, 3.05, 3.3)))
        : cur < 5.05 ? lerp(G.gates[0], G.gates[1], ease(span(cur, 4.05, 4.28))) : lerp(G.gates[1], G.flag, ease(span(cur, 5.05, 5.45)));
      deFlow(cur, phase, deEnd + (cur >= 5.45 ? 6 : 0), span(cur, 3.2, 3.4) * clamp(sec / 1.5));
    });
    void started;
  }

  return { set: (s, t) => st.set(s, t), destroy: () => breathe.stop() };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
