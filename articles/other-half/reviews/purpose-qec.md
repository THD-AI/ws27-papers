# Review: VISUALS-PURPOSE.md – QEC specialist seat

Reviewer: quantum error-correction researcher. Read against `text.md` sections 2 to 6 and `data/lattice.json`. Judged for truth only: is what the reader will believe after the picture correct, and can the text still undo whatever isn't?

## Scores (truth)

| Concept | As written | With the corrections below |
|---|---|---|
| A, alarms in a dark building | 5 | 8 |
| B, the simple film of 3 frames | 9 | 9 |
| C, A then B | 6 | 8.5 |

A loses most of its points to its own ambiguity example, which is wrong (see 2.1). The mapping can be repaired without losing simplicity, and the repaired version lines up exactly with the B example in section 3 below, which is what makes C worth doing.

## 1. The one idea

"You never see the errors, only alarms going off, very fast, and different errors can set off the same alarms."

Correct, and the right idea for section 4: it is what the section's last paragraph says ("Many sets of errors light up the same points") and what sections 5 and 6 build on. Two small sharpenings, neither required:
- "different errors" should be "different sets of errors". The ambiguity is almost always one error against two or more, not one against another one, and that difference in count is what makes a guess possible at all (section 6).
- The section's own new fact is time: an alarm means "changed since the round before", and an alarm can also be wrong (section 3). The one idea can stay as it is if the picture shows time as frames; it shouldn't claim more.

## 2. Concept A: where the mapping holds and where it doesn't

### 2.1 The ambiguity example is wrong

In a row of rooms with an alarm on each wall between two rooms, the second room lights the alarms on walls 1|2 and 2|3. The third and fourth rooms together light walls 2|3, 3|4 and 4|5 with real smoke alarms, or walls 2|3 and 4|5 with parity alarms (wall 3|4 sees two and stays quiet). Neither is the same as the second room. The caption "Was it the second room, or the third and fourth together?" would teach an ambiguity that doesn't exist.

The correct example in the same picture is smaller: **three rooms, two alarms.** The middle room lights both alarms. The two end rooms together also light both alarms, one each, because an end room has an alarm on one side only. "Was it the middle room, or both end rooms?" This is the three-qubit code of section 2 exactly, and the two stories differ by all three rooms: if the decoder picks the wrong one, the stored value is flipped – the silent failure of section 5 in its smallest form.

### 2.2 Where it holds

- The errors are unseen; only the alarms are read.
- In a row, an alarm between two rooms is exactly a check on two neighbours (the three-qubit code's checks, Z1Z2 and Z2Z3).
- An end room lights one alarm, not two: the edge.
- Different sets of causes give the same alarms (with the example corrected).

### 2.3 Where it plants a wrong belief the text can't easily undo

- **Smoke adds up; checks count even or odd.** A smoke alarm between two burning rooms rings. A check between two hit qubits stays quiet. This isn't a detail: section 5's silent line of errors ("every check along such a line sees an even number of errors") depends on it, and a reader who holds the smoke picture will find section 5 contradicts it. This is the one the text can't undo, because the analogy is held as intuition and section 5 is read as an exception. The fix is an alarm that compares its two rooms and sounds when they differ, not one that detects trouble.
- **Rooms as qubits doesn't extend to the grid.** A wall separates two rooms, so "alarm on the wall between rooms" means a check on two qubits. On the grid a check touches four (two at the edge). Any floor plan drawn later, or a reader extending the row in their head, gets the wrong geometry. The truer mapping turns it round: **rooms are checks, walls are qubits.** On the grid, every storing qubit touches at most two flip-checks, so "trouble inside a wall shows in the rooms on both sides; an outside wall shows in one room" is exactly true for flips on the real grid, not only on a row. It is also the decoder's own picture: rooms are the points to pair, walls are the lines between them.
- **Alarms that stay on vs alarms that changed.** A smoke alarm rings while the smoke is there. A check fires when its answer changes, once, and then is quiet although the error is still there. A static building can't show this; three snapshots can, if the second shows the alarm and the third shows it quiet with nothing repaired. Otherwise readers will expect a lit check to mean "error present now".
- **Phase errors.** No counterpart, and that's fine: the text carries it, and a reader with only the flip picture is not misled, just incomplete. Don't add a second kind of alarm.
- **Wrong reports.** Fit naturally if wanted: a gauge misread once shows "changed" twice, when the wrong reading appears and when the right one returns.

### 2.4 A truer everyday analogy, equally simple

Keep the building, his father's eye and the cross-section; change what is measured.

**Settlement gauges on the joints between floor slabs.** You can't see the foundations. Across each joint between two slabs sits a crack gauge (a tell-tale) that only shows whether the two slabs have moved relative to each other. One slab sinks: the gauges on both its joints open. The end slab sinks: only its one inner joint opens. Two neighbouring slabs sink together: the joint between them stays closed, only the outer joints open – parity, for free. And if every slab sinks together, no gauge shows anything: that is the stored value changing silently, section 5's logical error. With three slabs: "the middle one sank, or both ends did?" Same picture, same three things, and true in every point that sections 3 to 6 later use.

If the alarm stays: "an alarm that compares the two rooms beside it and sounds when they differ", rooms as checks and walls as qubits as above. The gauge is truer and needs no explanation of "compares".

One caveat to write into the generation brief: a real gauge shows which side sank; a check doesn't. Draw the gauge as "moved / not moved", not with a direction.

## 3. Concept B: a concrete example on the distance-3 grid

From `lattice.json` (`q = row * 3 + col`): flip-checks z0 {1, 2, 4, 5}, z1 {3, 4, 6, 7}, z2 {0, 3}, z3 {5, 8}.

**The film (3 frames):** frame 1 dark; frame 2: z0 and z1 lit; frame 3 dark.

- **Story 1:** one flip on qubit 4 (the centre) between frames 1 and 2. Qubit 4 is in z0 and z1, so both change in frame 2, once.
- **Story 2:** two flips between frames 1 and 2, on qubit 2 (top-right corner) and qubit 6 (bottom-left corner). Qubit 2 is in z0 only (its other side is the top edge), qubit 6 in z1 only (its other side is the bottom edge). Same two lights, same frame, frame 3 dark.

Checked: no other flip-check changes in either story (qubits 2, 4 and 6 are not in z2 or z3), and the phase-checks don't react to flips. Both stories leave the qubits flipped in frame 3, and the checks are quiet anyway: this is the "fires once, not while" point for free.

Why this one:
- It is the drawing the reader already knows from `lattice` step 1 (the centre flip lighting the two checks beside it), so B adds only "and here is another story for the same lights".
- It is the grid version of the corrected three-room example in 2.1: centre against both ends. A and B tell the same story, which is what C needs.
- Together the two stories make the diagonal 2, 4, 6: a line from the top edge to the bottom edge. So guessing wrong is not harmless, it is section 5's logical error. And story 1 (one flip) is likelier than story 2 (two), which is section 6's "likelier" in its simplest form. The picture should not say this; it only has to be true when the text later says it.
- It uses the edges: the "or to the edge" pairing in the text gets a picture without a word.

What it doesn't use is time: both stories happen between frames 1 and 2. If a time story is wanted, the simplest is on z3 (qubits 5 and 8): z3 lit in frames 2 and 3. Story 1: z3 reports wrongly in frame 2, no storing qubit hit. Story 2: qubit 8 is flipped before frame 2 and flipped back before frame 3. I'd keep it out of the section 4 picture: one ambiguity, cleanly, is the idea.

Drawing notes, for truth only: keep the X marks only in the "what really happened?" panels, never in the film frames; draw frame 3 with the lights off and no repair marked.

## 4. Section 4 candidates

- **§3, flip against phase: "two notes that cancel when one is shifted" – physically wrong as described.** A phase error changes the relative sign between the 0 and 1 parts ("0 plus 1" becomes "0 minus 1"); both parts are still there with the same weight. Nothing cancels in the qubit. Cancellation appears only when the two parts are later combined (measured the other way), and then it is the other outcome that cancels, not the qubit going silent. A picture of notes cancelling plants "a phase error erases the qubit". Truer: two notes played together, in step and then half a beat out of step – both still sound, only how they line up changes; you'd hear it only when you listen for the combination. The text's own water image (same shape, shifted rhythm) is already right; the picture should follow it.
- **§2, information in the relation, "three people holding hands, the message in the hold" – wrong, and backwards.** The pairwise relations (do neighbours 1 and 2 agree, do 2 and 3 agree) are exactly what the checks measure. They are known, fixed while nothing goes wrong, and carry none of the stored information – that is why measuring them is safe (section 3). Putting the message "in the hold" says the checks read the message. The stored value is in the group as a whole, a property no pair and no single member shows. Truer everyday images: a secret split three ways so that any one or two shares reveal nothing and all three together do (a three-part combination); or the settlement picture: whether the whole building sank, which no single gauge can show. Related, outside the candidates: section 2's "No single one holds the information" is only half true for the three-qubit all-0/all-1 code: measuring one qubit does reveal 0 against 1 (and destroys the rest). What no single qubit holds is the superposition between them. It is fully true for the surface code at distance 3 and up, where any one or two qubits reveal nothing. Worth one clause in the text.
- **§6, "two ways add up", city against exact route.** Correct and good: the decoder only needs the class of explanation (the city), and a class reachable in two ways is likelier than one reachable in one, even when each single way is equally likely. Keep the 10 and 19 of 30 labelled as our constructed count at 5% error with checks never wrong.
- **§2, the threshold curves.** Correct in shape. Plot logical error on a log axis so the two lines are straight. Don't place Google 2023 above the threshold: its distance 5 beat distance 3, just (Λ about 1.04); "years of hardware above it" is right for before 2023.
- **§9, the scoreboard.** No physics to object to; the numbers must come from section 9's own data.

## Required corrections

- A: replace "the second room, or the third and fourth together?" (wrong) with three rooms, two alarms: "the middle room, or both end rooms?"
- A: the alarm must compare its two neighbours and stay quiet when both have trouble; a smoke alarm teaches "more trouble, more alarms" and contradicts section 5's silent line. Best: settlement gauges on the joints between slabs.
- A: if the analogy has to stand for the grid, make rooms the checks and walls the qubits, not the other way round.
- A or B: show the alarm lit in one snapshot and quiet in the next with nothing repaired, so a light reads as "changed", not "error present".
- §4 candidates: drop "two notes that cancel" (a phase error cancels nothing) and "message in the hold" (the holds are the checks and carry no message); use in-step / out-of-step notes and a secret split three ways.
