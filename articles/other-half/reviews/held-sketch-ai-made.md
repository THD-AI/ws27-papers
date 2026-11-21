# Review: the film sketches, A and C, read by the AI-made sceptic

Sheets reviewed: `reviews/sketches/film-A-{wide,tall,print}.png` and `film-C-{wide,tall,print}.png`, steps 0–4 at t = 1, no motion. Read against my plan review (`held-plan-ai-made.md`), `HELD-SCENE.md` round 2, the `lattice` scene as it renders now (`figures/_grid-lab/png/current-desktop-step3.png`) and the `syndromes` spec in `FIGURES.md` (the "103 of 256" field of cells).

Seat: a sceptic of AI-made visuals and writing, not of AI as a topic.

## 1. Short verdict

- **A, the filmstrip: 6/10.** Would not ship as drawn. The grid is unmistakably his, but repeated eight times at thumbnail size it becomes a sheet of identical stickers, and the two new marks (a floating circled X badge and a swooping accent arc) are the stock "lit nodes and a curve" moves.
- **C, the space-time chart: 8/10.** Would ship after the fixes below. It is the field's own syndrome-history chart, labelled so every note can be checked, and its field of cells is the same hand as the "103 of 256" field. The risk is a different one: a boxed table of 64 identical dotted cells can read as a dashboard heatmap.
- **Pick: C.**

## 2. Which form risks reading as generated, and why

**A is the riskier one.**
- Eight identical copies of a detailed glyph, evenly spaced on a grid, is the look of an icon sheet or a generated "step 1 … step 8" panel. In `lattice` the grid is a large drawing with room around it. Here it is about 110 px, its check dots shrink to specks, and the drawing turns into a pattern.
- The X is not on qubit 4. It is a circled accent badge floating in the gutter between rounds 2 and 3, which is how an icon marks an event, not how this article marks an error.
- The time join is a smooth accent bezier that dips under rounds 5 and 6, solid on screen and dashed in print. That is the arc between lit nodes I warned about in section 4 of the plan review. It is also forced: in a strip, a straight join along time from `z3` in round 5 to `z3` in round 6 would cut through round 6's grid, so A can't draw the time pair along its own geometry. The form itself fights the plan's must.
- No check is named. The notes say `z0`, `z1` and `z3`, but a reader can't find `z3` in a thumbnail without labels, so the "facts a reader can check" are not checkable in A.

**C's risk is smaller and easier to fix.**
- A field of boxed, tinted cells with a dot in each, axis numbers on top and row labels on the left, sits close to the generated "activity heatmap" or contribution-graph card. What keeps it his: the same tints as `lattice` (grey flip-checks, white phase-checks), the accent only on fired checks, the mono labels, the dotted "flip on qubit 4" line between rounds 2 and 3, and the key grid with the X on the qubit. The "103 of 256" figure is already a field of cells with accent marks, so C belongs to the article's existing family.
- The boxes do most of the dashboard work. Without cell outlines (rows as hairlines, quiet checks as the small ink points they already are), it reads as a chart in a paper.

## 3. Does each form look like the same hand?

- **A:** at the level of the glyph, yes, because it is the `lattice` grid. At the level of the composition, no. `lattice` is one large asymmetric drawing with a note to its right. A is a uniform 4×2 or 3×3 tiling, and nothing else in the article tiles like that.
- **C:** the key grid is `lattice` in small, with labels. The chart matches the "103 of 256" field. The composition is asymmetric (key left, chart right on wide, key above on tall), like `lattice`. Yes, the same hand, provided the cells lose their boxes or at least get lighter.

## 4. Did the plan-review musts land?

| Must | A | C |
|---|---|---|
| No tilt, no panes | Yes, flat | Yes, flat |
| Lit = `lattice` fired state, no glow | Yes: tint, solid accent dot, accent edge | Yes, translated to a cell: tint, accent dot, accent edge |
| Notes are facts with check and round names | Written so, but the checks are unlabelled, so they can't be checked | Yes, every row and round is labelled |
| All quiet checks drawn | Yes, all 64 | Yes, all 64 |
| "a constructed example" foot line | Yes, but in print the arc runs through it | Yes, but in print it collides with "flip on qubit 4" |
| No progress ticks | Yes | Yes |
| Joins: straight hairlines along the geometry, dashed | Round 3: straight diagonal, but solid on screen. Time: a curved arc, which fails | Straight, along a column and along a row, but solid on screen and dashed in print |
| X dashed (the chip never shows it) | No: a solid circled badge | No: a solid circled X on the qubit (right place, wrong stroke) |

## 5. Details that read as machine-made or careless

- **Italic notes:** the article's own system, and the wording is now factual. Good. In A-wide step 3 the note breaks early ("no / qubit hit") in an over-narrow column. Give the note the frame's width.
- **The X mark:** in both forms a solid accent circle around an X reads as an icon or a close button. `lattice` marks the unknown with plain ink. Draw the X as two short dashed ink strokes on qubit 4, with no circle.
- **Dashed joins:** solid on screen and dashed in print in both forms. One rule, everywhere. `lattice` pairs with a dashed ink line, so match that weight and dash.
- **The arc (A):** the clearest generated tell on the sheets.
- **Grid density:** A's thumbnails are too small for their detail. C's 64 boxed cells are dense but honest, and the boxes are the noise.
- **The "…" ends:** in A step 0 the trailing "…" sits alone in the bottom-right corner, far from round 1. In A-tall it lands in odd places. In C both ends sit on the round axis, which is where they belong.
- **Accent leaks (C-tall):** `x0`–`x3` row labels and the `z3` label in the key render in the accent before anything fires. The accent must mean fired, and nothing else.
- **Key labels (C):** `x2`, `z2`, `z3` and `x3` are crammed against the qubit circles and the half-disc edges and look clipped. Give them room or move them outside the arcs.
- **Collisions in print:** A's arc crosses the foot line, and C's "flip on qubit 4" overlaps it. Gate "nothing collides" fails on both print sheets.

## 6. Scores

- **A:** 6/10. A reader would not guess AI from the glyph, but the badge X and the swoop arc on a tiled sheet are the generated grammar. Would not ship.
- **C:** 8/10 as sketched, about 9 with the fixes. Would ship.

## 7. Required fixes (for C)

1. Accent only on fired checks: no accent row labels, no accent key labels.
2. The X: two short dashed ink strokes on qubit 4, no circle, no accent fill.
3. Joins: one dashed hairline style on screen and in print, matching `lattice`'s pairing line.
4. Lighten or drop the cell boxes: rows as hairlines, quiet checks as ink points, the field tint only behind the flip-check rows, so it reads as a chart, not a heatmap card.
5. Fix the collisions and clipping: the foot line clear of "flip on qubit 4", and key labels clear of circles and arcs, at 11 px or more.

## 8. If he picks A anyway

- Label `z0`, `z1` and `z3` on every frame, or at least on rounds 3, 5 and 6.
- Replace the arc with a mono bracket under rounds 5–6 ("z3 · z3, no qubit hit").
- Put the X on qubit 4 inside round 3's frame, dashed, in ink.
- Keep the step 0 "…" next to round 1.
