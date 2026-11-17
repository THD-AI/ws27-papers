# Figures for "The other half of a quantum computer"

Read `SPEC.md` first (figure contract, design system). Each figure below says what a reader must take from it in five seconds, its steps, and its data. The data is in `data/<id>.json` with the source id on every entry; draw nothing that is not in the data. The article text is `text.md`; the step numbers below match its `@step` lines.

Pacing (17 November 2026): each scene step draws across its passage, from t 0 to about 0.9, in reading order, with labels after what they label; a step does not finish in its first third. Only titles, lane titles, axes and frames stand from the start of a step. The author found the compressed timing of the web rounds rushed ("bang, bang, bang"); this restores the earlier pacing and keeps the layout fixes of those rounds.

Three sizes, as in the storyboard: one large opening scene (the hero drawing), three scroll scenes (`lattice`, `clock`, `learning`), four figures in the text flow (`syndromes`, `line`, `suppression`, `noise`) and one small margin scene (`qubits`).

Where the data comes from: `learning`, `noise`, `syndromes`, `lattice`, `line` and `qubits` are written by `node tools/other-half-data.mjs` from the group's result files and are never edited by hand. `clock` and `suppression` are copied by hand from the cited papers and were revised after the fact check of 16 November 2026. `data/results-summary.json` is not a figure: it holds every own number used in the text, with its file.

Honesty rules that override looks:

- The group's own results and Google's results never share a plate, an axis or a colour key. Quoted figures carry a small mono tag `Google, 2024` or `preprint, 2025`; own figures carry `our runs`.
- Every own point is drawn with its 95% interval. Where a run has several seeds, each seed is its own thin line or mark; no average line without the seeds behind it. Three seeds of distance 3 and three of the long distance-5 run were run later as a repeat with new seeds (`later_repeat` in the data); they are drawn like the others, and the plate says how many seeds it shows.
- Everything of ours is simulation. No figure of ours shows a chip, and no caption or note says what a decoder would do on one.
- A claim that has not been reviewed is drawn dashed and open-ended, with the word `claimed`, never as a measured mark.
- Where a value is not known, draw the absence with an italic note ("not measured", "not published"), never an estimate. Do not extend a curve past its last point.
- One vocabulary, the text's: storing qubit, helper, check, fires, flip, phase error, round, run, example, noise level. Not: data qubit, ancilla, stabilizer, syndrome, shot, detector, physical error rate. The file names keep the technical words; the page does not.
- A flip is marked X, a phase error Z, both at once Y, as in the proposal's figure, with a three-line key in italic the first time they appear.

## Motion timing (17 November 2026): triggered by scroll, played by time

A step now starts when its passage is reached and plays its timeline (t 0 to 1) over a set time; each figure exports `durations` in seconds, one per step (dotUni `docs/papers/innovation/loop-motion.md`). Inside a step things arrive in reading order at least 0.15 s apart, a label 0.2 to 0.4 s after what it names, and the timeline is busy over about 75% or more of t.

- **`lattice`** `[2.4, 1.8, 1.8, 1.8, 2.6, 2.4]`: step 0 starts with the leftmost tile at once; its notes arrive one by one (qubits, checks, the sum). Steps 1 to 3 overlap their arrivals a little (the error, the fired checks, the note, the key); step 5 starts at once.
- **`clock`** `[2.4, 2.0, 2.4, 2.4, 1.8]`: step 1, the bracket and "about 22 rounds meanwhile" are separate, to 0.92. Step 4 goes the axis moving down, the claim's lane and blocks, its note, then its tag (was still from 0.54).
- **`learning`** `[3.0, 2.8, 2.6]`: unchanged inside (already busy over 84–86%).
- **`line`**, **`syndromes`**, **`noise`** `medium: [2.0]`; **`suppression`** `medium: [1.8]`: unchanged inside.
- **`qubits`** (margin) `small: [0.6, 0.9, 1.0, 1.1, 1.0, 1.1]`: the new dots start while the grid still shrinks (from 0.3 of the change, not 0.38).

## `lattice` (scene, 6 steps): the smallest grid, and three fired checks with two explanations

Five-second reading at the last step: "the same three fired checks can be explained in two ways; the standard decoder picks the one that is right one time in three, and the other is right six times in ten". Steps 0 to 2: "errors are never seen; only the checks next to them fire, and in a row of errors only the ends".

This is the proposal's Figure 1, built up. Geometry and example come from `data/lattice.json` (source OWN-ENUM): 9 storing qubits in a 3 by 3 grid, `q = row * 3 + col`; 8 checks, each a tile between its qubits (four squares, four half-round tiles at the edges). Checks that ask about flips (`z0` to `z3`) and checks that ask about phase errors (`x0` to `x3`) are told apart by a quiet tint and a hairline in two weights, not by two strong colours; the accent is kept for what fires. A fired check gets the accent field and a solid dot.

- Step 0: the grid alone, drawn from left to right. Note with leader: "9 storing qubits, never read directly". Second note: "8 checks, each asks its neighbours one question". Count in mono: `9 + 8 = 17`.
- Step 1: a flip appears on the centre qubit (`walk[0]`: qubit 4, X). The two flip-checks beside it fire (`z0`, `z1`). Note: "one flip: the two checks beside it fire".
- Step 2: a second flip below it (`walk[1]`: qubit 7). The check between the two goes quiet, one check stays fired (`z0`), and the row ends at the bottom edge. Note: "a row of errors: only its ends fire, and an end at the edge fires nothing".
- Step 3: the errors of steps 1 and 2 leave; the example's three checks fire (`example.fired`: `z2`, `x0`, `x1`). Nothing else is drawn on the grid. Note: "3 of 8 checks fired. Which errors?". Two thin dashed joins sketch the pairing puzzle: the flip-check `z2` to the left edge, the phase-checks `x0` and `x1` to each other.
- Step 4: the grid moves to the left third and a first copy appears beside it with plain matching's answer (`example.plain_matching.errors`: X on qubit 0, Z on qubit 4). Note in italic: "plain matching: right 1 time in 3" (draw `chance_right` 0.333 as counted units: a strip of 30 small dots, 10 filled). One pen-like ring around this copy, the only one in the figure.
- Step 5: a second copy with the other answer (`example.read_together.errors`: Y on qubit 0, Z on qubit 8). Note: "read together: right about 6 times in 10" (the same strip, 19 of 30 filled, from `chance_right` 0.622). A third, faint note: "the rest: rarer explanations" (`rest`, 0.045). Under both copies, in mono: `5% error per storing qubit · checks never wrong · our own count`.
- Print composite: the grid at step 2 small on the left, then step 5 (fired checks and both copies) at full size.
- Phone layout (`tall`): the grid on top, the two copies side by side below it.

Do not show the decoder as a box or a machine here. Do not write "wrong" on plain matching's copy: its answer is the less likely one, and it is still right a third of the time.

## `syndromes` (figure, wide): 103 of 256

Five-second reading: "there are 256 possible patterns of fired checks, and in 103 of them the standard decoder's answer is not the most likely one".

A 16 by 16 field of small marks from `data/syndromes.json` (`cells`, source OWN-ENUM). Each mark is one pattern, drawn as a tiny version of the eight checks (a 3 by 3 footprint with the fired checks dark), so that a reader can see that a mark is a pattern and not a dot. Rows are the 16 patterns of the four flip-checks, columns the 16 patterns of the four phase-checks, both in the order given in `grid.order` (fewest fired checks first), so the top-left mark is "no check fired". State `differs`: the mark sits on the accent field. State `same`: no field. There are no ties (`counts.tie` is 0).

- Counted note at the right edge, in mono: `103 of 256`, with one pen-like ring.
- The example of the `lattice` scene (`example`: flip-checks `0010`, phase-checks `1100`) carries a thin leader and the italic note "the pattern shown below". It is one of 8 equally frequent differing patterns, mirror images of each other; the note must not say "the most frequent".
- A second note, italic, bottom left, from `share_of_all_cases_with_a_differing_pattern` (0.016) and `share_of_all_cases_with_no_check_fired` (0.631): "these 103 are the rarer patterns: about 1.6% of all cases. In 63% of cases no check fires". Without this note the figure overstates how often matching is off; it is not optional.
- Row and column labels: only "flips: 0 … 4 checks fired" along the left and "phase errors: 0 … 4 checks fired" along the top, as brackets over the groups. No binary strings on the page.
- Under the field, in mono: `distance 3 · 5% error per storing qubit · checks never wrong · our own count`.
- Do not size or shade marks by probability. If a builder wants to show how rare the filled patterns are, the italic note does it.

## `line` (figure, column): the one mistake that matters

Five-second reading: "three real errors in a column fire one check; the decoder's shortest explanation adds two more, the line crosses the grid, and nothing fires".

Added to the proposed set. Reason: section 5 defines the logical error, the quantity every later figure counts, and the draft had a slot for exactly this picture; a reviewer of draft 3 asked for the point that three errors are enough at distance 5.

Data: `data/line.json` (source OWN-ARITH; a constructed example, recomputed and checked by the script, not a measurement). A grid of distance 5 showing storing qubits and flip-checks only (`flip_checks`); the phase-checks are left out and an italic note says so: "only the checks for flips are drawn".

Three small plates in a row (stacked on phones), all three visible, read left to right:

1. "what happened": three flips in the middle column, rows 0 to 2 (`real_errors`: 2, 7, 12), drawn as X marks in ink. Nothing else.
2. "what the chip reports": the one fired check (`fired_by_real_errors`), accent field and dot. The X marks are gone. Note: "one check fired".
3. "what the decoder adds": the two flips below it (`decoder_correction`: 17, 22), drawn as open X marks in the accent line, with the real ones back in ink. One line in the accent, 2.5px, runs through all five from the top edge to the bottom edge. No check carries a field. Note: "errors and correction cross the grid: the stored value has changed, no check fires".

Counts in mono under plates 1 and 3: `3 real` and `3 real + 2 added = 5 = the distance`. No pen ring here; the line is the mark.

## `suppression` (figure, column): the 2024 result, quoted

Five-second reading: "on Google's chip every step to a bigger grid roughly halved the errors, and the network's ladder falls a little faster than matching's".

Google's data, drawn as Google's. Tag in mono at the top: `Google Quantum AI, 2024 · each recording read by two decoders, both run afterwards`. Data: `data/suppression.json` (source GQA-2024).

Two ladders side by side, matching left, network right. Each ladder has three rungs, distance 3, 5 and 7, labelled with the qubit count (17, 49, 97). On each rung the errors in 100,000 rounds are counted units: one dot is 10 errors (stated in the figure), dots in rows of 10, counted from zero. Matching: 712, 349, 171. Network: 650, 303, 143. Round to whole dots (71, 35, 17 and 65, 30, 14) and print the exact value in mono at the end of each rung.

- Between rungs, a short bracket with the factor in mono: `÷ 2.04` on the matching ladder, `÷ 2.14` on the network ladder (`lambda`). The network's distance-7 rung is the accent; one pen-like ring around `143` with the italic note "171 → 143: about one in six fewer, same recording".
- No line through the rungs, no log axis: the dots are the scale. No extrapolation to distance 9.
- Small italic note at the bottom, from `note_recordings`: "distances 3 and 5: averages over 9 and 4 smaller grids on the same chip (supplementary table S1). Each distance is its own recording". The values are confirmed against the PDF (`status`). Within a rung the two decoders read the same data; across rungs the data differs, so the ring's note says "same recording", not "same chip run" for the whole ladder.
- Never place a mark of the group's own runs in this figure.

## `clock` (scene, 5 steps): accurate, or in time

Five-second reading at the last step: "the chip produces a new round of checks every 1.1 millionths of a second; the 2024 network needs 24 for each, so it falls further and further behind; the matching decoder keeps up with a short constant delay; a 2025 preprint claims a network that keeps up".

The owner rejected an earlier chart on this as not understandable. So: no bar chart, one unit (millionths of a second, written out once, then `µs`), one time axis from left to right, and a reader who has never heard of a round. Data: `data/clock.json`.

The trap to avoid: 24 and 63 are different kinds of number. 24 is how long the network works on one round (the Google paper quotes it from its reference [27]; `kind: "quoted"`). 63 is how long after the last round of a run the live decoder's answer arrives, on average, and it stays about 63 however long the run is. Drawn as two bars, 63 looks worse than 24, which is the opposite of what happened. They are never drawn as two lengths of the same kind, and the 63 is always labelled "answer after the last round, average" (`label_on_page`).

Layout: horizontal lanes over one shared time axis, a faint dot grid behind. Steps 0 to 2 use an axis from `0` to about `75 µs`. Step 3 shows the end of a run.

- Lane 1, "the chip": a tick every 1.1 µs (`round.value`), each tick with a small dot above it: one question. Lane title in Libre Franklin: "the chip asks: which checks fired?". Note: "one round of checks every 1.1 µs, about 900,000 a second" (`rounds_per_second.say`).
- Lane 2, "neural network, 2024": answers drawn as blocks, each 24 µs long (`decoders[0].value`), one after another.
- Lane 3, "matching, live, 2024": a thin line that runs along with the chip's ticks while the run lasts, then one answer dot after the run's last tick.

Steps:

- Step 0: lane 1 only. The ticks draw from left to right. Italic note with leader on one gap: "1.1 millionths of a second". Nothing else.
- Step 1: lane 2 appears with its first block, 24 µs long, starting at the first tick. A bracket above lane 1 spans the ticks that pass meanwhile, with the count in mono: `22 rounds` (`derived[0]`, 21.8, rounded and stated as "about"). Note: "the network needs 24 µs for one round", with the small mono tag `quoted in the 2024 paper`.
- Step 2: the second and third block follow. Thin leaders join each block to the round it answers (rounds 1, 2, 3), so the leaders fan out: the answer to round 3 ends at 72 µs, when the chip is at round 65. The questions not yet answered pile up as unit dots above lane 2, one dot per waiting round, counted in mono. Note: "the backlog grows without end".
- Step 3: the view moves to the end of a run: lane 1's ticks stop at a last tick marked "last round". Lane 3 has run beside the ticks all along and now sets one answer dot 63 µs after the last tick (`decoders[1].value`), with a measured bracket: "answer after the last round, average: 63 µs" and `± 17` in mono. Italic note: "the same for runs of up to a million rounds: it keeps pace". On lane 2 the blocks are still far back; an italic note at its right end, from `derived`: "after a run of a million rounds (1.1 seconds) the network would need 24 seconds". Beside lanes 2 and 3, two small italic notes from `accuracy_on_the_same_recording`: "269 errors in 100,000 rounds, worked out afterwards" and "350 errors in 100,000 rounds, live". These are notes, not a second axis and not bars. A final italic line between the lanes: "accurate, or in time".
- Step 4: a fourth lane, dashed throughout, "neural network, preprint of December 2025": blocks shorter than one tick gap, drawn with an open left end and a dashed outline (`below: 1`), with the mono tag from `tag_on_page`: `claimed · under 1 µs per round on accelerator chips · up to distance 11 · preprint, not peer-reviewed` (AQ2-2025). No accuracy note on this lane. Do not write "simulated data" or "not on a chip" on the page: the first could not be verified for the timing itself, and the paper reports no loop with a quantum chip either way (`verified`).
- Print composite: lanes 1 and 2 at step 2 on the left, the end of the run with lanes 3 and 4 on the right.
- Phone layout (`tall`): the same lanes, the axis shortened to `0` to `30 µs` for steps 0 to 2; step 3 as its own strip below.

The time the live matching decoder needs per round is not in our notes (`time_needed_per_round: null`); do not draw a block length for it, only the line that keeps up.

## `learning` (scene, 3 steps): our own learning curves

Five-second reading, step 0: "on the smallest grid the network gets better with every million examples and ends below both versions of matching". Step 1: "on the next grid, with the same number of examples, it is still above both". Step 2: "trained on four times as many, it ends below plain matching and stays above the better one".

Data: `data/learning.json`, three panels: `d3` (OWN-D3, eight seeds), `d5-66m` (OWN-D5, five seeds), `d5-250m` (OWN-D5-250M, five seeds). Tag in mono: `our runs · simulation · noise level 0.5%`.

One measurement plate. Horizontal axis: examples the network has seen, in millions, on a log scale with ticks at 1, 10, 100 and 250 (the points are spaced by a constant factor). Vertical axis: share of runs in which the decoder was wrong, linear, from 0 to 2.5%, starting at zero. A curve that comes from above 2.5% enters at the top edge with a small mono note of its first plotted value (at distance 5 the network starts above 20%); do not rescale the axis to fit it.

- Each seed is one thin line (1.25px) through its points with its 95% interval as a faint band or short ticks (`curves[].points`). The end of each line carries a small open circle at the final test value (`final_network.per_seed`).
- The two versions of matching are two horizontal level lines across the whole plate (`levels.plain`, `levels.correlated`), each with its interval as a thin band, labelled at the right edge in italic: "plain matching" and "correlated matching", and under both: "needs no examples; given the simulator's exact error model". At distance 3 a third, dotted level: "looked up in a table: 1.47%" (`levels.table`).
- Step 0, distance 3 (`d3`, eight seeds): the eight lines draw from left to right and cross below both levels. Mono at the end: `network 1.48% · plain 1.72% · correlated 1.66% · 8 seeds`. A thin vertical leader where the lines first dip below plain matching: "at 6.6 or 9.3 million examples" (`curves[].first_point_below_plain`: four seeds each). The accent is the network's line ends.
- Step 1, distance 5 (`d5-66m`, five seeds): the plate changes to distance 5 (the title in the plate changes; the distance-3 lines shrink to a faint inset at the top right so the two are never read against each other). Five lines end above both levels at 66 million: `network 1.90 to 2.16% · plain 1.41% · correlated 1.09%`. Italic note: "same network, same number of examples: still above both".
- Step 2, distance 5 on a longer schedule (`d5-250m`, five seeds): five new lines draw from the left edge to 250 million and end between the two levels: `1.29 to 1.36% · 5 seeds`. They are separate runs trained from scratch, not continuations: do not draw them as extensions of the 66-million lines. Two of them share their random seed with a 66-million line and lie exactly on it up to 52 million examples (`d5_250m_against_d5_66m_same_random_seeds`); let that overlap show. One pen-like ring around the five ends, note: "below plain matching, above correlated matching". The five 66-million lines stay, faint.
- Honesty notes that must be on the plate: `d5 runs are five rounds, d3 runs three: not comparable across distances`; and near the right end of the lines, italic: "the last fifth of each run lowers the learning rate" (`note_schedule`). That is why the 66-million lines bend down at their end and finish a little below the long runs at the same count. Do not smooth it away.
- The curve points are scored on a fixed set of 1 million runs per seed, the levels and end circles on 2 million fresh runs per seed (`note_probe`); say so in one mono line under the plate. Because of this, a crossing read off the curve is less sharp than the end values.
- Do not extend any line beyond its last point, and do not draw where the network "would" reach correlated matching.
- Print composite: two plates side by side, distance 3 (step 0) and distance 5 (step 2 with the 66-million lines faint).
- Phone layout (`tall`): the same plate, taller; labels of the levels move inside the plate above their lines.

## `noise` (figure, wide): the long run at eight noise levels

Five-second reading: "at the lowest noise the network is level with the better matching decoder; as noise grows it falls behind it, and at the two highest levels it is behind plain matching too".

Data: `data/noise.json` (source OWN-D5-250M), eight rows. Tag: `our runs · simulation · distance 5 · network trained on 250 million examples · 5 seeds, 10 million runs per level`. The exact values are in the table in the text, so this figure shows the comparison, not the digits.

Small multiples: eight narrow panels in a row (two rows of four on phones), one per noise level, labelled in mono `0.1%` to `1.0%`. The error rates span a factor of almost a thousand, so every panel has its own vertical scale, starting at zero, with its top value printed in mono; an italic note under the row says "each panel has its own scale". Inside a panel: plain matching (ink, open mark) and correlated matching (ink, filled mark) from `plain.pooled` and `correlated.pooled`, each with its 95% interval as a short vertical tick; the network as one accent mark at `network.pooled` with its interval, and behind it five small accent dots, one per seed (`network.per_seed`), so the spread between seeds is visible.

- A thin horizontal hairline at correlated matching's value runs across each panel so the eye compares the network marks against it.
- Under each panel a few words in italic, taken from `network_vs_correlated` and `network_vs_plain` in the data, not typed: 0.1% "level with correlated"; 0.2% to 0.6% "between the two"; 0.8% and 1.0% "behind both". These verdicts compare the 95% intervals of the pooled values (`comparison_basis`); print that basis once, in mono, under the row: `compared: 95% intervals of the pooled values`.
- The 0.6% panel carries the italic note "ahead of plain matching by 2%; four of five seeds" (`network_over_plain`, `seeds_ahead_of_plain`), because here the pooled verdict and one seed disagree.
- The 0.1% panel carries the note "a noise level the network never saw in training" (`trained_at_this_level` is false) and, in mono, the counts `989 against 1,048 in 10 million runs`.
- No lines joining panels, no ratio axis, no ticks and crosses.
- Alternative a builder may choose if eight panels read badly at phone width: a designed table like `pairs` in the first article, each cell a short strip with the mark and its interval. The reading and the notes stay the same.

## `qubits` (margin scene, 6 states): how many, and the other half

A small exact drawing of the grid, drawn in ink line: storing qubits as small open circles, helpers as smaller filled dots between them. The count in mono under it. Data: `data/qubits.json` (source OWN-ARITH). One or two words per label.

- State 0 (opening and section 1): one open circle alone. Label `1 qubit`.
- State 1 (section 2, at the surface code): the grid at distance 3. Label `17 · distance 3`, and smaller: `9 store, 8 help`.
- State 2 (section 3, after the counts): distance 5. Label `49 · distance 5`.
- State 3 (section 4): distance 7. Label `97 · distance 7`, smaller: `48 checks a round`.
- State 4 (section 5): the distance-7 grid moves up and a plain box appears beside it, joined by one line; the box sits on the accent field. Label `the other half`, smaller: `the decoder`.
- State 5 (section 7, at Λ): the grid grows to distance 9, the box stays. Label `161 · distance 9`.

The grid grows from its centre; the dots that are new in a state draw last. At distances 7 and 9 the circles become dots of one size so the drawing stays legible at 14rem; the count carries the number. On phones and in print each state is a small figure at the start of its section.

## Hero (the large opening scene)

`art/hero-line.png` and `art/hero-field.png` are the two layers of one accepted pen drawing, 1536 × 1024 px, transparent. Left third: the open dilution refrigerator of a quantum computer, hanging. The same line leaves the can at its lowest point, runs along the ground as a cable with two loops, and becomes two stacked rack servers on the right. The one colour field starts behind the lower right of the refrigerator, crosses the cable and covers the servers. Show the line layer over the field layer; the field layer has thin gaps where the line sits. Do not edit, redraw, recolour by hand or crop the files. The field in the file is paler than the accent field `#A9B7EC`; whether the shell tints it is the shell's decision, and it applies to the field layer only.

If the files exist, the shell shows them behind the title. If they do not, the title stands alone. Do not draw a substitute.

The drawing is the title made literal: two halves joined by one line. If the shell animates the hero, it follows the accepted scene (`21-Paper-Studio/scenes/other-half/scene.js`): the line is revealed from left to right in two parts, first up to x = 565 of 1536 (the refrigerator), then the cable and the servers; the field fades in after the line has reached the servers. Landmarks in the drawing's own pixels, for any exact mark placed on it: the chip sits at (312, 800) inside the can; the cable reaches the servers at (883, 886).

Exact marks allowed on the hero, all optional and all from the accepted scene: a small square at the chip's position, and three small dots travelling along the cable from the chip to the servers (idle motion only, off in print and with reduced motion). Nothing else: no lattice, no numbers, no labels. The grid and the two explanations belong to the `lattice` scene.

Credit and licence: see `art/SOURCES.md`. The credit line stands in `text.md` under the title block (`Drawing: …`). Whether the drawing must be offered under CC BY-SA is undecided; decide it before the page goes public.
