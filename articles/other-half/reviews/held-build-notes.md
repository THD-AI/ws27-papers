# Build notes: the held scene lab (before coding)

Branch `feat/held-scene`. Read: `HELD-SCENE.md` (section 0 wins), `reviews/held-plan2-motion.md` (sections 3 to 5), `SPEC.md` (figure contract, design system, motion), `lib/article.js` (MODES, soft, aim, advance, sizeScenes; read only), `figures/film.js`, `data/film.json`, `figures/_lab.html` and `_lab.js`, and section 4 of `text.md`.

## What I am building

- `figures/_held.html` and `figures/_pinned.html`, two thin shells around one script, `figures/_held.js`. Both link `lib/article.css` (read only) for type and the scene grid; neither loads `article.js`.
- **Held:** the end of section 3 and the first paragraph of section 4 as plain text, a skip link, then the held block: a track of `(1 + hold)` svh with a sticky stage of 100 svh. In the stage, the paragraph "While the computer runs…" and the five notes from `film.js` as page text, beside the figure (side) or above it (top). The figure is drawn with `ctx.notes === false`, so its own note band stays empty and no word is read twice. After the block: the last paragraph of section 4 and the start of section 5, so the block can let go.
- **Pinned:** the same run-in, the paragraph as the last line before the scene, then an ordinary scene in `article.css`'s own `.scene` geometry: the figure sticky beside (or above) five passages, the five notes, each triggering its step as its top passes 65% of the window. It plays with the engine's own rules (squeeze by the number behind, at least 0.5 s, more than three behind: set the second-last), so the comparison is held against today's engine.
- **Pure functions exported** from `_held.js` (it runs only in a browser): `triggers`, `goalAt`, the held player (`aimHeld`, `stepHeld`), the pinned player (`aimPinned`, `stepPinned`), `stateOf`. `tools/held-test.mjs` imports them for the unit checks and a 60 fps simulation, then drives both pages in Chrome.
- `film.js`: a `notes` export (the same function the drawing uses) and the `ctx.notes === false` flag. Nothing else in the drawing changes.

## Parameters (section 0)

- `band=` default 0.45 of the svh window, `rest=` default 0.5, `lead` 0.10. Hold = lead + 3 × band + rest = 1.95 windows at the defaults, 2.5 at 0.6/0.6. (The brief's 0.35 and rest = band, 1.5 windows, are superseded.)
- Triggers in scroll px, measured in svh px from a fixed probe: step 0 when the block's top passes 65% of the window; step 1 at lead after the pin; steps 2 to 4 at lead + k × band.
- Hysteresis 25 px, backwards only; forwards a step is due at once.
- Step times are the figure's own `durations.large` (1.4, 2.0, 1.4, 1.4, 1.6 s), not the brief's 1.8/2.4.

## Contradictions found, and how I resolve them

1. **Band and rest.** Brief: `band=0.35`, `rest=band`. Section 0: 0.45 and 0.5. Section 0.
2. **Play rule and the 1.2 s floor.** Section 0: full length up to two behind; three behind, each at 1/1.5 of its time; four or more, jump to the second-last and play only the last. 1.4 s / 1.5 = 0.93 s, under the 1.2 s floor of plan section 5 and the brief. I keep both: each step at max(1.2, own / 1.5). The scale is fixed when a step starts, so no step changes speed half way (except under the exit rule).
3. **Exit rule.** Brief: on leaving, `pos = goal − 1` (drop the step in flight, play the last in 0.6 s). Section 0: queued steps are set at once, and the step in flight finishes within 0.6 s. Section 0: the step in flight keeps playing with at most 0.6 s left; any step not yet started is set at once when it would start. The harness reports both (in flight at exit, queued at exit).
4. **Entry and "in view".** Brief: a figure under 25% in view is set at once. With step 0 due at 65% (section 0), the figure is only about 20% in view at 1440×900 when step 0 is due, so it would be set, never drawn. I use 10%: step 0 plays as the figure comes in, which is what section 0 asks ("never blank when it pins").
5. **Notes in the held block.** Brief: a screen-reader-only list. Section 0: the notes as page text. Visible text: beside the figure every note stays once shown (the earlier ones step back to the engine's read grey); on top, where height is short, the notes share one slot and only the current one shows. All five are always in the accessibility tree, in order.
6. **Fit test.** Section 0: figure column ≥ 690 px beside, figure ≥ 313 px wide on top. The brief adds "≥ 360 px off phones"; section 0 names only 313, so 313. Also: passage, notes and figure must fit in one svh window together, or stills.
7. **Stills.** Brief: one composite. This task: the five states one after another, each with its note. The task wins here; section 0 says nothing about the stills' content. Stills under reduced motion, where `MODES` reads a scene as stills, and where the held fit test fails. No hold, no empty scroll.
8. **The pinned page's passages.** Review: passage 1 = the paragraph (step 0), passages 2 to 5 = "the four notes" (there are five). Task: five passages, the five notes, each triggering its step. Task: the paragraph stands just before the scene as plain text, then the five notes. The same words on both pages.
9. **Run-in.** Brief: section 4's first paragraph above. Task: the end of section 3 and the start of section 4. The task, which includes the brief's.
10. **Plan section 5** (35% bands, 1.8 s steps, about 1.5 windows, "shortened as the engine does today") is superseded by section 0 throughout.

## Expected, before measuring

At a steady wheel of 300 px/s in a 900 px window, defaults: step 1 due 0.3 s after the pin, steps 2 to 4 every 1.35 s, the block lets go at 5.85 s. Played at full length one after another, step 4 would end at about 6.7 s, so it is probably in flight at the exit and cut short by the 0.6 s rule. At 0.6/0.6 the steps are 1.8 s apart and the block lets go at 7.5 s: probably clean. In a 720 px window everything is 20% faster in time, so the defaults should do worse there. The harness will say.

## Harness readers

- Steady wheel: 100 px wheel ticks every 0.333 s (about 300 px/s), real `mouse.wheel`.
- Trackpad: continuous small wheel deltas every 16 ms, 2500 px/s decaying with τ 0.35 s, a swipe every 1.2 s, and a resting finger's settle of −12 px then +6 px after each swipe.
- Phone flick: 4000 px/s decaying with τ 0.5 s, one every 1.5 s, by scripted scrolling (headless Chrome has no real touch fling); at 390×844 the page is emulated as a touch phone.
- Space: the real key, every 1.5 s (Chrome scrolls 0.875 of the window, smoothly).
- Flags: a forward step played in under 1.2 s at the steady wheel; any backward goal change while the reader rests at a band edge (a dedicated ±20 px jitter test at every edge, plus every backward change in the forward runs); any step still queued when the block lets go; for wheel and Space, the last step ending with under 75% of the figure in view.

## After measuring (21 November, `node tools/held-test.mjs`; full report in `.shots/held/report.md`, not committed)

- **Steady wheel:** the defaults (band 0.45, rest 0.5) pass at 1440×900 only (step 4 shortened to 1.25 s by the exit rule). At 1280×720 step 4 is still queued when the block lets go; at 390×844 it is cut to 1.03 s. Band 0.6 / rest 0.6 passes at all three sizes, every step at full length. The estimate above held.
- **Trackpad, flick, Space:** these readers cross a band faster than a step plays, so the four-behind rule sets steps 1 to 3 or the exit sets the last; no setting of band and rest is clean for all of them, because five steps take at least 6 s (7.8 s at full length) and these readers cross 2.5 windows in 2 to 4 s. Space also carries the figure out of view before the last step ends (one press is 0.875 of a window).
- **Resting on an edge:** no flip at any edge, size or setting (±20 px after crossing).
- **Pinned, for comparison:** at the same steady wheel the engine squeezes steps 2 to 4 to 0.7–0.8 s; on a 390×844 phone the ordinary pinned scene cannot pin this figure at all (235 px in 45% of the window) and reads as stills, where the held block holds it at 366 px.
- **Gates:** the first run found the key's half-check names (x2, x3, z2, z3) struck through by their arcs; `film.js` now sets those names outside the arc. After that: no line through lettering, smallest figure lettering 11.5 px beside and 11.7 px on top, page text 11.5 px or more, no sideways scroll, no em dash.
- **Fit test:** holds at 1440×900, 1366×768, 1280×720, 1280×630 and 390×844; stills at 390×660 (figure 267 px), 844×390 (MODES) and 720×450 (304 px beside).

## Fix round 1: plan (before coding)

From `held-proto-lay.md` (7), `held-proto-ai-made.md` (7) and `held-proto-motion.md` (7.5), as the coordinator sorted them into nine items.

| # | Item | File | Done when |
|---|---|---|---|
| 1 | Qubit 4: a mono "4" outside its ring; the dashed X as four short arms that start outside the ring; the key's joins stop short of the X; the square tiles' names moved out from the centre to make room | `figures/film.js` | the audit finds no line through "4" or any key name; the step 4 shot shows the ring clear at reading size |
| 2 | An honest key: step 2 z0 and z1 lit (and the X); step 3 only z3; step 4 all three, the X, and "every check that fired, rounds 1–8" under the key; print = step 4 | `film.js` | the step 2, 3 and 4 shots show exactly that; the print composite has the caption |
| 3 | Rounds at an even real-time pace: the shell eases t with `soft()`, so the figure inverts it for the columns; each round number (and "round …", the end "…") arrives with its column | `film.js` | in the recording the round columns arrive at even intervals; no number shows before its column |
| 4 | Step 4 in the drawing: "across the chip" beside the vertical join, "along time" beside the horizontal one (muted mono 11.5, between row lines, never on one); chart joins under the lit boxes (2 px dashes so they show in the gap); boxes inset 6 px across so the flip line stays clear; "lit: …" moved to the foot, left-aligned with it; without the in-figure notes the chart and key move up (no empty band) and the wide key sits on the flip-check rows. Without notes the drawing is shorter, so `film.js` exports `aspectFor(ctx)` for the page | `film.js`, `_held.js` | the audit passes at every step; shots show no gap above the chart |
| 5 | Notes without numbers. Laptop: read notes grey, current in ink. Phone: the current note alone; the old one fades out in 0.12 s, then the new one fades in | `_held.js`, `_held.css` | no number in the notes or the stills; a phone frame never shows two notes |
| 6 | Defaults band 0.6, rest 0.6; band px = max(band × svh, band × 900), which is max(0.6 svh, 540 px) at the default; the rest gets the same floor (it must cover the last step). The track's height follows in px (`--hold-px`) | `_held.js`, `_held.css`, `tools/held-test.mjs` | at 1280×720 the bands are 540 px; the harness's default runs use them |
| 7 | No set of several steps while the figure is on screen: four or more behind becomes a run-through, each queued step in order at 0.35 s (also backwards). Set at once only off screen, on a jump, and for steps still queued when the block lets go | `_held.js`, test | unit check: four behind changes nothing in that frame and then plays each step at 0.35 s; no `set:skip` in any run |
| 8 | Skip link out of the flow on focus (absolute, above the block's top, on paper), with `scroll-margin` so it shows whole | `_held.css` | harness: the block's top does not move when the link is focused, and the link is fully in the window |
| 9 | Focus moving into or over the block (Shift+Tab) is a jump: set, not played back | `_held.js` | harness: after Shift+Tab from `#after-film` to the skip link, `data-moving` never set and the figure equals the goal |

Harness: the default only at all three sizes, plus 0.45/0.5 at 1440×900; pinned kept for comparison; keyboard checks for 8 and 9; with the video.

Notes: the key's X now shows at steps 2 and 4, not 3 (item 2's honesty applies to it too: the flip is in round 3). Item 7 overrides section 0's "jump to the second-last": the run-through is the coordinator's later decision after the motion review.

## Fix round 1: after measuring (`node tools/held-test.mjs`, with the recording)

- Steady wheel, new default (band 0.6, rest 0.6, at least 540 px each): passes at 1440×900, 1280×720 and 390×844, every step at full length (1.4, 2.0, 1.4, 1.4, 1.6 s), nothing in flight at let-go. In the simulation it also passes at svh 630 and 660.
- Trackpad, flick, Space at the default: no step is set while the figure is held in view any more (four behind runs through at 0.35 s a step), so these fast readers now arrive at let-go with 1 to 3 steps queued, and those are set by the exit rule. That is the cost of item 7 under a hold of about 2.5 windows. Space at 1440×900 carries the figure off screen before the last step.
- 0.45 / 0.5 at 1440×900, for comparison: wheel passes (step 4 cut to 1.31 s at let-go), trackpad and Space pass by running through, flick fails (2 queued).
- Edges: no flip anywhere. Keyboard: the skip link no longer moves the block and shows whole; Enter lands on `#after-film` with the figure set; Shift+Tab back is set, never played.
- Gates: no line through lettering at any step, size or in print; figure lettering 11.5 px or more beside, 11.7 on top; page text 16.5 px or more in the held stage. Fit: 390×660 is still stills (296 px, under 313; it was 267).
- In the figure, the wide key grew (pitch 34 to 50) and the tall one (30 to 40), and the tall drawing is 24 units taller, so that the 4, the X and the joins have room. "along time" sits above its pair in the tall drawing, where the chart ends close after it.
- Gap: the recording is still about 10 frames a second (headless screencast), so the even cadence of the rounds is not judged by it. The phone's sequential crossfade is set in CSS and not measured.
