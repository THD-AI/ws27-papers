# Section 4 visuals – build notes

## Build notes (before coding, 21 November 2026)

Brief: `VISUALS-PURPOSE.md` section 6 (draft 3 and the 3.1 changes); section 0 is history. Requirements 3–7 are built here; 1–2 (references, drawings) are done (`art/tt-block.png`, `art/tt-strip.png`, approved); 8 (fresh readers) comes after.

### What I understand

**The one idea:** you never see the errors, only alarms, very fast, and different sets of errors set off the same alarms. One picture per state, three to five things, readable in five seconds on a phone.

**`gauges` (scene, 4 steps), placed by code from two drawings:**
- Three copies of the block in a row with narrow gaps, one ground line, a glass strip across each gap (the strip drawing, centred on the gap, one end on each block).
- Step 0: the row at rest; the strip drawn once large as the key: "a glass strip where two blocks meet: it cracks if they move against each other, either way". At each look, a cracked strip is noted and replaced (3.1, engineer's wording): said in the key's second line, so a cracked strip means "moved since the last look", which frame 3 of the film needs.
- Step 1: both strips cracked (one diagonal shear line through the strip, not a shatter) and lit with the article's fired mark (accent field over the glass, solid accent dot). The blocks stay where they are; the line says the movement is far too small to see. Question: "Which block moved?"
- Step 2: two dotted guesses at a smaller scale, "the middle one?" and "both ends?", each the same cracked and lit strips, the guessed block(s) one step down at full height (base under the ground line). The main row keeps its cracks: the reader compares.
- Step 3: the silent case, its own step: all three one step down, no strip cracked, a dotted "level before" line at the old roof line, and "All three moved: nothing cracks, so nobody can tell, and the level of the row was what was stored."
- Wide and tall layouts; a print composite with all four facts (key, cracked row and question, the two guesses, the silent case).
- Words on the page: "a glass strip", "where two blocks meet". Never "tell-tale", "elevation", "movement joint", "joint".

**`film` (figure in the text flow, not a scene):** the bridging line exactly as 3.1 words it, three small unlabelled frames of the distance-3 grid (checks as tiles between the qubit dots, as in `lattice`), frame 2 with `z0` and `z1` lit, frames 1 and 3 dark, and beside frame 2, small, "two of the stories that fit": a flip on qubit 4, or flips on 1 and 7. Same lit mark as the strips.
- Why a figure and not a scene: it is one picture with nothing to reveal in order (the frames are the order), and a scene needs a passage per step, which would add words to section 4. As a figure in the text it plays once (frames left to right, then the stories), prints as itself, and keeps the section short.

**Data:** `tools/other-half-data.mjs` writes `data/gauges.json` (three blocks, two strips, stories middle / both ends / all three, cracked strips computed by a parity rule) and `data/film.json` (3 rounds, frames computed as the change between consecutive rounds). Assertions as the plan lists them; the logical row `{3,4,5}` is checked to commute with every phase-check, and the two stories together (`{1,4,7}`) overlap it an odd number of times.

**Text:** the analogy passages go in as `@step n screen` (screen only; print keeps section 4's paragraphs and the scene's caption), so the argued text changes as little as possible. The existing third paragraph of section 4 ("The fired checks … Many sets of errors light up the same points.") becomes the step-2 passage unchanged. Every new or changed sentence is listed in `s4-text-changes.md` for his decision.

### Contradictions and how I resolve them

1. **Dabs at each end vs the approved drawing.** 3.1 asks for "a glass strip bedded on a dab at each end; the two dabs are drawn". The approved `tt-strip.png` is one plaster pad with a glass slip set in it (a *témoin en plâtre* with glass). The drawing is approved by him; I use it as it is and do not draw dabs in code (that would be code imitating his line). Noted for the engineer's review of the drawing (requirement 8).
2. **Silent case in step 2 or its own step.** Requirement 3's table puts it "small beside" the guesses in step 2; the 3.1 list makes it "a step of its own after the two guesses". 3.1 wins: four steps, as the brief to me also says.
3. **Silent-case label.** The table says "the dangerous case: nothing shows"; 3.1 replaces it with the reasoned line. 3.1 wins.
4. **Caption ending.** Section 0 says "before the next frame", requirement 3 "before the next look". "Look" (lay reader, requirement 3).
5. **Where the art is served from.** `lib/build.mjs` copies only `card.png` and the hero layers from `art/` into `dist/`; I may not touch `lib/`. Folders inside `figures/` are copied whole, so the figure uses trimmed copies of the two drawings in `figures/tt/` (cropped to the ink box plus a margin, pixels otherwise unchanged; the originals stay in `art/`). To be decided by him: allow `tt-*` in the builder's art filter instead, and drop the copies.
6. **Lab frame width.** The task asks for wide shots at 708 px (scene width beside the text at 1440); the lab's default scene frame is 860. Shots are taken at `w=708`.
7. **"Lights are the strips" vs only flip-checks.** The bridging line's 3.1 wording ("a lit square is a cracked strip, for flips") is used as given; phase-check tiles stay drawn but dark, as in `lattice`.
