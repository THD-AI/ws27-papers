# Plan: a held scene, and the film of hints

Status: plan, round 2. The round 1 plan was reviewed by three readers before anything was built (his rule, 21 November 2026: measure twice, cut once): a quantum error-correction specialist (overall 7.5), a scroll-story designer (6) and the AI-made sceptic (6). Their reviews are in `reviews/held-plan-*.md`. His words: dotUni `.docs/transcripts/2026-11-21-004` and `-005`.

## 1. What he asked for

Today a scene works one way: the figure is pinned and the paragraphs scroll past it, and each paragraph that arrives starts a step. He asked for the other way round as well: **the paragraph stays put, the reader scrolls, and the drawing moves on.** With it, the article can carry more visuals that explain rather than decorate.

The first use is the space-time picture that came out of comparing our figures with Google's papers: errors leave hints in time as well as across the chip. Section 4, "A film of hints", tells this only in words today.

## 2. What changed after the plan review

Convergent: two or more readers, or the specialist for the point.
- **No stacked panes and no tilt** (sceptic and motion designer). Overlapping translucent sheets that tilt into place on scroll are the current generic "isometric layers" look, and they hide checks behind each other. Two flat forms replace them (section 4); he picks one.
- **Both pairs in one matching puzzle** (specialist). The wrong report moves from `x2` to the flip-check `z3`, so the pair in space and the pair in time belong to the same puzzle. The article says flip-checks and phase-checks are matched separately.
- **The film is a window from a longer run,** with no bare "round 1". The X is drawn between rounds 2 and 3, not on round 3 (specialist).
- **The notes state facts a reader can check,** naming the check and the round. "Film" stays in the passage, and "the whole film" becomes "across rounds, not round by round", because real decoders work in windows (specialist and sceptic).
- **A lit check looks exactly like a fired check in `lattice`:** field tint and solid dot, set. No glow, no pulse, no change in brightness. Every quiet check is drawn in every round. The mono foot line says "a constructed example".
- **No progress ticks.** The round axis shows where the drawing is. Readers can still get through without the scroll: a skip link before the block, and the notes as page text for screen readers (motion designer).
- **The held mechanism takes the designer's 14 requirements** (section 5).
- **The same figure is also built as an ordinary scene** (motion designer and sceptic), so he and the readers compare held against pinned on the same drawing.
- **Sketches before motion:** the two forms are first drawn as static states, at desktop and phone width, and reviewed. Motion is built only after one form is chosen.

## 3. The physics, stated so it can be checked

Same grid and the same words as the article (sections 3 to 6, figure `lattice`, `data/lattice.json`): distance 3, 9 storing qubits (`q = row * 3 + col`), 8 checks. Four ask about flips (`z0`–`z3`), four about phase errors (`x0`–`x3`).

- A check fires in round r when its answer differs from round r − 1 (the article's definition, section 3). The first round drawn is compared with a round before it that isn't drawn. `film.json` says so.
- **A flip on qubit 4 between rounds 2 and 3** fires `z0` (qubits 1, 2, 4, 5) and `z1` (3, 4, 6, 7) in round 3, once: a pair in space. A flip in the middle row lights two checks. A flip on any other storing qubit lights one, because its other end is the grid's edge. The figure claims only what it shows.
- **`z3` (right edge, qubits 5 and 8) reports wrongly in round 5:** it fires in round 5 and again in round 6, and no qubit is hit. That's a pair in time, the article's "fires twice in a row".
- **Pairing:** `z0`–`z1` within round 3, and `z3` round 5 to `z3` round 6. Both are pairs of flip-checks in one puzzle. The decoder pairs lights across rounds, not round by round. Real decoders do it in windows of rounds; this figure is one window.
- **Generated, not typed:** `tools/other-half-data.mjs` gets a `film` block. From the error list (the flip and the wrong report, with their rounds) and the check definitions in `lattice.json`, it computes the lights and writes `data/film.json` (source `OWN-ENUM`, "a constructed example, not a measurement"). A test recomputes the lights and compares them with the file.
- **Scale stays in the passage** (1.1 µs a round, 48 checks at distance 7, about ninety thousand rounds in a blink). It isn't drawn.

## 4. The picture: two forms, sketched first

Common to both: the article's ink line, the one blue accent, the tiles and fired state of `lattice`, and the mono axis `… round 1 2 3 4 5 6 7 8 …` with faded ellipses at both ends. Foot line: `a constructed example · 8 rounds from a longer run`. The only error mark is the X, drawn dashed (the chip never shows it) between rounds 2 and 3. The joins are straight hairline segments, dashed in the accent: one across the grid, one along time.

- **A, the filmstrip:** eight small `lattice` grids side by side, round numbers under each, time running left to right. On phones, two rows of four. No depth at all; the film is literal without being said.
- **B, the oblique space-time drawing:** round 1 drawn whole and face on at the front, never rotated. Behind it, along a 30° drafting axis foreshortened to one half, each of the 8 checks continues as a hairline through time, with a small open point for every round. A lit check is a solid accent point on its line. The axis step is computed so that no point of any round lands on another check's line; a gate checks this.

Steps, scroll triggered, time played. The pen draws at an even, clock-like pace: rounds are evenly spaced, so linear timing is the truthful one.

| Step | What appears | Note (a fact the reader can check) |
|---|---|---|
| 0 | One round, face on: the grid, nothing lit. | "one round: 8 checks, one answer each" |
| 1 | The other seven rounds are drawn in, one by one, at an even pace; all quiet. | "a round every 1.1 µs, the same 8 checks each time" |
| 2 | Round 3: `z0` and `z1` lit; the dashed X on qubit 4 between rounds 2 and 3. | "round 3: z0 and z1 fire – a flip on qubit 4" |
| 3 | Rounds 5 and 6: `z3` lit in both; no qubit marked. | "z3 fires in rounds 5 and 6 – a wrong report, no qubit hit" |
| 4 | The two joins: across the grid in round 3, along time from round 5 to round 6. | "pairs run across the chip and along time" |

Print and stills: one composite with every lit check, the X, both joins and the notes.

## 5. The held scene (mechanism)

- **Markup**, once it moves into the engine: `:::scene film held`. In the prototype it is a lab page (`figures/_held.html`), so the engine isn't touched. Next to it is a second lab page with the same figure as an ordinary pinned scene, for comparison.
- **What stays:** the passage (section 4's second paragraph) and the figure, side by side, in one block held in the window (`position: sticky`, sized in `svh`, so a phone's address bar doesn't move it). Behind it is a stretch of empty scroll.
- **Scroll to steps:**
  - Step 1 is due within 10% of a window after the block is held, so the first scroll gets an answer.
  - Steps 2 to 4 sit at equal bands of 35% of the window, with 25 px of hysteresis at each edge, so a resting trackpad never flips a step.
  - Steps play in time: 1.8 s, at least 1.2 s. When two or fewer steps are behind, each plays at full length; more behind, they are shortened as the engine does today. Back plays in 0.6 s.
  - After the last step, a rest of one band, and the figure stays in view until that step has played. Then the block lets go.
- **Length:** about 1.5 window heights held in total. His call (section 7).
- **Ways through:** a skip link before the block (visible on focus), and Space and Page Down. The notes are page text for screen readers, because the SVG is hidden from them.
- **When it holds:**
  - The engine's `MODES` decide, not a new threshold. Where the scene would be read as stills, there is no hold.
  - Reduced motion and print get no hold either.
  - A height-only resize under 150 px (a phone's address bar) neither lays the page out again nor re-anchors it.
  - Jumps, reloads, back and forward (`pageshow`) and restored scroll positions all set the state for that position at once.

## 6. Evaluation (more effort than the build)

1. **Sketch review** (before any motion): steps 0, 2 and 4 of A and B, at 708 px and 355 px wide, as static lab sheets. Reviewed by the sceptic and the specialist. Then **he picks A or B.**
2. **Gates:**
   - every number is from `film.json`, and the physics test passes;
   - no point collisions in B;
   - lettering of at least 11 px on screen and 11.5 px on top;
   - nothing outside the frame;
   - en dashes;
   - the composite contains everything.
3. **Motion, measured:** the timing tool gets hold readers (steady wheel, trackpad with inertia, phone flick, Space). Each step is complete within its time, at least 1.2 s at the steady wheel; no step flips while resting; the figure is in view until its last step has played.
4. **Devices:** 1440×900, 1280×720, 390×844 upright, 844×390 sideways and print, as screenshots of every step plus a video at reading pace. On real phones, one iPhone and one Android scrolled by hand: only he can do this.
5. **Readers on the prototype:** the specialist, the motion designer (driving the live lab page, held against pinned), the sceptic and one lay reader for the five-second test.
6. **His eye:** he scrolls both versions before anything moves into the article.

**Done when:** the readers' median is near 9, the gates pass, and he has scrolled it and chosen. Only then does `:::scene film held` go into the engine and the article.

## 7. For him (only what he can answer)

- A or B, once he sees the sketches.
- Is about 1.5 window heights of held scrolling acceptable?
- Can he scroll the lab page on a real iPhone or Android when it's ready?
