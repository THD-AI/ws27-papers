# Purpose brief: which visuals the article is missing, and why

Status: draft 2 (section 0). Draft 1 was judged by the three readers, the specialist and the AI-made sceptic (`reviews/purpose-*.md`, round 2). Nothing is sketched yet. His correction of 21 November 2026 (dotUni `.docs/transcripts/2026-11-21-006`): the space-time chart was "too cluttered … too much info for a normal person". It was planned for feasibility, not purpose. "We're not trying to recreate the Google research paper": this is our own research article, partly illustrated with OpenAI image generation, and every explanation must be intuitive for anyone who reads it, with analogies and comparisons where they help.

The held-scene prototype (`HELD-SCENE.md`, branch `feat/held-scene`) is set aside. If a visual below turns out to need its own way of scrolling, it can come back as a tool; it is not the starting point.

## 0. Draft 2: what the review changed

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

## 6. Build plan for section 4 (playbook: plan, to be reviewed before any work)

He agreed to the slab-and-gauge analogy on 21 November (transcript `-007`), on the condition that it goes through the playbook. Every number below is a claim for the reviewers to check.

| # | Requirement | File | Done when |
|---|---|---|---|
| 1 | **Research first:** what a real tell-tale crack monitor and a settlement gauge look like and how an engineer reads them, from free-licensed photographs and a building-section reference | `21-Paper-Studio/forge/refs/SOURCES.md`, `sources.json` | Two or three references, each with author, licence (CC BY, CC BY-SA, CC0 or public domain) and fetch date recorded. **Downloads only with his OK** (filename, source and size stated) |
| 2 | **The drawing:** a row of three floor slabs in section with a gauge across each of the two joints, the gauges unread and neutral; his line from `hand.png`; on white, no people, no props, no text, a shape distinct from the Renovate house | `21-Paper-Studio/forge/boards/gauge-slabs.json` | At most two rounds of three candidates. Each is looked at full size on white and on dark. One is approved as a first pass, then by him |
| 3 | **The analogy scene,** placed by code over the drawing. Step 0: the row and its two gauges, all at rest. Step 1: both gauges moved, accent field and solid dot, and the question "which slab moved?". Step 2: two small copies of the same drawing (reused, never generated again): the middle slab sank, or both end slabs sank. Both move the same two gauges. Caption ending: "so a program has to guess which it was, before the next frame". The scene says what it is: "the simplest version: three in a row" | `articles/other-half/figures/gauges.js`, data `data/gauges.json` written by `tools/other-half-data.mjs` | A fresh lay reader, given five seconds on the last step, states the one idea. Every moved gauge is computed from the data, not placed by hand |
| 4 | **The film on the real grid:** three small frames, unlabelled. Frame 1 dark; frame 2 with `z0` and `z1` lit; frame 3 dark. Beside frame 2, the two stories small: qubit 4, or qubits 2 and 6. The lit mark is the same as in the analogy | `figures/film.js` (rewritten), `data/film.json` (regenerated) | The generator checks that both stories light exactly `z0` and `z1`, and that together they commute with every flip-check and cross from edge to edge. Five-second test as above |
| 5 | **Text:** the two scenes go into section 4 at its second and third paragraphs, with the fewest words changed. Any change to his text is listed for his yes | `articles/other-half/text.md` | A diff of section 4 only, with every changed sentence listed |
| 6 | **Print and phones:** both scenes print as stills and read at 390 px | the same files | Gates below pass |
| 7 | **Gates:** lettering at least 11 px (11.5 on top); no line through lettering; nothing outside the frame; en dashes; `node tools/read.mjs other-half`; the motion and timing tools on the new scenes; print | – | All green |
| 8 | **Review the work:** three fresh readers (lay, specialist, AI-made sceptic) on the built scenes, with video; then his eye | `reviews/s4-*.md` | Median near 9, or Limits to him after three rounds |

Not taken, with reasons:
- The held-scroll mechanism stays on its branch: ordinary scenes are enough for two short scenes.
- The other candidate visuals (threshold, scoreboard, "two ways") come later, by his choice.
- The section 2 wording fix is a separate text pass.

Branch: this work moves to a new branch from `main` (`feat/section4-visuals`), carrying this brief and its reviews. `feat/held-scene` keeps the prototype.
