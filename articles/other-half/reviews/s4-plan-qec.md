# Section 4 build plan – QEC specialist review

Reviewer: quantum error-correction specialist, independent of the plan's author. Read: `text.md` sections 2–6, `VISUALS-PURPOSE.md` sections 0 and 6, `data/lattice.json`. Nothing built yet; this reviews the plan.

## Scores

| | Score |
|---|---|
| Truth | 7 |
| Plan quality | 7 |
| Overall | 7 |

Truth would be 9 once the direction problem in the gauges (1a) is fixed; the film is correct as specified.

## 1. The analogy: is it a faithful repetition code?

The mapping holds as far as it goes:
- Slabs = qubits, joint gauges = the two weight-2 parity checks of the three-qubit repetition code (Z1Z2, Z2Z3). Correct.
- "Changed since last reading" = detection event (the XOR of two consecutive check results). Correct, and it matches the text's definition of "fires" in section 3.
- A misreading that is right again next time = measurement error, which lights the same gauge in two consecutive readings. Correct, and it matches section 3's "fires twice in a row".
- Middle slab vs both end slabs: middle moves gauges 1|2 and 2|3; slab 1 moves 1|2 and slab 3 moves 2|3. As a moved/unmoved pattern, identical. Correct.
- The end slab has one joint and moves one gauge: the edge. Correct.
- Two neighbours sinking together leave the gauge between them unchanged: parity. Correct, as long as they sink by the same amount.
- A bonus the plan doesn't use yet: all three slabs sinking together moves no gauge at all. That is the logical operator of the repetition code, the whole row shifted with every gauge silent. If the engineer guesses "middle" and props it back up when really both ends sank, the row is left uniformly lower: the silent logical error of section 5 in the analogy's own terms. Worth one line.

**What plants a wrong belief:**

a. **Real gauges show direction, and direction tells the two stories apart. This is the one serious flaw.** A tell-tale or settlement gauge reads the relative displacement of the two slabs, with sign. If the middle slab sinks, both joints show "middle side lower". If both end slabs sink, both joints show "middle side higher". A real engineer, and his father in particular, would tell the two stories apart at a glance, so the claim "both move exactly the same two gauges" is false for the device as drawn. A qubit parity check has no sign: it only says even or odd. Fix, one of:
   - use a direction-free indicator: a glass or plaster witness tell-tale, which cracks on any movement either way (a real, historical builder's device), replaced at each reading so "cracked" means "moved since the last reading"; or
   - keep the crack monitor, but draw no scale, no needle and no offset; the code marks only "moved" with the accent dot, and the caption says the gauge only shows *whether* the joint moved, not which way.
   The witness is the more honest choice; the second option still invites an engineer to ask which way.

b. **Continuous vs discrete.** Slabs sink by amounts, and sinking twice adds up; a qubit flipped twice is back where it started. Two neighbours sinking by different amounts would move their shared gauge. Acceptable for an analogy at this level, provided the drawing shows each slab either level or dropped by one step, never by varying amounts. The direction-free witness (1a) hides most of this anyway.

c. **1D vs 2D.** Handled: the plan says "the simplest version: three in a row" and the film follows on the real grid. Fine.

d. **Phase errors absent.** The repetition code only catches flips, and the analogy has no phase counterpart. The film shows phase-checks dark, and the text carries the rest. Fine; don't add anything to the analogy for it.

e. **Measurement errors.** Section 0 says the misreading "is why it has to be a film", but requirement 3's scene has no misreading step and no time. The analogy as built is a single reading. Either drop that sentence from the brief or accept that the text alone carries misreading. Not wrong, just a promise the build plan doesn't keep.

## 2. The film: checked against `lattice.json`

Flip-checks (Z-type, notice flips): z0 {1,2,4,5}, z1 {3,4,6,7}, z2 {0,3} (left), z3 {5,8} (right). Phase-checks (X-type): x0 {0,1,3,4}, x1 {4,5,7,8}, x2 {1,2} (top), x3 {6,7} (bottom).

- **Flip on qubit 4:** z0 contains 4, z1 contains 4, z2 and z3 don't. Lights exactly z0, z1. Verified.
- **Flips on qubits 2 and 6:** z0 contains 2 (not 6), z1 contains 6 (not 2), z2 and z3 contain neither. Lights exactly z0, z1. Verified. No phase-check fires for either story (a flip never fires its own kind, i.e. X-type checks).
- **X on {2,4,6} commutes with every flip-check:** overlaps z0 {2,4} = 2, z1 {4,6} = 2, z2 0, z3 0. All even. Verified.
- **Not a product of phase-checks:** any product containing qubit 2 must include x2 {1,2}; removing qubit 1 then needs x0, which brings in 0 and 3, and only x0 contains 0, so 0 can never be removed. No product of x0–x3 equals {2,4,6}. Verified. Equivalently, it overlaps the logical Z on row {0,1,2} in one qubit (odd), so it flips the stored value.
- **Which boundaries:** a flip at the top or bottom row touches only one flip-check (e.g. qubit 2 only z0), so flip-strings end silently on the top and bottom edges, the edges with phase half-checks x2 and x3. {2,4,6} runs from qubit 2 (top row) to qubit 6 (bottom row): top to bottom. Correct. It is equivalent to the column {0,3,6}: {2,4,6}·{0,3,6} = {0,2,3,4} = x0·x2.

**Caution on the drawing.** {2,6} are corners, so the line is a diagonal from top-right to bottom-left. A reader can't tell from the picture whether it connects top to bottom or right to left, and the right-to-left reading is wrong (z3 and z2 are on those edges). Section 5's figure and the lattice scene's step 2 both show straight columns. Recommended: use **qubits 1 and 7** as the second story instead. They also light exactly z0 and z1 (1 is only in z0, 7 only in z1), and together with 4 they make the straight middle column {1,4,7}, which commutes with all flip-checks, overlaps logical Z {3,4,5} in one qubit, and visibly crosses top to bottom like section 5. If {2,6} stays, the caption must not say "edge to edge" without naming top and bottom.

**Wording.** "Two stories fit frame 2" is not exact: many fit. {0,1,3} also lights only z0 and z1 (z2 sees 0 and 3, even), as does every story times any phase-check product. Say "two of the stories that fit", which matches the text's "many sets of errors light up the same points".

**Frames 1–3.** Frame 2 lit and frame 3 dark is right for a flip that happens between rounds 1 and 2 with correct readings afterwards: the check results stay changed, so no new detection. It also rules out a single misreading, which would light the same check in frames 2 and 3. Correct.

## 3. Do the "done when" tests test correctness?

Requirement 4's generator check is partly redundant and partly missing:
- "Both stories light exactly z0 and z1": good, keep.
- "Together they commute with every flip-check": automatically true once both stories have the same syndrome. It tests nothing new.
- "Cross from edge to edge": not a test as written. Which edges, and how is it computed?
- Missing: that the combined operator is **not** a product of phase-checks. Without it, a pair of stories that differ by a harmless stabilizer would pass, and the figure would then show a harmless difference as a logical error. Test it as: the combined flips overlap a logical-Z representative (row {0,1,2} or {3,4,5}) in an odd number of qubits. That one check covers "not a stabilizer" and "crosses the right edges" together.
- Missing: that no phase-check fires for either story.
- Missing: frames computed, not authored. Each frame's lit checks should be the XOR of consecutive syndromes from the story, so frame 3 dark is derived, not drawn.

Requirement 3 has no correctness test at all; the five-second reader test is a comprehension test. Add a generator assertion on `gauges.json`: from a parity rule on three slabs, the middle story and the both-ends story give the same moved gauges, one end slab moves one gauge, and all three together move none. And a drawing rule: no gauge carries a direction, scale or needle (see 1a).

Requirement 8 ("median near 9") is a process gate, fine.

## 4. Numbers and claims

- 1.1 µs per round, about 90,000 frames in a blink (section 3B): 1 / 1.1 µs ≈ 909,000 rounds per second; a blink of ~0.1 s gives about 91,000. Consistent with the text.
- Distance 3: 9 storing, 8 helpers, 17 in all: matches `lattice.json`.
- "Room 2 lights 1|2 and 2|3; rooms 3 and 4 don't light the same": correct; 3 and 4 together light 2|3 and 4|5.
- "Both move exactly the same two gauges": false for a directional gauge (1a); true only as moved/unmoved.
- "Two stories fit frame 2": undercounts (section 2 above).
- "Together they cross the grid from edge to edge": true (top to bottom) but ambiguous with corner qubits.
- "One flip is likelier than two": true for any per-qubit error chance below one half; fine as the bridge to matching's "a few errors are more likely than many".
- "The film reuses the same lit mark, so the reader sees the building turn into the grid": a gauge sits on a joint between two slabs; a grid check sits in a face among four qubits. The mark can be the same, but the reader should not expect one gauge to map onto one specific grid check. No change needed, just don't animate one into the other.
- `data/film.json` and `figures/film.js` already exist for the held scene; "rewritten" and "regenerated" overwrite them on the new branch. Fine, since `feat/held-scene` keeps its own copy, but say so.

## Required changes

1. Make the gauges direction-free (glass or plaster witness, or no scale and no needle, marked "moved" only), and say in the caption that a gauge shows whether the joint moved, not which way.
2. Draw slabs as level or dropped by one step, never by varying amounts.
3. Requirement 4: replace "commute with every flip-check" and "edge to edge" with "the combined flips overlap a logical-Z row in an odd number of qubits"; add "no phase-check fires" and "frames computed as the change between consecutive rounds".
4. Requirement 3: add a generator assertion that the middle and both-ends stories move the same gauges and all three together move none.
5. Use qubits 1 and 7 for the second story (straight column, top to bottom), or name top and bottom in the caption if {2,6} stays.
6. Say "two of the stories that fit", not "two stories fit".
7. Drop or keep the misreading claim consistently: requirement 3 shows no misreading, so section 0 shouldn't promise the analogy carries it.

Optional: one line in the analogy that all three slabs sinking moves no gauge, the analogy's own silent logical error.

## Draft 3

Read: `VISUALS-PURPOSE.md` section 6, draft 3, and section 0 again.

### Scores

| | Score |
|---|---|
| Truth | 8.5 |
| Plan quality | 8.5 |
| Overall | 8.5 |

### Did the seven points land?

1. **Direction-free device:** landed. The glass tell-tale cracks on movement either way and says nothing else. Correct.
2. **Discrete one-step drops:** landed ("level or drops by one step, never by different amounts"), and the blocks are drawn as separate elements so code can drop them. Correct.
3. **Requirement 4 assertions:** landed. Both stories light exactly `z0` and `z1`, no phase-check fires, the two together overlap a logical row in an odd number of qubits, and frames are computed as round-to-round changes. One precision is still missing (see below).
4. **Requirement 3 assertions:** landed. Middle and both ends crack the same strips, and all three together crack none.
5. **Qubits 1 and 7:** landed. Re-checked against `lattice.json`: qubit 1 is only in `z0`, qubit 7 only in `z1`, neither is in `z2` {0,3} or `z3` {5,8}, so the story lights exactly `z0` and `z1`. {1,4,7} meets `z0` in {1,4} and `z1` in {4,7}, both even, and meets the row {3,4,5} in one qubit, so it is a logical flip running top to bottom.
6. **"Two of the stories that fit":** landed in section 6.
7. **Misreading claim:** dropped in section 6, with the right reason: a strip cracked by a knock shows once, while a wrong check report fires twice.

### Is a fresh glass strip each look a faithful detection event?

Yes, for what the scene shows. A strip fitted at one look and inspected at the next cracks exactly when the two blocks moved against each other in between. That is "the parity of this pair changed since the last round", which is what the text calls a check firing. Since the strip is replaced, a block that stays down doesn't keep showing, which is also right: after a flip the check results stay changed, but nothing new fires.

Two limits, neither needing a change while the scene shows a single look and one-step drops:
- A block that drops and comes back within one interval would crack the glass, while a qubit flipped twice fires nothing. The one-step rule keeps this out of the picture.
- The analogy can't show a wrong report, as draft 3 already says.

### What is still wrong or overclaimed

a. **Section 0 is stale and contradicts section 6.** It still describes the draft 2 device ("a settlement gauge across each joint", floor slabs in section) and still says "Both move exactly the same two gauges", "That's why it has to be a film", "Two stories fit frame 2", and qubits 2 and 6 on the corners. Anyone reading the brief from the top gets the rejected version first. Mark section 0 as superseded by section 6, or bring it in line.

b. **The bridging line overclaims.** "Dots are the hidden qubits, lights are the strips" has three problems:
   - Lights are *cracked* strips. Every flip-check tile is a strip, lit or not. As written, a reader takes the dark tiles to be nothing.
   - Only the flip-checks have strips. The phase-check tiles have no counterpart in the analogy, so "the tiles are the strips" without that qualification is wrong for half the grid.
   - On the grid, a check sits among two or four qubits, not between two neighbours, so the line shouldn't suggest one strip per pair of dots.
   - "One look every millionth of a second": the article's figure is 1.1 millionths. Say "about a million looks a second" (1 / 1.1 µs ≈ 909,000, so "about a million" holds) or use 1.1.
   Suggested wording: "The real chip is a square, not a row. The dots are the hidden qubits; the squares that watch for flips are the strips, and a lit one has cracked. About a million looks a second."

c. **"The dangerous case" needs its reason.** To a builder, a whole row settling evenly is the harmless kind of settlement. What makes it dangerous here is that the row's level is the stored value, and it changed with no strip to show it. Without that, the label fights the reader's building sense. Label it something like "the whole row moved and no strip shows it", so the danger is "unseen change", not structural.

d. **Name the logical row in requirement 4's generator.** "A logical row" should be pinned down: a row of the grid read as a phase-type operator, e.g. {3,4,5}. The generator should also check that the row commutes with every phase-check rather than assume it. Otherwise the test could pass against a row that isn't a logical operator.

Not a problem: the main state no longer shows the answer, and the guesses are marked "?". That is correct, since the gauges alone can't decide.

### Remaining required changes

1. Mark section 0 as superseded by section 6, or update it: device, film claim, qubits 1 and 7, "two of the stories that fit".
2. Reword the bridging line: a lit square is a cracked strip, only the flip-check squares are strips, and use "about a million looks a second" or 1.1 millionths.
3. Give "the dangerous case" its reason: the row's level is the stored value, and it changed unseen.
4. In requirement 4, name the logical row (e.g. {3,4,5}) and have the generator check that it commutes with every phase-check.
