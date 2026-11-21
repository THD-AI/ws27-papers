# Review, round 2: the held scene (motion and interaction)

Reviewer seat: interaction and motion designer, scroll stories (same seat as `held-plan-motion.md`). Read: `HELD-SCENE.md` round 2 (sections 5 and 6), `figures/film.js` (form C, the space-time chart), `reviews/sketches/film-C-wide.png` and `film-C-tall.png`, `reviews/held-sketch-lay.md`, `lib/article.js` (MODES, topFit, players, aim, advance), `lib/article.css` (2d), `SPEC.md`. Nothing was driven in a browser; sizes below are computed from the CSS and the figure's own sizes and are marked "est." where only a build can settle them.

## Scores

| | Score |
|---|---|
| Mechanism (section 5) | 7 |
| Evaluation (section 6) | 6.5 |

Most of the 14 changes landed in substance. What holds the mechanism back: two rules contradict each other (the 1.2 s floor and "shortened as the engine does today"; "stays in view until played" and a scroll that is never held back), the entry and the fit test are missing, and the plan still describes A and B while the code is C. The evaluation names the right readers and devices but has no harness for a lab page and still carries B's gates.

## 1. The 14 changes, one by one

| # | Change | In round 2 | Verdict |
|---|---|---|---|
| 1 | Step 1 within 10% of a window after the pin | 5, "within 10%" | Landed. At 1280×630 that is 63 px, under one wheel notch. |
| 2 | Full time when two or fewer behind | 5 | Landed, but contradicts itself: "at least 1.2 s" and "more behind, shortened as the engine does today" (the engine goes down to 0.5 s). Fix in the brief (§4): three behind, each at 1/1.5 of its time (1.8 s becomes 1.2 s); four or more, set to the second-last and play the last. |
| 3 | Figure in view until the last step has played | 5, a rest of one band | Half. A block can't wait for an animation without holding the scroll. At a steady wheel (300 px/s, 900 px window) the hold of 1.5 windows lasts about 4.5 s; the steps take 2.4 + 3 × 1.8 = 7.8 s, or about 5.9 s with the three-behind rule. The block lets go about 1 s before the last step ends. It needs an exit rule (§4: once the block lets go, queued steps are set and the one in flight finishes in 0.6 s), or a longer hold. Make band and rest URL parameters so he can feel both. |
| 4 | Hysteresis, about 25 px | 5 | Landed. Say it applies backwards only (forward is at once), which also absorbs a trackpad's settling tail. |
| 5 | A way through: links on the ticks, skip link | 5 | Landed as amended: the ticks went for a good reason (sceptic), and the skip link, Space and Page Down remain. Enough. |
| 6 | Notes as page text | 5 | Landed. The notes come from `film.js` (`NOTES`, not exported); export them so the list and the drawing can't drift apart. |
| 7 | The engine's `MODES` | 5 | Landed, but incomplete: a held block also has to fit the passage and the figure into one window, which a pinned scene never does. A held fit test is missing (§3). |
| 8 | Address bar: no relayout, `svh` | 5 | Landed. The bands must also be measured in `svh` px (a fixed probe), not `innerHeight`, or the steps move when the bar hides. |
| 9 | `pageshow` and restored scroll | 5 | Landed. |
| 10 | Occlusion in the stack | Moot | Form C has no depth. Two new drawing faults instead (§6). |
| 11 | Where the scale goes | 3 | Landed, with one loose end: 3 says the scale "isn't drawn", but the step 1 note draws "1.1 µs". Say "only the 1.1 µs, in the step 1 note". |
| 12 | Readers for the hold | 6.3 | Landed in name. No parameters and no harness: `timing.mjs` reads built articles, not lab pages. Fixed in §5. |
| 13 | The same figure as a pinned scene | 5, 6.5 | Landed, but undefined: a pinned scene needs one passage per step, and the round-2 passage is two sentences. Decide what the pinned version's passages are (§2). |
| 14 | Real iPhone and Android, by hand | 6.4 | Landed. Add "recorded", so the readers judge motion from video, not stills. |

Two more contradictions, outside the 14:
- **The plan still says A or B** (sections 2, 4, 6.1, 6.2 "no point collisions in B", 7). The chart C was chosen and is in the code. The step table also differs from `film.js` (notes 3 and 4, step 1 at 2.4 s, not 1.8). The plan should match the code before the build.
- **Entry is undefined.** The figure's step 0 starts empty (`set(0, 0)` shows only the title; the key fades in over step 0). If the block pins blank, the first thing the reader sees is a figure drawing itself while they are not scrolling yet. Step 0 must be due as the block comes in (its top passing 65% of the window, as a passage would), so that it is complete by the pin.

## 2. The two lab pages

- `figures/_held.html` (mode held) and `figures/_pinned.html` (mode pinned), both thin shells around one script, `figures/_held.js`, so the figure, the player and the measurements are identical and only the mechanism differs. Both link `../../../lib/article.css` (read only) for type, `--left`, `--gap` and, on the pinned page, the real `.scene` geometry. Neither loads `article.js`.
- Both carry the real context: section 4's first paragraph above, the following paragraphs through the start of section 5 below, so there is something to scroll into and out of.
- **The pinned page's passages:** passage 1 is the section 4 paragraph (step 0); passages 2 to 5 are the four step notes as sentences (steps 1 to 4). The figure is built with its in-drawing note hidden (`ctx.notes === false` in `film.js`, the band left empty), so no word is read twice. Same words on both pages.
- **Tuning by URL:** `?lead=0.10&band=0.35&rest=0.35` (defaults from the plan), `&freeze=<step>:<t>`, `&trace=wheel|trackpad|flick|space` for the harness.

## 3. Sharing the held window, and when to fall back

Figure C's sizes: wide 720×450 (key left, chart right), tall 360×580 (key on top, chart below). Smallest lettering 11.5 units. Body text 1.06rem (17 px), line height about 27.5 px; the held passage is about 165 characters.

| Window | Mode | Held layout | Figure | Est. lettering | Holds? |
|---|---|---|---|---|---|
| 1440×900 (about 790 inside Chrome) | side | Passage in the text column at `--left` (224 px), 20rem wide; figure beside it, as a pinned scene | ≈ 784 × 490 px, centred in the window | 12.5 px | Yes, about 150 px of air above and below |
| 1366×768 | side | same | ≈ 747 × 467 | 11.9 px | Yes |
| 1280×720 (about 630 inside) | side | same | ≈ 710 × 444 | 11.3 px | Yes, 90 px of air at 630 |
| 390×844 (Puppeteer) | top | Passage on top (about 5 lines, 140 px, 24 px gutters), tall figure below, full bleed less 12 px a side | ≈ 366 × 590 | 11.7 px | Yes: 16 + 140 + 12 + 590 + 12 ≈ 770 ≤ 844 |
| 390×844 iPhone Safari, toolbars shown (`svh` about 660) | top | same | ≤ 482 px high, so ≈ 299 px wide | lifted to 11.5 by fig.js, but under the phone's 313 px need | **No, stills (est.)** |
| 844×390, and 720×450 (1440×900 at 200%) | seq / side | – | – | – | Stills |

Rules:
- **Beside (side mode):** the same grid as `article.css` 2d (`clamp(20rem, 26%, 23rem) minmax(0, 1fr)`, gap 3rem, the same margins), so held and pinned figures are the same width at every size. Passage and figure top-aligned; the pair centred vertically in `100svh`. Holds when the figure column is ≥ 690 px (11 px lettering) and figure height + 4rem ≤ the `svh` height.
- **On top (top mode):** passage, then the tall figure. Width = min(room, 432, (svh − passage − 40) / r), with r the figure's measured height per px of width. Holds when that is ≥ 313 px on a phone (room < 640 px, the engine's phone need: 360 × 10/11.5) or ≥ 360 px otherwise; a tablet may try the wide drawing as `topFit` does.
- **Stills** where MODES says seq, where the fit test fails, under reduced motion, and in print: the passage, then one still, the composite (`ctx.print = true` drawn at the column width: every light, the X, both joins, all five notes numbered). No hold, no empty scroll.
- **For him (section 7):** the estimate says a real iPhone in Safari gets stills, because the passage takes the height the figure needs. If he wants it held there, the tall drawing has to lose about 45 units of height (its title, which the passage already gives, and one of the two foot lines), which brings the width to ≈ 323 px. His call, after he has seen the 390×660 screenshot.

## 4. Build brief

### DOM (`_held.html`)

```html
<main class="body">
  <h2 class="sec">4. A film of hints</h2>
  <p>One round of checks takes 1.1 millionths …</p>
  <a class="held-skip" href="#after-film">Skip the film figure</a>
  <section class="held" id="film-held" data-fig="film">          <!-- the scroll track -->
    <div class="held-stage">                                      <!-- sticky, 100svh -->
      <div class="held-text">
        <p>While the computer runs, that stream is all that comes out of it. …</p>
        <ol class="sr-only" id="film-notes"><!-- five notes from film.js --></ol>
      </div>
      <div class="held-fig" aria-hidden="true"><div class="fig-frame"></div></div>
    </div>
  </section>
  <div class="held-stills" hidden><!-- the composite, mounted only in stills --></div>
  <p id="after-film" tabindex="-1">The fired checks say roughly where …</p>
  …
</main>
<div class="svh-probe" aria-hidden="true"></div>
```

### CSS (the held block only)

```css
.svh-probe { position: fixed; top: 0; left: 0; width: 0; height: 100svh; visibility: hidden; pointer-events: none; }
.held { --hold: 1.5; position: relative; height: calc((1 + var(--hold)) * 100svh); max-width: none !important; }
.held-stage { position: sticky; top: 0; height: 100svh; box-sizing: border-box; display: grid; align-content: center; }
.held-fig .fig-frame { width: var(--fig-w); aspect-ratio: var(--fig-ar); }   /* both set by _held.js */
/* beside: the article's scene grid, so held and pinned match */
.held.is-side { margin: 0 calc(var(--pad) - var(--gutter)) 0 0; --pad: clamp(1.5rem, calc((var(--pw) - 62rem) * 0.2), 4rem); }
.held.is-side .held-stage { grid-template-columns: clamp(20rem, 26%, 23rem) minmax(0, 1fr); column-gap: var(--gap); align-items: start; }
/* on top: passage, then the figure, full bleed */
.held.is-top { margin: 0 calc(-1 * var(--gutter)) 0 calc(-1 * var(--left)); }
.held.is-top .held-stage { grid-template-columns: 1fr; row-gap: 0.75rem; padding: 1rem 0 0.75rem; }
.held.is-top .held-text { max-width: var(--measure); margin: 0 var(--gutter) 0 var(--left); }
.held.is-top .held-fig { justify-self: center; }
/* stills: no hold */
.held.is-seq { height: auto; }
.held.is-seq .held-stage { position: static; height: auto; }
.held.is-seq .held-fig { display: none; }
.held-skip { position: absolute; left: -9999px; }
.held-skip:focus { position: static; display: inline-block; margin: 0 0 0.5rem; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@media print { .held { height: auto; } .held-stage { position: static; height: auto; } .held-skip { display: none; } }
```

`--hold` is set from the URL: `lead + 3 × band + rest` (1.5 at the defaults).

### Layout (on load, on a real resize, never while scrolling)

```js
const MODES = { /* copied verbatim from lib/article.js, with its comment */ };
function layout() {
  G.svh = probe.getBoundingClientRect().height;               // not innerHeight
  let mode = MODES.side.matches ? 'side' : MODES.top.matches ? 'top' : 'seq';
  if (reduced.matches || mode !== 'seq' && !fit(mode)) mode = 'seq';   // fit() as in §3; sets --fig-w, --fig-ar, layout
  held.className = `held is-${mode}`;
  G.top = held.getBoundingClientRect().top + scrollY;         // the track's top in the document
  G.T = triggers();                                           // below
  G.end = G.top + HOLD * G.svh;                               // the block lets go after this
  G.mode = mode;
}
```

### Scroll to step, with hysteresis

The player's position runs 0 to 5, as in the engine: k + u shows step k at t = soft(u), a whole k shows step k − 1 complete.

```js
const LEAD = q('lead', 0.10), BAND = q('band', 0.35), REST = q('rest', BAND);
const HOLD = LEAD + 3 * BAND + REST, HYST = 25;
function triggers() {                                  // scroll positions at which goal 1..5 is due
  const t = [G.top - 0.65 * G.svh];                    // step 0: the block's top passes 65% of the window
  t.push(G.top + LEAD * G.svh);                        // step 1: 10% after the pin
  for (let k = 1; k <= 3; k++) t.push(G.top + (LEAD + k * BAND) * G.svh);   // steps 2 to 4
  return t;
}
function goalAt(y, prev) {
  let raw = 0;
  while (raw < G.T.length && y >= G.T[raw]) raw++;
  if (raw >= prev) return raw;                         // forward: at once
  let g = prev;                                        // back: only 25 px past the edge
  while (g > raw && y < G.T[g - 1] - HYST) g--;
  return g;
}
```

### Play loop

```js
const DUR = mod.durations.large;                       // [1.8, 2.4, 1.8, 1.8, 1.8], the figure's own
const FLOOR = 1.2, BACK = 0.6, EXIT = 0.6;
const soft = (x) => x * (1.4 - 0.4 * x);               // the engine's ease
const p = { pos: 0, goal: 0, scale: 1 };
let raf = 0, last = 0, exiting = false;

function update(jump = false) {                         // rAF-throttled from scroll
  const y = scrollY;
  exiting = y > G.end;
  const goal = G.mode === 'seq' ? 5 : goalAt(y, p.goal);
  aim(goal, jump || G.mode === 'seq' || !inView());     // inView: ≥ 25% of the figure on screen
  if (exiting && p.goal - p.pos > 1) { p.pos = p.goal - 1; draw(); }   // leaving: set the queue, finish the last
}
function aim(goal, now) {
  if (goal !== p.goal) {
    const n = Math.ceil(Math.abs(goal - p.pos) - 1e-6);
    p.goal = goal;
    if (n >= 4) { p.pos = goal - Math.sign(goal - p.pos); }          // a flick: set the second-last, play the last
    p.scale = n === 3 ? 1.5 : 1;                                     // up to two behind: full time
  }
  if (now) p.pos = p.goal;
  if (p.pos !== p.goal && !raf) { last = 0; raf = requestAnimationFrame(frame); }
  draw();
}
function frame(t) {
  const dt = last ? Math.min(0.1, (t - last) / 1000) : 1 / 60; last = t;
  const dir = Math.sign(p.goal - p.pos);
  const i = dir > 0 ? Math.floor(p.pos) : Math.ceil(p.pos) - 1;      // the step being played
  let d = dir < 0 ? BACK : Math.max(FLOOR, DUR[i] / p.scale);
  if (exiting && dir > 0) d = Math.min(d, EXIT);
  p.pos = dir > 0 ? Math.min(p.goal, i + 1, p.pos + dt / d) : Math.max(p.goal, i, p.pos - dt / d);
  draw();
  root.dataset.moving = p.pos !== p.goal ? '1' : '';
  raf = p.pos !== p.goal ? requestAnimationFrame(frame) : 0;
  if (!raf) p.scale = 1;
}
function draw() {
  if (p.pos <= 0) return h.set(0, 0);
  const i = Math.min(4, Math.ceil(p.pos) - 1);
  h.set(i, soft(Math.min(1, Math.max(0, p.pos - i))));
}
```

Events: `scroll` (passive, one rAF); `load` and `pageshow` (`persisted`) call `update(true)`; `hashchange` and the skip link call `update(true)`; `resize`: if the width is unchanged and the height changed by less than 150 px on a coarse pointer, ignore it; otherwise wait 200 ms of calm, keep the reader's fraction through the hold, `layout()`, scroll back to that fraction, `update(true)`. Expose `window.__held = { p, G, goalAt, finish() }` for the harness.

The pinned page uses the same player with the engine's own rules instead (trigger when a passage's top passes 65%, squeeze by n, at least 0.5 s, more than three behind: second-last), and `--stage-top` set to centre the figure, so the comparison is held against today's engine, not against a tuned copy.

## 5. Tests

Node, no browser (pure functions exported from `_held.js`):
1. `goalAt`: forward at once; ±20 px jitter at every edge never changes the goal; 30 px back does; a back-and-forth trace of a settling trackpad ends where it should.
2. Player simulation at 60 fps, four readers, at 900, 630, 844 and 660 px `svh`: steady wheel (100 px every 0.3 s); trackpad swipes (2500 px/s decaying with τ = 0.35 s, one every 1.2 s); one phone flick (4000 px/s, τ = 0.5 s); Space (0.875 × `svh` every 1.5 s, 0.4 s smooth). Record each step's played time, which steps were set at once, and the figure's visible share when the last step ends. Pass: no forward step under 1.2 s except the exit's last step (≥ 0.6 s); steady wheel and Space: the last step ends with ≥ 75% of the figure in view; no backward step during any settle; the flick ends in the final state.

Puppeteer on both pages:
3. First scroll: three wheel notches after the pin change the figure, at 1440×900, 1280×720 and 1280×630.
4. Layout gates at 1440×900, 1366×768, 1280×720, 1280×630, 390×844, 390×660, 844×390, 720×450 and print: the expected mode and fallback (§3 table); smallest lettering ≥ 11 px beside, ≥ 11.5 px on top (measured with `getBoundingClientRect` on text); passage and figure inside the stage; no horizontal scroll; no line through lettering (the `_lab.js` audit).
5. Resize: on top mode, −100 px of height: no relayout, no draw; −200 px: relayout, the same goal, set at once.
6. Leave from mid-hold and come back (back-forward cache and a plain back), and reload mid-hold: `data-moving` never set, goal equals `goalAt(scrollY)`.
7. Keyboard: Tab reaches the skip link, which is visible on focus; Enter moves focus to `#after-film`.
8. `prefers-reduced-motion: reduce`: no empty scroll, the composite shown.
9. The accessibility tree has the five notes in order and no SVG text.
10. Videos at reading pace and at a steady wheel, 1440×900 and 390×844, held and pinned side by side; these go to every reader, not only stills.

By hand: NVDA on Windows (the notes are read), and his iPhone and an Android, recorded.

## 6. Figure faults seen in the C sketches

- **Step 0 shows two rounds.** In `film.js` round 2 appears at g ≥ 1 (`1 + (k − 1) × 0.12` with k = 1), and step 0 complete is g = 1, so the "one round" note stands over two columns (sketch, step 0). Start round 2 just after 1 (for example `1.05 + (k − 1) × 0.12`).
- **The key's join strokes through its labels.** The dashed path runs from the centres of `z0` and `z1`, where their names are written, to qubit 4, so both names are struck through at step 4 (wide and tall sketches). Start the join at the tile's edge, or move the two names. Add "no line through lettering" to the gates in 6.2.

## Remaining required changes

1. Update the plan to form C: drop A and B from sections 2, 4, 6.1, 6.2 and 7, and make the step table match `film.js` (notes 3 and 4, step 1 at 2.4 s).
2. Replace "shortened as the engine does today" with a rule that keeps the 1.2 s floor: three behind at 1/1.5 time, four or more set to the second-last.
3. Add an exit rule in place of "the figure stays in view until that step has played": when the block lets go, queued steps are set and the step in flight ends in 0.6 s; make band and rest URL parameters so he can compare 1.5 and about 2 windows.
4. Define entry: step 0 is due when the block's top passes 65% of the window, so the figure is complete when it pins.
5. Add a held fit test (passage and figure in one `svh` window, with the thresholds in §3), on top of `MODES`; tell him a real iPhone in Safari probably gets stills.
6. Measure the bands in `svh` px from a fixed probe, not `innerHeight`.
7. Define the pinned page's passages (the paragraph, then the four notes) and hide the in-drawing note there.
8. Give the hold readers their parameters and a lab harness (exported pure functions plus Puppeteer), since `timing.mjs` reads built articles only.
9. Fix the two figure faults (two rounds at step 0, the join through the key's labels) and add "no line through lettering" to the gates.
10. Record the real-phone runs, and give every reader the videos.
