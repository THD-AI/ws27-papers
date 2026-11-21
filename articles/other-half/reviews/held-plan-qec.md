# Review: HELD-SCENE.md plan, sections 2–4 – QEC specialist seat

Reviewer: quantum error-correction researcher (surface codes, detection events, detector error models, matching). Round 1, plan only, nothing built. Read against `text.md` sections 3–6, `data/lattice.json` and the step definitions of `lattice`.

## Scores

- Physics correctness of the plan: **8/10**
- Clarity of the example: **7/10**
- Overall: **7.5/10**

The core physics is right. What keeps it from a 9 is one over-general sentence in the five-second test, a choice of example that mixes the two separate matching puzzles, and an axis label that implies the start of a run.

## 1. Is the physics in section 3 right?

**Check definitions.** I verified `lattice.json` against the rotated distance-3 layout: every X-type check overlaps every Z-type check on an even number of qubits (x0/z0 on {1,4}, x0/z1 on {3,4}, x0/z2 on {0,3}, x1/z0 on {4,5}, x1/z1 on {4,7}, x1/z3 on {5,8}, x2/z0 on {1,2}, x3/z1 on {6,7}). The stabiliser group is consistent, boundaries sit where they should (X-type half-checks top and bottom, Z-type left and right).

**Flip on qubit 4 between rounds 2 and 3.** Correct. The Z-type checks containing qubit 4 are exactly z0 {1,2,4,5} and z1 {3,4,6,7}; z2 {0,3} and z3 {5,8} don't touch it. Under the article's definition (fires = differs from the round before, i.e. a detection event) both fire in round 3 and never again, because the changed parity persists. This matches step 1 of `lattice` light for light, as section 3 requires.

**Wrong report on x2 in round 5.** Correct for a measurement error in the phenomenological model: detection events at (x2, 5) and (x2, 6). The film has 8 rounds, so round 6 exists and the pair closes inside the film. Good: a wrong report in the last frame would leave one light whose partner is the final readout, which the figure doesn't show.

**A data error fires only once.** Correct for an error between rounds (a persistent Pauli on the data, tracked in software, as section 5 of the text already says). It is the idealised model: see point 3 for errors in the middle of a round.

**Boundary checks.** x2 is a boundary check. Its events could in principle be matched to the top edge (two edges, weight 2) instead of to each other along time (one edge, weight 1). With equal weights, matching still takes the time pair, so "matching gives the true story" holds. Worth knowing because a specialist will check exactly that.

**First and last rounds.** The plan doesn't address them, and the axis does: "round 1 … 8" reads as the start of a run. In a real memory experiment the first round compares against the prepared state, and only one kind of check is deterministic there (for a run prepared in |0…0⟩ the phase-checks are random in round 1 and carry no detection events). The last round is closed by measuring the storing qubits directly. Nothing lights in frames 1, 2, 7 or 8 here, so no light is wrong, but the label is. Either draw the film as a window from a longer run (fading or ellipsis frames at both ends, axis "… round r … r + 7 …" or "8 rounds of a longer run") or say in the generator and caption that frame 1 is compared with a round before it that isn't drawn. The text already says "While the computer runs", so mid-run is the honest framing and costs nothing.

**Scale numbers.** 1.1 µs per round, 48 = 7² − 1 checks at distance 7, about 90,000 rounds in a ~100 ms blink: all consistent with GQA-2024 and with the text.

## 2. Do the notes mislead?

**"an error on a qubit lights two neighbouring checks in one frame" (section 2).** Too general. On this grid a flip lights two checks only on qubits 3, 4 and 5 (q3: z1, z2; q4: z0, z1; q5: z0, z3); on qubits 0, 1, 2, 6, 7 and 8 it lights one, because the other end of its edge is the boundary. That is five of nine qubits. The text itself (section 6) is careful: "In the middle of the grid, a single flip fires the two flip-checks on either side of it." The five-second sentence and any general caption should say "lights the checks beside it, two in the middle, one at the edge", or simply "lights checks beside it, in one frame". The step-2 note ("a flip on one qubit: two checks light, in one frame") is fine because it is about this qubit; keep it specific ("this flip", "here").

**Mixing a flip and a phase-check in one decoding picture.** The flip lights z-checks, the wrong report lights an x-check. Step 4 then shows "the decoder's pairs" as if one puzzle. Section 6 of the text says plain matching solves flip-checks and phase-checks separately. A specialist will see two independent matching graphs drawn as one, and a careful lay reader might wonder whether z1 could be paired with x2. The clean fix: put the wrong report on a flip-check (z3 on the right edge, qubits 5 and 8, is the natural choice; it is far from the z0–z1 pair and lights alone). Then the whole film is one puzzle, and the point "the pairs run in two directions" is made inside a single graph. The phase-checks simply stay dark, which repeats the text's "a flip isn't their kind of error". If x2 is kept, step 4 needs a word that these are two puzzles, which costs more than switching.

**Whether to show a phase error too.** No. It adds a third mark and a second error kind without adding to "pairs in space and in time". If z3 replaces x2, a single line in the caption ("the phase-checks work the same way") is enough.

**"the decoder pairs lights across the whole film".** Defensible for the recorded experiments the article discusses: Google's offline decoding (and the network) takes the whole run at once. For a live decoder it overstates: real-time matching decodes in sliding or parallel windows, with overlaps, and commits only the older part of each window. The figure's real point is "across frames, not frame by frame". Say that: "the decoder pairs lights across frames, not one frame at a time". It is both true for live and offline decoders and closer to the five-second claim. Keep "whole film" out of the five-second sentence too.

**"a film in which a few points light up in every frame" (text, section 4) vs. a mostly dark film.** Five of the eight frames are dark. At distance 3 and realistic rates (detection probability of order 10% per check per round on recent chips) about one light per frame is expected, so a dark frame is plausible, but three lights in eight frames is sparse. Fine for a constructed example; the `film.json` note "a constructed example, not a measurement" should add "sparser than a real run", and the caption should not imply typical density.

**The dashed X "between frames 2 and 3".** Good and honest: it places the error in time, between measurements, and shows it is inferred. Keep it visibly between the frames, not on frame 3, or it reads as "the flip happens in round 3".

**Wording "a check that reports wrongly".** Fine and matches the text. A specialist knows the cause can be a readout error or an error on the helper during the round; the lay wording covers both without claiming either.

## 3. Is this the best example?

Yes, for the stated point. One pure space pair and one pure time pair is the minimal honest illustration of "hints come in pairs in space and in time", and it maps directly onto the two kinds of edge in a matching graph. With the wrong report moved to a flip-check, it is the textbook example (phenomenological noise).

What a specialist will notice is missing: errors in the middle of a round. A flip that happens while the helpers are part-way through their interactions is seen by one check this round and by its neighbour only in the next: a diagonal pair, one light in frame r and one beside it in frame r + 1. Those space-time diagonals are real edges in every circuit-level matching graph (and hook errors from a helper give pairs two steps apart in space). They are precisely why "read the checks as a sequence" matters for more than wrong reports.

Would adding it overload lay readers? As a sixth animated step, yes: a third kind of pair after two clean ones, needing an explanation of the interaction schedule. My recommendation: do not animate it; mention it in one caption line or the figure's footnote ("an error in the middle of a round can also light one check in one frame and its neighbour in the next"). That pre-empts the specialist objection at no cost to the five-second test. Hook errors: leave them out entirely.

## 4. Other objections a specialist would raise

- **"Every light pairs with another light or the edge."** Good, keep "or the edge" in the note so boundary matching is not lost.
- **Equal weights.** The plan's "matching gives the true story" assumes uniform weights. Real decoders weight time and space edges differently from measured error rates. No claim in the figure depends on it; just don't write "shortest" about the time join without "most likely".
- **Joins drawn through the qubit.** Draw the z0–z1 join through qubit 4's position (as `lattice` does), not as a free line between check centres; it shows that a space join is a guess at a qubit, while the time join stays on one check. This difference is the content of the figure.
- **Oblique projection.** No physics issue. Keep the grid orientation identical in every frame so a check keeps its position along the time axis; the time join must be visibly "the same check, next frame".
- **"8 checks, one answer each" (step 0).** Correct for distance 3 (d² − 1 = 8).
- **Generator test.** The planned test recomputes lights from the error list. Have it also assert that every light has a partner under the stated pairs (no unpaired light), which catches an off-by-one on the round of the wrong report.

## Required changes (must)

- Replace "an error on a qubit lights two neighbouring checks" in the five-second sentence with wording true at the edge (two in the middle, one at the edge).
- Move the wrong report from x2 to a flip-check (z3 suggested), so both pairs live in the one matching puzzle the text describes; otherwise state the two puzzles in step 4.
- Change "pairs lights across the whole film" to "across frames, not frame by frame" in the note and the five-second sentence.
- Frame the film as a window of a longer run (ellipsis or faded end frames, axis not starting at a bare "round 1"), and note in `film.json` that frame 1 is compared with an undrawn earlier round.
- Draw the dashed X clearly between frames 2 and 3, not on frame 3.

## Suggestions (may)

- One caption line on errors in the middle of a round giving a diagonal pair across neighbouring frames; do not animate it.
- Draw the space join through qubit 4's position, the time join along the same check.
- Keep "or the edge" in the decoder note.
- Add "sparser than a real run" to the constructed-example note.
- Have the physics test also check that every light is paired.
- No phase error in the film; one caption line that phase-checks work the same way.
