# Review: the held scene prototype, with motion, read by the AI-made sceptic

Built thing reviewed: `figures/_held.html` (and `_pinned.html` for comparison) on `feat/held-scene`, through the step screenshots at 1440×900, 1280×720 and 390×844, the reduced-motion stills, and the steady-wheel recording at 1440×900 (139 frames, read in order with their timestamps). Read against my two earlier reviews (`held-plan-ai-made.md`, `held-sketch-ai-made.md`), `figures/film.js`, `figures/_held.css` and the live article. I did not run the server myself: the recording and the report cover the same ground.

Seat: a sceptic of AI-made work, not of AI as a topic.

## 1. Short verdict

The chart itself is close to shippable and still reads as his: the field's syndrome-history chart, every row and round named, sixty quiet points around four lights, a constructed-example line on the figure. The two things that pull it towards the generated scrollytelling look are both outside the chart: the **numbered, accumulating note list** (a stepper in a new costume) and one motion detail, the **rounds slowing down as they arrive**. A small cluster at qubit 4 and a key that shows a state that never happened read as careless rather than generated. **7/10. Not yet; about 8.5 after the fixes below.**

## 2. Did the sketch-review fixes land?

| Sketch fix | Built | |
|---|---|---|
| Accent only on fired checks | Row labels and key labels in ink; accent only on lit cells and lit tiles | landed |
| The X: dashed ink strokes on qubit 4, no circle | Dashed ink, no circle, but the strokes sit on top of the qubit's own ring, and at step 4 the key's two join lines also end on the same point (see 4) | half |
| One dashed join style on screen and in print | `DASH` everywhere, the `lattice` pairing weight | landed |
| Lighten or drop the cell boxes | Quiet checks are ink points on hairline rows, flip-check rows on a faint field; no table boxes | landed |
| Collisions and clipping | Key names sit outside the arcs; foot line clear; nothing struck through (the harness checks it) | landed |

From the plan review: no tilt, no panes, no glow or pulse, no progress ticks, facts in the notes, the word "film" in the passage only, "a constructed example" on the figure. All held.

## 3. What reads as the generated scrollytelling look

**The numbered note list.** Beside the figure, the notes pile up as `1 … 5`, a mono number in a gutter, the current one in ink and the earlier ones stepped back to grey. That is the sticky feature tour's step list: text left, visual right, "step 3 of 5" written as a list. I asked for the five accent ticks to go; the numbers bring them back as type. The live article numbers figures, never steps, and its pinned scenes (and this lab's own `_pinned.html`) carry the notes without numbers. On the phone it is worse: a lone `5` before the only note on screen reads as a counter.

**The greyed earlier notes.** On their own they are the engine's read-grey, which the article already uses, so they are native. Together with the numbers they become the checklist. Without the numbers they are fine.

**The rounds' cadence.** `film.js` says "the rounds arrive at an even pace, like the clock that drives them", and spaces the columns evenly in step time, but the player maps step time through `soft()` (a prompt start, a gentle end). In the recording the columns come about every 0.17 s at first and every 0.25 s or more at the end: the eased stagger I warned about in the plan review, the one place where motion contradicts the physics (rounds are evenly spaced). It is small, but it is exactly what a viewer who knows the field would notice.

**The round numbers arrive before the rounds.** At the start of step 1 the axis `round … 1 2 3 … 8 …` and the legend snap in at once, and the columns of points follow under numbers that are already there. That is a skeleton loading before its content. Each number should arrive with its column.

**What is not a tell.** The sticky layout with the passage beside the figure is the article's own scene geometry, and the measurements show that it holds steady at every band edge. Steps 2 to 4 are single, complete changes (lights set in one frame, the joins drawn whole), then nothing until the next band: discrete steps that feel discrete, as Kosara asks. The notes' 0.25 s opacity change is short enough to read as a cut. The lights are the `lattice` fired state, set, not animated. Good.

## 4. What reads as careless

- **Qubit 4 at step 4.** The dashed X, the qubit's ring and the two dashed joins from z0 and z1 all meet in about 12 px. At reading size it is a black asterisk, a glitch more than a mark. The joins should stop at the tile edges or short of the qubit, and the X needs room of its own (larger, or offset from the ring).
- **The key mixes rounds.** From step 3 the key shows z0, z1 and z3 lit together. That state never happened: z0 and z1 fire in round 3, z3 in rounds 5 and 6. A reader who checks the key against the chart, which is the whole point of naming everything, finds a picture of no round. Either the key shows the round in focus, or it is labelled as "every check that fired".
- **Joins drawn over the lights.** The ink dashes run across the accent dots and through the accent box edges (most visible in the short z0–z1 join in round 3). It reads as a line laid on top late. Draw the joins under the lights, from dot edge to dot edge.
- **The flip line touches the round 3 boxes.** The dotted line between rounds 2 and 3 runs about 3 px from the left edge of the two lit boxes, so the eye reads it as part of the box. Inset the boxes or shorten them.
- **Two captions under the chart, two alignments.** "flip on qubit 4" is centred on its line and "lit: the answer changed since the round before" is left-aligned to the chart, 19 px below. They read as one block set two ways. Put the lit legend beside the key or on the foot line.
- **The empty band above the chart.** At 1440×900 there are about 90 px between the figure's title and the round axis, and the key floats centred in its own column, so the figure looks unanchored to its title. On the phone the gap between the title and the key is larger still. Bring the chart up to the title and seat the key on the chart's flip-check rows.

## 5. Score

**7/10.** Nobody would guess AI from the chart; the numbered list and the decelerating rounds give the page away as a generated scrollytelling template to anyone who has seen a few. Would I ship it in this article: not yet. With fixes 1 to 3 it is an 8.5, and I would.

## 6. Fixes (one line each)

1. Drop the note numbers on the held page (keep the read grey, as the pinned scenes do); on the phone, the current note alone, unnumbered.
2. Space the round columns in real time, not through `soft()` (or invert it), so the rounds really arrive at the clock's even pace.
3. Let each round number arrive with its column; the axis is not drawn ahead of the data.
4. Clear qubit 4: the key's joins stop short of the qubit, and the X gets its own room off the ring.
5. Make the key honest: show only the round in focus, or label it "every check that fired so far".
6. Draw the chart's joins under the lights, from dot edge to dot edge, never over the accent dots.
7. Keep the flip line clear of the round 3 boxes (inset the boxes by a few px).
8. Move "lit: …" out of the stack under "flip on qubit 4", onto the foot line or beside the key.
9. Close the empty band between the title and the chart; seat the key on the chart's rows, not floating centred.
