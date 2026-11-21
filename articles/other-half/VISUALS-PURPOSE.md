# Purpose brief: which visuals the article is missing, and why

Status: draft 2 (section 0). Draft 1 was judged by the three readers, the specialist and the AI-made sceptic (`reviews/purpose-*.md`, round 2). Nothing is sketched yet. His correction of 21 November 2026 (dotUni `.docs/transcripts/2026-11-21-006`): the space-time chart was "too cluttered … too much info for a normal person". It was planned for feasibility, not purpose. "We're not trying to recreate the Google research paper": this is our own research article, partly illustrated with OpenAI image generation, and every explanation must be intuitive for anyone who reads it, with analogies and comparisons where they help.

The held-scene prototype (`HELD-SCENE.md`, branch `feat/held-scene`) is set aside. If a visual below turns out to need its own way of scrolling, it can come back as a tool; it is not the starting point.

## 0. Draft 2: what the review changed (SUPERSEDED by section 6, draft 3.1; the gauge and the slabs below are not the brief)

All five pick C, the analogy and then the film:

| | Teacher | Professional | Student | Specialist (truth) | Sceptic (AI look) |
|---|---|---|---|---|---|
| A | 7 | 7 | 5 | 5, 8 corrected | 5, 8 constrained |
| B | 4 | 4 | 5 | 9 | 8 |
| C | 8 | 8 | 7 | 8.5 corrected | 8, 9 constrained |

- **Draft 1's example was wrong** (student and specialist). Room 2 lights the alarms on walls 1|2 and 2|3; rooms 3 and 4 together don't light the same ones.
- **A smoke alarm is the wrong device** (student, specialist, professional and sceptic). It rings when trouble is near, but a check compares its two neighbours: trouble on both sides cancels. With alarms, the silent line of errors in section 5 would contradict the picture. Smoke alarms also go on ceilings, not shared walls.

**The analogy now: gauges on the joints of a building** (the specialist's and the sceptic's device, his father's trade). A row of three floor slabs seen in section, with a settlement gauge across each joint: a real builder's tell-tale that shows whether the two slabs on either side have moved against each other. The engineer reads the gauges at fixed intervals.
- A slab that sinks moves both gauges on its joints. A slab at the end of the row has one joint and moves one gauge. That's the edge.
- Two neighbouring slabs that sink together leave the gauge between them unchanged. Only the ends of a line show: the silent line of section 5.
- **The two stories:** the middle slab sank, or both end slabs sank. Both move exactly the same two gauges. You read the gauges, not the slabs.
- A gauge shows a change since the last reading. A reading can be wrong once (misread), then right again. That's why it has to be a film.
- It is honestly the simplest code, the row of three that section 2 already introduces (qubits all-0 or all-1 together). The figure says so: "the simplest version, three in a row". The real grid follows in B.

**The film (B), the specialist's example on the real grid** (`data/lattice.json`), three small frames, unlabelled:
- frame 1 dark;
- frame 2 with `z0` and `z1` lit;
- frame 3 dark again, though nothing was repaired, because a light means "changed since the round before".

Two stories fit frame 2: one flip on the centre qubit 4, or two flips on the corners, qubits 2 and 6. Together they cross the grid from edge to edge, so picking the wrong one is section 5's silent logical error. One flip is likelier than two, which leads into section 6. The two stories are drawn small, beside frame 2 only.

**Constraints on the drawing** (sceptic):
- It is generated from his own line drawing (`hand.png`) and real photographs: a building section, and a real tell-tale gauge. On white, never at night, no people, no cute props, a shape distinct from the Renovate house. He approves the candidate himself.
- The model draws only the slabs and unread gauges. Every moved gauge, every mark for the two stories and every word is placed by code, in the article's flat lit state: the accent field and a solid dot, no glow, no red, no motion lines.
- The film reuses the same lit mark, so the reader sees the building turn into the grid (teacher).
- Caption ending (professional): "so a program has to guess which it was, before the next frame".

**Dropped from section 4** (sceptic and specialist): "holding hands" (backwards: the holds are what checks measure, and they carry no message) and "two notes cancelling" (wrong: a phase error flips the relative sign, nothing cancels). Both would also look like stock imagery. The §6 city map is dropped too. The threshold curves and the scoreboard stay candidates, as plain charts drawn in code.

**A note for the text** (specialist): in section 2, "no single one holds the information" is only half true for the three-qubit code. Measuring one qubit does reveal 0 against 1; what no single qubit holds is the superposition. To fix in a later text pass.

## 1. Who reads it

Everyone the article reaches, and the visual has to work for the least prepared of them:
- **A curious non-specialist on a phone** (in the first round, a teacher): no physics. She skims when numbers stack up, and keeps reading when there is a picture she can hold in her head.
- **A professional from LinkedIn** (a product manager): gives it a few minutes, wants the story, and knows roughly what a neural network is.
- **A first-year AI student at THD** (the authors' own community): can code and has heard of matching, but knows no quantum.
- The professor and specialists read it too, but for them the facts must be right; the pictures aren't for them.

## 2. What the readers said (round 1, `reviews/purpose-*.md`)

| Moment | Teacher | Professional | Student |
|---|---|---|---|
| §4 the film of hints: shown, not only named | 2 | 1 | 1 |
| §6 why the other explanation is likelier ("two ways add up") | 3 | | 3 |
| §2 the threshold (bigger is better only below it) | | 3 | runner-up |
| §2 information in the relation between qubits, in none alone | 1 | | |
| §3 flip against phase error | | | 2 |
| §9 the verdict as a plain scoreboard (accuracy, cost, examples needed) | | 2 | |

All three put section 4 first or second, and for the same reason. The teacher: "the film is only announced, never shown". The professional: section 4 "reads like a numbers break that's easy to skip", although "the only output of a running quantum computer is a very fast stream of ambiguous blinking checks". The student: "the decoder never sees errors, only a film of lit checks over time that many error histories could produce".

## 3. The visual for section 4

**Why it exists:** section 4 is the hinge of the article. It turns "checks fire" (section 3) into the decoder's job (sections 5 and 6) and its deadline (section 8). Without a picture, readers skip the hinge, and sections 5 to 8 lose their ground.

**The one idea:** *You never see the errors, only alarms going off, very fast, and different errors can set off the same alarms.*

Everything else stays in the text: the distance-7 numbers, the 48 checks, flip-checks against phase-checks, and check names such as z0.

**What it must not be:** a chart, a grid with labels, eight rounds, or anything a reader has to decode. One picture, three to five things in it, readable in five seconds on a phone.

**Concepts** (each with what it maps truthfully and where it misleads):

### A. The alarms in a dark building (an analogy, generated in his line)

A building seen in cross-section at night, drawn in his one-line style from real references: a row of rooms with a smoke alarm on each wall between two rooms. We never see inside the rooms. When something happens in a room, the alarms on both its walls light up. A room at the end has a wall alarm on one side only. Underneath: "You only see which alarms went off. Was it the second room, or the third and fourth together?" Two small inset sketches show the two stories that light the same alarms.
- **Maps:** errors are unseen; a check sits between qubits and fires when something changes beside it; an error at the edge lights one alarm, not two; different causes give the same alarms. His father's civil-engineering eye suits a building in section.
- **Misleads:** a real check compares with the round before (an alarm lights when its reading changes, not while smoke is present); the code is a grid, not a row; phase errors have no counterpart. The text carries those.
- **Time:** shown as three small snapshots of the same building, "every 1.1 µs, millions a second". Or left to the text.

### B. The film itself, simply (no analogy, the article's own drawing)

Three big frames of the smallest grid, the one the reader already knows from section 3, drawn without labels: three snapshots one after another, a few alarms lit. Under the frames, two faint "what really happened?" panels: two different sets of hidden errors that both play exactly this film. One line: "a frame every 1.1 µs, about 90,000 frames in a blink".
- **Maps:** exactly the physics, with no translation step.
- **Misleads:** little; the risk is that it looks like "another grid of circles", the teacher's complaint about the current figure.

### C. A then B (recommended for review)

The analogy as the section's picture, generated in his line: it makes the idea feel obvious. Then the film itself, small and simple, as the scroll scene: it makes the idea exact. The analogy names the parts (rooms, walls, alarms); the film shows them on the real grid.

## 4. The other moments (for him to choose from later, not now)

- **§6, "two ways add up":** one route to the wrong answer against two routes to the right one, like guessing someone's city instead of their exact route. The 10 and 19 of 30 shown as votes.
- **§2, the threshold:** two curves of error against grid size, one rising (above the threshold) and one falling (below), with "years of hardware" and "Google 2024" marked.
- **§2, information in the relation:** three people holding hands, with the message in the hold, not in any one hand.
- **§3, flip against phase:** a bit turned over beside two notes that cancel when one is shifted (to be checked by the specialist).
- **§9, the verdict:** a plain scoreboard: three decoders, accuracy at two sizes, examples needed, and free against trained.

## 5. How the concepts get judged (before any sketch)

The three readers from round 1 judge section 3 against their own words: does A, B or C make section 4 land? A quantum error-correction specialist judges whether the analogy is true enough, and where it would mislead. The AI-made sceptic judges whether a generated building in his line can avoid the generic generated look. Then he gets one recommendation with the reasons, not a prototype.

## 6. Build plan for section 4, draft 3

Status: draft 3. Draft 2's plan was reviewed by a civil engineer (the trade reviewer, overall 5.5, 8.5 with changes), a fresh quantum error-correction specialist (7) and a fresh lay reader (slab picture 6, film 4). Reviews: `reviews/s4-plan-*.md`. He agreed to the building analogy on 21 November (transcript `-007`), on the condition that it goes through the playbook. Every number below is a claim for the reviewers to check.

**What changed after the plan review:**
- **The fault all three found:** a real gauge shows direction. "Middle sank" reads "middle side lower" at both joints, and "both ends sank" reads the opposite, so an engineer could tell the two stories apart and the point breaks. A check only says that something changed, never which way.
- **The device is now a glass tell-tale:** a thin glass strip glued across the joint. It cracks if the blocks on either side move against each other, either way, and says nothing else. A fresh strip is fitted after every look, so a cracked strip means "moved since the last look" (specialist and lay reader: direction-free, only "moved"). The engineer's alternative, a crack monitor with story two as "both end blocks rose", is recorded and not taken: a glass strip that is cracked or whole needs no scale, so a lay reader reads it at once.
- **The setting:** three separate blocks with movement joints, in elevation, with nothing beyond the two end blocks. Floor slabs in section were wrong: tell-tales sit on vertical faces, and dowelled slabs don't sink on their own (engineer). Each block stays level or drops by one step, never by different amounts: a flip is all or nothing (specialist).
- **The picture hides the answer:** the main state shows only the cracked strips and the question. The two stories are dotted guesses beside it, each marked "?", never the answer (lay reader).
- **The silent case is shown:** all three blocks moving together crack no strip. It is drawn once, small, and labelled as the dangerous case, not a harmless one (engineer and specialist).
- **The misreading claim is dropped:** a strip cracked by a knock shows once, not twice, so the analogy can't show a wrong report. Draft 2's sentence "that's why it has to be a film" goes; the film is there because the looks come every millionth of a second (specialist).
- **The film's second story is qubits 1 and 7,** a straight column with qubit 4, like the line in section 5. The caption says "two of the stories that fit": others fit too (specialist).
- **One bridging line between the two scenes:** "The real chip is a square, not a row: dots are the hidden qubits, lights are the strips, one look every millionth of a second" (lay reader, wording to be fitted to the article's terms).

**Draft 3.1, after the second plan review** (engineer 8 → 9 with these, specialist 8.5, lay reader 8 for the blocks and 6 for the film):
- **The strip as a builder fixes it:** a glass strip bedded on a dab at each end, one end on each side of the joint; the two dabs are drawn, and the unbonded middle is what makes it work. At each look, any cracked strip is noted and replaced with a new one. A crack is one diagonal shear line through the strip, not a shatter (engineer).
- **The words on the page:** "a glass strip" and "where two blocks meet". "Tell-tale", "elevation" and "movement joint" stay off the page; in the plan the joint is a settlement joint (engineer and lay reader).
- **A ground line under the row.** A dropped block keeps its height and moves down one step. In the silent case the ground line is the only thing that shows it (engineer).
- **The silent case gets its reason:** "all three moved: nothing cracks, so nobody can tell, and the level of the row was what was stored". It is a step of its own after the two guesses, not crowded into them (engineer, specialist, lay reader).
- **One mark across both scenes:** the grid's lit mark (accent field and solid dot) sits on each cracked strip in the block picture too, so "lit" means the same in both (lay reader).
- **On the grid, checks look different from qubits:** checks are drawn as the article's tiles between the qubit dots, the way the strips sit between blocks (lay reader).
- **The bridging line, exact:** "The real chip is a square, not a row. The dots are the hidden qubits; a lit square is a cracked strip, for flips; and it looks about a million times a second." Phase-checks have no strip and are left out of the comparison (specialist).
- **The logical row is named:** `{3, 4, 5}`, the middle row. The generator checks that it commutes with every phase-check, and that the two stories together overlap it in an odd number of qubits (specialist).

**References** (engineer's search; nothing downloaded yet):
- First choice: [Chartres, Église Saint-Aignan, témoin à lame de verre 01](https://commons.wikimedia.org/wiki/File:Chartres,_%C3%89glise_Saint-Aignan,_T%C3%A9moin_%C3%A0_lame_de_verre_01.jpg) by Coyau, CC BY-SA 3.0, 3456×2304, about 9.1 MB.
- Second view of the same: `…_02.jpg` by Coyau, CC BY-SA 3.0, about 8.0 MB.
- Backup, CC0: "Basilique de Saint-Quentin – Témoin de fissure 1922" by Renhour48, about 10.9 MB.
- A HABS/HAER elevation (public domain) for the line is still to be found by eye. Otherwise `hand.png` alone carries the line.

| # | Requirement | File | Done when |
|---|---|---|---|
| 1 | **Research and references:** a free-licensed photograph of a glass tell-tale on a wall, a public-domain measured elevation (HABS/HAER) for the line, and `hand.png`. The engineering manuals are for checking only | `21-Paper-Studio/forge/refs/SOURCES.md`, `sources.json` | Each reference has author, licence and fetch date recorded. **Downloads only with his OK** (filename, source and size stated) |
| 2 | **The drawing:** three separate flat-roofed blocks in elevation with two movement joints and a glass strip across each, intact; and one large strip drawn once beside the row, as the key. His line, on white, no people, no props, no text. Each block is drawn as a separate element, so code can drop one by one step | `forge/boards/tell-tale-blocks.json` (and `tell-tale-key.json`) | At most two rounds of three candidates. Each is looked at full size on white and on dark. One is approved as a first pass, then by him |
| 3 | **The analogy scene, placed by code.** Step 0: the row at rest, and the key "a glass strip: it cracks if the blocks either side move". Step 1: both strips cracked, nothing else shown, and the question "which block moved?" Step 2: two dotted guesses, "the middle one?" and "both ends?", each marked "?". Small beside them: all three moved, no strip cracked, "the dangerous case: nothing shows". Caption ending: "so a program has to guess which it was, before the next look" | `articles/other-half/figures/gauges.js`, `data/gauges.json` from `tools/other-half-data.mjs` | **Generator asserts:** the middle story and the both-ends story crack the same strips; all three together crack none. A fresh lay reader, given five seconds on step 2, states the one idea |
| 4 | **The film on the real grid:** three small frames, unlabelled, preceded by the bridging line. Frame 1 dark; frame 2 with `z0` and `z1` lit; frame 3 dark, each frame computed as the change between consecutive rounds. Beside frame 2, "two of the stories that fit": qubit 4, or qubits 1 and 7 | `figures/film.js` (rewritten), `data/film.json` (regenerated) | **Generator asserts:** both stories light exactly `z0` and `z1`, and no phase-check fires. The two stories together overlap a logical row in an odd number of qubits, so they differ by a logical error. Each frame is the change between consecutive rounds |
| 5 | **Text:** the two scenes go into section 4 with the fewest words changed. Every changed sentence is listed for his yes | `articles/other-half/text.md` | A diff of section 4 only, every change listed |
| 6 | **Print and phones:** both scenes print as stills and read at 390 px | the same files | The gates pass |
| 7 | **Gates:** lettering at least 11 px (11.5 on top); no line through lettering; nothing outside the frame; en dashes; `node tools/read.mjs other-half`; motion and timing on the new scenes; print | – | All green |
| 8 | **Review the work:** three fresh readers (lay, specialist, AI-made sceptic) on the built scenes, with video; the engineer on the drawing; then his eye | `reviews/s4-*.md` | Median near 9, or Limits to him after three rounds |

Not taken, with reasons:
- The held-scroll mechanism: ordinary scenes are enough for two short ones.
- The other candidate visuals: later, by his choice.
- The section 2 wording fix: a separate text pass.

Branch: a new branch from `main` (`feat/section4-visuals`), carrying this brief and its reviews.
