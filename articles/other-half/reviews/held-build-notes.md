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
